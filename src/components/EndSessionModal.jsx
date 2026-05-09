import React from "react";

export function EndSessionModal({ summary, onConfirm, onCancel, busy }) {
  return (
    <div className="fixed inset-0 bg-navy/90 flex items-center justify-center p-6 z-50">
      <div className="w-full max-w-2xl bg-navy-deep border-0.5 border-cloud/15 rounded-md overflow-hidden">
        <div className="px-5 py-4 border-b-0.5 border-cloud/10">
          <h3 className="text-cloud text-lg font-extrabold">End session, save summary?</h3>
          <p className="text-cloud/50 text-xs mt-1">
            This will append the summary to the project's Notion conversation log and clear the chat.
          </p>
        </div>

        <div className="p-5 max-h-[60vh] overflow-y-auto space-y-4">
          {summary ? (
            <>
              <Block label="Summary" content={summary.summary} />
              <Block label="Decisions" list={summary.decisions} />
              <Block label="Tasks created" list={summary.tasks_created} />
              <Block label="Client context to remember" content={summary.client_context} />
            </>
          ) : (
            <div className="text-cloud/40 text-sm">Generating summary...</div>
          )}
        </div>

        <div className="px-5 py-3 border-t-0.5 border-cloud/10 flex justify-end gap-2">
          <button
            onClick={onCancel}
            disabled={busy}
            className="text-cloud/60 hover:text-cloud text-xs font-bold uppercase tracking-tag px-3 py-1.5 transition-colors"
          >
            Keep chatting
          </button>
          <button
            onClick={onConfirm}
            disabled={!summary || busy}
            className="bg-teal text-navy text-xs font-bold uppercase tracking-tag px-3 py-1.5 rounded hover:bg-teal-dim transition-colors disabled:opacity-40"
          >
            {busy ? "Saving..." : "Save and end"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Block({ label, content, list }) {
  if (!content && (!list || list.length === 0)) return null;
  return (
    <div>
      <div className="text-cloud/40 text-[10px] font-bold uppercase tracking-tag mb-1">{label}</div>
      {content && <div className="text-cloud text-sm whitespace-pre-wrap">{content}</div>}
      {list && (
        <ul className="text-cloud text-sm space-y-1 list-disc list-inside marker:text-teal">
          {list.map((x, i) => <li key={i}>{typeof x === "string" ? x : JSON.stringify(x)}</li>)}
        </ul>
      )}
    </div>
  );
}
