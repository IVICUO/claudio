---
description: Scaffold a new client project: Notion page from template plus matching ClickUp list.
argument-hint: <client name> <branch: CRM|Data>
---

Scaffold a new IVICUO client project for: $ARGUMENTS

Steps:

1. Create a Notion page under the "Active Clients" parent, titled with the client name. Apply the IVICUO project page template (Status, Recent Meeting Notes, Open Items, Pinned Context sections). Tag with the branch.
2. Create a ClickUp list under the matching folder (CRM or Data), titled "{Client Name} - Delivery".
3. Cross link: Notion page links to ClickUp list, ClickUp list description links back to the Notion page.
4. Add an entry to the project list cache so the new project appears in the Claudio sidebar on next sync.

Both writes use the two way action protocol. Show all proposed creates together so the user confirms once.
