"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useSyncExternalStore } from "react";
import { useReducedMotion } from "motion/react";
import { heroApproach, hemInChat, hemIsCompanion } from "./heroLink";

/*
  The one Hem on the site. He flows between two places:
  - Home spot: on the home page, while his spot between the hero's hands (data-hem-home) is on
    screen, he sits there at full size.
  - Companion: everywhere else (and once you scroll past the hero) he floats at the 2 o'clock
    position of the cursor, smaller, trailing it gently. Near the right edge he moves to 10 o'clock,
    near the top edge to 4 o'clock, so he stays on screen.
  He never sits on the cursor: a personal-space bubble keeps him at least PERSONAL_SPACE away.
  The handoff is tied to scrolling: as his home spot scrolls up out of view he blends gradually
  from it to the cursor (on a gentle arc, shrinking as he goes), and scrolling back reverses it.
  Touch screens / reduced motion: instead of following, he rests in the bottom-right corner.
  Clicks always pass through him (pointer-events: none).
*/

const Hem = dynamic(() => import("./Hem"), { ssr: false });

const COMPANION_BOX = 190; // his canvas size when following, px (the star is ~a third: ~62px)
const CORNER_BOX = 140; // canvas size resting in the corner (touch / reduced motion / no cursor)
const DISTANCE = 85; // how far from the cursor he floats, px
const CLOCK_2 = { x: Math.sin(Math.PI / 3), y: -Math.cos(Math.PI / 3) }; // 2 o'clock direction
const PERSONAL_SPACE = 80; // never closer than this to the cursor, px (his center to the cursor)
const EDGE_MARGIN = 130; // near an edge, he switches sides
const FOLLOW_RATE = 6; // how quickly he catches up while following (per second); lower = lazier
const HOME_RATE = 18; // snappier while docked, so he stays put between the hands as they move
// The handoff happens while his home spot's center scrolls from HANDOFF_START to HANDOFF_END
// (as fractions of the screen height); in between he's partway along the journey.
const HANDOFF_START = 0.45;
const HANDOFF_END = -0.15;
const ARC_HEIGHT = 70; // how high the little hop arcs mid-handoff, px
// The Ask chat: when it's open he hops (in an arc) up to his seat at the top of it (data-hem-chat),
// floats above its frosted layer and "answers" from there; when it closes he hops back.
const HOP_TIME = 0.75; // seconds
const HOP_HEIGHT = 110; // px, how high the arc goes
const CHAT_Z = "70"; // above the chat overlay (z-60)

