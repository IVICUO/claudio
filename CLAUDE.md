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
