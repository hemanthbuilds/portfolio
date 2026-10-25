// All personal content lives here. Components only read from this file.

const email = "hemanthspd22@gmail.com";

export const site = {
  name: "Hemanth J", // short form, used in the nav and footer
  fullName: "Hemanth Jammigumpala",
  title: "Generative AI Products and AI Solutions Engineer",
  tagline: "I build AI products people actually use.",
  description:
    "Hemanth Jammigumpala is a Generative AI Products and AI Solutions Engineer who builds AI products people actually use.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  resumeUrl: "/resume.pdf",
  email,
  // Your profiles, in display order. The header icons and the footer both follow this order
  // (the header shows the ones it has icons for: GitHub, LinkedIn, Email).
  socials: [
    { label: "GitHub", href: "https://github.com/hemanthbuilds" },
    { label: "LinkedIn", href: "https://www.linkedin.com/in/hemanth-jammigumpala" },
    { label: "Email", href: `mailto:${email}` },
    { label: "Medium", href: "https://medium.com/@hemanthspd22" },
  ],
  // Articles are read from this Medium account's RSS feed (see src/lib/medium.ts).
  mediumUsername: "hemanthspd22",
} as const;

// Top menu. Each item scrolls to its section on the home page (one long, scrollable page);
// `page` is the matching full page (e.g. /projects), so the item stays lit when you're on it.
export const navLinks = [
  { label: "Home", href: "/", page: "/" },
  { label: "Projects", href: "/#projects", page: "/projects" },
  { label: "Articles", href: "/#articles", page: "/articles" },
  { label: "About", href: "/#about", page: "/about" },
  { label: "Contact", href: "/#contact", page: "/contact" },
] as const;

export const hero = {
  // The line under your name. (site.title is still used for the browser tab and search results.)
  subtitle: "Building Solutions Leveraging Generative AI",
  scrollHint: "Scroll to connect",

  // Scrolls along the bottom of the landing screen.
  motto: ["ideate", "build", "ship", "learn", "repeat"],

  // "Ask me" bar under the headline. Answers come from /api/ask (RAG over resume + projects, later).
  ask: {
    label: "Ask about Hemanth's work",
    placeholder: "Ask me anything about my work",
    submit: "Ask",
    thinking: "Thinking…",
    sources: "Based on my resume:",
    // The chat that opens over the page once someone asks.
    chatTitle: "Ask and know more about me",
    followUp: "Ask a follow-up…",
    close: "Close chat",
    closeHint: "Esc to close",
    error: "Couldn't reach the assistant. Try again in a moment.",
  },


  // The two hands. tipX / tipY = where the index fingertip sits in the image (0–1).
  // Both images are 2000 × 1342 on a pure black background.
  robotHand: {
    src: "/hero/robot-arm.webp",
    alt: "A robotic arm in black-and-white halftone, reaching out with its index finger",
    tipX: 0.952,
    tipY: 0.449,
    scale: 1, // drawn at the same size as the human hand
  },
  humanHand: {
    src: "/hero/human-hand.webp",
    alt: "A human hand reaching back toward the robotic hand",
    tipX: 0.2115,
    tipY: 0.44,
    scale: 1,
  },
  imageWidth: 2000,
  imageHeight: 1342,
} as const;
