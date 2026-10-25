// Projects shown on /projects. Ones marked `featured` also appear on the home page.
// TODO(Hem): one-liners are placeholders written from your brief; add real descriptions and links
// (GitHub links added 2026-10-07 from github.com/hemanthbuilds).
// Leave liveUrl / githubUrl / caseStudy empty until they exist: the card hides missing links.

export type Project = {
  slug: string;
  name: string;
  summary: string; // one line: the problem it solves
  tags: string[];
  liveUrl?: string;
  githubUrl?: string;
  presentationUrl?: string; // a PDF deck/report, e.g. "/projects/ev-charging.pdf" (file in public/projects/)
  caseStudy?: string; // e.g. "/projects/chat-with-resume" once the MDX write-up exists
  featured?: boolean; // show on the home page (keep it to about 4)
  hideComingSoon?: boolean; // no links: show nothing instead of "Prototyping…"
};

export const projects: Project[] = [
  {
    slug: "state-farm-hr-assistant",
    featured: true,
    hideComingSoon: true,
    name: "State Farm RetentionIQ: HR Workforce Intelligence Agent (Capstone)",
    summary:
      "An AI agent that answers State Farm HR's workforce questions from structured HR data. Our LLM evaluation framework cut hallucinations and raised user satisfaction from 59% to 88%. UTD capstone.",
    tags: ["Stack AI", "No-code / low-code", "Claude Sonnet 4.5", "RAG", "LLM evals", "Guardrails", "Capstone"],
  },
  {
    // TODO(Hem): add liveUrl once it's deployed (Render + Vercel).
    slug: "event-planner",
    featured: true,
    name: "Multi-Agent Event Planner",
    summary:
      "Describe an event in one sentence; agents find venues, check logistics and draft the invites, then wait for your approval before anything is sent.",
    tags: [
      "LangGraph",
      "Claude API",
      "MCP",
      "Human-in-the-loop",
      "Google OAuth 2.0",
      "Gmail API",
      "Google Calendar API",
      "Tavily",
      "Neon Postgres",
      "LangSmith",
      "FastAPI",
      "Next.js",
    ],
    githubUrl: "https://github.com/hemanthbuilds/event-planner",
  },
  {
    slug: "priorauth-copilot",
    featured: true,
    name: "PriorAuth Copilot",
    summary:
      "Checks a doctor's note against real Medicare coverage policies in under a minute: ready to submit, what's missing, or needs a clinician, with quotes from the note and policy. The AI never denies; a human confirms.",
    tags: [
      "Hybrid RAG (BM25 + vector)",
      "Cross-encoder rerank",
      "Groq (gpt-oss-120b)",
      "Guardrails",
      "Human-in-the-loop",
      "RAGAS",
      "LangSmith",
      "FastAPI",
      "Streamlit",
    ],
    githubUrl: "https://github.com/hemanthbuilds/priorauth-copilot",
  },
  {
    slug: "ask-hemanth",
    name: "Ask Hemanth: Portfolio AI Assistant",
    summary:
      "This portfolio website, with a RAG chat assistant that answers questions about my work from my resume. Using LLM function calling, Gemini decides on each question whether to answer or take an action, like opening my LinkedIn or GitHub.",
    tags: ["RAG", "Gemini", "Function calling", "Upstash Vector", "Next.js", "Streaming"],
    liveUrl: "https://hemanth-jammigumpala.vercel.app",
  },
  {
    slug: "chat-with-resume",
    featured: true,
    name: "Chat-with-Resume",
    summary: "Ask questions about my resume and get grounded answers, powered by retrieval-augmented generation.",
    tags: ["RAG", "FastAPI", "ChromaDB", "Llama 3.3 70B (Groq)", "Vercel", "Render"],
    liveUrl: "https://frontend-kappa-nine-51.vercel.app",
    githubUrl: "https://github.com/hemanthbuilds/resume-chat",
  },
  {
    slug: "hem-run",
    name: "HEM.RUN",
    summary: "See my career trajectory and get to know me in a fun, playable pixel-art game.",
    tags: ["Game", "Interactive resume"],
    liveUrl: "https://hemanthbuilds.github.io/Hem.Run",
    githubUrl: "https://github.com/hemanthbuilds/Hem.Run",
  },
  {
    slug: "company-project-recommender",
    name: "Company Project Recommender Agent",
    summary: "An agent that researches a company and recommends projects worth building for it.",
    tags: ["LangGraph", "Apify", "Agents"],
    githubUrl: "https://github.com/hemanthbuilds/Resume-Project-Recommender",
  },
  {
    slug: "ev-charging-analytics",
    name: "EV Charging Infrastructure Analytics (DFW)",
    summary:
      "An end-to-end BI solution comparing EV charging demand with supply across Dallas–Fort Worth, with Tableau dashboards to guide where to invest.",
    tags: ["Tableau", "Alteryx", "Data cleaning", "BI", "Analytics", "Consulting"],
    presentationUrl: "/projects/ev-charging.pdf",
  },
  {
    // TODO(Hem): summary and tags are placeholders until we rewrite them from the PRD.
    slug: "red-bull-campaign",
    name: "Red Bull Marketing Campaign: PRD & Analysis",
    summary:
      "A marketing campaign plan for Red Bull, from the product requirements to the analysis of how it should perform.",
    tags: ["Marketing strategy", "PRD", "Campaign analysis"],
    presentationUrl: "/projects/red-bull-campaign.pdf",
  },
  {
    // TODO(Hem): we'll build this one and push it to GitHub; then add githubUrl.
    slug: "sports-scoring-database",
    name: "Sports Scoring Database & Reporting",
    summary:
      "A normalized relational database for player performance and scoring data, with SQL reporting views for analyzing trends and player stats.",
    tags: ["SQL", "Database design", "Reporting"],
  },
  {
    slug: "voice-to-sql-agent",
    featured: true,
    name: "Voice-to-SQL Agent",
    summary: "Ask a database questions out loud and get answers, no SQL needed.",
    tags: ["Sarvam AI", "SQLite", "MCP", "Streamlit"],
  },
];

// "AI Products" subsection (shown after the regular projects), in this order.
const AI_PRODUCT_ORDER = ["hem-run", "ask-hemanth", "chat-with-resume"];
export const aiProducts = AI_PRODUCT_ORDER.map((slug) => projects.find((project) => project.slug === slug)!);

// "Business Intelligence & Marketing" subsection (after AI Products), in this order.
const BI_MARKETING_ORDER = ["ev-charging-analytics", "sports-scoring-database", "red-bull-campaign"];
export const biMarketing = BI_MARKETING_ORDER.map((slug) => projects.find((project) => project.slug === slug)!);

// Everything else: the regular projects, listed first.
const inSubsection = new Set([...AI_PRODUCT_ORDER, ...BI_MARKETING_ORDER]);
export const otherProjects = projects.filter((project) => !inSubsection.has(project.slug));
export const featuredOtherProjects = otherProjects.filter((project) => project.featured);
