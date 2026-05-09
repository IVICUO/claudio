// Claudio API, Cloudflare Worker.
// Proxies the Anthropic API for the React app and exposes integration endpoints
// for Notion, ClickUp, and Slack. Per route CORS validation against ALLOWED_ORIGIN.

const ANTHROPIC_VERSION = "2023-06-01";
const MODEL = "claude-sonnet-4-5-20250929";

function corsHeaders(env, origin) {
  const allowed = (env.ALLOWED_ORIGIN || "").split(",").map((s) => s.trim()).filter(Boolean);
  const allowOrigin = allowed.includes(origin) ? origin : (allowed[0] || "");
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}

function originAllowed(env, origin) {
  if (!origin) return false;
  const allowed = (env.ALLOWED_ORIGIN || "").split(",").map((s) => s.trim()).filter(Boolean);
  return allowed.includes(origin);
}

function json(data, init = {}, env, origin) {
  return new Response(JSON.stringify(data), {
    status: init.status || 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...corsHeaders(env, origin),
      ...(init.headers || {}),
    },
  });
}

function err(message, status, env, origin) {
  return json({ error: message }, { status }, env, origin);
}

async function readJson(request) {
  try { return await request.json(); } catch { return null; }
}

// ----- Anthropic -----

async function handleChat(request, env, origin) {
  const body = await readJson(request);
  if (!body) return err("invalid json", 400, env, origin);
  const { messages, system_prompt, user_api_key } = body;
  if (!user_api_key) return err("user_api_key required", 400, env, origin);
  if (!Array.isArray(messages) || messages.length === 0) return err("messages required", 400, env, origin);

  const upstream = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "anthropic-version": ANTHROPIC_VERSION,
      "x-api-key": user_api_key,
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 4096,
      system: system_prompt || "",
      messages,
      stream: true,
    }),
  });

  if (!upstream.ok) {
    const text = await upstream.text();
    return new Response(text, {
      status: upstream.status,
      headers: {
        "Content-Type": upstream.headers.get("Content-Type") || "application/json",
        ...corsHeaders(env, origin),
      },
    });
  }

  return new Response(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      ...corsHeaders(env, origin),
    },
  });
}

async function handleValidateKey(request, env, origin) {
  const body = await readJson(request);
  if (!body || !body.api_key) return err("api_key required", 400, env, origin);

  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "anthropic-version": ANTHROPIC_VERSION,
      "x-api-key": body.api_key,
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1,
      messages: [{ role: "user", content: "hi" }],
    }),
  });

  if (r.ok) return json({ valid: true }, {}, env, origin);
  let detail = "invalid key";
  try { const e = await r.json(); detail = e?.error?.message || detail; } catch {}
  return json({ valid: false, error: detail }, { status: 200 }, env, origin);
}

// ----- Notion -----

function readSelect(props, names) {
  for (const n of names) {
    const v = props[n]?.select?.name;
    if (v) return v;
  }
  return null;
}
function readRichText(props, names) {
  for (const n of names) {
    const v = props[n]?.rich_text?.map((t) => t.plain_text).join("");
    if (v) return v;
  }
  return null;
}
function readDate(props, names) {
  for (const n of names) {
    const v = props[n]?.date?.start;
    if (v) return v;
  }
  return null;
}
function deriveQuarter(isoDate) {
  if (!isoDate) return null;
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return null;
  const q = Math.floor(d.getMonth() / 3) + 1;
  return `${d.getFullYear()} Q${q}`;
}
function deriveQuarterDashed(isoDate) {
  if (!isoDate) return null;
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return null;
  const q = Math.floor(d.getMonth() / 3) + 1;
  return `${d.getFullYear()}-Q${q}`;
}

