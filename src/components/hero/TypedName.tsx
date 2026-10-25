"use client";

import { useEffect, useRef, useState } from "react";
import { loadOutlines, type FontOutlines } from "./glyphOutlines";

/*
  The hero name.
  1. Types out one letter at a time with a blinking cursor, which fades away when done.
  2. Letters near the mouse turn into their vector outline (randomly white or the site blue): a thin line tracing the real letter shape
     with a dot on each anchor point (like the OpenAI DevDay title), and switch back as it moves on.
  3. On touch screens (no hover), one outline wave sweeps across the name after it finishes typing.

  - Every letter is always laid out (untyped ones are just invisible), so nothing shifts while typing.
  - The typing cursor is absolutely positioned and takes no width, so it can't push the name around.
  - Screen readers get the full name immediately.
  - Reduced motion: the name shows straight away; the hover effect still works since it follows the user.
  The parent <h1> must be `relative` (the typing cursor is positioned against it).
*/

const START_DELAY_MS = 500;
const MS_PER_LETTER = 80;
const CURSOR_LINGER_MS = 2200; // how long the typing cursor keeps blinking after typing finishes
const HOVER_RADIUS_EM = 1.1; // letters within this distance of the mouse switch to their outline
// Letters only switch back once the mouse is this much further away. Without this gap, letters at
// the edge flicker on/off, interrupting the outline mid-draw and leaving parts of it missing.
const HOVER_RELEASE = 1.3;
const BLUE_CHANCE = 0.35; // chance a letter's outline comes out in the site blue instead of white

// Switch a letter's outline on/off. Each time it switches on, it randomly picks white or blue.
function setLetterActive(span: HTMLElement, active: boolean) {
  const wasActive = span.dataset.active === "true";
  if (active && !wasActive) span.dataset.tone = Math.random() < BLUE_CHANCE ? "blue" : "white";
  span.dataset.active = String(active);
}
const SWEEP_MS_PER_LETTER = 55;

export function TypedName({ text, still }: { text: string; still: boolean }) {
  const [typed, setTyped] = useState(0);
  const [cursorVisible, setCursorVisible] = useState(true);
  const [outlines, setOutlines] = useState<FontOutlines | null>(null);
  const lettersRef = useRef<HTMLSpanElement>(null);
  const shown = still ? text.length : typed;
  const letters = Array.from(text);

  // Typing, then (on touch screens) one dotted sweep across the name.
  useEffect(() => {
    if (still) return;
    const count = Array.from(text).length;
    const setActive = (index: number, active: boolean) => {
      const span = lettersRef.current?.children[index] as HTMLElement | undefined;
      if (span) setLetterActive(span, active);
    };

    const timers: ReturnType<typeof setTimeout>[] = [];
    for (let i = 1; i <= count; i++) {
      timers.push(setTimeout(() => setTyped(i), START_DELAY_MS + i * MS_PER_LETTER));
    }
    const done = START_DELAY_MS + count * MS_PER_LETTER;
    timers.push(setTimeout(() => setCursorVisible(false), done + CURSOR_LINGER_MS));

    if (!window.matchMedia("(hover: hover)").matches) {
      loadOutlines(text).then(setOutlines);
      for (let i = 0; i < count; i++) {
        timers.push(setTimeout(() => setActive(i, true), done + 400 + i * SWEEP_MS_PER_LETTER));
        timers.push(setTimeout(() => setActive(i, false), done + 400 + (i + 3) * SWEEP_MS_PER_LETTER));
      }
    }
    return () => timers.forEach(clearTimeout);
  }, [text, still]);

  // Letters near the mouse turn dotted.
  useEffect(() => {
    function onPointerMove(event: PointerEvent) {
      const container = lettersRef.current;
      if (event.pointerType !== "mouse" || !container) return;
      const spans = Array.from(container.children) as HTMLElement[];
      const box = container.getBoundingClientRect();
      const radius = HOVER_RADIUS_EM * parseFloat(getComputedStyle(container).fontSize);
      const near =
        event.clientX > box.left - radius &&
        event.clientX < box.right + radius &&
        event.clientY > box.top - radius &&
        event.clientY < box.bottom + radius;

      if (near) loadOutlines(container.textContent ?? "").then(setOutlines);
      for (const span of spans) {
        if (!near) {
          setLetterActive(span, false);
          continue;
        }
        const r = span.getBoundingClientRect();
        const distance = Math.hypot(event.clientX - (r.left + r.width / 2), event.clientY - (r.top + r.height / 2));
        const wasActive = span.dataset.active === "true";
        setLetterActive(span, wasActive ? distance < radius * HOVER_RELEASE : distance < radius);
      }
    }
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    return () => window.removeEventListener("pointermove", onPointerMove);
  }, []);

  return (
    <>
      <span className="sr-only">{text}</span>
      <span ref={lettersRef} aria-hidden="true">
        {letters.map((letter, i) => (
          <span key={i} data-active="false" className="name-letter" style={{ visibility: i < shown ? "visible" : "hidden" }}>
            <span className="letter-fill">{letter === " " ? "\u00a0" : letter}</span>
            {outlines && <LetterOutline letter={letter} font={outlines} />}
          </span>
        ))}
      </span>
      {!still && cursorVisible && <TypingCursor lettersRef={lettersRef} shown={shown} />}
    </>
  );
}

