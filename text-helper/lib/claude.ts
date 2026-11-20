import Anthropic from "@anthropic-ai/sdk";
import { buildUserPrompt, cleanOutput, SYSTEM_PROMPT, type FixRequest } from "./prompt";

// Server-only. Reads ANTHROPIC_API_KEY from the environment.
const client = new Anthropic();

export const MODEL = "claude-opus-5-5";

export class RefusalError extends Error {}

export async function fixText(req: FixRequest): Promise<string> {
  const response = await client.beta.messages.create({
    model: MODEL,
    max_tokens: 4000,
    // Short texts need little reasoning; low effort keeps replies fast.
    output_config: { effort: "low" },
    // If the model declines, the API retries on a fallback model in the same call.
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
    messages: [{ role: "user", content: buildUserPrompt(req) }],
  });

  if (response.stop_reason === "refusal") {
    throw new RefusalError("The AI declined to write this one. Try rewording it.");
  }

  const text = response.content
    .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");

  const cleaned = cleanOutput(text);
  if (!cleaned) {
    throw new Error("Got an empty answer. Please try again.");
  }
  return cleaned;
}
