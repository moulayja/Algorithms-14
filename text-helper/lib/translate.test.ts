import assert from "node:assert/strict";
import { test } from "node:test";
import { chunkText, decodeEntities, langPair, parseMyMemoryResponse } from "./translate.ts";

const bytes = (s: string) => new TextEncoder().encode(s).length;

test("language pairs", () => {
  assert.equal(langPair("fr"), "en|fr");
  assert.equal(langPair("en"), "fr|en");
});

test("short text is one chunk", () => {
  assert.deepEqual(chunkText("See you at 3."), ["See you at 3."]);
});

test("chunks rejoin to the original text and respect the limit", () => {
  const samples = [
    "Hello there! How are you? I'm fine.\n\nSee you tomorrow at 3. Bring the papers please.",
    "Une très longue phrase avec des accents éèàçù ".repeat(30),
    "word ".repeat(200) + "end.",
    "x".repeat(1000),
    "...!!!??\n\n  indented line\n",
  ];
  for (const s of samples) {
    const chunks = chunkText(s, 100);
    assert.equal(chunks.join(""), s);
    for (const c of chunks) assert.ok(bytes(c) <= 100, `chunk too long: ${bytes(c)}`);
  }
});

test("prefers sentence boundaries", () => {
  const s = "First sentence here. Second sentence here.";
  assert.deepEqual(chunkText(s, 25), ["First sentence here. ", "Second sentence here."]);
});

test("decodes HTML entities", () => {
  assert.equal(decodeEntities("J&#39;arrive &amp; toi&quot;"), 'J\'arrive & toi"');
  assert.equal(decodeEntities("&#233;t&#xE9;"), "été");
  assert.equal(decodeEntities("&amp;#39;"), "&#39;"); // decoded once, not twice
});

test("reads a good MyMemory response", () => {
  assert.equal(
    parseMyMemoryResponse({ responseStatus: 200, responseData: { translatedText: "Je t&#39;appelle" } }),
    "Je t'appelle",
  );
});

test("MyMemory quota and errors become readable messages", () => {
  assert.throws(
    () => parseMyMemoryResponse({ responseStatus: 429, responseData: { translatedText: "x" } }),
    /limit for today/,
  );
  assert.throws(
    () =>
      parseMyMemoryResponse({
        responseStatus: 200,
        responseData: { translatedText: "MYMEMORY WARNING: YOU USED ALL AVAILABLE FREE TRANSLATIONS FOR TODAY" },
      }),
    /limit for today/,
  );
  assert.throws(() => parseMyMemoryResponse({ responseStatus: 403, responseDetails: "INVALID LANGUAGE PAIR" }), /INVALID/);
  assert.throws(() => parseMyMemoryResponse(null), /Translation failed/);
});
