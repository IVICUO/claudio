---
name: fill-meeting-sheet
description: Use when transferring information between a ClickUp task and the Notion meeting sheet for a project. Maps fields between systems consistently.
---

# Fill meeting sheet

Each active client project has a Notion meeting sheet (one Notion page per project, "Meeting Notes" section) and a corresponding ClickUp list. This skill defines the field mapping.

## ClickUp to Notion mapping

| ClickUp field | Notion field |
|---|---|
| Task name | Meeting heading (H2) with date prefix |
| Description | "Context" subsection |
| Status (custom field "Decision") | "Decisions reached" subsection |
| Subtasks (status: open) | "Action items" subsection, owner from assignee |
| Comments (last 7 days) | "Discussion notes" subsection, attribution preserved |
| Due date | Action item due date inline |

## Notion to ClickUp mapping (less common)

| Notion section | ClickUp action |
|---|---|
| New action item | Create subtask, assignee from owner field, due date set |
| Decision marked "needs followup" | Create task in same list, status "Open", priority "High" |

## Conventions

Date format: ISO (YYYY-MM-DD), no other formats.
Owner names match `config/team.json` `name` field exactly.
Action items always have an owner. If the meeting did not assign one, write "Owner: TBD" and flag it.

Before any write, follow the two way action protocol: emit action_preview JSON, wait for confirmation.
