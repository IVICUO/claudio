---
name: detect-project-signal
description: Use when scanning Slack or ClickUp activity for early signals of new project opportunities, expansions, or risks. Encodes the language patterns IVICUO has learned predict opportunity.
---

# Detect project signal

This skill enumerates the language patterns IVICUO has historically observed precede new work.

## Opportunity signals (positive intent)

| Pattern | Likely meaning |
|---|---|
| "we should also" | Adjacent scope, often within current engagement |
| "would be useful to" | Explicit unmet need |
| "next phase" | Sequel engagement under discussion internally |
| "what about" + capability | Probing whether we cover that capability |
| "thinking about" + initiative | Early stage, worth a conversation now |
| "considering" + tool/process | Buying signal, may need our help to land it |

## Expansion signals (existing client, broader footprint)

| Pattern | Likely meaning |
|---|---|
| "their team is also" | Sister team with same problem |
| "another department" | Cross functional spread possible |
| "rolling this out to" | Scale up of the current work |
| "if this works, then" | Conditional next step, deserves followup |

## Risk signals

| Pattern | Likely meaning |
|---|---|
| "still struggling with" | Our work is not landing yet, intervene |
| "this isn't landing" | Adoption issue, often process not technical |
| "second time we" | Recurring problem, may be structural |
| "going around in circles" | Stuck, needs a reset conversation |
| "frustration" or "frustrated" | Surface this immediately, do not wait |

## How to apply

For each candidate match: quote the source verbatim with channel and author, name the project, classify the signal type, suggest one concrete followup. One short paragraph per signal. Risk signals always lead.
