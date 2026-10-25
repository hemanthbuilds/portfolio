"use client";

import Image from "next/image";
import { useRef, useSyncExternalStore } from "react";
import {
  LazyMotion,
  domAnimation,
  m,
  useReducedMotion,
  useMotionValueEvent,
  useScroll,
  useTransform,
  type MotionValue,
} from "motion/react";
import { heroApproach } from "@/components/hem/heroLink";
import { hero, site } from "@/data/site";
import { AskBar } from "./AskBar";
import { TypedName } from "./TypedName";
import { Ticker } from "./Ticker";



/*
  Landing hero: a robot hand (left) and a human hand (right).
  The section is taller than the screen; while you scroll through it the panel stays
  pinned and the hands slide together until the fingertips reach Hem, the little blue star between them.
  With reduced motion it's a single screen with the hands already touching.
*/

const TOUCH_AT = 0.8; // scroll progress (0–1) at which the fingertips meet
const START_OFFSET_VW = 22; // how far each hand starts from its touching position
// Each fingertip stops just short of the star's points. The star's box is 26vw wide on
// desktop and 56vw on phones; the star reaches about 23% of that from its center.
const BALL_REACH_VW = { desktop: 6, mobile: 12.8 };
const TILT_DEG = 12; // the hands meet on a diagonal: robot from the upper left

const rad = (deg: number) => (deg * Math.PI) / 180;

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion() ?? false;

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  const tilt = TILT_DEG;
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const touchGap = isDesktop ? BALL_REACH_VW.desktop : BALL_REACH_VW.mobile;
  const approach = useTransform(scrollYProgress, [0, TOUCH_AT], [0, 1], { clamp: true });
  const along = useTransform(approach, (a) => START_OFFSET_VW + (touchGap - START_OFFSET_VW) * a);
  // Share the hands' progress with the site-wide Hem so he winks as they arrive.
  useMotionValueEvent(approach, "change", (value) => heroApproach.set(value));
  const robotX = useTransform(along, (d) => `${-d * Math.cos(rad(tilt))}vw`);
  const robotY = useTransform(along, (d) => `${-d * Math.sin(rad(tilt))}vw`);
  const humanX = useTransform(along, (d) => `${d * Math.cos(rad(tilt))}vw`);
  const humanY = useTransform(along, (d) => `${d * Math.sin(rad(tilt))}vw`);
  const touching = (sign: number) => ({
    x: `${sign * touchGap * Math.cos(rad(tilt))}vw`,
    y: `${sign * touchGap * Math.sin(rad(tilt))}vw`,
  });
  const hintOpacity = useTransform(scrollYProgress, [0, 0.12], [1, 0]);

  return (
    <LazyMotion features={domAnimation} strict>
      <section
        ref={sectionRef}
        aria-label="Introduction"
        className={reduceMotion ? "relative h-[calc(100svh-3.5rem)]" : "relative h-[260svh]"}
      >
        {/* --hand-w: width of each hand image. --hand-y: height of the fingertips in the panel. */}
        <div className={`sticky top-14 h-[calc(100svh-3.5rem)] overflow-hidden [--hand-w:120vw] [--mark-w:56vw] md:[--hand-w:62vw] md:[--mark-w:26vw] [--hand-y:66%] md:[--hand-y:66%]`}>
          <m.div
            className="absolute inset-0"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.4, ease: "easeOut" }}
          >
            <HandImage
              hand={hero.robotHand}
              offset={reduceMotion ? touching(-1) : { x: robotX, y: robotY }}
              tilt={tilt}
            />
            <HandImage
              hand={hero.humanHand}
              offset={reduceMotion ? touching(1) : { x: humanX, y: humanY }}
              tilt={tilt}
            />

            {/* Matching soft fades on both screen edges, so both arms dissolve into the black the
                same way wherever they are during the scroll (the arms reach in from off-screen). */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 left-0 w-[14vw] bg-gradient-to-r from-background to-transparent"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 right-0 w-[14vw] bg-gradient-to-l from-background to-transparent"
            />

            {/* Hem's spot between the hands. The one site-wide Hem (HemCompanion) sits here while
                it's on screen, then flows off to follow the cursor as you scroll on. */}
            <div
              data-hem-home
              className="pointer-events-none absolute top-(--hand-y) left-1/2 aspect-square w-(--mark-w) -translate-x-1/2 -translate-y-1/2"
            />
          </m.div>

          <IntroText reduceMotion={reduceMotion} />

          {!reduceMotion && (
            <m.p
              aria-hidden="true"
              style={{ opacity: hintOpacity }}
              className="absolute inset-x-0 bottom-12 text-center text-sm text-muted-foreground"
            >
              {hero.scrollHint}
            </m.p>
          )}

          <Ticker words={hero.motto} />
        </div>
      </section>
    </LazyMotion>
  );
}

// Centered, with type styling taken from the OpenAI Developers page:
// your full name typed out as a medium-weight headline, the job title, then the "Ask me" bar.
function IntroText({ reduceMotion }: { reduceMotion: boolean }) {
  return (
    <m.div
      className="page-container relative pt-14 text-center md:pt-24"
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
    >
      <h1 data-hem="amazed" className="relative inline-block text-[clamp(2rem,7.8vw,5.5rem)] leading-[1.1] font-medium tracking-[-0.02em] whitespace-nowrap">
        <TypedName text={site.fullName} still={reduceMotion} />
      </h1>
      <p className="mt-3 text-base text-foreground/90 md:mt-4 md:text-[1.0625rem]">{hero.subtitle}</p>
      <p className="mt-1.5 text-sm text-muted-foreground">{site.title}</p>
      <AskBar />
    </m.div>
  );
}

type Hand = { src: string; alt: string; tipX: number; tipY: number; scale: number };

// Places a hand image so its fingertip sits at the center of the panel (before the x offset).
function HandImage({
  hand,
  offset,
  tilt,
}: {
  hand: Hand;
  offset: { x: MotionValue<string> | string; y: MotionValue<string> | string };
  tilt: number;
}) {
  const aspect = hero.imageHeight / hero.imageWidth;
  const width = `(var(--hand-w) * ${hand.scale})`;

  return (
    <m.div
      style={{
        x: offset.x,
        y: offset.y,
        rotate: tilt,
        // Rotate around the fingertip so the tips still meet exactly.
        transformOrigin: `${hand.tipX * 100}% ${hand.tipY * 100}%`,
        width: `calc${width}`,
        left: `calc(50% - ${width} * ${hand.tipX})`,
        top: `calc(var(--hand-y) - ${width} * ${aspect * hand.tipY})`,
      }}
      // "lighten" lets the black backgrounds overlap without hiding the other hand.
      className="absolute mix-blend-lighten"
    >
      <Image
        src={hand.src}
        alt={hand.alt}
        width={hero.imageWidth}
        height={hero.imageHeight}
        sizes="(min-width: 768px) 62vw, 120vw"
        preload
        className="h-auto w-full select-none"
        draggable={false}
      />
    </m.div>
  );
}

// True when the media query matches; false during server rendering.
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
