// Pure helpers for translation. No network code, so they are easy to test.

export const TARGETS = ["fr", "en"] as const;
export type Target = (typeof TARGETS)[number];

/** MyMemory accepts at most 500 bytes per request; stay well under it. */
export const CHUNK_LIMIT = 400;

/** The source language is assumed to be the other one. */
export function langPair(to: Target): string {
  return to === "fr" ? "en|fr" : "fr|en";
}

function byteLength(s: string): number {
  return new TextEncoder().encode(s).length;
}

/** Hard-splits a single piece that is still too long, on spaces when possible. */
function splitLong(piece: string, limit: number): string[] {
  const out: string[] = [];
  let current = "";
  for (const word of piece.split(/(\s+)/)) {
    if (byteLength(current + word) <= limit) {
      current += word;
      continue;
    }
    if (current) out.push(current);
    current = word;
    // A single "word" longer than the limit: cut it by characters.
    while (byteLength(current) > limit) {
      let cut = current.length;
      while (cut > 1 && byteLength(current.slice(0, cut)) > limit) cut--;
      out.push(current.slice(0, cut));
      current = current.slice(cut);
    }
  }
  if (current) out.push(current);
  return out;
}

/**
 * Splits text into chunks under the limit, keeping lines and sentences whole
 * when possible. Joining the chunks gives back the original text exactly.
 */
export function chunkText(text: string, limit = CHUNK_LIMIT): string[] {
  // Split after sentence ends and newlines, keeping the separators attached.
  const pieces = text.match(/[^.!?\n]+[.!?]*[ \t]*|\n+|[.!?]+[ \t]*/g) ?? [text];
  const chunks: string[] = [];
  let current = "";
  for (const piece of pieces) {
    if (byteLength(current + piece) <= limit) {
      current += piece;
      continue;
    }
    if (current) chunks.push(current);
    current = "";
    if (byteLength(piece) <= limit) current = piece;
    else chunks.push(...splitLong(piece, limit));
  }
  if (current) chunks.push(current);
  return chunks;
}

const NAMED: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

/** MyMemory sometimes returns HTML entities; turn them back into characters (one pass). */
export function decodeEntities(s: string): string {
  return s.replace(/&(#\d+|#x[0-9a-f]+|amp|lt|gt|quot|apos|nbsp);/gi, (match, code: string) => {
    const lower = code.toLowerCase();
    if (lower.startsWith("#x")) return String.fromCodePoint(parseInt(lower.slice(2), 16));
    if (lower.startsWith("#")) return String.fromCodePoint(Number(lower.slice(1)));
    return NAMED[lower] ?? match;
  });
}

/** Reads one MyMemory response. Throws a readable error on quota or failure. */
export function parseMyMemoryResponse(data: unknown): string {
  const d = (data ?? {}) as {
    responseStatus?: unknown;
    responseDetails?: unknown;
    responseData?: { translatedText?: unknown };
  };
  const status = Number(d.responseStatus);
  const text = d.responseData?.translatedText;
  if (status === 429 || (typeof text === "string" && /MYMEMORY WARNING/i.test(text))) {
    throw new Error("The free translation limit for today is used up. Try again tomorrow.");
  }
  if (status !== 200 || typeof text !== "string") {
    const detail = typeof d.responseDetails === "string" ? d.responseDetails : "";
    throw new Error(detail ? `Translation failed: ${detail}` : "Translation failed. Try again.");
  }
  return decodeEntities(text);
}
