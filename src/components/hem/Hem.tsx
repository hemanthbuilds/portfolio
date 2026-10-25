"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import type { MotionValue } from "motion/react";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { hemInChat, hemIsCompanion, hemTalking, hemThinking, hemTyping } from "./heroLink";

/*
  Hem: the little character between the hands, a soft, rounded blue star with eyes and a mouth.
  - It slowly morphs (5 ↔ 6 points, points swelling and shrinking) and turns to look at the cursor.
  - Mood reacts to the page:
      calm         → small smile, blinks now and then
      excited      → hovering any link or button: wide eyes, open grin, bounces, wiggles faster
      very excited → pressing down to click: happy ^ ^ eyes, bigger grin, jumps, points stretch
      amazed       → hovering the name (anything marked data-hem="amazed"): first looks at the cursor
                     for a moment, then turns to you with a happy "wow": wide eyes with bigger shines, a soft
                     "o" mouth, rosy cheeks, floating up and swaying gently; relaxes when it leaves
  - Winks (one eye, little head tilt) when the hands come close to it while scrolling.
  - Always has a small white shine in each eye, which grows when he's amazed.
  - As a companion (following the cursor), every so often he turns to look at the viewer and pulls
    a cute face for a moment: happy ^ ^, a wink, a "wow", or a shy blushing smile.
  Reduced motion: a still star with a smile, facing forward.
*/

const COLORS = {
  face: "#0f1419", // palette secondary-foreground (near-black)
  sparkle: "#ffffff",
  blush: "#e0245e", // palette chart-5 (soft pink), shown faintly
};

// The star uses the site's one blue, read from the --primary CSS variable so it can never drift.
function sitePrimaryBlue() {
  return getComputedStyle(document.documentElement).getPropertyValue("--primary").trim() || "#1c9cf0";
}

const RADIUS = 1.6;
const DEPTH = 0.85; // a little flatter front-to-back, like a puffy cookie
const LOOK_DEPTH = 500; // how "far" in front of the star the cursor is treated as being, in px
const BLINK_EVERY = 4; // seconds between blinks (roughly)
const BLINK_LENGTH = 0.14;
const WINK_AT = 0.9; // hands' approach progress (0–1) that triggers a wink
const WINK_REARM_BELOW = 0.6; // scrolling back past this lets it wink again
const WINK_LENGTH = 0.55; // seconds
const INTERACTIVE = 'a, button, [role="button"], input, select, textarea, summary, label';
// Elements that mean "leaving" (e.g. the chat's close button): no excitement, just a little sad.
const LEAVING = '[data-hem="leaving"]';
const AMAZING = '[data-hem="amazed"]'; // hovering these makes Hem shocked and amazed
// Idle moments while he's a companion: how long a cute face lasts and the gap between them (seconds).
const IDLE_LENGTH = 1.6;
const IDLE_GAP = { min: 5, max: 10 };
const IDLE_FACES = ["happy", "wink", "wow", "shy"] as const;
const CHAT_GAP = { min: 3, max: 6 }; // seconds between friendly looks while he's in the chat
const TYPING_LINGER = 1.2; // seconds he keeps watching the text box after the last keystroke
const LOOK_BEFORE_REACTING = 0.35; // seconds Hem glances at the cursor before turning to you

// Mood: 0 = calm, 1 = excited (hovering something clickable), 2 = very excited (pressing it).
type Mood = 0 | 1 | 2;

type Props = {
  still: boolean;
  approach?: MotionValue<number>; // 0 → 1 as the hero's hands move in (he winks); omit elsewhere
  paused?: boolean; // stop rendering entirely while he's not visible
};

export default function Hem({ still, approach, paused = false }: Props) {
  return (
    <Canvas
      frameloop={paused ? "never" : "always"}
      flat // no filmic colour filter, so the star's blue matches the page's blue exactly
      camera={{ position: [0, 0, 18], fov: 35 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
      // Measure the layout size, ignoring CSS scale: the companion shrinks him with a scale, and
      // the canvas shouldn't resize (and flicker) while that animates.
      resize={{ offsetSize: true }}
      aria-hidden="true"
    >
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 5, 6]} intensity={2.2} />
      <directionalLight position={[-4, -2, 2]} intensity={0.5} />
      <Character still={still} approach={approach} />
    </Canvas>
  );
}