export function HemCompanion() {
  const reduceMotion = useReducedMotion() ?? false;
  const hasMouse = useMediaQuery("(hover: hover) and (pointer: fine)");
  const follows = hasMouse && !reduceMotion;
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const cursor = { x: 0, y: 0, known: false };
    const pos = { x: window.innerWidth - CORNER_BOX / 2, y: window.innerHeight - CORNER_BOX / 2, size: CORNER_BOX };
    let placed = false;
    let canvasSize = 0;
    let inChat = false;
    let hop: { from: { x: number; y: number; size: number }; start: number } | null = null;
    let frame = 0;
    let lastTime = performance.now();

    function onPointerMove(event: PointerEvent) {
      if (event.pointerType !== "mouse") return;
      cursor.x = event.clientX;
      cursor.y = event.clientY;
      cursor.known = true;
    }
    function onPointerOut(event: PointerEvent) {
      if (!event.relatedTarget) cursor.known = false; // cursor left the window
    }

    // Where he'd be as a companion: 2 o'clock of the cursor, or resting in the corner.
    function companionSpot() {
      if (follows && cursor.known) {
        const flipX = cursor.x > window.innerWidth - EDGE_MARGIN ? -1 : 1; // 2 → 10 o'clock
        const flipY = cursor.y < EDGE_MARGIN ? -1 : 1; // 2 → 4 o'clock
        return { x: cursor.x + CLOCK_2.x * DISTANCE * flipX, y: cursor.y + CLOCK_2.y * DISTANCE * flipY, size: COMPANION_BOX };
      }
      return { x: window.innerWidth - CORNER_BOX / 2 - 8, y: window.innerHeight - CORNER_BOX / 2 - 8, size: CORNER_BOX };
    }

    // How far through the handoff we are: 0 = home between the hands, 1 = companion.
    function handoff(home: DOMRect | undefined) {
      if (!home || home.width === 0) return 1;
      const centerY = (home.top + home.height / 2) / window.innerHeight;
      const t = Math.min(Math.max((HANDOFF_START - centerY) / (HANDOFF_START - HANDOFF_END), 0), 1);
      return t * t * (3 - 2 * t); // smoothstep: eases in and out of the journey
    }

    function tick(now: number) {
      frame = requestAnimationFrame(tick);
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      const homeRect = document.querySelector<HTMLElement>("[data-hem-home]")?.getBoundingClientRect();
      const b = handoff(homeRect);
      const isCompanion = b > 0.6 ? 1 : 0;
      if (hemIsCompanion.get() !== isCompanion) hemIsCompanion.set(isCompanion);
      const companion = companionSpot();
      const home = homeRect
        ? { x: homeRect.left + homeRect.width / 2, y: homeRect.top + homeRect.height / 2, size: homeRect.width }
        : companion;

      // Blend the two spots by scroll progress, with a small upward hop in the middle of the trip.
      let target = {
        x: home.x + (companion.x - home.x) * b,
        y: home.y + (companion.y - home.y) * b - Math.sin(b * Math.PI) * ARC_HEIGHT,
        size: home.size + (companion.size - home.size) * b,
      };

      // The Ask chat is open: his seat at the top of it wins over everything else.
      const seat = document.querySelector<HTMLElement>("[data-hem-chat]")?.getBoundingClientRect();
      const chatOpen = Boolean(seat && seat.width > 0);
      if (chatOpen) {
        target = { x: seat!.left + seat!.width / 2, y: seat!.top + seat!.height / 2, size: seat!.width };
        if (hemIsCompanion.get() !== 0) hemIsCompanion.set(0); // no idle faces: he's busy answering
      }
      if (chatOpen !== inChat) {
        inChat = chatOpen;
        hemInChat.set(chatOpen ? 1 : 0);
        hop = reduceMotion ? null : { from: { ...pos }, start: now };
        if (chatOpen) box!.style.zIndex = CHAT_Z;
        else if (!hop) box!.style.zIndex = "";
      }

      // Mid-hop (into or out of the chat): an eased arc from where he was to where he's going.
      if (hop) {
        const t = Math.min((now - hop.start) / 1000 / HOP_TIME, 1);
        const e = t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2; // ease in-out
        pos.x = hop.from.x + (target.x - hop.from.x) * e;
        pos.y = hop.from.y + (target.y - hop.from.y) * e - Math.sin(t * Math.PI) * HOP_HEIGHT;
        pos.size = hop.from.size + (target.size - hop.from.size) * e;
        if (t >= 1) {
          hop = null;
          if (!inChat) box!.style.zIndex = ""; // back under the page's own layers
        }
        draw();
        return;
      }

      // Time-based easing (same feel at any frame rate); tight when docked or seated in the chat,
      // lazier when following.
      const rate = inChat ? HOME_RATE : HOME_RATE + (FOLLOW_RATE - HOME_RATE) * b;
      const ease = !placed || reduceMotion ? 1 : 1 - Math.exp(-rate * dt);
      placed = true;
      pos.x += (target.x - pos.x) * ease;
      pos.y += (target.y - pos.y) * ease;
      pos.size += (target.size - pos.size) * ease;

      // Personal space: once he's mostly a companion, never let him sit on (or pass over) the cursor.
      if (!inChat && b > 0.6 && follows && cursor.known) {
        const dx = pos.x - cursor.x;
        const dy = pos.y - cursor.y;
        const distance = Math.hypot(dx, dy);
        if (distance < PERSONAL_SPACE) {
          const angle = distance > 0.5 ? Math.atan2(dy, dx) : Math.atan2(CLOCK_2.y, CLOCK_2.x);
          pos.x = cursor.x + Math.cos(angle) * PERSONAL_SPACE;
          pos.y = cursor.y + Math.sin(angle) * PERSONAL_SPACE;
        }
      }

      draw();

      // The 3D canvas keeps one fixed size (big enough for his largest size on this page) and he's
      // shrunk/grown with a CSS scale. Resizing the canvas itself every frame made him flicker and
      // stretch during the handoff; a scale is smooth. The canvas only ever grows (his home spot
      // changes size as the hands move), and starts over when the window is resized.
      function draw() {
        const largest = Math.round(Math.max(home.size, companion.size, target.size));
        if (largest > canvasSize) {
          canvasSize = largest;
          box!.style.width = `${canvasSize}px`;
          box!.style.height = `${canvasSize}px`;
        }
        const scale = pos.size / canvasSize;
        box!.style.transform = `translate3d(${pos.x - canvasSize / 2}px, ${pos.y - canvasSize / 2}px, 0) scale(${scale})`;
      }
    }

    const onResize = () => (canvasSize = 0);
    window.addEventListener("resize", onResize);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    document.addEventListener("pointerout", onPointerOut);
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerout", onPointerOut);
    };
  }, [follows, reduceMotion]);

  return (
    // [&_*]: the 3D canvas inside turns pointer events back on for itself, so switch them off for
    // everything inside too; otherwise he'd swallow clicks meant for whatever is under him.
    <div
      ref={boxRef}
      aria-hidden="true"
      className="pointer-events-none fixed top-0 left-0 z-50 transition-opacity duration-300 will-change-transform [&_*]:pointer-events-none!"
    >
      <Hem still={reduceMotion} approach={heroApproach} />
    </div>
  );
}

function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (onChange) => {
      const list = window.matchMedia(query);
      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}
