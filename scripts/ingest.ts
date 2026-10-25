/*
  Ingestion: parse → split → embed → store. Runs automatically before every build (npm "prebuild"),
  so deploying with an updated content/resume.pdf updates the assistant's answers.
  Run by hand with:  npm run ingest          (add -- --force to re-embed an unchanged resume)

  Skips quietly (without failing the build) when the keys aren't set yet.
*/

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { RAG, ragConfigured } from "../src/lib/rag/config";
import { embedTexts } from "../src/lib/rag/embed";
import { parseResume } from "../src/lib/rag/parse";
import { splitResume } from "../src/lib/rag/split";
import { replaceChunks, storedResumeHash } from "../src/lib/rag/store";

async function main() {
  if (!ragConfigured()) {
    console.log("[ingest] Skipped: GEMINI_API_KEY / UPSTASH_VECTOR_* not set.");
    return;
  }

  // Fingerprint the resume together with the settings that shape the chunks and vectors,
  // so changing either one triggers a re-embed.
  const pdf = await readFile(RAG.resumePath);
  const settings = [RAG.chunkSize, RAG.chunkOverlap, RAG.embeddingModel, RAG.embeddingDimensions].join("|");
  const hash = createHash("sha256").update(pdf).update(settings).digest("hex");

  if (!process.argv.includes("--force") && (await storedResumeHash()) === hash) {
    console.log("[ingest] Resume unchanged; vectors are up to date.");
    return;
  }

  const text = await parseResume(RAG.resumePath);
  const chunks = splitResume(text, RAG.chunkSize, RAG.chunkOverlap);
  const vectors = await embedTexts(
    chunks.map((chunk) => chunk.text),
    "RETRIEVAL_DOCUMENT",
  );
  await replaceChunks(chunks, vectors, hash);

  const sections = [...new Set(chunks.map((chunk) => chunk.section))].join(", ");
  console.log(`[ingest] Stored ${chunks.length} chunks (${text.length} chars) from: ${sections}`);
}

main().catch((error) => {
  console.error("[ingest] Failed:", error);
  process.exit(1);
});
