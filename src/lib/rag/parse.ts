import { readFile } from "node:fs/promises";
import { extractText, getDocumentProxy } from "unpdf";

/*
  Stage 1 — Parse: read the resume PDF and turn it into clean plain text.
  PDFs store positioned text fragments, not paragraphs, so the raw text needs tidying:
  words split across lines, odd bullet characters, and runs of spaces.
*/

export async function parseResume(path: string) {
  const pdf = await getDocumentProxy(new Uint8Array(await readFile(path)));
  const { text } = await extractText(pdf, { mergePages: false });
  return cleanText(text.join("\n\n"));
}

export function cleanText(raw: string) {
  return raw
    .replace(/\r\n?/g, "\n")
    .replace(/[   ]/g, " ") // non-breaking spaces
    .replace(/[•●▪◦‣⁃]\s*/g, "• ") // all bullet styles → "• "
    .replace(/(\w)-\n(\w)/g, "$1$2") // re-join words hyphenated across lines
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
