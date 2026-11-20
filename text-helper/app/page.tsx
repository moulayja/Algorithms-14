"use client";

import { diffWords } from "diff";
import { useEffect, useState } from "react";
import type { Language, Mode, Tone } from "@/lib/prompt";

const STORAGE_KEY = "text-helper-settings";

interface Settings {
  password: string;
  tone: Tone;
  language: Language;
}

const DEFAULT_SETTINGS: Settings = { password: "", tone: "auto", language: "auto" };

// Browser storage can be blocked (private mode), so every access is guarded.
function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<Settings>) };
  } catch {}
  return DEFAULT_SETTINGS;
}

function saveSettings(s: Settings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {}
}

const TONE_LABELS: Record<Tone, string> = {
  auto: "Auto",
  casual: "Casual",
  friendly: "Friendly",
  professional: "Pro",
};

const LANGUAGE_LABELS: Record<Language, string> = {
  auto: "Auto",
  en: "English",
  fr: "Français",
};

function Segmented<T extends string>(props: {
  label: string;
  value: T;
  options: Record<T, string>;
  onChange: (v: T) => void;
}) {
  return (
    <div className="segment" role="radiogroup" aria-label={props.label}>
      {(Object.keys(props.options) as T[]).map((key) => (
        <button
          key={key}
          type="button"
          role="radio"
          aria-checked={props.value === key}
          className={props.value === key ? "on" : ""}
          onClick={() => props.onChange(key)}
        >
          {props.options[key]}
        </button>
      ))}
    </div>
  );
}

function Changes({ before, after }: { before: string; after: string }) {
  const parts = diffWords(before, after);
  if (parts.every((p) => !p.added && !p.removed)) {
    return <p className="hint">No changes needed. Your text was already good.</p>;
  }
  return (
    <p className="changes">
      {parts.map((p, i) =>
        p.added ? (
          <ins key={i}>{p.value}</ins>
        ) : p.removed ? (
          <del key={i}>{p.value}</del>
        ) : (
          <span key={i}>{p.value}</span>
        ),
      )}
    </p>
  );
}

export default function Home() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);
  const [received, setReceived] = useState("");
  const [draft, setDraft] = useState("");
  const [result, setResult] = useState("");
  const [resultFor, setResultFor] = useState<{ mode: Mode; draft: string } | null>(null);
  const [busy, setBusy] = useState<Mode | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const s = loadSettings();
    setSettings(s);
    setShowSettings(!s.password);
    setLoaded(true);
  }, []);

  function update(patch: Partial<Settings>) {
    const next = { ...settings, ...patch };
    setSettings(next);
    saveSettings(next);
  }

  async function paste(set: (v: string) => void) {
    try {
      set(await navigator.clipboard.readText());
    } catch {
      setError("Couldn't read the clipboard. Long-press the box and tap Paste instead.");
    }
  }

  async function run(mode: Mode) {
    setError("");
    setCopied(false);
    if (!settings.password) {
      setShowSettings(true);
      setError("Enter your app password first.");
      return;
    }
    setBusy(mode);
    try {
      const res = await fetch("/api/fix", {
        method: "POST",
        headers: { "content-type": "application/json", "x-app-password": settings.password },
        body: JSON.stringify({
          mode,
          draft,
          received,
          tone: settings.tone,
          language: settings.language,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { text?: string; error?: string };
      if (!res.ok || !data.text) {
        if (res.status === 401) setShowSettings(true);
        throw new Error(data.error ?? `Request failed (${res.status}).`);
      }
      setResult(data.text);
      setResultFor({ mode, draft });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(null);
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Couldn't copy. Long-press the text to copy it.");
    }
  }

  function clearAll() {
    setReceived("");
    setDraft("");
    setResult("");
    setResultFor(null);
    setError("");
  }

  if (!loaded) return null;

  return (
    <main>
      <header>
        <h1>Text Helper</h1>
        <button type="button" className="link" onClick={() => setShowSettings((v) => !v)}>
          {showSettings ? "Done" : "Settings"}
        </button>
      </header>

      {showSettings && (
        <section className="card">
          <label htmlFor="pw">App password</label>
          <input
            id="pw"
            type="password"
            autoComplete="current-password"
            value={settings.password}
            onChange={(e) => update({ password: e.target.value })}
            placeholder="The APP_PASSWORD you set on the server"
          />
          <p className="hint">Saved on this device only.</p>
        </section>
      )}

      <section className="card">
        <div className="row">
          <label htmlFor="received">Message you got (optional)</label>
          <button type="button" className="link" onClick={() => paste(setReceived)}>
            Paste
          </button>
        </div>
        <textarea
          id="received"
          rows={3}
          value={received}
          onChange={(e) => setReceived(e.target.value)}
          placeholder="Paste the text or email you received"
        />

        <div className="row">
          <label htmlFor="draft">Your reply, or notes on what to say</label>
          <button type="button" className="link" onClick={() => paste(setDraft)}>
            Paste
          </button>
        </div>
        <textarea
          id="draft"
          rows={5}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="e.g. ok see you tomorow at 3, ill bring the papers"
          autoCapitalize="sentences"
        />

        <span className="label">Tone</span>
        <Segmented label="Tone" value={settings.tone} options={TONE_LABELS} onChange={(tone) => update({ tone })} />
        <span className="label">Language</span>
        <Segmented
          label="Language"
          value={settings.language}
          options={LANGUAGE_LABELS}
          onChange={(language) => update({ language })}
        />

        <div className="actions">
          <button type="button" className="primary" disabled={busy !== null} onClick={() => run("check")}>
            {busy === "check" ? "Checking…" : "Check my text"}
          </button>
          <button type="button" className="secondary" disabled={busy !== null} onClick={() => run("reply")}>
            {busy === "reply" ? "Writing…" : "Write reply for me"}
          </button>
        </div>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
      </section>

      {result && (
        <section className="card result" aria-live="polite">
          <span className="label">Ready to send</span>
          <textarea
            aria-label="Result"
            rows={Math.min(10, Math.max(3, result.split("\n").length + 1))}
            value={result}
            onChange={(e) => setResult(e.target.value)}
          />
          <div className="actions">
            <button type="button" className="primary" onClick={copy}>
              {copied ? "Copied ✓" : "Copy"}
            </button>
            <button type="button" className="secondary" onClick={clearAll}>
              Start over
            </button>
          </div>
          {resultFor?.mode === "check" && (
            <>
              <span className="label">What changed</span>
              <Changes before={resultFor.draft} after={result} />
            </>
          )}
        </section>
      )}
    </main>
  );
}
