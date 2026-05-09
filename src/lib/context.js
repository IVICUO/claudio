// Builds the layered system prompt for every chat turn.

import agentsConfig from "../../config/agents.json";
import ivicuoContext from "../../config/ivicuo-context.md?raw";
import { getSummaries } from "./storage.js";

const TWO_WAY_INSTRUCTION = `
TWO WAY ACTION PROTOCOL (mandatory).
Before writing to any external tool (Notion, ClickUp, Slack), you must output a structured preview using this exact JSON format wrapped in a fenced code block tagged action_preview:

\`\`\`action_preview
{
  "action_preview": true,
  "tool": "notion" | "clickup" | "slack",
  "description": "<one line, what will change>",
  "current_state": "<what exists today>",
  "proposed_state": "<what will exist after the write>"
}
\`\`\`

The UI renders this as a confirmation card. Wait for the user to confirm before proceeding. Never execute writes without this flow.
`.trim();

export function buildSystemPrompt({ user, project, agentId, openTasks }) {
  const agent = agentsConfig.find((a) => a.id === agentId) || agentsConfig[0];

  const layer1 = ivicuoContext.trim();
  const layer2 = `You are speaking with ${user.name} from the ${user.branch} branch of IVICUO.`;
  const layer3 = agent.system_prompt;
  const layer4 = project?.contextText
    ? `Active project, ${project.name}.\n${project.contextText.slice(0, 1600)}`
    : `Active project, ${project?.name || "unspecified"}.`;

  const summaries = getSummaries(project?.id || "").slice(0, 3);
  const layer5 = summaries.length
    ? `Recent conversation summaries for this project (most recent first):\n` +
      summaries.map((s, i) => `(${i + 1}) ${s.summary || s.text || ""}`).join("\n")
    : "No prior conversation summaries on file for this project yet.";

  const layer6 = openTasks?.length
    ? `Open ClickUp tasks for this project:\n` +
      openTasks.slice(0, 10).map((t) => `- ${t.name} [${t.status || "open"}]`).join("\n")
    : "No open ClickUp tasks loaded for this project.";

  const prompt = [layer1, layer2, layer3, layer4, layer5, layer6, TWO_WAY_INSTRUCTION].join("\n\n");

  // Rough heuristic: 4 chars per token.
  const approxTokens = Math.ceil(prompt.length / 4);
  if (approxTokens > 4000) {
    console.warn(`[claudio] system prompt is ~${approxTokens} tokens, exceeds 4000 budget`);
  }
  return prompt;
}
