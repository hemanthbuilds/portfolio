import { RAG, type ChatModel } from "./config";
import { getCachedAnswer, saveCachedAnswer } from "./cache";
import { PROMPT_VERSION, streamAnswer, type Profile } from "./generate";
import { retrieve } from "./retrieve";
import { site } from "../../data/site";

/*
  The whole query side in one place (used by /api/ask and by the test suite in scripts/eval.ts):
    1. Clean the question (strip anything that looks like our own prompt tags).
    2. Injection screen: obvious attempts to override the rules get a fixed reply; no LLM call.
    3. Answer cache: asked before → the stored answer, instantly, with no Gemini call.
    4. Retrieve resume chunks.
    5. Ask Gemini, which may call the open_profile tool (→ "open" result, not cached) instead of
       answering. Otherwise stream its grounded answer (and cache it), plus the resume sections it
       was based on; if nothing in the resume was close enough, the fixed off-topic reply instead.
*/

export const FIXED_ANSWERS = {
  offTopic:
    "I can only answer questions about my work: my projects, skills, experience and education. Try asking about one of those!",
  injection:
    "I can only answer questions about my work: my projects, skills, experience and education. I can't change how I work or share my instructions.",
};

export type Prepared =
  | { kind: "fixed"; text: string; reason: keyof typeof FIXED_ANSWERS }
  | { kind: "stream"; stream: AsyncGenerator<string>; sources: string[] }
  | { kind: "open"; profile: Profile; text: string; link: { label: string; href: string } };

const PROFILE_LABEL = { linkedin: "LinkedIn", github: "GitHub" } as const;

// Phrases that only show up when someone tries to take over the assistant.
const INJECTION_PATTERNS = [
  /\b(ignore|disregard|forget|override|bypass)\b.{0,40}\b(instructions?|rules|prompt|guidelines|above|previous|everything)\b/i,
  /\b(system|developer|hidden|initial|original)\s+(prompt|message|instructions?)\b/i,
  /\b(reveal|print|show|repeat|output|leak)\b.{0,30}\b(prompt|instructions?|rules|context|excerpts)\b/i,
  /\byou\s+are\s+(now|no longer)\b|\bpretend\s+(to\s+be|you\s+are)\b|\bact\s+as\b|\brole-?play\b/i,
  /\b(jailbreak|DAN mode|developer mode|do anything now)\b/i,
  /\b(rules?|instructions?|guidelines|prompt)\b.{0,30}\b(you (were|have been|are) given|you (follow|obey|have))\b/i,
  // The same attempts in other languages (French, Spanish, German).
  /\b(ignorez|ignorer|oubliez|ignora|ignore[sn]?|olvida|ignorieren?|ignoriere|vergiss)\b.{0,40}\b(instructions?|instrucciones|r[eè]gles|reglas|Anweisungen|Regeln|pr[eé]c[eé]dentes|anteriores|vorherigen)\b/i,
  /<\s*\/?\s*(system|resume|question|today|instructions?)\b/i,
];

export function sanitizeQuestion(question: string) {
  return question
    .replace(/[\u0000-\u001f\u007f]/g, " ") // control characters
    .replace(/<\s*\/?\s*(resume|question|today|system)[^>]*>/gi, " ") // our prompt's tags
    .replace(/\s+/g, " ")
    .trim();
}

export function looksLikeInjection(question: string) {
  return INJECTION_PATTERNS.some((pattern) => pattern.test(question));
}

type Options = { models?: readonly ChatModel[]; cache?: boolean };

export async function prepareAnswer(rawQuestion: string, options: Options = {}): Promise<Prepared> {
  const { models = RAG.chatModels, cache = true } = options;
  if (looksLikeInjection(rawQuestion)) return { kind: "fixed", text: FIXED_ANSWERS.injection, reason: "injection" };
  const question = sanitizeQuestion(rawQuestion);

  if (cache) {
    const hit = await getCachedAnswer(question, PROMPT_VERSION);
    if (hit) return { kind: "stream", stream: once(hit.text), sources: hit.sources };
  }

  const chunks = await retrieve(question);
  // Gemini is asked even with no matching resume text, so "open your LinkedIn" still reaches the tool.
  const result = await streamAnswer(question, chunks, models);
  if (result.kind === "open") {
    const label = PROFILE_LABEL[result.profile];
    const href = site.socials.find((social) => social.label === label)!.href;
    return { kind: "open", profile: result.profile, text: `Opening my ${label} in a new tab.`, link: { label, href } };
  }
  const stream = result.stream;
  if (chunks.length === 0) {
    void stream.return(undefined); // relevance gate: not about my work → fixed off-topic reply
    return { kind: "fixed", text: FIXED_ANSWERS.offTopic, reason: "offTopic" };
  }
  // "Based on" shows the sections that matched about as well as the best one, not every chunk
  // that cleared the bar (a simple education question shouldn't list four sections).
  const best = chunks[0].score;
  const sources = [...new Set(chunks.filter((chunk) => chunk.score >= best - 0.03).map((chunk) => chunk.section))];
  if (!cache) return { kind: "stream", stream, sources };

  // Pass the answer through as it streams, and cache it once it's complete.
  async function* recording() {
    let text = "";
    for await (const piece of stream) {
      text += piece;
      yield piece;
    }
    await saveCachedAnswer(question, PROMPT_VERSION, { text, sources });
  }
  return { kind: "stream", stream: recording(), sources };
}

async function* once(text: string) {
  yield text;
}
