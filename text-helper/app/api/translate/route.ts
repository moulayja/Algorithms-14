import { MAX_TEXT_LENGTH } from "@/lib/grammar";
import { chunkText, langPair, parseMyMemoryResponse, TARGETS, type Target } from "@/lib/translate";

export const runtime = "nodejs";

// Free MyMemory translation API: no key needed. Setting MYMEMORY_EMAIL (optional)
// raises the free daily limit from about 5,000 to 50,000 characters.
const MYMEMORY_URL = process.env.MYMEMORY_URL || "https://api.mymemory.translated.net/get";

function json(body: unknown, status = 200) {
  return Response.json(body, { status });
}

async function translateChunk(chunk: string, to: Target): Promise<string> {
  // Keep the spacing around each chunk so the pieces join back naturally.
  const lead = chunk.match(/^\s*/)?.[0] ?? "";
  const trail = chunk.match(/\s*$/)?.[0] ?? "";
  const core = chunk.trim();
  if (!core) return chunk;

  const params = new URLSearchParams({ q: core, langpair: langPair(to) });
  if (process.env.MYMEMORY_EMAIL) params.set("de", process.env.MYMEMORY_EMAIL);

  const res = await fetch(`${MYMEMORY_URL}?${params}`, { signal: AbortSignal.timeout(15000) });
  if (res.status === 429) {
    throw new Error("The free translation limit for today is used up. Try again tomorrow.");
  }
  if (!res.ok) throw new Error("The translator had a problem. Try again.");
  return lead + parseMyMemoryResponse(await res.json()) + trail;
}

export async function POST(request: Request) {
  let body: { text?: unknown; to?: unknown };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Request body must be JSON." }, 400);
  }

  const text = typeof body.text === "string" ? body.text : "";
  if (!text.trim()) return json({ error: "Type or paste a message first." }, 400);
  if (text.length > MAX_TEXT_LENGTH) {
    return json({ error: `Text is too long (max ${MAX_TEXT_LENGTH} characters).` }, 400);
  }
  if (!(TARGETS as readonly unknown[]).includes(body.to)) {
    return json({ error: "Choose French or English." }, 400);
  }
  const to = body.to as Target;

  try {
    const parts: string[] = [];
    // One at a time, so a long message doesn't trip the free service's rate limit.
    for (const chunk of chunkText(text)) parts.push(await translateChunk(chunk, to));
    return json({ text: parts.join("") });
  } catch (error) {
    console.error("Translation failed", error);
    const message =
      error instanceof Error && !(error instanceof TypeError) && error.name !== "TimeoutError"
        ? error.message
        : "Couldn't reach the translator. Check your connection and try again.";
    return json({ error: message }, 502);
  }
}
