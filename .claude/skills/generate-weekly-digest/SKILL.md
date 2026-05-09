---
name: generate-weekly-digest
description: Use when producing the Monday morning weekly digest, either ad hoc or as part of the monday-digest workflow.
---

# Generate weekly digest

The weekly digest goes to two places: a new section on the relevant Notion project page, and a Slack message in the project's channel (or `#ivicuo-internal` for IVICUO Internal).

## Structure

The digest has exactly three parts. No more, no less.

### What moved last week

One short paragraph per project. Mention completions, decisions reached, client signals worth noting. Prose, not bullets.

### What is in flight this week

One short paragraph per project. Frame as commitments, not aspirations. Owner names from `config/team.json`.

### Worth a conversation

One to three items that warrant discussion in the weekly internal sprint. Could be opportunity signals (use Insight agent output), risk signals, or process friction.

## Slack formatting

Use Slack markdown: bold with `*text*`, italics with `_text_`, code with backticks. No headers. Section titles bolded only.
Include a thread invitation at the bottom: "Replies welcome in this thread."

## Notion formatting

Standard Notion blocks. H2 for week label ("Week of YYYY-MM-DD"), H3 for section names. Toggle blocks per project to keep the page tidy.

## Before posting

Both Notion write and Slack post are confirmed via the two way action protocol. Show both previews together so the user confirms once.
