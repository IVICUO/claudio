import React, { useState } from "react";

// Renders the two way action confirmation card.
// `payload` is the parsed action_preview JSON object.
// `onConfirm` and `onCancel` are async, the card updates to reflect the result.
export function ActionPreview({ payload, onConfirm, onCancel }) {
  const [status, setStatus] = useState("pending"); // pending | working | done | cancelled | failed
  const [resultUrl, setResultUrl] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  async function handleConfirm() {
    setStatus("working");
    try {
      const res = await onConfirm(payload);
      setResultUrl(res?.url || null);
      setStatus("done");
    } catch (e) {
      setErrorMsg(e.message || String(e));
      setStatus("failed");
    }
  }

  function handleCancel() {
    setStatus("cancelled");
    onCancel?.(payload);
  }

  const toolColor = {
    notion: "text-cloud",
    clickup: "text-teal",
    slack: "text-magenta",
  }[payload.tool] || "text-cloud";

  return (
    <div className="my-2 border-0.5 border-teal/30 rounded bg-navy-deep/80 overflow-hidden">
      <div className="px-3 py-2 border-b-0.5 border-cloud/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-bold uppercase tracking-tag ${toolColor}`}>
            {payload.tool} write
          </span>
          <span className="text-cloud/70 text-xs">{payload.description}</span>
        </div>
        <StatusPill status={status} />
      </div>

      <div className="grid grid-cols-2 divide-x-0.5 divide-cloud/5">
        <div className="p-3">
          <div className="text-cloud/40 text-[10px] font-bold uppercase tracking-tag mb-1">Current</div>
          <div className="text-cloud/80 text-xs whitespace-pre-wrap break-words font-mono leading-relaxed">
            {stringifySafe(payload.current_state)}
          </div>
        </div>
        <div className="p-3 bg-teal/5">
          <div className="text-teal text-[10px] font-bold uppercase tracking-tag mb-1">Proposed</div>
          <div className="text-cloud text-xs whitespace-pre-wrap break-words font-mono leading-relaxed">
            {stringifySafe(payload.proposed_state)}
          </div>
        </div>
      </div>

      {status === "pending" && (
        <div className="px-3 py-2 border-t-0.5 border-cloud/5 flex items-center justify-end gap-2">
          <button
            onClick={handleCancel}
            className="text-cloud/60 hover:text-cloud text-xs font-bold uppercase tracking-tag px-3 py-1.5 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="bg-teal text-navy text-xs font-bold uppercase tracking-tag px-3 py-1.5 rounded hover:bg-teal-dim transition-colors"
          >
            Confirm and update
          </button>
        </div>
      )}
      {status === "done" && (
        <div className="px-3 py-2 border-t-0.5 border-teal/20 bg-teal/5 text-teal text-xs font-bold">
          Updated successfully{resultUrl && (
            <> · <a href={resultUrl} target="_blank" rel="noreferrer" className="underline">open</a></>
          )}
        </div>
      )}
      {status === "cancelled" && (
        <div className="px-3 py-2 border-t-0.5 border-cloud/10 text-cloud/50 text-xs">
          Cancelled, no changes made.
        </div>
      )}
      {status === "failed" && (
        <div className="px-3 py-2 border-t-0.5 border-magenta/30 bg-magenta/5 text-magenta text-xs">
          Failed, {errorMsg}
        </div>
      )}
    </div>
  );
}

function StatusPill({ status }) {
  const map = {
    pending: { label: "Awaiting confirmation", cls: "text-cloud/50 bg-cloud/5" },
    working: { label: "Writing...", cls: "text-teal bg-teal/10" },
    done: { label: "Done", cls: "text-teal bg-teal/10" },
    cancelled: { label: "Cancelled", cls: "text-cloud/50 bg-cloud/5" },
    failed: { label: "Failed", cls: "text-magenta bg-magenta/10" },
  };
  const s = map[status] || map.pending;
  return (
    <span className={`text-[9px] font-bold uppercase tracking-tag rounded px-1.5 py-0.5 ${s.cls}`}>
      {s.label}
    </span>
  );
}

function stringifySafe(v) {
  if (typeof v === "string") return v;
  try { return JSON.stringify(v, null, 2); } catch { return String(v); }
}

// Extracts action_preview JSON blocks from a streamed assistant message.
// Returns { cleanText, actions } where cleanText has the blocks removed and
// actions is an array of parsed payloads.
export function extractActionPreviews(text) {
  const fence = /```action_preview\s*([\s\S]*?)```/g;
  const actions = [];
  let cleanText = text;
  let match;
  while ((match = fence.exec(text)) !== null) {
    try {
      actions.push(JSON.parse(match[1].trim()));
    } catch {
      // Leave malformed blocks in the message text.
    }
  }
  cleanText = text.replace(fence, "").trim();
  return { cleanText, actions };
}
