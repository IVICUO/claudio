---
description: Force a ClickUp to Notion sync for the current project.
argument-hint: [project name]
---

Run the project-agent for: $ARGUMENTS

If no project name is provided, sync the active project from the chat context.

Compute the diff between ClickUp open tasks and the Notion project page. Show the proposed Notion updates as action_preview JSON. Wait for confirmation. Then execute.

Highlight any items that have been stalled for 14 days or more in plain prose at the end.
