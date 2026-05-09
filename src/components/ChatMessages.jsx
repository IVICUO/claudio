import React, { useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ActionPreview, extractActionPreviews } from "./ActionPreview.jsx";
import agentsConfig from "../../config/agents.json";

export function ChatMessages({ messages, agentId, onActionConfirm, onActionCancel, busy }) {
  const endRef = useRef(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, messages[messages.length - 1]?.content?.length]);

  const agentName = agentsConfig.find((a) => a.id === agentId)?.name || "Claudio";

  return (
    <div className="flex-1 overflow-y-auto px-5 py-6 space-y-4 geometric-bg">
      {messages.length === 0 && (
        <div className="text-cloud/40 text-sm text-center mt-16">
          Ask anything about this project.
        </div>
      )}
      {messages.map((m, i) => (
        <MessageRow key={i} message={m} agentName={agentName} onActionConfirm={onActionConfirm} onActionCancel={onActionCancel} />
      ))}
      {busy && (
        <div className="flex items-center gap-2 text-cloud/40 text-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-teal animate-pulse" />
          Claudio is thinking...
        </div>
      )}
      <div ref={endRef} />
    </div>
  );
}

function MessageRow({ message, agentName, onActionConfirm, onActionCancel }) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[75%] bg-teal text-navy rounded-2xl rounded-tr-sm px-4 py-2.5 font-medium">
          {message.content}
        </div>
      </div>
    );
  }

  const { cleanText, actions } = extractActionPreviews(message.content || "");

  return (
    <div className="flex flex-col items-start max-w-[85%]">
      <span className="text-cloud/40 text-[10px] font-bold uppercase tracking-tag mb-1">{agentName}</span>
      <div className="bg-navy-deep border-0.5 border-teal/30 rounded-2xl rounded-tl-sm px-4 py-3 text-cloud prose-message">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{cleanText || "..."}</ReactMarkdown>
        {actions.map((payload, i) => (
          <ActionPreview
            key={i}
            payload={payload}
            onConfirm={onActionConfirm}
            onCancel={onActionCancel}
          />
        ))}
      </div>
    </div>
  );
}
