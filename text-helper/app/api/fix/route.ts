import { timingSafeEqual } from "node:crypto";
import Anthropic from "@anthropic-ai/sdk";
import { fixText, RefusalError } from "@/lib/claude";
import { parseFixRequest } from "@/lib/prompt";

export const runtime = "nodejs";
export const maxDuration = 60;

function json(body: unknown, status = 200) {
  return Response.json(body, { status });
}

// Keeps strangers from spending your API credits if they find the URL.
function passwordOk(given: string | null): boolean {
  const expected = process.env.APP_PASSWORD;
  if (!expected || !given) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  if (!process.env.APP_PASSWORD || !process.env.ANTHROPIC_API_KEY) {
    return json({ error: "Server is not set up: APP_PASSWORD and ANTHROPIC_API_KEY are required." }, 500);
  }
  if (!passwordOk(request.headers.get("x-app-password"))) {
    return json({ error: "Wrong password." }, 401);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Request body must be JSON." }, 400);
  }

  const parsed = parseFixRequest(body);
  if (!parsed.ok) return json({ error: parsed.error }, 400);

  try {
    const text = await fixText(parsed.value);
    return json({ text });
  } catch (error) {
    if (error instanceof RefusalError) {
      return json({ error: error.message }, 422);
    }
    if (error instanceof Anthropic.RateLimitError) {
      return json({ error: "Too many requests right now. Wait a few seconds and try again." }, 429);
    }
    if (error instanceof Anthropic.AuthenticationError) {
      console.error("Anthropic auth failed: check ANTHROPIC_API_KEY");
      return json({ error: "The server's AI key is invalid." }, 500);
    }
    if (error instanceof Anthropic.APIConnectionError) {
      return json({ error: "Could not reach the AI. Check your connection and try again." }, 502);
    }
    if (error instanceof Anthropic.APIError) {
      console.error("Anthropic API error", error.status, error.message);
      return json({ error: "The AI service had a problem. Please try again." }, 502);
    }
    console.error(error);
    return json({ error: "Something went wrong. Please try again." }, 500);
  }
}
