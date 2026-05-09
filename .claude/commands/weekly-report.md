---
description: Trigger the report-agent to produce the weekly project report.
argument-hint: [project name]
---

Run the report-agent for the project named: $ARGUMENTS

If no project name is provided, list active projects from Notion and ask which one.

Apply the `generate-weekly-digest` skill structure: what moved last week, what is in flight this week, worth a conversation.

Output to chat first. If the user confirms, post to the project's Slack channel and append to the Notion page. Both writes use the two way action protocol.
