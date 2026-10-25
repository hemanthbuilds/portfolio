/*
  Ask the resume assistant from the terminal, showing what retrieval found (with scores) before
  the answer. Handy for tuning RAG.minScore and checking guardrails.
    npm run ask -- "What RAG projects has Hemanth built?"
*/

import { retrieve } from "../src/lib/rag/retrieve";
import { streamAnswer } from "../src/lib/rag/generate";

async function main() {
  const question = process.argv.slice(2).join(" ").trim();
  if (!question) throw new Error('Usage: npm run ask -- "your question"');

  const chunks = await retrieve(question);
  console.log(`\nRetrieved ${chunks.length} chunk(s):`);
  for (const chunk of chunks) console.log(`  ${chunk.score.toFixed(3)}  ${chunk.text.split("\n")[0]}`);
  const result = await streamAnswer(question, chunks);
  if (result.kind === "open") {
    console.log(`\nTool call: open_profile(${result.profile})`);
    return;
  }
  if (chunks.length === 0) {
    console.log("\n(nothing relevant and no tool call: the site replies with its off-topic message)");
    return;
  }
  process.stdout.write("\nAnswer: ");
  for await (const piece of result.stream) process.stdout.write(piece);
  process.stdout.write("\n");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
