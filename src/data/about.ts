// Content for /about. TODO(Hem): the skills below are still placeholders.

export const about = {
  photo: "/images/hem.webp" as string | null, // null shows the placeholder instead
  photoAlt: "Portrait of Hemanth Jammigumpala",
  // Same tone as Hem's LinkedIn About, refocused on GenAI solutions, agentic AI and FDE roles.
  intro: [
    "I'm Hemanth, a determined, detail-oriented problem solver focused on Generative AI solutions engineering and agentic AI. I recently graduated from The University of Texas at Dallas with a Bachelor's degree in Computer Information Systems and Technology, and I enjoy turning real business problems into working AI products.",
    "I build with LLMs, RAG, multi-agent workflows (LangGraph, MCP) and human-in-the-loop guardrails, and I care about the whole path: understanding how people actually work, prototyping fast, measuring quality with evals, and shipping something they use. That's what draws me to forward deployed engineering: working directly with teams to put AI where it improves decisions and efficiency.",
    "I'm always up for a coffee and a conversation about the latest capabilities in technology and how to craft them into a solution for a real problem.",
  ],
};

// Grouped skills. Items are a starting point taken from your projects; edit freely.
export const skillGroups = [
  { name: "GenAI & LLMs", items: ["RAG", "Prompt design", "Llama 3.3", "Claude", "Embeddings"] },
  { name: "Agents & Tools", items: ["LangGraph", "MCP", "Tavily", "Apify", "Tool calling"] },
  { name: "Backend", items: ["Python", "FastAPI", "REST APIs", "Vercel", "Render"] },
  { name: "Data", items: ["ChromaDB", "SQLite", "SQL", "Vector search"] },
  { name: "Product", items: ["Problem framing", "Prototyping", "User testing", "Shipping fast"] },
];
