import React, { useMemo, useState } from "react";
import { Logo } from "./Logo.jsx";

export function Sidebar({
  user,
  projects,
  activeProjectId,
  onSelectProject,
  onResync,
  cacheAgeMs,
  resyncing,
  onOpenAdmin,
  isAdmin,
}) {
  const [filter, setFilter] = useState("");

  const internal = useMemo(() => projects.find((p) => p.name === "IVICUO Internal"), [projects]);
  const others = useMemo(
    () =>
      projects
        .filter((p) => p.name !== "IVICUO Internal")
        .filter((p) => p.name.toLowerCase().includes(filter.toLowerCase()))
        .sort((a, b) => new Date(b.last_activity || 0) - new Date(a.last_activity || 0)),
    [projects, filter]
  );

  return (
    <aside className="w-[220px] shrink-0 bg-navy-deep border-r-0.5 border-cloud/10 flex flex-col">
      <div className="p-4 border-b-0.5 border-cloud/10">
        <Logo size="sm" />
      </div>

      <div className="p-3 border-b-0.5 border-cloud/10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-teal/20 border-0.5 border-teal/40 flex items-center justify-center text-teal font-bold text-sm">
            {user.name?.[0]?.toUpperCase() || "?"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-cloud font-bold text-sm truncate">{user.name}</div>
            <BranchBadge branch={user.branch} small />
          </div>
        </div>
      </div>

      <div className="px-3 py-2 flex items-center justify-between">
        <span className="text-cloud/40 text-xs font-bold uppercase tracking-tag">Projects</span>
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter"
          className="bg-navy border-0.5 border-cloud/10 rounded px-2 py-1 text-xs text-cloud w-20 focus:w-32 focus:border-teal/50 focus:outline-none transition-all"
        />
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-2">
        {internal && (
          <ProjectItem
            project={internal}
            active={activeProjectId === internal.id}
            onClick={() => onSelectProject(internal)}
            internal
          />
        )}
        <div className="my-2 border-b-0.5 border-cloud/5" />
        {others.length === 0 ? (
          <div className="text-cloud/30 text-xs px-2 py-3">No active projects yet, sync from Notion.</div>
        ) : (
          others.map((p) => (
            <ProjectItem
              key={p.id}
              project={p}
              active={activeProjectId === p.id}
              onClick={() => onSelectProject(p)}
            />
          ))
        )}
      </div>

      <div className="p-3 border-t-0.5 border-cloud/10 space-y-2">
        <button
          onClick={onResync}
          disabled={resyncing}
          className="w-full text-xs font-bold border-0.5 border-teal/40 text-teal rounded px-2 py-1.5 hover:bg-teal/10 transition-colors disabled:opacity-40"
        >
          {resyncing ? "Syncing..." : "Re sync from Notion"}
        </button>
        <div className="flex items-center justify-between">
          <span className="text-cloud/30 text-[10px]">
            {cacheAgeMs == null ? "Not synced" : `Last synced ${humanAge(cacheAgeMs)} ago`}
          </span>
          {isAdmin && (
            <button
              onClick={onOpenAdmin}
              title="Admin panel"
              className="text-cloud/40 hover:text-teal transition-colors"
              aria-label="Admin panel"
            >
              <GearIcon />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}

function ProjectItem({ project, active, onClick, internal }) {
  return (
    <button
      onClick={onClick}
      className={
        "w-full text-left px-2.5 py-2 rounded transition-colors group " +
        (active
          ? "bg-teal/10 border-l-2 border-teal pl-2"
          : "hover:bg-cloud/5 border-l-2 border-transparent")
      }
    >
      <div className="flex items-center justify-between gap-2">
        <span className={"font-bold text-sm truncate " + (active ? "text-teal" : "text-cloud")}>
          {project.name}
        </span>
        {internal && <span className="text-[9px] font-bold text-cloud/40 uppercase tracking-tag">internal</span>}
      </div>
      <div className="flex items-center gap-1.5 mt-1">
        <BranchBadge branch={project.branch} small />
        {project.last_activity && (
          <span className="text-cloud/30 text-[10px]">{shortDate(project.last_activity)}</span>
        )}
      </div>
    </button>
  );
}

export function BranchBadge({ branch, small }) {
  if (!branch) return null;
  const isCRM = branch === "CRM";
  const cls =
    "inline-block font-bold uppercase tracking-tag rounded px-1.5 " +
    (small ? "text-[9px] py-0" : "text-[10px] py-0.5") +
    " " +
    (isCRM ? "bg-teal/15 text-teal" : "bg-magenta/15 text-magenta");
  return <span className={cls}>{branch}</span>;
}

function humanAge(ms) {
  const m = Math.floor(ms / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} h`;
  return `${Math.floor(h / 24)} d`;
}

function shortDate(iso) {
  try {
    const d = new Date(iso);
    return d.toISOString().slice(5, 10);
  } catch { return ""; }
}

function GearIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}
