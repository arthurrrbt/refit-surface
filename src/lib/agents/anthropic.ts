import "server-only";
import Anthropic from "@anthropic-ai/sdk";

export const AGENT_MODEL = "claude-opus-5-5";

let client: Anthropic | null = null;

/** Client Claude partagé (clé : ANTHROPIC_API_KEY). Null si la clé n'est pas configurée. */
export function getAnthropic(): Anthropic | null {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  client ??= new Anthropic();
  return client;
}