async function notionFetch(env, path, init = {}) {
  const r = await fetch(`https://api.notion.com/v1${path}`, {
    ...init,
    headers: {
      "Authorization": `Bearer ${env.NOTION_API_KEY}`,
      "Notion-Version": "2022-06-28",
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
  return r;
}

// IVICUO's internal initiatives database, separate from any client workspace.
// Hardcoded because the title pattern would not pick it up alongside "WORKSPACE *".
const INTERNAL_DB_ID = "2b8021fb3bdc807fbd33eb5ba92eb066";
const INTERNAL_CLIENT_LABEL = "IVICUO Internal";

// Statuses that count as "not active" (hidden by default in the sidebar).
const INACTIVE_STATUSES = new Set([
  "Done",
  "🛑 Blocked OR Paused",
  "🗑️ Dissmissed OR Postponed",
]);

async function handleNotionFetchProjects(_request, env, origin) {
  if (!env.NOTION_API_KEY) return err("notion not configured", 503, env, origin);

  // 1. Discover all client workspace databases by name pattern.
  const search = await notionFetch(env, "/search", {
    method: "POST",
    body: JSON.stringify({
      query: "WORKSPACE",
      filter: { property: "object", value: "database" },
      page_size: 100,
    }),
  });
  if (!search.ok) return err(`notion search failed: ${search.status}`, 502, env, origin);
  const searchData = await search.json();

  const workspaces = (searchData.results || [])
    .filter((db) => db.object === "database")
    .map((db) => ({ id: db.id, title: notionDbTitle(db) }))
    .filter((ws) => /^WORKSPACE\s+/i.test(ws.title))
    .map((ws) => ({
      id: ws.id,
      client: ws.title.replace(/^WORKSPACE\s+/i, "").trim(),
    }));

  // Always include IVICUO Internal alongside client workspaces.
  workspaces.push({ id: INTERNAL_DB_ID, client: INTERNAL_CLIENT_LABEL });

  // 2. Query each workspace database in parallel, tag results with client name.
  const results = await Promise.all(workspaces.map((ws) => queryWorkspace(env, ws)));
  const projects = results.flat();

  return json({ projects }, {}, env, origin);
}

function notionDbTitle(db) {
  const title = db.title || db.name;
  if (Array.isArray(title)) return title.map((t) => t.plain_text || "").join("");
  return String(title || "");
}

async function queryWorkspace(env, workspace) {
  try {
    const r = await notionFetch(env, `/databases/${workspace.id}/query`, {
      method: "POST",
      body: JSON.stringify({ page_size: 100 }),
    });
    if (!r.ok) return [];
    const data = await r.json();
    return (data.results || []).map((page) => extractProject(page, workspace));
  } catch {
    return [];
  }
}

function extractProject(page, workspace) {
  const props = page.properties || {};
  const titleProp = Object.values(props).find((p) => p.type === "title");
  const name = titleProp?.title?.map((t) => t.plain_text).join("") || "Untitled";
  const status = props["Status"]?.status?.name || readSelect(props, ["Status", "status"]) || null;
  const quarter = props["Quarter"]?.multi_select?.[0]?.name
    || readSelect(props, ["Quarter", "quarter"])
    || deriveQuarterDashed(readDate(props, ["Start Date", "Start", "Date"]));
  const branch = readSelect(props, ["Branch", "branch"]);
  const priority = readSelect(props, ["Priority", "priority"]);
  const mainProject = props["Main Project"]?.multi_select?.map((s) => s.name) || [];
  const isActive = status ? !INACTIVE_STATUSES.has(status) : true;
  return {
    id: page.id,
    name,
    notion_page_id: page.id,
    notion_url: page.url,
    clickup_list_id: null, // Per Roadmap First, ClickUp link is via Main Project tags, not list IDs.
    main_project: mainProject,
    client: workspace.client,
    branch,
    status,
    priority,
    quarter,
    is_active: isActive,
    last_activity: page.last_edited_time,
  };
}

async function handleNotionFetchContext(request, env, origin) {
  const body = await readJson(request);
  if (!body?.notion_page_id) return err("notion_page_id required", 400, env, origin);

  const blocksRes = await notionFetch(env, `/blocks/${body.notion_page_id}/children?page_size=100`);
  if (!blocksRes.ok) return err(`notion blocks failed: ${blocksRes.status}`, 502, env, origin);
  const blocksData = await blocksRes.json();

  const text = (blocksData.results || [])
    .map((b) => {
      const t = b[b.type];
      if (!t) return "";
      const rich = t.rich_text || t.text || [];
      return rich.map((r) => r.plain_text || r.text?.content || "").join("");
    })
    .filter(Boolean)
    .join("\n");

  return json({ context: text.slice(0, 6000) }, {}, env, origin);
}

async function handleNotionWriteSummary(request, env, origin) {
  const body = await readJson(request);
  if (!body?.notion_page_id || !body?.summary_json) return err("notion_page_id and summary_json required", 400, env, origin);

  const s = body.summary_json;
  const summaryText = typeof s === "string" ? s : JSON.stringify(s, null, 2);
  const date = new Date().toISOString().slice(0, 10);

  const r = await notionFetch(env, `/blocks/${body.notion_page_id}/children`, {
    method: "PATCH",
    body: JSON.stringify({
      children: [
        {
          object: "block",
          type: "heading_3",
          heading_3: { rich_text: [{ type: "text", text: { content: `Conversation log, ${date}` } }] },
        },
        {
          object: "block",
          type: "paragraph",
          paragraph: { rich_text: [{ type: "text", text: { content: summaryText.slice(0, 1900) } }] },
        },
      ],
    }),
  });
  if (!r.ok) return err(`notion append failed: ${r.status}`, 502, env, origin);
  const data = await r.json();
  return json({ success: true, notion_url: `https://www.notion.so/${body.notion_page_id.replace(/-/g, "")}` }, {}, env, origin);
}

async function handleNotionPreviewUpdate(request, env, origin) {
  const body = await readJson(request);
  if (!body?.notion_page_id) return err("notion_page_id required", 400, env, origin);

  const pageRes = await notionFetch(env, `/pages/${body.notion_page_id}`);
  if (!pageRes.ok) return err(`notion page failed: ${pageRes.status}`, 502, env, origin);
  const page = await pageRes.json();
  const titleProp = Object.values(page.properties || {}).find((p) => p.type === "title");
  const currentTitle = titleProp?.title?.map((t) => t.plain_text).join("") || "Untitled";

  return json({
    current_state: { title: currentTitle, last_edited_time: page.last_edited_time },
    proposed_state: body.proposed_changes || {},
  }, {}, env, origin);
}

async function handleNotionConfirmUpdate(request, env, origin) {
  const body = await readJson(request);
  if (!body?.notion_page_id || !body?.confirmed_changes) return err("notion_page_id and confirmed_changes required", 400, env, origin);

  // confirmed_changes is expected to be a Notion blocks/children patch payload
  const r = await notionFetch(env, `/blocks/${body.notion_page_id}/children`, {
    method: "PATCH",
    body: JSON.stringify(body.confirmed_changes),
  });
  if (!r.ok) {
    const detail = await r.text();
    return err(`notion update failed: ${r.status}, ${detail.slice(0, 300)}`, 502, env, origin);
  }
  return json({ success: true, notion_url: `https://www.notion.so/${body.notion_page_id.replace(/-/g, "")}` }, {}, env, origin);
}

// ----- ClickUp -----

async function clickupFetch(env, path, init = {}) {
  return fetch(`https://api.clickup.com/api/v2${path}`, {
    ...init,
    headers: {
      "Authorization": env.CLICKUP_API_KEY,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
}

async function handleClickupFetchTasks(request, env, origin) {
  const body = await readJson(request);
  if (!body?.list_id) return err("list_id required", 400, env, origin);
  const r = await clickupFetch(env, `/list/${body.list_id}/task?archived=false&include_closed=false&page=0`);
  if (!r.ok) return err(`clickup fetch failed: ${r.status}`, 502, env, origin);
  const data = await r.json();
  const tasks = (data.tasks || []).slice(0, 10).map((t) => ({
    id: t.id, name: t.name, status: t.status?.status, url: t.url,
  }));
  return json({ tasks }, {}, env, origin);
}

async function handleClickupCreateTask(request, env, origin) {
  const body = await readJson(request);
  if (!body?.list_id || !body?.task_name) return err("list_id and task_name required", 400, env, origin);
  const r = await clickupFetch(env, `/list/${body.list_id}/task`, {
    method: "POST",
    body: JSON.stringify({ name: body.task_name, description: body.description || "" }),
  });
  if (!r.ok) return err(`clickup create failed: ${r.status}`, 502, env, origin);
  const data = await r.json();
  return json({ success: true, task_url: data.url, task_id: data.id }, {}, env, origin);
}

// ----- Slack -----

async function handleSlackFetchThreads(request, env, origin) {
  if (!env.SLACK_BOT_TOKEN) return json({ threads: [] }, {}, env, origin);
  const body = await readJson(request);
  const project = body?.project_name || "";

  const search = await fetch(`https://slack.com/api/search.messages?query=${encodeURIComponent(project)}&count=10`, {
    headers: { "Authorization": `Bearer ${env.SLACK_BOT_TOKEN}` },
  });
  const data = await search.json();

  const threads = (data?.messages?.matches || []).slice(0, 10).map((m) => ({
    channel: m.channel?.name || m.channel?.id,
    snippet: (m.text || "").slice(0, 140),
    reply_count: m.reply_count || 0,
    url: m.permalink,
  }));
  return json({ threads }, {}, env, origin);
}

// ----- Health & router -----

function handleHealth(env, origin) {
  return json({
    status: "ok",
    worker: "claudio-api",
    timestamp: new Date().toISOString(),
  }, {}, env, origin);
}

const ROUTES = {
  "POST:/chat": handleChat,
  "POST:/validate-key": handleValidateKey,
  "POST:/notion-fetch-projects": handleNotionFetchProjects,
  "POST:/notion-fetch-context": handleNotionFetchContext,
  "POST:/notion-write-summary": handleNotionWriteSummary,
  "POST:/notion-preview-update": handleNotionPreviewUpdate,
  "POST:/notion-confirm-update": handleNotionConfirmUpdate,
  "POST:/clickup-fetch-tasks": handleClickupFetchTasks,
  "POST:/clickup-create-task": handleClickupCreateTask,
  "POST:/slack-fetch-threads": handleSlackFetchThreads,
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin") || "";

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(env, origin) });
    }

    if (request.method === "GET" && url.pathname === "/health") {
      return handleHealth(env, origin);
    }

    // All POST endpoints require a permitted Origin.
    if (request.method === "POST" && !originAllowed(env, origin)) {
      return err("origin not allowed", 403, env, origin);
    }

    const handler = ROUTES[`${request.method}:${url.pathname}`];
    if (!handler) return err("not found", 404, env, origin);

    try {
      return await handler(request, env, origin);
    } catch (e) {
      return err(`internal error: ${e.message}`, 500, env, origin);
    }
  },
};
