import React from "react";
import { BranchBadge } from "./Sidebar.jsx";
import agentsConfig from "../../config/agents.json";

export function ChatHeader({ project, agentId, onAgentChange, onEndSession, contextSyncedAt, conversationCount }) {
  return (
    <header className="border-b-0.5 border-cloud/10 bg-navy-deep">
      <div className="flex items-center justify-between px-5 py-3">
        <div className="flex items-center gap-3">
          <h2 className="text-cloud font-extrabold text-lg">{project?.name || "Select a project"}</h2>
          <BranchBadge branch={project?.branch} />
        </div>
        <div className="flex items-center gap-3">
          <AgentSelector value={agentId} onChange={onAgentChange} />
          <button
            onClick={onEndSession}
            className="border-0.5 border-magenta/50 text-magenta text-xs font-bold uppercase tracking-tag rounded px-3 py-1.5 hover:bg-magenta/10 transition-colors"
          >
            End session
          </button>
        </div>
      </div>
      <div className="px-5 py-2 border-t-0.5 border-cloud/5 flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-teal" />
        <span className="text-cloud/50 text-xs">
          Context loaded, {project?.name || "no project"}, {conversationCount} message
          {conversationCount === 1 ? "" : "s"}
          {contextSyncedAt && `, last sync ${new Date(contextSyncedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}
        </span>
      </div>
    </header>
  );
}

function AgentSelector({ value, onChange }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-navy border-0.5 border-cloud/15 text-cloud text-sm rounded px-3 py-1.5 pr-8 appearance-none focus:border-teal focus:outline-none cursor-pointer"
      >
        {agentsConfig.map((a) => (
          <option key={a.id} value={a.id}>{a.name}</option>
        ))}
      </select>
      <svg
        className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-cloud/50"
        width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      >
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </div>
  );
}
