"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useReducedMotion } from "motion/react";
import type { MouseEvent } from "react";
import { navLinks, site } from "@/data/site";
import { SocialIcons } from "./SocialIcons";
import { useLiquidBubble } from "./useLiquidBubble";

// How far down the screen a section's top must reach before its menu item lights up.
const SECTION_LINE = 0.4;

export function Nav() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const activeHref = useActiveHref(pathname);
  const reduceMotion = useReducedMotion() ?? false;

  // On the home page, menu items glide to their section instead of reloading the page.
  // (From any other page the link opens the home page at that section.)
  function scrollToSection(event: MouseEvent<HTMLAnchorElement>, href: string) {
    setMenuOpen(false);
    if (pathname !== "/") return;
    event.preventDefault();
    const behavior = reduceMotion ? "instant" : "smooth";
    const id = href.split("#")[1];
    if (id) document.getElementById(id)?.scrollIntoView({ behavior, block: "start" });
    else window.scrollTo({ top: 0, behavior });
    window.history.replaceState(null, "", href);
  }

  // Arriving on the home page from another page with a section in the link (e.g. /#about):
  // jump there once the page has laid out (the browser's own jump can land before it settles).
  useEffect(() => {
    if (pathname !== "/" || !window.location.hash) return;
    const id = decodeURIComponent(window.location.hash.slice(1));
    const jump = () => document.getElementById(id)?.scrollIntoView({ behavior: "instant", block: "start" });
    const timers = [setTimeout(jump, 60), setTimeout(jump, 400)];
    return () => timers.forEach(clearTimeout);
  }, [pathname]);

  // Close the mobile menu on Escape.
  useEffect(() => {
    if (!menuOpen) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-md">
      <nav
        aria-label="Main"
        className="flex h-14 items-center justify-between px-5 md:px-6"
      >
        <Link
          href="/"
          className="text-[1.375rem] font-semibold tracking-[-0.01em]"
          onClick={(event) => scrollToSection(event, "/")}
        >
          {site.name}
        </Link>

        <GlassMenu activeHref={activeHref} onNavigate={scrollToSection} />

        <div className="flex items-center gap-2">
          <SocialIcons display="hidden lg:flex" />
          <a
            href={site.resumeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-8 items-center gap-1 rounded-full bg-secondary px-3.5 text-sm font-medium text-secondary-foreground transition-opacity hover:opacity-85"
          >
            Resume
            <svg aria-hidden="true" viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.75">
              <path d="M5 11 11 5M6 5h5v5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
          <button
            type="button"
            className="rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-foreground md:hidden"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? "Close" : "Menu"}
          </button>
        </div>
      </nav>

      {menuOpen && (
        <ul id="mobile-menu" className="flex flex-col gap-1 border-t border-border px-3 pt-2 pb-4 md:hidden">
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                onClick={(event) => scrollToSection(event, link.href)}
                className={`block rounded-lg px-3 py-2.5 hover:bg-card hover:text-foreground ${
                  link.href === activeHref ? "bg-card text-foreground" : "text-foreground/85"
                }`}
              >
                {link.label}
              </Link>
            </li>
          ))}
          <li className="mt-2 border-t border-border pt-3 lg:hidden">
            <SocialIcons />
          </li>
        </ul>
      )}
    </header>
  );
}

// Desktop menu, with the liquid glass bubble (see useLiquidBubble) behind the current item.
function GlassMenu({
  activeHref,
  onNavigate,
}: {
  activeHref: string | null;
  onNavigate: (event: MouseEvent<HTMLAnchorElement>, href: string) => void;
}) {
  const reduceMotion = useReducedMotion() ?? false;
  const { listRef, bubbleRef, glowRef } = useLiquidBubble<HTMLUListElement, HTMLLIElement, HTMLSpanElement>(
    activeHref,
    reduceMotion,
  );

  return (
    <ul ref={listRef} className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 md:flex">
      <li
        ref={bubbleRef}
        aria-hidden="true"
        className="glass-pill pointer-events-none absolute top-0 left-0 h-full origin-center rounded-full opacity-0"
      >
        <span ref={glowRef} className="glass-pill-glow absolute inset-0 rounded-full opacity-0" />
      </li>
      {navLinks.map((link) => {
        const active = link.href === activeHref;
        return (
          <li key={link.href} data-bubble-key={link.href} className="relative z-10">
            <Link
              href={link.href}
              onClick={(event) => onNavigate(event, link.href)}
              aria-current={active ? "location" : undefined}
              className={`block rounded-full px-3.5 py-1.5 text-[0.9375rem] transition-colors duration-500 hover:text-foreground ${
                active ? "text-foreground" : "text-foreground/70"
              }`}
            >
              {link.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

// Which menu item is lit (by href): on the home page it follows the section you've scrolled to
// (Home while you're on the landing screen); on a full page like /projects it's that item.
function useActiveHref(pathname: string) {
  const [section, setSection] = useState<string | null>(null);

  useEffect(() => {
    if (pathname !== "/") return;
    const ids = navLinks.flatMap((link) => (link.href.includes("#") ? [link.href.split("#")[1]] : []));
    let frame = 0;
    function update() {
      frame = 0;
      const line = window.innerHeight * SECTION_LINE;
      let current: string | null = null;
      for (const id of ids) {
        const top = document.getElementById(id)?.getBoundingClientRect().top;
        if (top !== undefined && top <= line) current = id;
      }
      // At the very bottom the last (short) section can't scroll up to the line, so light it then.
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
      if (atBottom && window.scrollY > 0) current = ids[ids.length - 1];
      setSection(current);
    }
    function onScroll() {
      if (!frame) frame = requestAnimationFrame(update);
    }
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [pathname]);

  if (pathname !== "/") return navLinks.find((link) => link.page === pathname)?.href ?? null;
  return section ? `/#${section}` : "/";
}
