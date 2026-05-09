# Architecture

Claudio is one repo, one set of MCP connections, three layers that share context.

## The three layers

**Layer 1, the Claudio app.** A React single page app deployed to GitHub Pages at https://ivicuo.github.io/claudio. This is what 13 of the 14 IVICUERs use every day. They open one URL, log in once with their name, branch, and Anthropic API key, and use it to talk to project context.

**Layer 2, the Cloudflare Worker.** `claudio-api` at https://claudio-api.bitter-disk-1bf7.workers.dev. The Worker proxies the Anthropic API (so a user's key stays in their browser, never on a server) and exposes thin endpoints into Notion, ClickUp, and Slack (using IVICUO scoped service tokens stored as Worker secrets). All POST endpoints validate the Origin header against `ALLOWED_ORIGIN`.

**Layer 3, the Claude Code environment.** `CLAUDE.md`, `.claude/` (agents, skills, slash commands, hooks, settings), and `.mcp.json`. Whoever maintains the system uses Claude Code locally with the same shared MCP connections (Notion, ClickUp, Slack, GitHub). Four scheduled GitHub Actions run agents on cron and call Claude Code in cloud runners. Two more workflows handle deploys.

## Data flow

A user types a question in the React app.

The app builds a layered system prompt: company context, who the user is, the current agent's specific instructions, the active project's Notion context, the last three conversation summaries from localStorage, and the project's open ClickUp tasks. Total budget, 4000 tokens.

The app calls `POST /chat` on the Worker with the user's API key in the body. The Worker forwards to Anthropic with the streaming flag set and pipes the SSE response back to the browser. The app renders tokens as they arrive.

When the model wants to write to Notion, ClickUp, or Slack, it emits an `action_preview` JSON block instead of writing. The app extracts the block, renders it as a confirmation card, and waits. Only after the user clicks "Confirm and update" does the app call the corresponding write endpoint on the Worker. This is the two way action model in one paragraph.

When a user ends a session, the app asks the model to summarize. The summary is shown for review, then appended to the project's Notion conversation log via `POST /notion-write-summary` and stored in localStorage for future context layers.

## Which tool owns what

Notion holds the canonical project list, project pages with embedded context, meeting notes, and the conversation log per project. The project list is fetched once per hour and cached in the browser. There is no `projects.json` in the repo by design.

ClickUp holds tasks, owners, statuses, due dates. The Friday sync agent reconciles ClickUp to Notion, ClickUp wins on facts.

Slack holds the live conversation. The Slack agent reads channels for action items and decisions, the Insight agent reads them for opportunity, expansion, and risk signals.

GitHub holds code, configuration, and the agent definitions. The system itself lives here. Branch protection requires PR review for any change to prompts or agents.

## How secrets flow

Local development: `.env` (never committed). Vite reads `VITE_*` vars; everything else is read by the Worker or by hooks.

GitHub Actions: GitHub Secrets at github.com/IVICUO/claudio/settings/secrets/actions. The four scheduled agent workflows mount them into the Claude Code base action's MCP config block.

Cloudflare Worker: dashboard environment variables and secrets. `NOTION_API_KEY`, `CLICKUP_API_KEY`, `SLACK_BOT_TOKEN` are scoped to the Worker. `ALLOWED_ORIGIN` is a plain var.

The user's Anthropic API key never leaves their browser. The Worker accepts it on every `/chat` request and forwards it to Anthropic, never persists it anywhere.

## The two way action model

Every write to an external tool follows the same protocol. The model emits a structured preview, the UI renders it as a card, the user explicitly confirms, then the app fires the actual write. This applies to creating a Notion block, creating a ClickUp task, posting a Slack message. Without exception. The cost is one extra round trip; the benefit is the team trusts Claudio enough to use it.

The protocol is enforced in three places: in the system prompt assembled per turn (`src/lib/context.js`), in the Worker's separate preview/confirm endpoints (`/notion-preview-update`, `/notion-confirm-update`), and in the React component that parses model output for `action_preview` JSON blocks (`src/components/ActionPreview.jsx`).
