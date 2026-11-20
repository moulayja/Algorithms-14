// Pure helpers for grammar results. No network code, so they are easy to test.

export const CHECK_LANGUAGES = ["auto", "en", "fr"] as const;
export type CheckLanguage = (typeof CHECK_LANGUAGES)[number];

export const MAX_TEXT_LENGTH = 5000;

export interface Issue {
  offset: number;
  length: number;
  message: string;
  replacements: string[];
  /** e.g. "misspelling", "grammar", "typographical", "style" */
  type: string;
}

/** LanguageTool language parameters for each choice. */
export function languageToolParams(lang: CheckLanguage): Record<string, string> {
  if (lang === "en") return { language: "en-US" };
  if (lang === "fr") return { language: "fr-FR" };
  return { language: "auto", preferredVariants: "en-US,fr-FR" };
}

interface RawMatch {
  offset?: unknown;
  length?: unknown;
  message?: unknown;
  shortMessage?: unknown;
  replacements?: unknown;
  rule?: { issueType?: unknown };
}

/** Turns an untrusted LanguageTool response into clean, sorted issues. */
export function parseLanguageToolResponse(data: unknown): { issues: Issue[]; detected: string } {
  const d = (data ?? {}) as { matches?: unknown; language?: { detectedLanguage?: { name?: unknown } } };
  const detectedName = d.language?.detectedLanguage?.name;
  const raw = Array.isArray(d.matches) ? (d.matches as RawMatch[]) : [];

  const issues: Issue[] = [];
  for (const m of raw) {
    if (typeof m.offset !== "number" || typeof m.length !== "number") continue;
    const replacements = Array.isArray(m.replacements)
      ? (m.replacements as Array<{ value?: unknown }>)
          .map((r) => r?.value)
          .filter((v): v is string => typeof v === "string")
          .slice(0, 4)
      : [];
    issues.push({
      offset: m.offset,
      length: m.length,
      message:
        typeof m.message === "string" && m.message
          ? m.message
          : typeof m.shortMessage === "string"
            ? m.shortMessage
            : "Possible mistake",
      replacements,
      type: typeof m.rule?.issueType === "string" ? m.rule.issueType : "other",
    });
  }
  issues.sort((a, b) => a.offset - b.offset);
  return { issues, detected: typeof detectedName === "string" ? detectedName : "" };
}

/**
 * Applies one replacement and returns the new text plus the remaining issues,
 * with their positions shifted. Issues that overlapped the fixed one are dropped.
 */
export function applyFix(
  text: string,
  issues: Issue[],
  index: number,
  replacement: string,
): { text: string; issues: Issue[] } {
  const target = issues[index];
  if (!target) return { text, issues };
  const start = target.offset;
  const end = target.offset + target.length;
  const newText = text.slice(0, start) + replacement + text.slice(end);
  const delta = replacement.length - target.length;

  const rest: Issue[] = [];
  issues.forEach((issue, i) => {
    if (i === index) return;
    const iStart = issue.offset;
    const iEnd = issue.offset + issue.length;
    if (iEnd <= start) rest.push(issue);
    else if (iStart >= end) rest.push({ ...issue, offset: issue.offset + delta });
    // otherwise it overlapped the fixed text and is no longer valid
  });
  return { text: newText, issues: rest };
}

/** Applies the first suggestion of every issue that has one. */
export function applyAll(text: string, issues: Issue[]): { text: string; issues: Issue[] } {
  let state = { text, issues: [...issues] };
  // Work from the end so earlier positions stay valid; skip issues with no suggestion.
  for (let i = state.issues.length - 1; i >= 0; i--) {
    const issue = state.issues[i];
    if (issue && issue.replacements.length > 0) {
      state = applyFix(state.text, state.issues, i, issue.replacements[0]!);
    }
  }
  return state;
}