// A blinking bar placed at the right edge of the last typed letter. It takes no space in the layout.
function TypingCursor({ lettersRef, shown }: { lettersRef: React.RefObject<HTMLSpanElement | null>; shown: number }) {
  const cursorRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const container = lettersRef.current;
    const cursor = cursorRef.current;
    const host = cursor?.offsetParent;
    if (!container || !cursor || !host) return;
    const letter = container.children[Math.max(shown - 1, 0)];
    if (!letter) return;
    const hostBox = host.getBoundingClientRect();
    const box = letter.getBoundingClientRect();
    cursor.style.left = `${(shown > 0 ? box.right : box.left) - hostBox.left}px`;
    cursor.style.top = `${box.top - hostBox.top}px`;
    cursor.style.height = `${box.height}px`;
  }, [lettersRef, shown]);

  return (
    <span
      ref={cursorRef}
      aria-hidden="true"
      className="pointer-events-none absolute w-[0.06em] animate-[caret-blink_1s_steps(1)_infinite] bg-primary [clip-path:inset(14%_0_12%_0)]"
    />
  );
}

const LINE_HEIGHT = 1.1; // must match the h1's leading

// The letter's vector outline and key-point dots, laid exactly over the real letter.
// The outline draws itself in (stroke-dashoffset), the dots pop in one after another (see globals.css).
function LetterOutline({ letter, font }: { letter: string; font: FontOutlines }) {
  const glyph = font.glyphs.get(letter);
  if (!glyph) return null;
  const { unitsPerEm: em, ascender, descender } = font;
  const height = (ascender - descender) / em; // font's full height, in em
  const dot = em * 0.03;

  return (
    <svg
      className="letter-outline"
      viewBox={`0 ${-ascender} ${glyph.advance} ${ascender - descender}`}
      style={{ width: `${glyph.advance / em}em`, height: `${height}em`, top: `${(LINE_HEIGHT - height) / 2}em` }}
      aria-hidden="true"
    >
      <path
        className="outline-path"
        d={glyph.path}
        pathLength={1}
        fill="none"
        stroke="currentColor"
        strokeWidth={em * 0.019} // in font units (≈1.4px at desktop size); a fixed-px stroke breaks the draw-in dash
        strokeLinejoin="round"
      />
      {glyph.anchors.map(([x, y], i) => (
        <circle
          key={i}
          className="outline-anchor"
          cx={x}
          cy={y}
          r={dot}
          fill="currentColor"
          style={{ transitionDelay: `${i * 14}ms` }}
        />
      ))}
    </svg>
  );
}
