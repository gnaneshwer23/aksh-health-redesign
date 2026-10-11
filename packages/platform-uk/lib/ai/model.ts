/**
 * One place that decides how Aksh reaches a language model.
 * - OPENAI_API_KEY set: call OpenAI directly with the organisation's own key (model ids "openai/<model>").
 * - Otherwise: the Vercel AI Gateway (AI_GATEWAY_API_KEY, or the deployment's OIDC identity on Vercel).
 * Callers keep their "provider/model" ids; nothing else changes.
 */
import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";

let openai: ReturnType<typeof createOpenAI> | null = null;

export function aiProvider(): "openai" | "gateway" | null {
  if (process.env.OPENAI_API_KEY?.trim()) return "openai";
  if (process.env.AI_GATEWAY_API_KEY?.trim() || process.env.VERCEL_OIDC_TOKEN || process.env.VERCEL === "1") return "gateway";
  return null;
}

export function aiConfigured(): boolean {
  return aiProvider() !== null;
}

export function languageModel(id: string): LanguageModel {
  if (aiProvider() === "openai" && id.startsWith("openai/")) {
    openai ??= createOpenAI({ apiKey: process.env.OPENAI_API_KEY!.trim() });
    return openai(id.slice("openai/".length));
  }
  return id;
}
