# Claudio repo guide for Claude Code

This repo is Claudio, IVICUO's AI brain. IVICUO is a RevOps and GTM Engineering consultancy in Madrid, 14 people, two branches (CRM and Data), serving European B2B scale ups Series B and later.

## What this repo contains

Three layers, one repo, one set of MCP connections.

1. **Claudio app**: a React chat interface in `src/`, deployed to GitHub Pages, served at https://ivicuo.github.io/claudio. Non-technical IVICUERs use this daily.
2. **Cloudflare Worker**: `worker/index.js`, deployed to https://claudio-api.bitter-disk-1bf7.workers.dev. Proxies the Anthropic API and tool integrations server side, hides keys from the browser.
3. **Claude Code environment**: this `CLAUDE.md`, `.claude/` (agents, skills, commands, hooks, settings), `.mcp.json` (Notion, ClickUp, Slack, GitHub MCPs). Used by whoever maintains the system. GitHub Actions runs four scheduled agents on cron.

## Output conventions

No dashes in written output, use commas or restructure.
Prose over bullet lists for narrative content.
Professional, understated titles. No filler phrases.
Match the language of the user's message.

## Two way action model

Every write to Notion, ClickUp, or Slack must follow the same protocol: emit a structured preview, wait for explicit confirmation, then execute. The preview is JSON with shape `{ action_preview: true, tool, description, current_state, proposed_state }`. The frontend renders this as a confirmation card. Never call a write endpoint without first emitting this preview and receiving confirmation.

## Git conventions

Conventional commits (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`).
Feature branches off main, PRs required for merges.
Any change to `prompts/`, `.claude/agents/`, or `config/agents.json` must go through PR review.
Main branch is protected. PRs require one approving review.
Main auto deploys to production on merge.

## Local setup

```
npm install
cp .env.example .env
# fill in real values
npm run dev
```

The Vite dev server runs at http://localhost:5173. The Worker can be developed against using `npm run worker:dev` (runs `wrangler dev`).

## Triggering agents manually

From the in app Admin Panel (gear icon, admin users only) or via the GitHub UI: Actions tab, pick a workflow, click "Run workflow". Both routes call the same `workflow_dispatch` endpoint.

## Where secrets live

Local development: `.env` (never committed).
GitHub Actions: GitHub Secrets at github.com/IVICUO/claudio/settings/secrets/actions.
Cloudflare Worker: Worker environment variables at dash.cloudflare.com.

Never commit `.env` or any file containing real credentials. The `.gitignore` enforces this for `.env*` patterns.

## Configuration checklist (current state, May 2026)

The system is fully built but not fully configured. All scheduled workflows are PAUSED until the items below are addressed. Manual triggering via the Admin Panel and `workflow_dispatch` still works.

### Secrets that need real values

GitHub Secrets at https://github.com/IVICUO/claudio/settings/secrets/actions, all currently `placeholder-set-manually`:
- `ANTHROPIC_API_KEY`
- `NOTION_API_KEY` (blocked: Sergio does not have permission to create the integration yet)
- `CLICKUP_API_KEY` (Sergio shared `pk_100568785_5EVV24DJ5H0G6SOZX0YI1RU9ZN2U6GV3` in chat on 2026-05-09 — rotate before setting)
- `SLACK_BOT_TOKEN`
- `SLACK_TEAM_ID`

Cloudflare Worker secrets at https://dash.cloudflare.com (Workers & Pages → claudio-api → Settings → Variables and Secrets), all currently `placeholder-set-manually`:
- `NOTION_API_KEY`
- `CLICKUP_API_KEY`
- `SLACK_BOT_TOKEN`

### Slack bot setup

The bridge agent posts to nine internal client channels (`#client-cognism`, `#client-cloudbeds`, `#client-thefork`, `#client-carto`, `#client-tinybird`, `#client-encord`, `#client-launchmetrics`, `#client-instantly`, `#client-trustyou`). The Slack app backing `SLACK_BOT_TOKEN` must be invited to each one before the workflow will succeed.

### Re-enabling scheduled workflows

After the above is done, uncomment the `schedule:` block in each YAML under `.github/workflows/`:
- `friday-sync.yml`
- `monday-digest.yml`
- `daily-insight.yml`
- `pre-meeting-brief.yml`
- `friday-clickup-bridge.yml`
- `clickup-bridge-replies.yml`

### Deferred to v2

- Notion → ClickUp option sync (auto-create new `Key Projects [Client]` dropdown options when corresponding `Main Project` values exist in Notion).
- In-app interactive bridge (a `/bridge` slash command in the chat to run an ad-hoc audit).
- Worker routes for in-app bridge (powering the above).
- ClickUp side-panel in the React app (currently broken because the project schema does not carry a `clickup_list_id`; replacement uses `Main Project` as the ClickUp tag bridge).
- Surface the proposed Roadmap First fields once they exist in the Notion schema (`Project Status Note`, `Sprint Active`, `Next Milestone`, `Quarter Focus`, `Waiting On`).
