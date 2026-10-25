import { RAG } from "./config";
import { embedQuestion } from "./embed";
import { resumeSpace, type ChunkMetadata } from "./store";

/*
  Stage 5 — Retrieve: embed the question and find the resume chunks closest in meaning
  (cosine similarity in Upstash Vector). Chunks below `minScore` are dropped: if nothing is
  similar enough, the question isn't about the resume and we don't call the LLM at all.
*/

export type Retrieved = ChunkMetadata & { score: number };

export async function retrieve(question: string): Promise<Retrieved[]> {
  const vector = await embedQuestion(question);
  const results = await resumeSpace().query<ChunkMetadata>({
    vector,
    topK: RAG.topK,
    includeMetadata: true,
  });
  return results
    .filter((result) => result.metadata && result.score >= RAG.minScore)
    .map((result) => ({ ...result.metadata!, score: result.score }));
}
