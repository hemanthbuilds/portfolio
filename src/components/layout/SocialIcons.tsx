"use client";

import { useState } from "react";
import { useReducedMotion } from "motion/react";
import { site } from "@/data/site";
import { useLiquidBubble } from "./useLiquidBubble";

// Icon links to GitHub, LinkedIn and email (links come from src/data/site.ts). Hovering (or
// keyboard-focusing) them brings up the same liquid glass bubble as the menu, which flows between icons.

const ICONS = {
  GitHub: (
    <path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.52 2.34 1.08 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.56-1.11-4.56-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02a9.58 9.58 0 0 1 5 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.69-4.57 4.93.36.31.68.92.68 1.85v2.75c0 .27.18.58.69.48A10 10 0 0 0 12 2Z" />
  ),
  LinkedIn: (
    <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13ZM7.12 20.45H3.56V9h3.56v11.45Z" />
  ),
  Email: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="m4 7 8 6 8-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
};

// Same order as site.socials (so it matches the footer), keeping only the ones with an icon.
const links = site.socials.flatMap((social) =>
  social.label in ICONS ? [{ ...social, icon: ICONS[social.label as keyof typeof ICONS] }] : [],
);

// `display` lets the caller choose when the row shows (e.g. "hidden sm:flex").
export function SocialIcons({ display = "flex" }: { display?: string }) {
  const reduceMotion = useReducedMotion() ?? false;
  const [hovered, setHovered] = useState<string | null>(null);
  const { listRef, bubbleRef, glowRef } = useLiquidBubble<HTMLUListElement, HTMLLIElement, HTMLSpanElement>(
    hovered,
    reduceMotion,
  );

  return (
    <ul ref={listRef} className={`relative items-center gap-0 ${display}`} onPointerLeave={() => setHovered(null)}>
      <li
        ref={bubbleRef}
        aria-hidden="true"
        className="glass-pill pointer-events-none absolute top-0 left-0 h-full origin-center rounded-full opacity-0"
      >
        <span ref={glowRef} className="glass-pill-glow absolute inset-0 rounded-full opacity-0" />
      </li>
      {links.map((link) => (
        <li key={link.label} data-bubble-key={link.label} className="relative z-10">
          <a
            href={link.href}
            aria-label={link.label}
            title={link.label}
            target="_blank"
            rel="noopener noreferrer"
            onPointerEnter={() => setHovered(link.label)}
            onFocus={() => setHovered(link.label)}
            onBlur={() => setHovered(null)}
            className="grid size-9 place-items-center rounded-full text-foreground/70 transition-colors duration-300 hover:text-foreground focus-visible:text-foreground"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" className="size-[1.125rem]" fill="currentColor">
              {link.icon}
            </svg>
          </a>
        </li>
      ))}
    </ul>
  );
}
