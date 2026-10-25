import { ragConfigured } from "@/lib/rag/config";
import { prepareAnswer } from "@/lib/rag/answer";
import { AssistantBusyError } from "@/lib/rag/generate";
import { checkRateLimit } from "@/lib/rag/ratelimit";

/*
  POST /api/ask  { question: string }

  The query side of the resume RAG pipeline (see src/lib/rag/config.ts for the whole picture):
  validate → rate-limit → prepareAnswer (injection screen, retrieval, relevance gate, Gemini).

  Replies:
  - Streamed answer: text/plain body, plus an "X-Sources" header listing the resume sections used.
  - Tool call (open_profile): JSON { answer, open: { label, href } }; the chat opens the link.
  - Everything else (placeholder, off-topic, limits, errors): JSON { answer } or { error }.
*/

const MAX_QUESTION_LENGTH = 500;

const NOT_READY_ANSWER =
  "I'm still connecting my resume to this assistant. For now, browse the projects below or open my resume.";

export async function POST(request: Request) {
  let question: unknown;
  try {
    ({ question } = await request.json());
  } catch {
    return Response.json({ error: "Send JSON like { \"question\": \"...\" }." }, { status: 400 });
  }
  if (typeof question !== "string" || question.trim().length === 0) {
    return Response.json({ error: "Type a question first." }, { status: 400 });
  }
  if (question.length > MAX_QUESTION_LENGTH) {
    return Response.json({ error: `Keep questions under ${MAX_QUESTION_LENGTH} characters.` }, { status: 400 });
  }
  if (!ragConfigured()) {
    return Response.json({ answer: NOT_READY_ANSWER, ready: false });
  }

  const visitor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anonymous";
  const limited = await checkRateLimit(visitor).catch(() => null); // never block on limiter errors
  if (limited) return Response.json({ error: limited }, { status: 429 });

  try {
    const prepared = await prepareAnswer(question);
    if (prepared.kind === "fixed") return Response.json({ answer: prepared.text, sources: [] });
    if (prepared.kind === "open") return Response.json({ answer: prepared.text, open: prepared.link, sources: [] });

    const answer = prepared.stream;
    const sources = prepared.sources;
    const encoder = new TextEncoder();
    const body = new ReadableStream<Uint8Array>({
      async pull(controller) {
        try {
          const { value, done } = await answer.next();
          if (done) controller.close();
          else controller.enqueue(encoder.encode(value));
        } catch (error) {
          console.error("[api/ask] stream", error);
          controller.error(error);
        }
      },
    });
    return new Response(body, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Sources": encodeURIComponent(JSON.stringify(sources)),
      },
    });
  } catch (error) {
    // Over a free-tier limit (answer models, or the embedding model) → friendly "busy" message.
    if (error instanceof AssistantBusyError || (error as { status?: number }).status === 429) {
      return Response.json(
        { error: "Lots of people are asking right now. Give it a minute and try again!" },
        { status: 503 },
      );
    }
    console.error("[api/ask]", error);
    return Response.json({ error: "The assistant is unavailable right now. Please try again shortly." }, { status: 502 });
  }
}
