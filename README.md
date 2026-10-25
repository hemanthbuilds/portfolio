# Hemanth Jammigumpala: Portfolio + Ask Hemanth

**Live:** https://hemanth-jammigumpala.vercel.app

My portfolio site, with **Ask Hemanth**: a conversational RAG assistant that answers recruiters' questions about my
experience, skills and projects in my own voice, grounded only in my resume. It also uses LLM function calling to take
actions, like opening my LinkedIn or GitHub when asked.

## How the assistant works

```
Resume (content/resume.pdf), at build time:
  parse → split into sections and entries → embed (Gemini) → store (Upstash Vector)

Question (POST /api/ask):
  validate → rate limit (Upstash Redis) → prompt-injection screen → answer cache
  → retrieve resume chunks → Gemini, with the open_profile tool
      ├─ tool call      → open LinkedIn / GitHub (URL from src/data/site.ts, never from the model)
      ├─ nothing close  → fixed "only about my work" reply
      └─ answer         → streamed, grounded in the resume, cached
```

- **Grounded:** answers only from resume excerpts, says so when something isn't there, never shares private details.
- **Safe for a public site:** injection screening, relevance gate, phone-number redaction, per-visitor rate limits.
- **Reliable on free tiers:** answer cache plus automatic failover across 3 Gemini models. Runs at $0/month.
- **Tested:** `scripts/eval.ts` runs 46 real questions (facts, hallucination traps, private info, off-topic,
  prompt injection, dates, tool calls) through the same code the site uses and grades every answer.

## Stack

Next.js · TypeScript · Tailwind · Motion · Gemini (`@google/genai`) · Upstash Vector · Upstash Redis · Vercel.
Built with Claude Code.

## Run it locally

```bash
npm install
```

Create `.env.local` with `GEMINI_API_KEY`, `UPSTASH_VECTOR_REST_URL`, `UPSTASH_VECTOR_REST_TOKEN` and (optional,
for rate limiting and caching) `UPSTASH_REDIS_REST_KV_REST_API_URL` / `UPSTASH_REDIS_REST_KV_REST_API_TOKEN`.

```bash
npm run ingest   # load the resume into the vector store
npm run dev      # http://localhost:3000
npm run eval     # run the 46-case test suite against the live models
npm run ask -- "What RAG projects have you built?"   # one question, with retrieval scores
```

Site content (projects, about, links) lives in `src/data/`; components only read from there.
