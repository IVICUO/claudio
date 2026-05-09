import React, { useEffect, useState } from "react";
import { workerHealth } from "../lib/api.js";

const WORKFLOWS = [
  { file: "friday-sync.yml", name: "Friday sync", description: "Project agent: ClickUp to Notion sync for all active projects." },
  { file: "monday-digest.yml", name: "Monday digest", description: "Insight agent: weekly signal report to Notion and Slack." },
  { file: "daily-insight.yml", name: "Daily insight", description: "Slack agent: thread monitoring, action item extraction." },
  { file: "pre-meeting-brief.yml", name: "Pre meeting brief", description: "Report agent: briefings for upcoming meetings (next 48h)." },
];

export function AdminPanel({ user, onClose }) {
  const [health, setHealth] = useState(null);
  const [healthErr, setHealthErr] = useState("");
  const [runs, setRuns] = useState({});
  const [triggerState, setTriggerState] = useState({});

  useEffect(() => {
    workerHealth().then(setHealth).catch((e) => setHealthErr(e.message));
  }, []);

  useEffect(() => {
    if (!user.github_token) return;
    Promise.all(
      WORKFLOWS.map(async (w) => {
        try {
          const r = await fetch(
            `https://api.github.com/repos/IVICUO/claudio/actions/workflows/${w.file}/runs?per_page=1`,
            { headers: { Authorization: `token ${user.github_token}`, Accept: "application/vnd.github+json" } }
          );
          const data = await r.json();
          return [w.file, data.workflow_runs?.[0] || null];
        } catch { return [w.file, null]; }
      })
    ).then((entries) => setRuns(Object.fromEntries(entries)));
  }, [user.github_token]);

  async function trigger(file) {
    if (!user.github_token) {
      setTriggerState((s) => ({ ...s, [file]: { error: "Add a GitHub token in your profile to trigger workflows." } }));
      return;
    }
    setTriggerState((s) => ({ ...s, [file]: { status: "running" } }));
    try {
      const r = await fetch(
        `https://api.github.com/repos/IVICUO/claudio/actions/workflows/${file}/dispatches`,
        {
          method: "POST",
          headers: {
            Authorization: `token ${user.github_token}`,
            Accept: "application/vnd.github+json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ ref: "main" }),
        }
      );
      if (r.status === 204) {
        setTriggerState((s) => ({ ...s, [file]: { status: "queued" } }));
      } else {
        const text = await r.text();
        setTriggerState((s) => ({ ...s, [file]: { error: `${r.status}: ${text.slice(0, 120)}` } }));
      }
    } catch (e) {
      setTriggerState((s) => ({ ...s, [file]: { error: e.message } }));
    }
  }

  return (
    <div className="fixed inset-0 bg-navy/90 flex items-center justify-center p-6 z-50">
      <div className="w-full max-w-3xl bg-navy-deep border-0.5 border-cloud/15 rounded-md overflow-hidden max-h-[85vh] flex flex-col">
        <div className="px-5 py-4 border-b-0.5 border-cloud/10 flex items-center justify-between">
          <h3 className="text-cloud text-lg font-extrabold">Admin panel</h3>
          <button onClick={onClose} className="text-cloud/50 hover:text-cloud" aria-label="Close">×</button>
        </div>

        <div className="p-5 overflow-y-auto space-y-6">
          <Section title="Scheduled agents">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {WORKFLOWS.map((w) => {
                const last = runs[w.file];
                const ts = triggerState[w.file] || {};
                return (
                  <div key={w.file} className="border-0.5 border-cloud/10 rounded p-3 bg-navy">
                    <div className="text-cloud font-bold text-sm">{w.name}</div>
                    <div className="text-cloud/50 text-xs mt-1">{w.description}</div>
                    <div className="text-cloud/40 text-[11px] mt-2">
                      Last run: {last ? `${last.conclusion || last.status} on ${new Date(last.run_started_at).toLocaleString()}` : "never"}
                    </div>
                    <button
                      onClick={() => trigger(w.file)}
                      className="mt-3 text-xs font-bold border-0.5 border-teal/40 text-teal rounded px-2 py-1 hover:bg-teal/10 transition-colors"
                    >
                      Run now
                    </button>
                    {ts.status === "queued" && <span className="text-teal text-[11px] ml-2">Queued</span>}
                    {ts.error && <div className="text-magenta text-[11px] mt-2">{ts.error}</div>}
                  </div>
                );
              })}
            </div>
          </Section>

          <Section title="Cloudflare Worker">
            <div className="text-cloud text-sm">
              {healthErr && <span className="text-magenta">Health failed: {healthErr}</span>}
              {!healthErr && health && (
                <>
                  <span className="text-teal font-bold">{health.status}</span> · {health.worker} · {health.timestamp}
                </>
              )}
            </div>
          </Section>

          <Section title="GitHub Pages">
            <div className="text-cloud text-sm">
              Live at <a className="text-teal underline" href="https://ivicuo.github.io/claudio" target="_blank" rel="noreferrer">https://ivicuo.github.io/claudio</a>.
              Deploy status visible in the Actions tab on GitHub.
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <div className="text-cloud/40 text-[10px] font-bold uppercase tracking-tag mb-2">{title}</div>
      {children}
    </div>
  );
}
