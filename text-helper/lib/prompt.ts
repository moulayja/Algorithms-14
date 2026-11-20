// Builds the instructions sent to Claude. Kept free of SDK imports so it can be
// unit-tested with plain Node.

export const MODES = ["check", "reply"] as const;
export const TONES = ["auto", "casual", "friendly", "professional"] as const;
export const LANGUAGES = ["auto", "en", "fr"] as const;

export type Mode = (typeof MODES)[number];
export type Tone = (typeof TONES)[number];
export type Language = (typeof LANGUAGES)[number];

export const MAX_FIELD_LENGTH = 8000;

export interface FixRequest {
  mode: Mode;
  /** What the user wrote: a full draft (check) or rough notes (reply). */
  draft: string;
  /** The message the user received, for context. Optional. */
  received: string;
  tone: Tone;
  language: Language;
}

export type ParseResult =
  | { ok: true; value: FixRequest }
  | { ok: false; error: string };

function pick<T extends string>(
  allowed: readonly T[],
  value: unknown,
  fallback: T,
): T {
  return typeof value === "string" && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : fallback;
}

/** Validates an untrusted JSON body. Never throws. */
export function parseFixRequest(body: unknown): ParseResult {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "Request body must be a JSON object." };
  }
  const b = body as Record<string, unknown>;
  const draft = typeof b.draft === "string" ? b.draft.trim() : "";
  const received = typeof b.received === "string" ? b.received.trim() : "";
  const mode = pick(MODES, b.mode, "check");

  if (draft.length > MAX_FIELD_LENGTH || received.length > MAX_FIELD_LENGTH) {
    return { ok: false, error: `Text is too long (max ${MAX_FIELD_LENGTH} characters).` };
  }
  if (mode === "check" && !draft) {
    return { ok: false, error: "Write the text you want checked first." };
  }
  if (mode === "reply" && !draft && !received) {
    return { ok: false, error: "Paste the message you received, or write what you want to say." };
  }

  return {
    ok: true,
    value: {
      mode,
      draft,
      received,
      tone: pick(TONES, b.tone, "auto"),
      language: pick(LANGUAGES, b.language, "auto"),
    },
  };
}

// Stable across requests, so it can be cached.
export const SYSTEM_PROMPT = `You help one person write text messages and emails in English and French. They are a fluent speaker but worry about typos, grammar, and sounding unnatural. Your output gets copied and sent as-is, so return only the message itself: no quotes around it, no preface like "Here is", no explanation, no alternatives.

Sound like a real person texting, not like an AI:
- Keep their voice, their words, and roughly their length. A short text stays short.
- Use plain everyday words. Avoid stiff or flowery phrasing such as "I hope this message finds you well", "Feel free to", "Don't hesitate to", "I wanted to reach out", "delve", "N'hésitez pas à", "Je me permets de".
- Do not use em dashes or en dashes. Use commas, periods, or a new sentence.
- Do not add greetings, sign-offs, emojis, or exclamation marks the situation does not call for. Keep any emojis they used.
- Contractions are fine in English. In casual French, normal spoken forms are fine ("t'es", "j'sais pas" only if they already write that way).
- In French, keep their choice of "tu" or "vous", and fix accents, agreements, and conjugation.
- Never invent facts, times, places, or promises they did not give you.`;

const TONE_TEXT: Record<Tone, string> = {
  auto: "Match the tone of the conversation (casual with friends and family, polite with work contacts).",
  casual: "Tone: casual, like texting a friend.",
  friendly: "Tone: warm and friendly, but not over the top.",
  professional: "Tone: professional and polite, still natural and not stiff.",
};

const LANGUAGE_TEXT: Record<Language, string> = {
  auto: "Language: write in the language they wrote in. If they only gave a received message, answer in the language of that message.",
  en: "Language: write the final message in English, translating if needed.",
  fr: "Language: write the final message in French, translating if needed.",
};

/** The user-turn text for one request. */
export function buildUserPrompt(req: FixRequest): string {
  const parts: string[] = [];

  if (req.mode === "check") {
    parts.push(
      "Task: correct my message. Fix spelling, grammar, punctuation, and anything that sounds unnatural. Change as little as possible; if it is already good, return it unchanged.",
    );
  } else {
    parts.push(
      "Task: write the reply I will send. If I gave notes about what to say, follow them exactly. If I gave no notes, write a short, sensible reply to the received message.",
    );
  }

  parts.push(TONE_TEXT[req.tone], LANGUAGE_TEXT[req.language]);

  if (req.received) {
    parts.push(`<received_message>\n${req.received}\n</received_message>`);
  }
  if (req.draft) {
    const tag = req.mode === "check" ? "my_message" : "my_notes";
    parts.push(`<${tag}>\n${req.draft}\n</${tag}>`);
  }

  return parts.join("\n\n");
}

/** Removes wrappers the model sometimes adds despite instructions. */
export function cleanOutput(text: string): string {
  let out = text.trim();
  const pairs: Array<[string, string]> = [
    ['"', '"'],
    ["“", "”"],
    ["«", "»"],
  ];
  for (const [open, close] of pairs) {
    if (out.length >= 2 && out.startsWith(open) && out.endsWith(close)) {
      const inner = out.slice(open.length, out.length - close.length);
      // Only strip when the quotes wrap the whole message, not quote a part of it.
      if (!inner.includes(open) && !inner.includes(close)) {
        out = inner.trim();
      }
    }
  }
  return out;
}
