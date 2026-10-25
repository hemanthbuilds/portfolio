/*
  Stage 2 — Split: break the resume text into small, self-contained chunks for retrieval.

  1. Redact private details (phone numbers) so they never reach the vector DB or the LLM.
  2. Re-join lines the PDF wrapped mid-sentence.
  3. Group into sections (PROFESSIONAL SUMMARY, PROJECT EXPERIENCE, ...) and, inside a section,
     into entries (one project / role / degree with its bullet points).
  4. Recursive split: an entry that fits in `chunkSize` stays whole; a longer one is split on
     bullets, then sentences, then words, with `chunkOverlap` characters carried over between
     neighbouring pieces so nothing is cut off without context.
  5. Every chunk starts with its section and entry title ("contextual header"), so a lone bullet
     like "Improved satisfaction from 59% to 88%" still says which project it belongs to.
*/

export type Chunk = {
  id: string;
  section: string; // e.g. "Project Experience"
  title: string; // entry title, e.g. "RAG Document Q&A System 2026" ("" for summary-style sections)
  text: string; // what gets embedded and shown to the LLM
};

const PHONE = /(\+?\d{1,2}[\s.-]?)?\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}/g;
const BULLET = /^•\s*/;
const DATE_AT_END = /((19|20)\d{2}|Present)$/i;

export function splitResume(text: string, chunkSize: number, chunkOverlap: number): Chunk[] {
  const lines = unwrap(redact(text).split("\n"));
  const chunks: Chunk[] = [];

  for (const section of toSections(lines)) {
    for (const entry of toEntries(section.lines)) {
      const header = [section.name, entry.title].filter(Boolean).join(" — ");
      const room = Math.max(chunkSize - header.length - 1, 120);
      for (const piece of recursiveSplit(entry.body.join("\n"), room, chunkOverlap)) {
        chunks.push({
          id: `${slug(section.name)}-${chunks.length}`,
          section: section.name,
          title: entry.title,
          text: `${header}\n${piece}`,
        });
      }
    }
  }
  return chunks;
}

export function redact(text: string) {
  return text.replace(PHONE, "").replace(/\|\s*\|/g, "|");
}

// The PDF wraps long lines; stitch continuations back onto the line they belong to.
function unwrap(lines: string[]) {
  const out: string[] = [];
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    const prev = out.at(-1);
    const startsNew =
      BULLET.test(line) ||
      isHeading(line) ||
      /^[A-Z][\w /&-]{1,40}:/.test(line) || // "Programming & Backend: ..."
      (/^[A-Z]/.test(line) && DATE_AT_END.test(line)) || // an entry title, e.g. "EV Charging ... Sep 2025 – Dec 2025"
      /^[A-Z][^•|]{0,60} \| /.test(line); // or one without dates, e.g. "PriorAuth Copilot | Prior Authorization Chatbot | ..."
    const continues =
      prev !== undefined &&
      !startsNew &&
      !isHeading(prev) &&
      (BULLET.test(prev) || /[,(&/-]$|\b(and|or|of|with|the|a|to|in|for|via)$/i.test(prev) || /^[a-z(]/.test(line) || !/[.:!?]$/.test(prev)) &&
      !DATE_AT_END.test(prev); // an entry title line ends with a year; the next line is new
    if (continues) out[out.length - 1] = `${prev} ${line}`;
    else out.push(line);
  }
  return out;
}

// "PROJECT EXPERIENCE" or "Technical Projects": a short line of capitalized words only.
function isHeading(line: string) {
  return line.length <= 40 && (/^[A-Z][A-Z &/-]+$/.test(line) || /^[A-Z][A-Za-z]*( (&|[A-Z][A-Za-z]*)){0,3}$/.test(line));
}

// "PROJECT EXPERIENCE" → "Project Experience"; "AI Product" stays as written.
function sectionName(line: string) {
  return line === line.toUpperCase() ? titleCase(line) : line;
}

function toSections(lines: string[]) {
  const sections: { name: string; lines: string[] }[] = [];
  for (const line of lines) {
    // The first block (name + contact line) has no heading of its own; call it "Profile".
    if (sections.length === 0) sections.push({ name: "Profile", lines: [isHeading(line) ? sectionName(line) : line] });
    else if (isHeading(line)) sections.push({ name: sectionName(line), lines: [] });
    else sections.at(-1)!.lines.push(line);
  }
  return sections.filter((section) => section.lines.length > 0);
}

// Within a section: a non-bullet line after bullets (or at the start) begins a new entry.
function toEntries(lines: string[]) {
  const entries: { title: string; body: string[] }[] = [];
  const hasBullets = lines.some((line) => BULLET.test(line));
  if (!hasBullets) return [{ title: "", body: lines }]; // e.g. summary, skills: one block

  for (const line of lines) {
    const current = entries.at(-1);
    if (BULLET.test(line)) {
      if (current) current.body.push(line);
      else entries.push({ title: "", body: [line] });
    } else if (!current || current.body.some((l) => BULLET.test(l))) {
      entries.push({ title: line, body: [] });
    } else {
      current.title = `${current.title} | ${line}`; // e.g. a role/team line under the title
    }
  }
  return entries.map((entry) => ({ ...entry, body: entry.body.length ? entry.body : [entry.title] }));
}

// Classic recursive character splitting: try the coarsest separator first.
const SEPARATORS = ["\n", ". ", " "];

export function recursiveSplit(text: string, size: number, overlap: number, level = 0): string[] {
  if (text.length <= size) return [text];
  const separator = SEPARATORS[level];
  if (separator === undefined) return hardSplit(text, size, overlap);

  const parts = text.split(separator).filter(Boolean);
  const pieces: string[] = [];
  let current = "";
  for (const part of parts) {
    const candidate = current ? current + separator + part : part;
    if (candidate.length <= size) {
      current = candidate;
      continue;
    }
    if (current) pieces.push(current);
    if (part.length > size) {
      pieces.push(...recursiveSplit(part, size, overlap, level + 1));
      current = "";
    } else {
      // Carry the tail of the previous piece forward as overlap.
      const tail = current.slice(-overlap);
      const start = tail.indexOf(" ");
      current = (start >= 0 && tail.length + part.length + 1 <= size ? tail.slice(start + 1) + separator : "") + part;
    }
  }
  if (current) pieces.push(current);
  return pieces;
}

function hardSplit(text: string, size: number, overlap: number) {
  const pieces: string[] = [];
  for (let i = 0; i < text.length; i += size - overlap) pieces.push(text.slice(i, i + size));
  return pieces;
}

function titleCase(text: string) {
  return text.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

function slug(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