function Character({ still, approach }: Omit<Props, "paused">) {
  const root = useRef<THREE.Group>(null);
  const body = useRef<THREE.Mesh>(null);
  const roundEyes = useRef<THREE.Group>(null);
  const happyEyes = useRef<THREE.Group>(null);
  const winkingEye = useRef<THREE.Mesh>(null);
  const wink = useRef({ armed: true, startedAt: -10 });
  const smile = useRef<THREE.Mesh>(null);
  const gasp = useRef<THREE.Mesh>(null); // the soft "o" mouth when amazed
  const shines = useRef<(THREE.Mesh | null)[]>([]); // white shine in each eye (always on)
  const blush = useRef<THREE.Group>(null); // rosy cheeks when amazed
  const amazedTarget = useRef(0); // 1 while hovering the name
  const amazedSince = useRef<number | null>(null); // when the current hover over the name began
  const amazement = useRef(0); // smoothed, 0..1
  const idle = useRef({ next: IDLE_GAP.min, until: -1, face: 0 }); // companion idle moments
  const idleAmount = useRef(0); // smoothed, 0..1
  const thinking = useRef(0); // smoothed, 0..1: waiting for an Ask-chat answer
  const talking = useRef(0); // smoothed, 0..1: an Ask-chat answer is streaming in
  const leavingTarget = useRef(0); // 1 while the cursor is on a "leaving" control (chat close)
  const leaving = useRef(0); // smoothed
  const chat = useRef({ wasTalking: false, keys: 0, typedAt: -10 }); // what's happening in the chat
  const listening = useRef(0); // smoothed, 0..1: the visitor is typing in the chat
  const grin = useRef<THREE.Mesh>(null);

  const sphere = useMemo(() => new THREE.SphereGeometry(RADIUS, 96, 96), []);
  const bodyColor = useMemo(() => sitePrimaryBlue(), []);
  const rest = useMemo(() => Float32Array.from(sphere.attributes.position.array), [sphere]);

  const pointer = useRef<{ x: number; y: number } | null>(null);
  const mood = useRef<Mood>(0);
  const excitement = useRef(0); // smoothed mood, 0..2
  const clock = useRef({ morph: 0, bounce: 0, nextBlink: BLINK_EVERY });
  const { gl } = useThree();

  // Follow the cursor, and read the mood from what it's over and whether it's pressed.
  useEffect(() => {
    if (still) return;
    let hovering = false;
    let pressing = false;
    const update = () => (mood.current = hovering ? (pressing ? 2 : 1) : 0);
    const isLeaving = (target: EventTarget | null) => target instanceof Element && target.closest(LEAVING) !== null;
    const isInteractive = (target: EventTarget | null) =>
      target instanceof Element && target.closest(INTERACTIVE) !== null && !isLeaving(target);

    function onPointerMove(event: PointerEvent) {
      const rect = gl.domElement.getBoundingClientRect();
      pointer.current = {
        x: event.clientX - (rect.left + rect.width / 2),
        y: event.clientY - (rect.top + rect.height / 2),
      };
    }
    function onPointerOver(event: PointerEvent) {
      hovering = isInteractive(event.target);
      leavingTarget.current = isLeaving(event.target) ? 1 : 0;
      amazedTarget.current = event.target instanceof Element && event.target.closest(AMAZING) ? 1 : 0;
      update();
    }
    function onPointerDown(event: PointerEvent) {
      pressing = true;
      hovering = isInteractive(event.target);
      update();
    }
    function onPointerUp() {
      pressing = false;
      update();
    }

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    document.addEventListener("pointerover", onPointerOver);
    document.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("blur", onPointerUp);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerover", onPointerOver);
      document.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("blur", onPointerUp);
    };
  }, [gl, still]);

  useFrame((state, delta) => {
    if (!root.current || !body.current) return;
    const t = state.clock.elapsedTime;
    // In the chat, hovering buttons and the text box doesn't excite him: his expressions there
    // come from the conversation itself.
    const moodNow = hemInChat.get() === 1 ? 0 : mood.current;
    excitement.current = THREE.MathUtils.damp(excitement.current, moodNow, 8, delta);
    const e = excitement.current;
    const excited = Math.min(e, 1); // 0..1: hovering
    const thrilled = Math.max(e - 1, 0); // 0..1: pressing
    // Hovering the name: look at the cursor first, then react (stare at the viewer, amazed).
    if (amazedTarget.current && amazedSince.current === null) amazedSince.current = t;
    if (!amazedTarget.current) amazedSince.current = null;
    const reacting = amazedSince.current !== null && t - amazedSince.current > LOOK_BEFORE_REACTING ? 1 : 0;
    amazement.current = THREE.MathUtils.damp(amazement.current, still ? 0 : reacting, 14, delta); // quick to react
    const amazed = amazement.current * (1 - excited); // buttons take priority over the name

    // Companion idle moments: every so often he looks at the viewer and pulls a cute face.
    // Only while following the cursor and otherwise calm; postponed while he's busy reacting.
    const moment = idle.current;
    // Thinking (Ask bar waiting for an answer): glances up and to the side, pondering.
    thinking.current = THREE.MathUtils.damp(thinking.current, still ? 0 : hemThinking.get(), 6, delta);
    const th = thinking.current;
    // Talking (the answer is streaming in): he faces the visitor and his mouth moves in an uneven,
    // speech-like rhythm.
    talking.current = THREE.MathUtils.damp(talking.current, still ? 0 : hemTalking.get(), 8, delta);
    const talk = talking.current;
    const mouthOpen = talk * Math.max(0, Math.sin(t * 13) * 0.6 + Math.sin(t * 5.3) * 0.4);
    // About to leave (cursor on the chat's close button): a small, sad look: eyes lowered, head
    // dipped, smile shrinking. Uses the shy pose without the blush.
    leaving.current = THREE.MathUtils.damp(leaving.current, still ? 0 : leavingTarget.current, 8, delta);
    const sad = leaving.current;

    // In the chat he faces the visitor instead of following the cursor: watching the text box while
    // they type, a happy look when he finishes an answer, and friendly looks in between.
    const inChat = !still && hemInChat.get() === 1;
    const c = chat.current;
    // The visitor is typing: he looks down at the text box, attentive.
    if (hemTyping.get() !== c.keys) {
      c.keys = hemTyping.get();
      c.typedAt = t;
    }
    const typing = inChat && t - c.typedAt < TYPING_LINGER;
    listening.current = THREE.MathUtils.damp(listening.current, typing ? 1 : 0, 6, delta);
    const listen = listening.current;
    const talkingNow = hemTalking.get() === 1;
    if (inChat && c.wasTalking && !talkingNow) {
      moment.face = 0; // "happy": done answering
      moment.until = t + IDLE_LENGTH;
      moment.next = moment.until + CHAT_GAP.min;
    }
    c.wasTalking = talkingNow;

    const gap = inChat ? CHAT_GAP : IDLE_GAP;
    const free =
      !still &&
      (hemIsCompanion.get() === 1 || inChat) &&
      e < 0.3 &&
      !amazedTarget.current &&
      th < 0.1 &&
      talk < 0.1 &&
      sad < 0.1 &&
      !typing;
    if (free && t > moment.next) {
      moment.face = Math.floor(Math.random() * IDLE_FACES.length);
      moment.until = t + IDLE_LENGTH;
      moment.next = moment.until + gap.min + Math.random() * (gap.max - gap.min);
    } else if (!free && t > moment.until) {
      moment.until = Math.min(moment.until, t);
      moment.next = Math.max(moment.next, t + IDLE_GAP.min);
    }
    idleAmount.current = THREE.MathUtils.damp(idleAmount.current, t < moment.until ? 1 : 0, 8, delta);
    const idleFace = IDLE_FACES[moment.face];
    const idleHappy = idleFace === "happy" ? idleAmount.current : 0;
    const idleWink = idleFace === "wink" ? idleAmount.current : 0;
    const idleShy = Math.max(idleFace === "shy" ? idleAmount.current : 0, sad);
    const wow = Math.max(amazed, idleFace === "wow" ? idleAmount.current : 0); // the "wow" face

    // Look at the cursor (or glance around before it has moved). In the chat he looks straight at
    // the visitor (with a tiny natural drift), and only looks down at the text box while they type.
    const target = inChat
      ? typing
        ? { x: 0, y: 560 }
        : { x: Math.sin(t * 0.5) * 14, y: Math.sin(t * 0.7) * 10 }
      : (pointer.current ?? { x: Math.sin(t * 0.6) * 120, y: Math.cos(t * 0.4) * 40 });
    const yaw = still ? 0 : Math.atan2(target.x, LOOK_DEPTH);
    const pitch = still ? 0 : Math.atan2(target.y, LOOK_DEPTH);
    // When amazed (or during an idle moment) he turns from the cursor to look at the viewer.
    const facing = 1 - Math.max(amazed, idleAmount.current, talk);
    const turnSpeed = 6 + amazedTarget.current * 8; // snappier head turn while reacting to the name
    const lookY = yaw * facing * (1 - th) + 0.42 * th; // thinking: looks up and to the side
    const lookX = (pitch * facing + idleShy * 0.22) * (1 - th) - 0.32 * th; // shy: dips his head
    root.current.rotation.y = THREE.MathUtils.damp(root.current.rotation.y, lookY, turnSpeed, delta);
    root.current.rotation.x = THREE.MathUtils.damp(root.current.rotation.x, lookX, turnSpeed, delta);

    // Excitement speeds up the morph and adds a bounce (bigger and faster when pressing).
    clock.current.morph += delta * (1 + excited * 2 + thrilled * 3);
    clock.current.bounce += delta * (6 + thrilled * 8);
    const hop = Math.abs(Math.sin(clock.current.bounce)) * (excited * 0.25 + thrilled * 0.35);
    root.current.position.y = still ? 0 : hop + wow * 0.2; // floats up a little, in awe
    // Wink once as the hands arrive; re-arm after scrolling back.
    const progress = approach?.get() ?? 0;
    if (!still && wink.current.armed && progress > WINK_AT) {
      wink.current = { armed: false, startedAt: t };
    } else if (!wink.current.armed && progress < WINK_REARM_BELOW) {
      wink.current.armed = true;
    }
    const winkPhase = (t - wink.current.startedAt) / WINK_LENGTH; // 0..1 while winking
    const winking = Math.max(winkPhase >= 0 && winkPhase <= 1 ? Math.sin(winkPhase * Math.PI) : 0, idleWink); // 0 → 1 → 0
    root.current.rotation.z = still
      ? 0
      : Math.sin(clock.current.bounce * 0.5) * thrilled * 0.15 + winking * 0.18 + Math.sin(t * 2.2) * 0.07 * wow - idleShy * 0.12 + Math.sin(t * 1.4) * 0.08 * th; // happy sway / shy tilt / pondering

    morphStar(body.current.geometry, rest, still ? 0 : clock.current.morph, 0.24 + excited * 0.08 + thrilled * 0.14 + wow * 0.04);

    // Face: round eyes widen when excited and swap to ^ ^ when pressing; smile → open grin.
    if (roundEyes.current && happyEyes.current) {
      const blinking = !still && e < 0.5 && wow < 0.5 && idleAmount.current < 0.5 && isBlinking(t, clock.current);
      // Wide when amazed; swapped for ^ ^ when pressing or in a "happy" moment; half-lowered when shy.
      const open = (1 + excited * 0.25 + wow * 0.4 + listen * 0.15) * (1 - thrilled) * (1 - idleHappy); // attentive while listening
      const openY = open * (1 - idleShy * 0.45) * (1 - th * 0.2); // focused squint while thinking
      roundEyes.current.scale.set(
        Math.max(open, 0.0001),
        Math.max(THREE.MathUtils.damp(roundEyes.current.scale.y, blinking ? 0.1 : openY, 30, delta), 0.0001),
        1,
      );
      happyEyes.current.scale.setScalar(Math.max(thrilled, idleHappy, 0.0001));
    }
    if (winkingEye.current) winkingEye.current.scale.y = 1 - winking * 0.88;
    if (smile.current && grin.current && gasp.current) {
      smile.current.scale.setScalar(
        Math.max((1 - excited - wow) * (1 + idleHappy * 0.3) * (1 - th * 0.45) * (1 - mouthOpen * 0.85) * (1 - sad * 0.55), 0.0001),
      ); // small, focused smile while thinking; gives way to the open mouth while talking
      gasp.current.scale.setScalar(Math.max(wow, 0.0001));
      grin.current.scale.setScalar(Math.max(excited * (1 + thrilled * 0.35), mouthOpen * 0.75, 0.0001));
    }
    for (const shine of shines.current) shine?.scale.setScalar(1 + wow * 0.6);
    if (blush.current) blush.current.scale.setScalar(Math.max(wow, idleShy - sad, idleHappy * 0.6, 0.0001));
  });

  return (
    <group ref={root}>
      <mesh ref={body} geometry={sphere}>
        <meshStandardMaterial color={bodyColor} roughness={0.45} metalness={0.05} />
      </mesh>

      {/* Round eyes (calm / excited). */}
      <group ref={roundEyes} position={onFace(0, 0.3)}>
        {[-1, 1].map((side) => (
          <mesh key={side} ref={side === 1 ? winkingEye : undefined} position={[side * 0.5, 0, 0]} scale={[1, 1, 0.35]}>
            <capsuleGeometry args={[0.16, 0.3, 8, 16]} />
            <FaceMaterial />
            {/* White shine, part of the eye so it blinks, winks and widens with it. */}
            <mesh ref={(mesh) => void (shines.current[side === -1 ? 0 : 1] = mesh)} position={[-0.05, 0.12, 0.17]}>
              <circleGeometry args={[0.055, 16]} />
              <meshBasicMaterial color={COLORS.sparkle} />
            </mesh>
          </mesh>
        ))}
      </group>

      {/* Happy ^ ^ eyes (very excited). */}
      <group ref={happyEyes} position={onFace(0, 0.32)} scale={0.0001}>
        {[-1, 1].map((side) => (
          <mesh key={side} position={[side * 0.5, -0.08, 0]}>
            <torusGeometry args={[0.2, 0.06, 8, 24, Math.PI]} />
            <FaceMaterial />
          </mesh>
        ))}
      </group>

      {/* Calm: a small curved smile. */}
      <mesh ref={smile} position={onFace(0, -0.35)} rotation={[0, 0, Math.PI]}>
        <torusGeometry args={[0.28, 0.05, 8, 24, Math.PI]} />
        <FaceMaterial />
      </mesh>

      {/* Amazed ("wow"): a soft "o" mouth… */}
      <mesh ref={gasp} position={onFace(0, -0.38)} scale={0.0001}>
        <circleGeometry args={[0.13, 32]} />
        <FaceMaterial />
      </mesh>

      {/* …and faint rosy cheeks. */}
      <group ref={blush} position={onFace(0, -0.12)} scale={0.0001}>
        {[-1, 1].map((side) => (
          <mesh key={side} position={[side * 0.82, 0, -0.12]} rotation={[0, side * 0.55, 0]} scale={[1, 0.6, 1]}>
            <circleGeometry args={[0.18, 24]} />
            <meshBasicMaterial color={COLORS.blush} transparent opacity={0.45} depthWrite={false} />
          </mesh>
        ))}
      </group>

      {/* Excited: an open "D" grin. */}
      <mesh ref={grin} position={onFace(0, -0.32)} rotation={[0, 0, Math.PI]} scale={0.0001}>
        <circleGeometry args={[0.36, 32, 0, Math.PI]} />
        <FaceMaterial />
      </mesh>
    </group>
  );
}

