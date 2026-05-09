# Onboarding to Claudio

For a new IVICUER. Five steps, under five minutes.

## 1. Open Claudio

Open https://ivicuo.github.io/claudio in any modern browser (Chrome, Edge, Firefox, Safari).

You do not need to install anything. You do not need a GitHub account.

## 2. Get your Anthropic API key

Open https://platform.anthropic.com/api-keys in another tab.

Sign in with the email IVICUO uses for you. If you do not have an Anthropic account yet, create one (free) and ask in `#ivicuo-internal` for the team to invite you to the IVICUO organization. This is the difference between billing landing on you personally and billing landing on IVICUO.

Click "Create Key", give it a name like "Claudio personal", copy the value (starts with `sk-ant-`). Treat it like a password.

## 3. Log in

Back in Claudio:

Your name should be pre filled. If not, type your first name.
Pick your branch (CRM or Data).
Paste the API key in the third field.
Click Connect.

The app validates the key against Anthropic and stores `{ name, branch, key }` in your browser only. Your key never reaches any server other than Anthropic.

If Connect fails, the message will tell you why. The most common cause is a typo in the key.

## 4. Pick a project

The sidebar lists all active client projects, plus IVICUO Internal pinned at the top. The list is fetched from Notion, so you see exactly what is in Notion.

Click any project. The right side of the screen loads its open Slack threads and open ClickUp tasks. The chat area is ready.

## 5. Ask anything

Type in the chat. Default agent is "General assistant". Switch to "Slack agent" to ask about thread activity, "Project agent" for ClickUp/Notion sync, "Insight agent" for opportunity signals, "Report agent" for briefings.

If Claudio wants to write something to Notion, ClickUp, or Slack, it will show you a preview card with current state and proposed state side by side. Nothing is written until you click "Confirm and update". If something looks off, Cancel.

When you finish, click "End session". Claudio will summarize what was discussed, you confirm, and the summary is saved back to the project's Notion page. Next time you open the project, Claudio remembers.

## If something does not work

Check the Worker is up: open https://claudio-api.bitter-disk-1bf7.workers.dev/health, you should see a JSON status response.

Refresh the page. The app is fully client side, refresh fixes most state issues.

Click "Re sync from Notion" in the sidebar if the project list looks stale.

If the chat itself fails, your API key may be over its rate limit or out of credit. Check https://console.anthropic.com/settings/limits.

For anything else, post in `#claudio-help` on Slack.
