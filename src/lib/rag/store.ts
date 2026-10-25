import { Index } from "@upstash/vector";
import { RAG } from "./config";
import type { Chunk } from "./split";

/*
  Stage 4 — Store: save each chunk's vector plus its text in Upstash Vector.
  Chunks live in the "resume" namespace. A tiny record in the "meta" namespace remembers a
  fingerprint (hash) of the resume, so an unchanged resume isn't re-embedded on every deploy.
*/

export type ChunkMetadata = { text: string; section: string; title: string };

let index: Index | undefined;
export function vectorIndex() {
  index ??= Index.fromEnv();
  return index;
}

export const resumeSpace = () => vectorIndex().namespace("resume");
const metaSpace = () => vectorIndex().namespace("meta");

// A placeholder vector for the meta record (Upstash needs one; it's never searched).
const metaVector = () => Array.from({ length: RAG.embeddingDimensions }, (_, i) => (i === 0 ? 1 : 0));

export async function storedResumeHash() {
  const [record] = await metaSpace().fetch(["resume"], { includeMetadata: true });
  return (record?.metadata as { hash?: string } | undefined)?.hash;
}

// Replace everything in the "resume" namespace with the new chunks, then record the hash.
export async function replaceChunks(chunks: Chunk[], vectors: number[][], hash: string) {
  const space = resumeSpace();
  await space.reset();
  await space.upsert(
    chunks.map((chunk, i) => ({
      id: chunk.id,
      vector: vectors[i],
      metadata: { text: chunk.text, section: chunk.section, title: chunk.title } satisfies ChunkMetadata,
    })),
  );
  await metaSpace().upsert({ id: "resume", vector: metaVector(), metadata: { hash, chunks: chunks.length } });
}