function FaceMaterial() {
  return <meshStandardMaterial color={COLORS.face} roughness={0.3} side={THREE.DoubleSide} />;
}

// A point on the star's (flattened) front face at the given height, nudged just above the surface.
function onFace(x: number, y: number): [number, number, number] {
  const z = Math.sqrt(Math.max(RADIUS ** 2 - x ** 2 - y ** 2, 0)) * DEPTH;
  return [x, y, z + 0.03];
}

// Blink every few seconds, at slightly irregular intervals.
function isBlinking(t: number, clock: { nextBlink: number }) {
  if (t > clock.nextBlink + BLINK_LENGTH) clock.nextBlink = t + BLINK_EVERY * (0.6 + Math.random() * 0.8);
  return t > clock.nextBlink && t < clock.nextBlink + BLINK_LENGTH;
}

// Reshape the sphere into a rounded star. Each vertex is pushed out depending on its angle
// around the front axis; the push fades toward the front and back so the face stays round.
function morphStar(geometry: THREE.BufferGeometry, rest: Float32Array, time: number, amount: number) {
  const position = geometry.attributes.position as THREE.BufferAttribute;
  const array = position.array as Float32Array;
  const slow = time * 0.25;
  const sixPoints = 0.5 + 0.5 * Math.sin(slow); // 0 = five points, 1 = six points
  const swell = amount + 0.06 * Math.sin(slow * 1.5 + 1);
  const spin = slow * 0.4;

  for (let i = 0; i < array.length; i += 3) {
    const x = rest[i];
    const y = rest[i + 1];
    const z = rest[i + 2];
    const side = 1 - (z / RADIUS) ** 2; // 0 at the front/back, 1 around the edge
    const angle = Math.atan2(y, x) + spin;
    const wave = Math.cos(5 * angle) * (1 - sixPoints) + Math.cos(6 * angle) * sixPoints;
    const bump = 1 + swell * side * (0.5 + 0.5 * wave) ** 1.5; // round bumps, not spikes
    array[i] = x * bump;
    array[i + 1] = y * bump;
    array[i + 2] = z * DEPTH;
  }
  position.needsUpdate = true;
  geometry.computeVertexNormals();
}
