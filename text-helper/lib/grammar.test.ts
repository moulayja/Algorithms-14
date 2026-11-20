import assert from "node:assert/strict";
import { test } from "node:test";
import { applyAll, applyFix, languageToolParams, parseLanguageToolResponse, type Issue } from "./grammar.ts";

const issue = (offset: number, length: number, replacements: string[] = []): Issue => ({
  offset,
  length,
  replacements,
  message: "m",
  type: "misspelling",
});

test("language params", () => {
  assert.deepEqual(languageToolParams("fr"), { language: "fr-FR" });
  assert.deepEqual(languageToolParams("en"), { language: "en-US" });
  assert.equal(languageToolParams("auto").language, "auto");
});

test("parses a LanguageTool response and ignores junk", () => {
  const r = parseLanguageToolResponse({
    language: { detectedLanguage: { name: "French" } },
    matches: [
      { offset: 10, length: 3, message: "B", replacements: [{ value: "x" }, { value: 5 }], rule: { issueType: "grammar" } },
      { offset: 0, length: 2, shortMessage: "A", replacements: [] },
      { offset: "bad", length: 1 },
    ],
  });
  assert.equal(r.detected, "French");
  assert.equal(r.issues.length, 2);
  assert.equal(r.issues[0]!.offset, 0); // sorted
  assert.equal(r.issues[0]!.message, "A");
  assert.deepEqual(r.issues[1]!.replacements, ["x"]);
  assert.equal(r.issues[1]!.type, "grammar");
});

test("handles empty or broken responses", () => {
  assert.deepEqual(parseLanguageToolResponse(null).issues, []);
  assert.deepEqual(parseLanguageToolResponse({ matches: "no" }).issues, []);
});

test("applyFix replaces text and shifts later issues", () => {
  const text = "i seen tomorow";
  const issues = [issue(0, 1, ["I"]), issue(2, 4, ["saw"]), issue(7, 7, ["tomorrow"])];
  const r = applyFix(text, issues, 1, "have seen");
  assert.equal(r.text, "i have seen tomorow");
  assert.equal(r.issues.length, 2);
  assert.equal(r.issues[0]!.offset, 0);
  assert.equal(r.issues[1]!.offset, 12);
  assert.equal(r.text.slice(r.issues[1]!.offset, r.issues[1]!.offset + 7), "tomorow");
});

test("applyFix drops overlapping issues", () => {
  const r = applyFix("abcdef", [issue(1, 3, ["X"]), issue(2, 2, ["Y"])], 0, "X");
  assert.equal(r.text, "aXef");
  assert.equal(r.issues.length, 0);
});

test("applyFix with a bad index changes nothing", () => {
  const issues = [issue(0, 1, ["I"])];
  assert.deepEqual(applyFix("i", issues, 5, "x"), { text: "i", issues });
});

test("applyAll fixes everything that has a suggestion", () => {
  const text = "i seen him tomorow";
  const issues = [issue(0, 1, ["I"]), issue(2, 4, []), issue(11, 7, ["tomorrow", "tomorrows"])];
  const r = applyAll(text, issues);
  assert.equal(r.text, "I seen him tomorrow");
  assert.equal(r.issues.length, 1); // the one with no suggestion stays
  assert.equal(r.text.slice(r.issues[0]!.offset, r.issues[0]!.offset + 4), "seen");
});

test("applyAll works with French accents", () => {
  const text = "Je suis aller a la maison";
  const r = applyAll(text, [issue(8, 5, ["allé"]), issue(14, 1, ["à"])]);
  assert.equal(r.text, "Je suis allé à la maison");
});
