import assert from "node:assert/strict";
import { test } from "node:test";
import { buildUserPrompt, cleanOutput, MAX_FIELD_LENGTH, parseFixRequest } from "./prompt.ts";

test("rejects non-object bodies", () => {
  assert.equal(parseFixRequest(null).ok, false);
  assert.equal(parseFixRequest("hi").ok, false);
});

test("check mode needs a draft", () => {
  const r = parseFixRequest({ mode: "check", draft: "   ", received: "hello" });
  assert.equal(r.ok, false);
});

test("reply mode works with only a received message", () => {
  const r = parseFixRequest({ mode: "reply", received: "Tu viens ce soir ?" });
  assert.ok(r.ok);
});

test("reply mode needs something", () => {
  assert.equal(parseFixRequest({ mode: "reply" }).ok, false);
});

test("unknown options fall back to defaults", () => {
  const r = parseFixRequest({ mode: "hack", draft: "hi", tone: "angry", language: "de" });
  assert.ok(r.ok);
  if (r.ok) {
    assert.equal(r.value.mode, "check");
    assert.equal(r.value.tone, "auto");
    assert.equal(r.value.language, "auto");
  }
});

test("rejects overly long text", () => {
  const r = parseFixRequest({ draft: "a".repeat(MAX_FIELD_LENGTH + 1) });
  assert.equal(r.ok, false);
});

test("prompt includes received message and draft in tags", () => {
  const p = buildUserPrompt({
    mode: "check",
    draft: "ok see you tomorow",
    received: "Are we still on?",
    tone: "casual",
    language: "auto",
  });
  assert.match(p, /<received_message>\nAre we still on\?\n<\/received_message>/);
  assert.match(p, /<my_message>\nok see you tomorow\n<\/my_message>/);
  assert.match(p, /casual/);
});

test("reply prompt labels drafts as notes", () => {
  const p = buildUserPrompt({ mode: "reply", draft: "say yes", received: "", tone: "auto", language: "fr" });
  assert.match(p, /<my_notes>/);
  assert.doesNotMatch(p, /<received_message>/);
  assert.match(p, /French/);
});

test("cleanOutput strips wrapping quotes only", () => {
  assert.equal(cleanOutput('  "See you at 3"  '), "See you at 3");
  assert.equal(cleanOutput("« Ça marche »"), "Ça marche");
  assert.equal(cleanOutput('He said "ok" and left'), 'He said "ok" and left');
  assert.equal(cleanOutput('"a" and "b"'), '"a" and "b"');
});
