/*
  Reads letter outlines from the Figtree font file so the hero name can be drawn as
  "vectorized" letters: a thin outline with a dot on each key point (like the OpenAI DevDay title).
  The parser and font load lazily, only the first time they're needed.
*/

import type { PathCommand } from "opentype.js";

const FONT_URL = "/fonts/figtree-500.woff"; // same weight as the hero name (font-medium)

// Fonts store many small curve segments per letter (a "g" can have 50–80 points), so a dot on every
// point looks like a dashed line. Only key points get a dot: sharp corners and the top/bottom/side
// extremes of curves, spaced at least MIN_DOT_GAP apart.
const CORNER_DEGREES = 35;
const MIN_DOT_GAP = 0.07; // in em

export type GlyphOutline = {
  path: string; // SVG path data in font units, baseline at y = 0 (y grows downward)
  anchors: [number, number][]; // key points, where the dots go
  advance: number; // letter width in font units
};

export type FontOutlines = {
  unitsPerEm: number;
  ascender: number;
  descender: number; // negative
  glyphs: Map<string, GlyphOutline>;
};

let loading: Promise<FontOutlines> | null = null;

export function loadOutlines(text: string): Promise<FontOutlines> {
  loading ??= (async () => {
    const [opentype, buffer] = await Promise.all([
      import("opentype.js"),
      fetch(FONT_URL).then((response) => response.arrayBuffer()),
    ]);
    // opentype.js is CommonJS; depending on the bundler its functions sit on the module or on `default`.
    const { parse } = "parse" in opentype ? opentype : (opentype as { default: typeof opentype }).default;
    const font = parse(buffer);
    const glyphs = new Map<string, GlyphOutline>();

    for (const letter of new Set(Array.from(text))) {
      if (letter === " ") continue;
      const glyph = font.charToGlyph(letter);
      const path = glyph.getPath(0, 0, font.unitsPerEm);
      glyphs.set(letter, {
        path: path.toPathData(1),
        anchors: keyPoints(path.commands, font.unitsPerEm * MIN_DOT_GAP),
        advance: glyph.advanceWidth ?? font.unitsPerEm / 2,
      });
    }

    return {
      unitsPerEm: font.unitsPerEm,
      ascender: font.tables.hhea.ascender,
      descender: font.tables.hhea.descender,
      glyphs,
    };
  })();
  return loading;
}

type Point = { x: number; y: number; in: [number, number]; out: [number, number] };

// Split the outline into closed contours of on-curve points, each with its incoming and
// outgoing direction, then keep the corners and curve extremes.
function keyPoints(commands: PathCommand[], minGap: number): [number, number][] {
  const contours: Point[][] = [];
  let current: Point[] = [];

  for (const command of commands) {
    if (command.type === "Z") {
      if (current.length) contours.push(current);
      current = [];
      continue;
    }
    const point: Point = { x: command.x, y: command.y, in: [0, 0], out: [0, 0] };
    const previous = current[current.length - 1];
    if (previous && command.type !== "M") {
      // Direction leaving the previous point, and arriving at this one.
      const [startControl, endControl] =
        command.type === "Q"
          ? [[command.x1, command.y1], [command.x1, command.y1]]
          : command.type === "C"
            ? [[command.x1, command.y1], [command.x2, command.y2]]
            : [[command.x, command.y], [previous.x, previous.y]];
      previous.out = [startControl[0] - previous.x, startControl[1] - previous.y];
      point.in = [command.x - endControl[0], command.y - endControl[1]];
    }
    current.push(point);
  }
  if (current.length) contours.push(current);

  const kept: [number, number][] = [];
  for (const contour of contours) {
    // The outline closes back to its first point; join up the directions there.
    const first = contour[0];
    const last = contour[contour.length - 1];
    if (Math.hypot(first.x - last.x, first.y - last.y) < 1) {
      first.in = last.in;
      contour.pop();
    } else {
      last.out = [first.x - last.x, first.y - last.y];
      first.in = last.out;
    }

    for (const p of contour) {
      if (!isKeyPoint(p)) continue;
      if (kept.some(([x, y]) => Math.hypot(x - p.x, y - p.y) < minGap)) continue;
      kept.push([p.x, p.y]);
    }
  }
  return kept;
}

function isKeyPoint(p: Point) {
  const [ix, iy] = p.in;
  const [ox, oy] = p.out;
  const inLength = Math.hypot(ix, iy);
  const outLength = Math.hypot(ox, oy);
  if (!inLength || !outLength) return true;
  const turn = Math.acos(Math.max(-1, Math.min(1, (ix * ox + iy * oy) / (inLength * outLength))));
  const corner = (turn * 180) / Math.PI > CORNER_DEGREES;
  // Top/bottom or left/right of a curve: the direction flips sign across this point.
  const extreme = Math.sign(iy) !== Math.sign(oy) || Math.sign(ix) !== Math.sign(ox);
  return corner || extreme;
}
