import React, { useEffect, useState } from "react";
import { Logo } from "./Logo.jsx";
import { validateKey } from "../lib/api.js";
import { saveUser } from "../lib/storage.js";
import teamConfig from "../../config/team.json";

const BRANCHES = ["CRM", "Data"];

function detectName() {
  // Best effort guess based on a known team member, otherwise empty.
  // The browser cannot read the OS username, so we fall back to the first team entry.
  if (Array.isArray(teamConfig) && teamConfig[0]?.name) return teamConfig[0].name;
  return "";
}

export function Login({ onAuthed }) {
  const [name, setName] = useState(detectName());
  const [branch, setBranch] = useState(BRANCHES[0]);
  const [apiKey, setApiKey] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Try to derive branch from a name match in team.json.
  useEffect(() => {
    const match = teamConfig.find((t) => t.name?.toLowerCase() === name.toLowerCase());
    if (match?.branch && BRANCHES.includes(match.branch)) setBranch(match.branch);
  }, [name]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!name.trim()) return setError("Tell us your name first.");
    if (!apiKey.trim()) return setError("Your Anthropic API key is required.");
    setBusy(true);
    try {
      const res = await validateKey(apiKey.trim());
      if (!res.valid) {
        setError(res.error || "That key did not validate.");
        return;
      }
      saveUser({ name: name.trim(), branch, api_key: apiKey.trim() });
      onAuthed();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="geometric-bg min-h-screen flex items-center justify-center p-6">
      <div className="relative w-full max-w-md bg-navy-deep border-0.5 border-cloud/10 rounded-md p-8 shadow-2xl">
        <div className="flex justify-center mb-6">
          <Logo size="lg" />
        </div>

        <h1 className="text-cloud text-2xl font-extrabold text-center">Welcome to Claudio</h1>
        <p className="text-cloud/60 text-sm text-center mt-1 mb-8">IVICUO's AI brain</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <Field label="Your name">
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-navy border-0.5 border-cloud/15 rounded px-3 py-2 text-cloud focus:border-teal focus:outline-none transition-colors"
              placeholder="First name"
            />
          </Field>

          <Field label="Branch">
            <BranchPicker value={branch} onChange={setBranch} />
          </Field>

          <Field label="Your Anthropic API key">
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full bg-navy border-0.5 border-cloud/15 rounded px-3 py-2 text-cloud font-mono text-sm focus:border-teal focus:outline-none transition-colors"
              placeholder="sk-ant-..."
            />
            <p className="text-cloud/40 text-xs mt-1.5">
              This validates your identity and enables Claudio. Get yours at{" "}
              <a href="https://platform.anthropic.com/api-keys" target="_blank" rel="noreferrer" className="text-teal underline">
                platform.anthropic.com
              </a>
              .
            </p>
          </Field>

          {error && (
            <div className="text-magenta text-sm font-medium">{error}</div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full bg-teal text-navy font-bold py-2.5 rounded hover:bg-teal-dim transition-colors disabled:opacity-50"
          >
            {busy ? "Validating..." : "Connect"}
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-cloud/70 text-xs font-bold uppercase tracking-tag mb-1.5">{label}</span>
      {children}
    </label>
  );
}

function BranchPicker({ value, onChange }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {BRANCHES.map((b) => {
        const active = value === b;
        const accent = b === "CRM" ? "teal" : "magenta";
        return (
          <button
            key={b}
            type="button"
            onClick={() => onChange(b)}
            className={
              "px-3 py-2 rounded border-0.5 text-sm font-bold transition-colors " +
              (active
                ? accent === "teal"
                  ? "bg-teal/15 border-teal text-teal"
                  : "bg-magenta/15 border-magenta text-magenta"
                : "bg-navy border-cloud/15 text-cloud/70 hover:border-cloud/30")
            }
          >
            {b}
          </button>
        );
      })}
    </div>
  );
}
