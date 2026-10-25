"use client";

import { motionValue } from "motion/react";

/*
  How the home hero talks to the one site-wide Hem (HemCompanion):
  - The hero marks Hem's spot between the hands with data-hem-home; Hem flies to it while it's on screen.
  - The hero writes its hands' approach (0 → 1) here so Hem can wink when the fingertips arrive.
  HemCompanion also sets hemIsCompanion (1 while he's following the cursor rather than docked),
  which turns on his idle "look at the viewer and pull a cute face" moments.
  The Ask chat sets hemThinking to 1 while it waits for an answer (he looks thoughtful), and
  hemTalking to 1 while the answer streams in (his mouth moves as if he's saying it).
  HemCompanion sets hemInChat to 1 while he's seated in the open chat (he stops following the
  cursor and faces the visitor instead), and the chat bumps hemTyping on each keystroke so he
  watches the visitor type.
*/
export const heroApproach = motionValue(0);
export const hemIsCompanion = motionValue(0);
export const hemThinking = motionValue(0);
export const hemTalking = motionValue(0);
export const hemInChat = motionValue(0);
export const hemTyping = motionValue(0);
