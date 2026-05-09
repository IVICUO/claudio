import React, { useEffect, useMemo, useState } from "react";
import { Login } from "./components/Login.jsx";
import { Sidebar } from "./components/Sidebar.jsx";
import { ChatHeader } from "./components/ChatHeader.jsx";
import { ChatMessages } from "./components/ChatMessages.jsx";
import { ChatInput } from "./components/ChatInput.jsx";
import { RightPanel } from "./components/RightPanel.jsx";
import { EndSessionModal } from "./components/EndSessionModal.jsx";
import { AdminPanel } from "./components/AdminPanel.jsx";
import {
  getUser, clearUser,
  getProjectsCache, saveProjectsCache, getProjectsCacheAge,
  getConversation, saveConversation, clearConversation,
  appendSummary,
} from "./lib/storage.js";
import {
  fetchProjects, fetchProjectContext,
  fetchClickupTasks, fetchSlackThreads,
  chatStream, writeSummary, createClickupTask,
} from "./lib/api.js";
import { buildSystemPrompt } from "./lib/context.js";
import teamConfig from "../config/team.json";

export default function App() {
  const [user, setUser] = useState(getUser());
  if (!user) return <Login onAuthed={() => setUser(getUser())} />;

  return <MainApp user={user} onLogout={() => { clearUser(); setUser(null); }} />;
}

