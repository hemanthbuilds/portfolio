import { GoogleGenAI } from "@google/genai";
import { RAG, geminiKey } from "./config";

/*
  Stage 3 — Embed: turn text into vectors (lists of numbers that capture meaning) with Gemini.
  Resume chunks are embedded as documents; a visitor's question is embedded as a query. Gemini
  tunes each kind slightly differently, which makes question → chunk matching more accurate.
*/

type Purpose = "RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY";

let client: GoogleGenAI | undefined;
export function gemini() {
  client ??= new GoogleGenAI({ apiKey: geminiKey() });
  return client;
}

export async function embedTexts(texts: string[], purpose: Purpose) {
  const response = await gemini().models.embedContent({
    model: RAG.embeddingModel,
    contents: texts,
    config: { taskType: purpose, outputDimensionality: RAG.embeddingDimensions },
  });
  const vectors = response.embeddings?.map((embedding) => embedding.values ?? []) ?? [];
  if (vectors.length !== texts.length || vectors.some((v) => v.length !== RAG.embeddingDimensions)) {
    throw new Error("Gemini returned an unexpected number or size of embeddings");
  }
  // Shortened Gemini embeddings aren't unit length; normalise so cosine scores are comparable.
  return vectors.map(normalize);
}

export async function embedQuestion(question: string) {
  const [vector] = await embedTexts([question], "RETRIEVAL_QUERY");
  return vector;
}

function normalize(vector: number[]) {
  const length = Math.hypot(...vector) || 1;
  return vector.map((value) => value / length);
}
