/*
  Settings for the resume RAG pipeline (the "Ask me" bar on the landing page).

  Ingestion (scripts/ingest.ts, runs before every build):
    parse.ts → split.ts → embed.ts → store.ts
  Answering a question (src/app/api/ask/route.ts):
    embed.ts (question) → retrieve.ts → generate.ts → streamed answer

  Keys come from environment variables (Vercel project settings, or .env.local locally):
    GEMINI_API_KEY                                   Google AI Studio key
    UPSTASH_VECTOR_REST_URL / UPSTASH_VECTOR_REST_TOKEN   vector database
    UPSTASH_REDIS_REST_KV_REST_API_URL / _TOKEN           rate limiter (optional locally)
*/

export type ChatModel = { readonly name: string; readonly noThinking: boolean };

export const RAG = {
  resumePath: "content/resume.pdf",

  // Splitting: chunk size and overlap, in characters. 700 keeps each project/role in one chunk.
  chunkSize: 700,
  chunkOverlap: 100,

  // Embeddings: Gemini's embedding model, shortened to 768 numbers per chunk.
  embeddingModel: process.env.GEMINI_EMBEDDING_MODEL ?? "gemini-embedding-001",
  embeddingDimensions: 768,

  // Retrieval: how many chunks to fetch, and how similar a chunk must be to count. Upstash
  // reports cosine similarity on a 0–1 scale ((1 + cosine) / 2), so 0.5 means "unrelated".
  // Tuned on real questions (npm run ask): resume questions score ~0.78–0.86, off-topic ones
  // ("write a poem", "capital of France") ~0.74–0.76.
  topK: 6,
  minScore: 0.77,

  // Generation.
  // Answer models, tried in order: each has its own free-tier allowance (only ~5 answers/min
  // each on the free plan), so if one is busy or unavailable the next one answers.
  // noThinking: skip the model's "thinking" step for speed (not every model accepts the setting).
  chatModels: [
    { name: process.env.GEMINI_CHAT_MODEL ?? "gemini-3.5-flash", noThinking: true },
    { name: "gemini-3.5-flash-lite", noThinking: false },
    { name: "gemini-2.5-flash", noThinking: true }, // only ~20 answers/day free
  ],
  temperature: 0.2,
  maxOutputTokens: 400,

  // Rate limits per visitor (by IP address).
  perMinute: 10,
  perDay: 100,
} as const;

export function geminiKey() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not set");
  return key;
}

// True when every key the live pipeline needs is present.
export function ragConfigured() {
  return Boolean(
    process.env.GEMINI_API_KEY && process.env.UPSTASH_VECTOR_REST_URL && process.env.UPSTASH_VECTOR_REST_TOKEN,
  );
}
