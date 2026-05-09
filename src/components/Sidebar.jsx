import React, { useMemo, useState } from "react";
import Fuse from "fuse.js";
import { Logo } from "./Logo.jsx";
import { currentQuarter, availableQuarters, projectInQuarter } from "../lib/quarter.js";

const ALL_QUARTERS = "__all__";

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
  const [query, setQuery] = useState("");
  const [quarter, setQuarter] = useState(currentQuarter());
  const [collapsedClients, setCollapsedClients] = useState(() => new Set());

  const internal = useMemo(() => projects.find((p) => p.name === "IVICUO Internal"), [projects]);

  // Quarter filter, applied to non-internal projects.
  const inQuarter = useMemo(
    () =>
      projects
        .filter((p) => p.name !== "IVICUO Internal")
        .filter((p) => quarter === ALL_QUARTERS || projectInQuarter(p, quarter)),
    [projects, quarter]
  );

  // Fuzzy search across name, client, branch.
  const fuse = useMemo(
    () =>
      new Fuse(inQuarter, {
        keys: [
          { name: "name", weight: 0.6 },
          { name: "client", weight: 0.3 },
          { name: "branch", weight: 0.1 },
        ],
        threshold: 0.4,
        ignoreLocation: true,
        includeMatches: false,
      }),
    [inQuarter]
  );
  const filtered = useMemo(
    () => (query.trim() ? fuse.search(query.trim()).map((r) => r.item) : inQuarter),
    [fuse, query, inQuarter]
  );

  // Group by client. Projects without a client land under "Other".
  const groups = useMemo(() => {
    const map = new Map();
    for (const p of filtered) {
      const key = p.client || "Other";
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(p);
    }
    // Sort clients alphabetically, "Other" always last.
    const entries = Array.from(map.entries()).sort(([a], [b]) => {
      if (a === "Other") return 1;
      if (b === "Other") return -1;
      return a.localeCompare(b);
    });
    // Sort projects within each client by most recent activity.
    for (const [, list] of entries) {
      list.sort((a, b) => new Date(b.last_activity || 0) - new Date(a.last_activity || 0));
    }
    return entries;
  }, [filtered]);

  function toggleClient(name) {
    setCollapsedClients((curr) => {
      const next = new Set(curr);
      if (next.has(name)) next.delete(name); else next.add(name);
      return next;
    });
  }

  const quarters = useMemo(() => availableQuarters(projects), [projects]);

  return (
    <aside className="w-[240px] shrink-0 bg-navy-deep border-r-0.5 border-cloud/10 flex flex-col">
      <div className="px-4 pt-4 pb-3 border-b-0.5 border-cloud/10">
        <Logo size="md" />
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

      {/* Smart search */}
      <div className="px-3 pt-3 pb-2">
        <SearchBar value={query} onChange={setQuery} />
      </div>

      {/* Quarter selector */}
      <div className="px-3 pb-2 flex items-center gap-2">
        <QuarterPicker value={quarter} onChange={setQuarter} options={quarters} />
        {query && (
          <span className="text-cloud/40 text-[10px]">{filtered.length} match{filtered.length === 1 ? "" : "es"}</span>
        )}
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
        {internal && groups.length > 0 && <div className="my-2 border-b-0.5 border-cloud/5" />}
        {groups.length === 0 && !query && (
          <div className="text-cloud/30 text-xs px-2 py-3">
            No projects in {quarter === ALL_QUARTERS ? "any quarter" : quarter} yet, sync from Notion.
          </div>
        )}
        {groups.length === 0 && query && (
          <div className="text-cloud/30 text-xs px-2 py-3">No projects match "{query}".</div>
        )}
        {groups.map(([client, list]) => {
          const collapsed = collapsedClients.has(client);
          return (
            <div key={client} className="mb-1">
              <button
                onClick={() => toggleClient(client)}
                className="w-full flex items-center justify-between px-2 py-1 text-cloud/60 hover:text-cloud transition-colors group"
              >
                <span className="flex items-center gap-1.5">
                  <Caret open={!collapsed} />
                  <span className="text-[10px] font-bold uppercase tracking-tag">{client}</span>
                </span>
                <span className="text-cloud/30 text-[10px]">{list.length}</span>
              </button>
              {!collapsed && (
                <div>
                  {list.map((p) => (
                    <ProjectItem
                      key={p.id}
                      project={p}
                      active={activeProjectId === p.id}
                      onClick={() => onSelectProject(p)}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
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

function SearchBar({ value, onChange }) {
  return (
    <div className="relative">
      <SearchIcon />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search projects..."
        className="w-full bg-navy border-0.5 border-cloud/15 rounded pl-7 pr-7 py-1.5 text-xs text-cloud placeholder:text-cloud/30 focus:border-teal/60 focus:outline-none transition-colors"
      />
      {value && (
        <button
          onClick={() => onChange("")}
          aria-label="Clear search"
          className="absolute right-2 top-1/2 -translate-y-1/2 text-cloud/40 hover:text-cloud text-xs"
        >
          ×
        </button>
      )}
    </div>
  );
}

function QuarterPicker({ value, onChange, options }) {
  return (
    <div className="relative flex-1">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none bg-navy border-0.5 border-cloud/15 rounded pl-2 pr-6 py-1 text-[11px] font-bold text-cloud uppercase tracking-tag focus:border-teal/60 focus:outline-none cursor-pointer"
      >
        {options.map((q) => (
          <option key={q} value={q}>{q}</option>
        ))}
        <option value={ALL_QUARTERS}>All quarters</option>
      </select>
      <svg
        className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-cloud/40"
        width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      >
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </div>
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

function Caret({ open }) {
  return (
    <svg
      width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"
      style={{ transform: open ? "rotate(0deg)" : "rotate(-90deg)", transition: "transform 0.15s" }}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg
      className="absolute left-2 top-1/2 -translate-y-1/2 text-cloud/40 pointer-events-none"
      width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function GearIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}
