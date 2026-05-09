// Cloudflare Worker client. All network calls funnel through here.

const WORKER_URL = import.meta.env.VITE_WORKER_URL || "https://claudio-api.bitter-disk-1bf7.workers.dev";

async function post(path, body) {
  const r = await fetch(`${WORKER_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body || {}),
  });
  const text = await r.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }
  if (!r.ok) throw new Error(data?.error || `HTTP ${r.status}`);
  return data;
}

export async function validateKey(api_key) {
  return post("/validate-key", { api_key });
}

export async function fetchProjects() {
  const { projects } = await post("/notion-fetch-projects", {});
  return projects;
}

export async function fetchProjectContext(notion_page_id) {
  const { context } = await post("/notion-fetch-context", { notion_page_id });
  return context;
}

export async function writeSummary(notion_page_id, summary_json) {
  return post("/notion-write-summary", { notion_page_id, summary_json });
}

export async function fetchClickupTasks(list_id) {
  const { tasks } = await post("/clickup-fetch-tasks", { list_id });
  return tasks;
}

export async function createClickupTask(list_id, task_name, description) {
  return post("/clickup-create-task", { list_id, task_name, description });
}

export async function fetchSlackThreads(project_name) {
  const { threads } = await post("/slack-fetch-threads", { project_name });
  return threads;
}

// Streams a chat response from the Worker, calling onDelta for each text chunk.
// Returns a promise that resolves with the accumulated text.
export async function chatStream({ messages, system_prompt, user_api_key, onDelta, signal }) {
  const r = await fetch(`${WORKER_URL}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, system_prompt, user_api_key }),
    signal,
  });
  if (!r.ok) {
    const text = await r.text();
    throw new Error(`chat failed: ${r.status}, ${text.slice(0, 200)}`);
  }

  const reader = r.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let full = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const payload = line.slice(6).trim();
      if (!payload) continue;
      try {
        const event = JSON.parse(payload);
        if (event.type === "content_block_delta" && event.delta?.type === "text_delta") {
          full += event.delta.text;
          onDelta?.(event.delta.text);
        }
      } catch {
        // Ignore non JSON keep alives.
      }
    }
  }
  return full;
}

export async function workerHealth() {
  const r = await fetch(`${WORKER_URL}/health`);
  return r.json();
}
