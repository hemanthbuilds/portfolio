"use client";

import { useEffect, useLayoutEffect, useRef } from "react";

/*
  The "liquid glass" bubble used in the top bar. It sits behind the item whose data-bubble-key
  matches `target` and, when the target changes, flows over like a drop of water: the edge on the
  side it's heading to reaches out first, the back edge follows a moment later, so it stretches and
  thins on the way and wobbles gently as it settles. A blue glow lights it while it moves.
  With no target it fades out; when it reappears it starts at the new item instead of flowing in.

  Usage: put the returned refs on the list (positioned), the bubble element and its glow element,
  and give each item a data-bubble-key. Items are measured with offsetLeft, so they must be direct
  children of the list.
*/

// Edge springs (k = stiffness, c = damping). Lead edge is firmer; trailing edge is softer and a bit bouncy.
const LEAD = { k: 70, c: 13 };
const TRAIL = { k: 32, c: 7.5 };
const MIN_WIDTH = 24; // never collapses into nothing, px

export function useLiquidBubble<List extends HTMLElement, Bubble extends HTMLElement, Glow extends HTMLElement>(
  target: string | null,
  instant: boolean,
) {
  const listRef = useRef<List>(null);
  const bubbleRef = useRef<Bubble>(null);
  const glowRef = useRef<Glow>(null);
  // Both edges are little springs (position, velocity, target), in px from the list's left.
  const edges = useRef({ left: 0, right: 0, leftV: 0, rightV: 0, leftTo: 0, rightTo: 0, dir: 1, shown: false });
  const frame = useRef(0);

  useLayoutEffect(() => {
    const list = listRef.current;
    const bubble = bubbleRef.current;
    const glow = glowRef.current;
    if (!list || !bubble || !glow) return;
    const e = edges.current;

    function draw() {
      const width = e.right - e.left;
      const restWidth = e.rightTo - e.leftTo;
      const speed = Math.max(Math.abs(e.leftV), Math.abs(e.rightV));
      const stretch = Math.max(width - restWidth, 0); // thins as it stretches, like a drop
      bubble!.style.transform = `translateX(${e.left}px) scaleY(${1 - Math.min(stretch / 320, 0.16)})`;
      bubble!.style.width = `${width}px`;
      glow!.style.opacity = String(Math.min(speed / 650, 0.85));
    }

    function step(now: number, last: number) {
      const dt = Math.min((now - last) / 1000, 1 / 30);
      const leftSpring = e.dir < 0 ? LEAD : TRAIL;
      const rightSpring = e.dir > 0 ? LEAD : TRAIL;
      e.leftV += (leftSpring.k * (e.leftTo - e.left) - leftSpring.c * e.leftV) * dt;
      e.rightV += (rightSpring.k * (e.rightTo - e.right) - rightSpring.c * e.rightV) * dt;
      e.left += e.leftV * dt;
      e.right += e.rightV * dt;
      if (e.right - e.left < MIN_WIDTH) e.right = e.left + MIN_WIDTH;
      draw();
      const settled =
        Math.abs(e.leftTo - e.left) < 0.3 && Math.abs(e.rightTo - e.right) < 0.3 &&
        Math.abs(e.leftV) < 2 && Math.abs(e.rightV) < 2;
      if (settled) {
        e.left = e.leftTo;
        e.right = e.rightTo;
        e.leftV = e.rightV = 0;
        draw();
        frame.current = 0;
      } else {
        frame.current = requestAnimationFrame((next) => step(next, now));
      }
    }

    function place(snap: boolean) {
      const item = target ? list!.querySelector<HTMLElement>(`[data-bubble-key="${target}"]`) : null;
      bubble!.style.opacity = item ? "1" : "0";
      if (!item) {
        e.shown = false;
        return;
      }
      const left = item.offsetLeft;
      const right = left + item.offsetWidth;
      e.dir = left + right > e.leftTo + e.rightTo ? 1 : -1;
      e.leftTo = left;
      e.rightTo = right;
      if (snap || !e.shown) {
        cancelAnimationFrame(frame.current);
        frame.current = 0;
        e.left = left;
        e.right = right;
        e.leftV = e.rightV = 0;
        e.shown = true;
        draw();
        return;
      }
      if (!frame.current) {
        const start = performance.now();
        frame.current = requestAnimationFrame((now) => step(now, start));
      }
    }

    place(instant);
    const onResize = () => place(true);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [target, instant]);

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  return { listRef, bubbleRef, glowRef };
}
