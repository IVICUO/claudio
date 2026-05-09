# Client playbook template

How to replicate Claudio for a client engagement, without giving away IVICUO's specifics.

## What is reusable

The architecture itself: React app on Pages, Cloudflare Worker proxy, Claude Code environment with shared MCP, scheduled GitHub Actions for unattended runs.

The two way action model. Every framework or company we deploy this for benefits from the "preview then confirm" interaction pattern, regardless of what tools they use.

The agent shape: general assistant, channel reader, project syncer, insight detector, briefing generator. The names and concrete prompts change per client; the five role pattern is broadly applicable.

The five layer system prompt assembly: organization context, who the user is, agent specific instructions, project context, recent summaries, current open items. The proportions can shift but the layering generalizes.

## What is IVICUO specific

The brand: navy/teal/magenta palette, Plus Jakarta Sans, the magnet U logo. Strip these out and replace with the client's identity before anything ships.

The output conventions in `config/ivicuo-context.md`: no dashes, prose over bullets, no marketing voice. These are house rules, not universal advice.

The CRM and Data branch split, the biweekly client cadence, references to Salesforce/HubSpot/Pardot. These reflect IVICUO's operating model.

The team list in `config/team.json` and the `is_admin` flag.

## Setup time and required credentials

Estimated 2 to 3 hours for a fresh deployment, assuming all credentials are gathered ahead of time.

Required from the client:

- An Anthropic API key with budget allocated.
- A Notion workspace with an integration token, plus a parent page where Claudio can read and write.
- A ClickUp workspace with an API token and known list IDs for each project.
- A Slack workspace with a bot token (`xoxb-`) and the corresponding team ID.
- A GitHub account or organization that will own the repo (Pro tier or above if the repo is private and they want Pages and branch protection).
- A Cloudflare account with API token and account ID.

Required from us:

- A clear taxonomy of the client's projects in Notion. Without this, the sidebar is empty and the system feels broken on day one.
- Agreement on the agent set. Most clients keep the five default agents. Some want to drop one or add a sixth (often a knowledge base agent).
- A short brand asset kit: primary color, accent color, logo, font. Two hours of design substitution gets us 90% of a custom feel.

## Deployment checklist

1. Fork or duplicate this repo into the client's GitHub.
2. Replace `config/ivicuo-context.md` with `config/<client>-context.md` reflecting their company.
3. Update `tailwind.config.js` colors and the `<Logo>` component.
4. Update `wrangler.toml` `name` and the Worker URL referenced in `vite.config.js` env, `index.html` meta, and `docs/onboarding.md`.
5. Set GitHub Secrets and Cloudflare Worker secrets (placeholders first, real values once their tokens are issued).
6. Adjust agent prompts in both `config/agents.json` and `.claude/agents/*.md` to match their tone of voice.
7. Walk one of their team members through the onboarding doc end to end, on a real project. Adjust until that walkthrough takes under five minutes.

## What we charge for

Setup is a fixed fee engagement (typically 2 to 3 weeks of one CRM branch person plus design assist).

Monthly retainer covers prompt evolution, new agent additions, and incident response when an upstream tool changes its API shape.

Client owns their Anthropic spend directly. We pass through Cloudflare costs at cost (negligible at most clients' usage levels).
