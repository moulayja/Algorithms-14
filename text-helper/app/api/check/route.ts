import { CHECK_LANGUAGES, languageToolParams, MAX_TEXT_LENGTH, parseLanguageToolResponse, type CheckLanguage } from "@/lib/grammar";

export const runtime = "nodejs";

// Free public LanguageTool server: no key needed, about 20 checks per minute.
const LANGUAGETOOL_URL = process.env.LANGUAGETOOL_URL || "https://api.languagetool.org/v2/check";

function json(body: unknown, status = 200) {
  return Response.json(body, { status });
}

export async function POST(request: Request) {
  let body: { text?: unknown; language?: unknown };
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
  const language: CheckLanguage = (CHECK_LANGUAGES as readonly unknown[]).includes(body.language)
    ? (body.language as CheckLanguage)
    : "auto";

  try {
    const res = await fetch(LANGUAGETOOL_URL, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded", accept: "application/json" },
      body: new URLSearchParams({ text, ...languageToolParams(language) }),
      signal: AbortSignal.timeout(15000),
    });
    if (res.status === 429) {
      return json({ error: "Too many checks in a short time. Wait a minute and try again." }, 429);
    }
    if (!res.ok) {
      console.error("LanguageTool error", res.status, await res.text().catch(() => ""));
      return json({ error: "The grammar checker had a problem. Try again." }, 502);
    }
    return json(parseLanguageToolResponse(await res.json()));
  } catch (error) {
    console.error("LanguageTool request failed", error);
    return json({ error: "Couldn't reach the grammar checker. Check your connection and try again." }, 502);
  }
}