function MainApp({ user, onLogout }) {
  const [projects, setProjects] = useState(getProjectsCache() || []);
  const [cacheAge, setCacheAge] = useState(getProjectsCacheAge());
  const [resyncing, setResyncing] = useState(false);
  const [activeProject, setActiveProject] = useState(null);
  const [agentId, setAgentId] = useState("general-assistant");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [openTasks, setOpenTasks] = useState([]);
  const [openThreads, setOpenThreads] = useState([]);
  const [contextLoading, setContextLoading] = useState(false);
  const [contextSyncedAt, setContextSyncedAt] = useState(null);
  const [endingSession, setEndingSession] = useState(false);
  const [sessionSummary, setSessionSummary] = useState(null);
  const [savingSession, setSavingSession] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);

  const isAdmin = useMemo(
    () => teamConfig.find((t) => t.name?.toLowerCase() === user.name?.toLowerCase())?.is_admin === true,
    [user.name]
  );

  // Initial sync if there's no cache.
  useEffect(() => {
    if (projects.length === 0) handleResync();
  }, []);

  // When the active project changes, load conversation history and side context.
  useEffect(() => {
    if (!activeProject) return;
    setMessages(getConversation(activeProject.id));
    loadProjectSideContext(activeProject);
  }, [activeProject?.id]);

  async function handleResync() {
    setResyncing(true);
    try {
      const fetched = await fetchProjects();
      setProjects(fetched);
      saveProjectsCache(fetched);
      setCacheAge(0);
    } catch (e) {
      console.error("project fetch failed", e);
    } finally {
      setResyncing(false);
    }
  }

  async function loadProjectSideContext(project) {
    setContextLoading(true);
    setOpenTasks([]); setOpenThreads([]);
    try {
      const [contextText, tasks, threads] = await Promise.all([
        fetchProjectContext(project.notion_page_id).catch(() => ""),
        project.clickup_list_id ? fetchClickupTasks(project.clickup_list_id).catch(() => []) : Promise.resolve([]),
        fetchSlackThreads(project.name).catch(() => []),
      ]);
      project.contextText = contextText;
      setOpenTasks(tasks);
      setOpenThreads(threads);
      setContextSyncedAt(Date.now());
    } finally {
      setContextLoading(false);
    }
  }

  async function handleSend() {
    if (!activeProject) return;
    const text = input.trim();
    if (!text) return;
    setInput("");

    const nextMessages = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    saveConversation(activeProject.id, nextMessages);

    setBusy(true);
    const systemPrompt = buildSystemPrompt({ user, project: activeProject, agentId, openTasks });
    let assistantText = "";

    setMessages([...nextMessages, { role: "assistant", content: "" }]);

    try {
      await chatStream({
        messages: nextMessages.map((m) => ({ role: m.role, content: m.content })),
        system_prompt: systemPrompt,
        user_api_key: user.api_key,
        onDelta: (delta) => {
          assistantText += delta;
          setMessages((curr) => {
            const copy = curr.slice();
            copy[copy.length - 1] = { role: "assistant", content: assistantText };
            return copy;
          });
        },
      });
    } catch (e) {
      assistantText = `_(error: ${e.message})_`;
      setMessages((curr) => {
        const copy = curr.slice();
        copy[copy.length - 1] = { role: "assistant", content: assistantText };
        return copy;
      });
    } finally {
      const final = [...nextMessages, { role: "assistant", content: assistantText }];
      saveConversation(activeProject.id, final);
      setBusy(false);
    }
  }

  // Two way action handlers: parsed payload comes from ActionPreview.
  async function onActionConfirm(payload) {
    // The model emits the proposed_state; we forward it to the appropriate Worker route.
    // This is a generic dispatcher; specific routes may need tailored payloads.
    if (payload.tool === "notion") {
      const res = await writeSummary(activeProject.notion_page_id, payload.proposed_state);
      return { url: res.notion_url };
    }
    if (payload.tool === "clickup") {
      const taskName = typeof payload.proposed_state === "string"
        ? payload.proposed_state
        : payload.proposed_state?.task_name || payload.description;
      const res = await createClickupTask(activeProject.clickup_list_id, taskName, payload.description);
      return { url: res.task_url };
    }
    // Slack writes are not implemented in the worker yet.
    throw new Error(`writes for tool "${payload.tool}" are not wired in the worker yet`);
  }
  function onActionCancel() { /* no op, the card handles UI */ }

  async function handleEndSession() {
    setEndingSession(true);
    setSessionSummary(null);
    try {
      const summaryPrompt = [
        { role: "user", content:
          "Summarize this conversation in 3 to 5 sentences. Extract decisions made, tasks created, and any client context worth remembering. Return valid JSON only with shape: { \"summary\": string, \"decisions\": string[], \"tasks_created\": string[], \"client_context\": string }. No prose outside the JSON."
        }
      ];
      const fullConversation = messages.map((m) => `${m.role}: ${m.content}`).join("\n\n");
      let raw = "";
      await chatStream({
        messages: [{ role: "user", content: `Conversation:\n\n${fullConversation}\n\n${summaryPrompt[0].content}` }],
        system_prompt: "You are a precise summarizer. Output valid JSON only.",
        user_api_key: user.api_key,
        onDelta: (d) => { raw += d; },
      });
      let parsed;
      try {
        const match = raw.match(/\{[\s\S]*\}/);
        parsed = JSON.parse(match ? match[0] : raw);
      } catch {
        parsed = { summary: raw, decisions: [], tasks_created: [], client_context: "" };
      }
      setSessionSummary(parsed);
    } catch (e) {
      setSessionSummary({ summary: `Failed to summarize: ${e.message}`, decisions: [], tasks_created: [], client_context: "" });
    }
  }

  async function confirmEndSession() {
    setSavingSession(true);
    try {
      appendSummary(activeProject.id, sessionSummary);
      try {
        await writeSummary(activeProject.notion_page_id, sessionSummary);
      } catch (e) {
        console.warn("Notion write failed", e);
      }
      clearConversation(activeProject.id);
      setMessages([]);
    } finally {
      setSavingSession(false);
      setEndingSession(false);
      setSessionSummary(null);
    }
  }

  return (
    <div className="h-screen flex bg-navy">
      <Sidebar
        user={user}
        projects={projects}
        activeProjectId={activeProject?.id}
        onSelectProject={setActiveProject}
        onResync={handleResync}
        cacheAgeMs={cacheAge}
        resyncing={resyncing}
        onOpenAdmin={() => setShowAdmin(true)}
        isAdmin={isAdmin}
      />

      <main className="flex-1 flex min-w-0">
        <div className="flex-1 flex flex-col min-w-0">
          {activeProject ? (
            <>
              <ChatHeader
                project={activeProject}
                agentId={agentId}
                onAgentChange={setAgentId}
                onEndSession={handleEndSession}
                contextSyncedAt={contextSyncedAt}
                conversationCount={messages.length}
              />
              <ChatMessages
                messages={messages}
                agentId={agentId}
                onActionConfirm={onActionConfirm}
                onActionCancel={onActionCancel}
                busy={busy}
              />
              <ChatInput
                value={input}
                onChange={setInput}
                onSend={handleSend}
                projectName={activeProject.name}
                disabled={busy}
              />
            </>
          ) : (
            <EmptyChatState onLogout={onLogout} />
          )}
        </div>

        {activeProject && (
          <RightPanel
            threads={openThreads}
            tasks={openTasks}
            loading={contextLoading}
            onTaskClick={(t) => setInput((v) => (v ? `${v} ` : "") + t.name)}
          />
        )}
      </main>

      {endingSession && (
        <EndSessionModal
          summary={sessionSummary}
          onConfirm={confirmEndSession}
          onCancel={() => { setEndingSession(false); setSessionSummary(null); }}
          busy={savingSession}
        />
      )}

      {showAdmin && <AdminPanel user={user} onClose={() => setShowAdmin(false)} />}
    </div>
  );
}

function EmptyChatState({ onLogout }) {
  return (
    <div className="flex-1 geometric-bg flex flex-col items-center justify-center text-center p-10">
      <h2 className="text-cloud text-2xl font-extrabold">Pick a project to start</h2>
      <p className="text-cloud/50 text-sm mt-2 max-w-sm">
        Every conversation in Claudio is project scoped. Choose one from the sidebar, then ask anything.
      </p>
      <button
        onClick={onLogout}
        className="mt-8 text-cloud/40 text-xs font-bold uppercase tracking-tag hover:text-magenta transition-colors"
      >
        Not you?
      </button>
    </div>
  );
}
