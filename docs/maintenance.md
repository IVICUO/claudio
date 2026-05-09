# Maintenance

For whoever is on rotation maintaining Claudio. Practical recipes, not theory.

## Update an agent prompt

Agent definitions live in two places that must stay in sync:

- The runtime app uses `config/agents.json`. This is what the in app agent selector loads.
- Claude Code uses `.claude/agents/*.md` (one file per agent, with frontmatter and a system prompt body).

To change an agent's behavior:

1. Branch off main, name it `prompt/<agent>-<short-reason>`.
2. Edit both files. They should always carry the same intent, even if the JSON is more compact.
3. Open a PR. The repo's branch protection requires one approving review before merge.
4. Once merged, the change is live for the React app on the next deploy (auto, on push to main). Claude Code picks up changes on next session start.

## Add a new client project in Notion

There is no `projects.json` in the repo. Notion is the source of truth.

1. In Notion, create a page under "Active Clients", named for the client.
2. Set the page's Branch property to CRM or Data, and Status to Active.
3. Add a `ClickUp List` rich text property holding the matching ClickUp list ID.
4. In the Claudio sidebar, click "Re sync from Notion". The new project appears immediately.

If you need to scaffold both the Notion page and the matching ClickUp list, run the `/new-project` Claude Code command from the repo locally.

## Check scheduled agent run history

GitHub: https://github.com/IVICUO/claudio/actions

Each of the four agent workflows (`friday-sync`, `monday-digest`, `daily-insight`, `pre-meeting-brief`) has its own page with all historical runs. Click any run to see the prompt, MCP calls made, and any output captured.

## Manually trigger any agent

From the Admin Panel in the app (gear icon, admin users only): each scheduled agent has a "Run now" button.

From GitHub directly: Actions tab, pick a workflow, click "Run workflow", choose `main` as the ref, click the green button.

Both routes hit the same `workflow_dispatch` event.

## Read cost data

Anthropic console: https://console.anthropic.com/settings/usage

Filter by API key to attribute spend per IVICUER (each user has their own key).

For Cloudflare Worker spend, https://dash.cloudflare.com points to the Workers Analytics dashboard. The Workers free tier covers 100k requests per day, which Claudio is unlikely to exceed in normal use.

## Rotate API keys

Anthropic personal keys: each user rotates their own at platform.anthropic.com/api-keys. After rotating, log out of Claudio ("Not you?" link in the empty chat state) and log in with the new key.

Notion, ClickUp, Slack service tokens (used by the Worker and by GitHub Actions): rotate in the respective vendor dashboard, then update both:

- Cloudflare Worker secrets via `npx wrangler secret put NAME` from this repo locally.
- GitHub Secrets via the GitHub UI at github.com/IVICUO/claudio/settings/secrets/actions.

Both must be updated within the same window or you will get inconsistent behavior between the live app and the scheduled agents.

The bootstrap GitHub PAT used during initial setup should be rotated immediately after the build, since it appeared in the build conversation transcript. The runtime never needs that token, only the per user fine grained PAT some admins keep for the Admin Panel.
