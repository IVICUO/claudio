---
description: Generate a pre-call briefing from Notion and ClickUp for the current project.
---

Use the report-agent subagent to produce a pre-call briefing for the active project.

Pull from:
- The project's Notion page (status, recent meeting notes, pinned context).
- The project's ClickUp list (open tasks, recently closed tasks, overdue items).
- The project's Slack channel (last 14 days, decisions and questions).

Default structure: situation, recent decisions, open items, recommended talking points (3 to 5).

Tone: professional, understated, no dashes, prose over bullets. Match the user's language.

Show the briefing in chat. Do not write it back to Notion unless the user explicitly asks.
