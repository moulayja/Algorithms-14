"use client";

import { useEffect, useState } from "react";
import { applyAll, applyFix, type CheckLanguage, type Issue } from "@/lib/grammar";
import type { Target } from "@/lib/translate";

const STORAGE_KEY = "text-helper-language";

const LANGUAGE_LABELS: Record<CheckLanguage, string> = {
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

/** Shows the mistake with a few words around it. */
function Snippet({ text, issue }: { text: string; issue: Issue }) {
  const start = Math.max(0, issue.offset - 25);
  const end = Math.min(text.length, issue.offset + issue.length + 25);
  return (
    <p className="snippet">
      {start > 0 && "…"}
      {text.slice(start, issue.offset)}
      <mark>{text.slice(issue.offset, issue.offset + issue.length) || " "}</mark>
      {text.slice(issue.offset + issue.length, end)}
      {end < text.length && "…"}
    </p>
  );
}

async function post<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) throw new Error(data.error ?? `Something went wrong (${res.status}).`);
  return data;
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

type Busy = "check" | Target | null;

export default function Home() {
  const [text, setText] = useState("");
  const [language, setLanguage] = useState<CheckLanguage>("auto");
  const [issues, setIssues] = useState<Issue[] | null>(null);
  const [translation, setTranslation] = useState<{ to: Target; text: string } | null>(null);
  const [busy, setBusy] = useState<Busy>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<"main" | "translation" | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "en" || saved === "fr" || saved === "auto") setLanguage(saved);
    } catch {}
  }, []);

  function chooseLanguage(lang: CheckLanguage) {
    setLanguage(lang);
    setIssues(null);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {}
  }

  function editText(value: string) {
    setText(value);
    setIssues(null); // positions are no longer valid once the text changes
    setError("");
  }

  async function paste() {
    try {
      editText(await navigator.clipboard.readText());
    } catch {
      setError("Couldn't read the clipboard. Long-press the box and tap Paste instead.");
    }
  }

  async function check(value = text, lang = language) {
    setError("");
    setBusy("check");
    try {
      const data = await post<{ issues: Issue[] }>("/api/check", { text: value, language: lang });
      setText(value);
      setIssues(data.issues);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(null);
    }
  }

  async function translate(to: Target) {
    setError("");
    setBusy(to);
    try {
      const data = await post<{ text: string }>("/api/translate", { text, to });
      setTranslation({ to, text: data.text });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(null);
    }
  }

  function fix(index: number, replacement: string) {
    if (!issues) return;
    const next = applyFix(text, issues, index, replacement);
    setText(next.text);
    setIssues(next.issues);
  }

  function ignore(index: number) {
    setIssues((list) => list?.filter((_, i) => i !== index) ?? null);
  }

  function fixAll() {
    if (!issues) return;
    const next = applyAll(text, issues);
    setText(next.text);
    setIssues(next.issues);
  }

  async function copy(which: "main" | "translation", value: string) {
    if (await copyText(value)) {
      setCopied(which);
      setTimeout(() => setCopied(null), 2000);
    } else {
      setError("Couldn't copy. Long-press the text to copy it.");
    }
  }

  function useTranslation() {
    if (!translation) return;
    editText(translation.text);
    chooseLanguage(translation.to);
    setTranslation(null);
  }

  const fixable = issues?.some((i) => i.replacements.length > 0) ?? false;

  return (
    <main>
      <header>
        <h1>Text Helper</h1>
      </header>

      <section className="card">
        <div className="row">
          <label htmlFor="text">Your message</label>
          <span className="row-links">
            <button type="button" className="link" onClick={paste}>
              Paste
            </button>
            {text && (
              <button
                type="button"
                className="link muted"
                onClick={() => {
                  editText("");
                  setTranslation(null);
                }}
              >
                Clear
              </button>
            )}
          </span>
        </div>
        <textarea
          id="text"
          rows={6}
          value={text}
          onChange={(e) => editText(e.target.value)}
          placeholder="Type or paste your text here"
          autoCapitalize="sentences"
          spellCheck
        />

        <span className="label">Language of your message</span>
        <Segmented label="Language" value={language} options={LANGUAGE_LABELS} onChange={chooseLanguage} />

        <div className="actions">
          <button type="button" className="primary" disabled={busy !== null || !text.trim()} onClick={() => check()}>
            {busy === "check" ? "Checking…" : "Check grammar"}
          </button>
          <button type="button" className="secondary" disabled={!text.trim()} onClick={() => copy("main", text)}>
            {copied === "main" ? "Copied ✓" : "Copy"}
          </button>
        </div>
        <div className="actions">
          <button type="button" className="secondary" disabled={busy !== null || !text.trim()} onClick={() => translate("fr")}>
            {busy === "fr" ? "Translating…" : "Translate to French"}
          </button>
          <button type="button" className="secondary" disabled={busy !== null || !text.trim()} onClick={() => translate("en")}>
            {busy === "en" ? "Translating…" : "Translate to English"}
          </button>
        </div>

        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
      </section>

      {issues && (
        <section className="card" aria-live="polite">
          {issues.length === 0 ? (
            <p className="good">✓ No mistakes found. Ready to copy and send.</p>
          ) : (
            <>
              <div className="row">
                <span className="label">
                  {issues.length} {issues.length === 1 ? "thing" : "things"} to look at
                </span>
                {fixable && (
                  <button type="button" className="link" onClick={fixAll}>
                    Fix all
                  </button>
                )}
              </div>
              <ul className="issues">
                {issues.map((issue, i) => (
                  <li key={`${issue.offset}-${issue.length}-${i}`}>
                    <Snippet text={text} issue={issue} />
                    <p className="message">{issue.message}</p>
                    <div className="chips">
                      {issue.replacements.map((r) => (
                        <button key={r} type="button" className="chip" onClick={() => fix(i, r)}>
                          {r || "(remove)"}
                        </button>
                      ))}
                      <button type="button" className="link muted" onClick={() => ignore(i)}>
                        Ignore
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      )}

      {translation && (
        <section className="card result" aria-live="polite">
          <span className="label">{translation.to === "fr" ? "In French" : "In English"}</span>
          <textarea
            aria-label="Translation"
            rows={Math.min(10, Math.max(3, translation.text.split("\n").length + 1))}
            value={translation.text}
            onChange={(e) => setTranslation({ ...translation, text: e.target.value })}
          />
          <div className="actions">
            <button type="button" className="primary" onClick={() => copy("translation", translation.text)}>
              {copied === "translation" ? "Copied ✓" : "Copy"}
            </button>
            <button type="button" className="secondary" onClick={useTranslation}>
              Edit &amp; check it
            </button>
          </div>
          <p className="hint">Free machine translation. Read it over before sending.</p>
        </section>
      )}
    </main>
  );
}
