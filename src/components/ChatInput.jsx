import React, { useRef } from "react";

export function ChatInput({ value, onChange, onSend, projectName, disabled }) {
  const taRef = useRef(null);

  function handleKey(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value.trim()) onSend();
    }
  }

  return (
    <div className="border-t-0.5 border-cloud/10 bg-navy-deep px-5 py-4">
      <div className="flex items-end gap-3 bg-navy border-0.5 border-cloud/15 rounded-lg px-3 py-2 focus-within:border-teal/60 transition-colors">
        <textarea
          ref={taRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKey}
          rows={1}
          placeholder={`Ask Claudio about ${projectName || "this project"}...`}
          disabled={disabled}
          className="flex-1 bg-transparent text-cloud placeholder:text-cloud/30 resize-none focus:outline-none max-h-32 py-1"
          style={{ minHeight: 28 }}
        />
        <button
          onClick={() => value.trim() && onSend()}
          disabled={disabled || !value.trim()}
          className="shrink-0 bg-teal text-navy w-8 h-8 rounded flex items-center justify-center disabled:opacity-30 hover:bg-teal-dim transition-colors"
          aria-label="Send"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </button>
      </div>
      <p className="text-cloud/30 text-[11px] mt-2">
        Claudio can read and update Notion, ClickUp, and Slack for this project.
      </p>
    </div>
  );
}
