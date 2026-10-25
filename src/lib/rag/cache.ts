import { createHash } from "node:crypto";
import { redis } from "./redis";
import { storedResumeHash } from "./store";

/*
  Answer cache: visitors (recruiters especially) ask the same few questions, so a question that's
  been answered before is served straight from Redis: instant, and no Gemini quota used.
  The key includes the resume's fingerprint and the prompt version, so updating the resume or the
  rules starts a fresh cache automatically. Entries also expire after a week.
*/

const TTL_SECONDS = 7 * 24 * 60 * 60;
type Cached = { text: string; sources: string[] };

// The resume fingerprint changes only on deploy; remember it for a few minutes per server.
let resumeVersion: { value: string; until: number } | undefined;
async function currentResumeVersion() {
  if (!resumeVersion || resumeVersion.until < Date.now()) {
    resumeVersion = { value: (await storedResumeHash()) ?? "none", until: Date.now() + 5 * 60_000 };
  }
  return resumeVersion.value;
}

// "What RAG projects have you built?" and "what rag projects have you built" share one entry.
function normalize(question: string) {
  return question.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

async function keyFor(question: string, promptVersion: string) {
  const id = [await currentResumeVersion(), promptVersion, normalize(question)].join("|");
  return `ask:answer:${createHash("sha256").update(id).digest("hex").slice(0, 32)}`;
}

export async function getCachedAnswer(question: string, promptVersion: string): Promise<Cached | null> {
  const client = redis();
  if (!client) return null;
  try {
    return await client.get<Cached>(await keyFor(question, promptVersion));
  } catch {
    return null; // a cache problem should never break answering
  }
}

export async function saveCachedAnswer(question: string, promptVersion: string, answer: Cached) {
  const client = redis();
  if (!client || answer.text.trim().length < 20) return;
  try {
    await client.set(await keyFor(question, promptVersion), answer, { ex: TTL_SECONDS });
  } catch {
    // ignore: caching is best-effort
  }
}
