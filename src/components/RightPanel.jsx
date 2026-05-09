import React, { useState } from "react";

export function RightPanel({ threads, tasks, loading, onTaskClick }) {
  const [collapsed, setCollapsed] = useState(false);

  if (collapsed) {
    return (
      <div className="w-[28px] border-l-0.5 border-cloud/10 bg-navy-deep flex items-start justify-center pt-3">
        <button
          onClick={() => setCollapsed(false)}
          className="text-cloud/40 hover:text-teal text-xs"
          aria-label="Expand context panel"
          title="Expand"
        >
          ‹
        </button>
      </div>
    );
  }

  return (
    <aside className="w-[200px] shrink-0 border-l-0.5 border-cloud/10 bg-navy-deep overflow-y-auto">
      <div className="flex items-center justify-between px-3 py-2 border-b-0.5 border-cloud/5">
        <span className="text-cloud/50 text-[10px] font-bold uppercase tracking-tag">Context</span>
        <button
          onClick={() => setCollapsed(true)}
          className="text-cloud/40 hover:text-teal text-xs"
          aria-label="Collapse context panel"
          title="Collapse"
        >
          ›
        </button>
      </div>

      <Section title="Open threads">
        {loading ? (
          <Skeleton n={3} />
        ) : threads.length === 0 ? (
          <Empty text="No open threads." />
        ) : (
          threads.map((t, i) => (
            <a
              key={i}
              href={t.url}
              target="_blank"
              rel="noreferrer"
              className="block px-3 py-2 hover:bg-cloud/5 border-b-0.5 border-cloud/5"
            >
              <div className="text-cloud text-xs font-bold truncate">#{t.channel || "channel"}</div>
              <div className="text-cloud/60 text-[11px] line-clamp-2 mt-0.5">{t.snippet}</div>
              {t.reply_count > 0 && (
                <div className="text-cloud/30 text-[10px] mt-1">{t.reply_count} replies</div>
              )}
            </a>
          ))
        )}
      </Section>

      <Section title="Open tasks">
        {loading ? (
          <Skeleton n={3} />
        ) : tasks.length === 0 ? (
          <Empty text="No open tasks." />
        ) : (
          tasks.map((t) => (
            <button
              key={t.id}
              onClick={() => onTaskClick?.(t)}
              className="block w-full text-left px-3 py-2 hover:bg-cloud/5 border-b-0.5 border-cloud/5"
            >
              <div className="text-cloud text-xs font-medium truncate">{t.name}</div>
              <div className="text-cloud/40 text-[10px] mt-0.5 uppercase tracking-tag">{t.status || "open"}</div>
            </button>
          ))
        )}
      </Section>
    </aside>
  );
}

function Section({ title, children }) {
  return (
    <div className="border-b-0.5 border-cloud/5">
      <div className="px-3 py-2 text-cloud/40 text-[10px] font-bold uppercase tracking-tag">{title}</div>
      <div>{children}</div>
    </div>
  );
}

function Empty({ text }) {
  return <div className="px-3 py-2 text-cloud/30 text-xs">{text}</div>;
}

function Skeleton({ n }) {
  return (
    <div className="px-3 py-2 space-y-2">
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className="h-3 rounded bg-cloud/5 animate-pulse" />
      ))}
    </div>
  );
}
