import type { ReactNode } from "react";

/*
  Small illustrated panels for the project cards: one per project, drawn in thin lines with blue
  accents and gently animated in a loop (styles + keyframes: ".art-*" in globals.css). They're
  decorative, so hidden from screen readers. Add an entry to ART (keyed by project slug) for a new
  project; unknown slugs get a simple fallback.
*/

const W = 400;
const H = 200;

// Fixed, varied heights so the waveform looks natural but is identical on server and client.
const WAVE = [18, 34, 52, 30, 64, 42, 24, 58, 72, 46, 28, 54, 40, 66, 36, 22, 48, 60, 32, 50, 26, 44, 38, 20];

const ART: Record<string, () => ReactNode> = {
  // Sound waveform flowing into a result table, a highlighted row sliding through it.
  "voice-to-sql-agent": () => (
    <>
      {WAVE.map((h, i) => (
        <rect
          key={i}
          className="art-accent-fill art-bar"
          x={28 + i * 6.2}
          y={100 - h / 2}
          width={2.6}
          height={h}
          rx={1.3}
          style={{ animationDelay: `${(i % 8) * 0.12}s` }}
        />
      ))}
      <path className="art-line art-flow" d="M 186 100 H 226" />
      <path className="art-line" d="M 220 94 L 226 100 L 220 106" />
      <rect className="art-line" x={240} y={52} width={132} height={96} rx={6} />
      <rect className="art-soft" x={240} y={52} width={132} height={20} rx={6} />
      {[0, 1, 2, 3].map((r) => (
        <path key={r} className="art-line" d={`M 240 ${76 + r * 18} H 372`} />
      ))}
      <path className="art-line" d="M 284 52 V 148 M 328 52 V 148" />
      <rect className="art-accent-soft art-row" x={242} y={78} width={128} height={16} rx={3} />
    </>
  ),

  // Policy documents beside a chat that answers from them.
  "state-farm-hr-assistant": () => (
    <>
      {[0, 1, 2].map((i) => (
        <g key={i} transform={`translate(${70 + i * 10} ${46 + i * 10})`}>
          <rect className={i === 2 ? "art-card" : "art-line"} width={86} height={104} rx={5} />
          {i === 2 && <path className="art-line" d="M 12 20 H 74 M 12 32 H 74 M 12 44 H 60 M 12 56 H 70 M 12 68 H 52" />}
          {i === 2 && <rect className="art-accent-soft" x={10} y={40} width={66} height={8} rx={2} />}
        </g>
      ))}
      <g className="art-bubble">
        <rect className="art-accent-soft" x={226} y={56} width={110} height={26} rx={13} />
      </g>
      <g className="art-bubble art-delay-2">
        <rect className="art-card" x={206} y={92} width={150} height={44} rx={12} />
        <path className="art-line" d="M 220 108 H 340 M 220 120 H 312" />
      </g>
    </>
  ),

  // Policy graph → matching passage in the note → checklist: two rules met, one flagged for a human.
  "priorauth-copilot": () => (
    <>
      <path className="art-line" d="M 52 70 L 92 100 L 52 130 M 92 100 L 128 100" />
      {[
        [52, 70],
        [52, 130],
      ].map(([x, y]) => (
        <circle key={y} className="art-line" cx={x} cy={y} r={8} />
      ))}
      <circle className="art-soft art-pulse" cx={92} cy={100} r={18} />
      <circle className="art-accent-line" cx={92} cy={100} r={11} />
      <path className="art-accent-line art-signal" d="M 103 100 H 146" />
      <rect className="art-card" x={150} y={52} width={84} height={96} rx={5} />
      <path className="art-line" d="M 162 70 H 222 M 162 84 H 214 M 162 112 H 222 M 162 126 H 204" />
      <rect className="art-accent-soft art-row" x={158} y={93} width={68} height={10} rx={2} />
      <path className="art-accent-line art-signal art-delay-1" d="M 238 100 H 270" />
      {[64, 100, 136].map((y, i) => (
        <g key={y} className="art-bubble" style={{ animationDelay: `${0.4 + i * 0.3}s` }}>
          <rect className="art-card" x={274} y={y - 13} width={92} height={26} rx={5} />
          {i < 2 ? (
            <path className="art-accent-line" d={`M 284 ${y} L 289 ${y + 5} L 298 ${y - 5}`} />
          ) : (
            <circle className="art-accent-soft art-pulse" cx={291} cy={y} r={6} />
          )}
          <path className="art-line" d={`M 308 ${y} H ${i === 2 ? 340 : 354}`} />
        </g>
      ))}
    </>
  ),

  // Orchestrator → two agents in parallel → invite drafted → paused for approval.
  "event-planner": () => (
    <>
      <path className="art-line" d="M 82 100 C 120 100 120 62 150 62 M 82 100 C 120 100 120 138 150 138 M 196 62 C 226 62 226 100 252 100 M 196 138 C 226 138 226 100 252 100 M 300 100 H 324" />
      <path className="art-accent-line art-signal" d="M 82 100 C 120 100 120 62 150 62" />
      <path className="art-accent-line art-signal" d="M 82 100 C 120 100 120 138 150 138" />
      <path className="art-accent-line art-signal art-delay-1" d="M 196 62 C 226 62 226 100 252 100" />
      <path className="art-accent-line art-signal art-delay-1" d="M 196 138 C 226 138 226 100 252 100" />
      <circle className="art-soft art-pulse" cx={62} cy={100} r={24} />
      <circle className="art-accent-line" cx={62} cy={100} r={14} />
      {[62, 138].map((y) => (
        <rect key={y} className="art-card" x={150} y={y - 14} width={46} height={28} rx={6} />
      ))}
      <g className="art-bubble art-delay-2">
        <rect className="art-card" x={252} y={80} width={48} height={40} rx={4} />
        <path className="art-line" d="M 252 84 L 276 102 L 300 84" />
      </g>
      <circle className="art-accent-soft art-pulse" cx={344} cy={100} r={20} />
      <path className="art-accent-line" d="M 338 90 V 110 M 350 90 V 110" strokeWidth={3} />
    </>
  ),

  // Three sources → one brain → three tailored ideas.
  "company-project-recommender": () => (
    <>
      {[60, 100, 140].map((y, i) => (
        <g key={y}>
          <circle className="art-line" cx={60} cy={y} r={9} />
          <path className="art-line" d={`M 69 ${y} C 120 ${y} 130 100 176 100`} />
          <path className="art-accent-line art-signal" style={{ animationDelay: `${i * 0.25}s` }} d={`M 69 ${y} C 120 ${y} 130 100 176 100`} />
        </g>
      ))}
      <circle className="art-soft art-pulse" cx={200} cy={100} r={30} />
      <circle className="art-accent-line" cx={200} cy={100} r={20} />
      <path className="art-accent-line" d="M 190 100 H 210 M 200 90 V 110" />
      {[56, 92, 128].map((y, i) => (
        <g key={y}>
          <path className="art-line" d={`M 224 100 C 262 100 262 ${y + 8} 290 ${y + 8}`} />
          <rect className="art-card art-bubble" style={{ animationDelay: `${0.4 + i * 0.3}s` }} x={292} y={y} width={70} height={16} rx={4} />
        </g>
      ))}
    </>
  ),

  // A little side-scrolling game: parallax stars, mountains and clouds; ground, coins, a checkpoint
  // flag and obstacles scrolling at one speed; a pixel runner whose legs alternate and who hops
  // each obstacle right as it reaches him (timings in globals.css: .run-*).
  "hem-run": () => (
    <>
      {/* Stars (twinkling) */}
      {[
        [40, 26], [96, 44], [150, 20], [210, 38], [262, 16], [318, 34], [372, 22], [124, 64], [344, 60],
      ].map(([x, y], i) => (
        <rect key={i} className="art-line-fill run-twinkle" x={x} y={y} width={2} height={2} style={{ animationDelay: `${(i % 4) * 0.5}s` }} />
      ))}
      {/* Far pixel mountains, two copies side by side for a seamless loop */}
      <g className="run-far">
        {[0, 200, 400].map((offset) => (
          <path
            key={offset}
            className="art-soft"
            d={`M ${offset} 146 V 120 H ${offset + 16} V 104 H ${offset + 32} V 92 H ${offset + 48} V 104 H ${offset + 64} V 116 H ${offset + 88} V 100 H ${offset + 104} V 84 H ${offset + 120} V 96 H ${offset + 136} V 112 H ${offset + 160} V 124 H ${offset + 184} V 116 H ${offset + 200} V 146 Z`}
          />
        ))}
      </g>
      {/* Clouds */}
      <g className="run-clouds">
        {[60, 260, 460].map((x, i) => (
          <path key={x} className="art-line-fill" d={`M ${x} ${48 + i * 6} h 24 v -6 h 12 v 6 h 8 v 6 h -52 v -6 Z`} />
        ))}
      </g>
      {/* Ground line and scrolling ground pixels */}
      <path className="art-line" d="M 0 146 H 400" />
      <g className="run-ground">
        {Array.from({ length: 32 }, (_, i) => (
          <rect key={i} className="art-line-fill" x={i * 28} y={154 + (i % 3) * 6} width={8} height={4} />
        ))}
      </g>
      {/* Coins, a checkpoint flag, and the obstacle, all scrolling with the ground */}
      <g className="run-items">
        <rect className="art-accent-fill run-coin" x={250} y={104} width={6} height={6} />
        <rect className="art-accent-fill run-coin" x={268} y={98} width={6} height={6} style={{ animationDelay: "0.2s" }} />
        <rect className="art-accent-fill run-coin" x={286} y={104} width={6} height={6} style={{ animationDelay: "0.4s" }} />
        <path className="art-line" d="M 360 146 V 104" />
        <path className="art-accent-fill" d="M 361 104 h 18 v 4 h -4 v 4 h 4 v 4 h -18 Z" />
      </g>
      <g className="run-obstacle">
        <rect className="art-card" x={420} y={128} width={14} height={18} />
        <rect className="art-line-fill" x={423} y={131} width={4} height={4} />
      </g>
      {/* The runner (4px pixels): head, body, arms, and two alternating leg poses */}
      <g className="run-runner">
        <g className="art-accent-fill">
          {[
            [8, 0], [12, 0], [8, 4], [12, 4], // head
            [4, 10], [8, 10], [12, 10], [16, 10], [8, 14], [12, 14], [8, 18], [12, 18], // body + arms
            [0, 12], [20, 8], // swinging hands
          ].map(([x, y], i) => (
            <rect key={i} x={110 + x} y={110 + y} width={4} height={4} />
          ))}
        </g>
        <g className="art-accent-fill run-legs-a">
          {[[4, 22], [16, 22], [0, 26], [20, 26]].map(([x, y], i) => (
            <rect key={i} x={110 + x} y={110 + y} width={4} height={4} />
          ))}
        </g>
        <g className="art-accent-fill run-legs-b">
          {[[8, 22], [12, 22], [8, 26], [12, 26]].map(([x, y], i) => (
            <rect key={i} x={110 + x} y={110 + y} width={4} height={4} />
          ))}
        </g>
      </g>
    </>
  ),

  // Charging-station pins pulsing on a map grid, next to a dashboard of bars and a trend line.
  "ev-charging-analytics": () => (
    <>
      <rect className="art-card" x={44} y={34} width={140} height={132} rx={8} />
      {[0, 1, 2, 3].map((i) => (
        <path key={i} className="art-line" d={`M 44 ${66 + i * 26} H 184 M ${72 + i * 28} 34 V 166`} opacity={0.5} />
      ))}
      {[
        [84, 70, 0], [136, 88, 0.5], [104, 122, 1], [158, 136, 1.5], [70, 146, 0.8],
      ].map(([x, y, delay], i) => (
        <g key={i}>
          <circle className="art-soft art-pulse" cx={x} cy={y} r={10} style={{ animationDelay: `${delay}s` }} />
          <circle className="art-accent-fill" cx={x} cy={y} r={3} />
        </g>
      ))}
      <rect className="art-card" x={214} y={34} width={142} height={132} rx={8} />
      {[38, 62, 48, 78, 56, 70].map((h, i) => (
        <rect
          key={i}
          className={i === 3 ? "art-accent-fill art-bar" : "art-accent-soft art-bar"}
          x={232 + i * 20}
          y={146 - h}
          width={11}
          height={h}
          rx={2}
          style={{ transformOrigin: "bottom", animationDelay: `${i * 0.15}s` }}
        />
      ))}
      <path className="art-accent-line art-signal" d="M 236 100 L 256 90 L 276 96 L 296 70 L 316 80 L 336 60" />
      <path className="art-line" d="M 228 146 H 344" />
    </>
  ),

  // PRD → launch → analysis: a requirements doc whose checklist ticks off one by one, a launch
  // marker, then a performance curve drawing in after launch and peaking (one loop, .camp-*).
  "red-bull-campaign": () => (
    <>
      {/* The PRD */}
      <rect className="art-card" x={44} y={36} width={104} height={128} rx={7} />
      <rect className="art-soft" x={56} y={48} width={52} height={8} rx={2} />
      {[0, 1, 2, 3].map((i) => (
        <g key={i}>
          <rect className="art-line" x={56} y={72 + i * 22} width={10} height={10} rx={2.5} />
          <path
            className="art-accent-line camp-tick"
            style={{ animationDelay: `${0.3 + i * 0.45}s` }}
            d={`M 58 ${77 + i * 22} l 2.5 2.5 l 4.5 -5`}
            pathLength={1}
          />
          <path className="art-line" d={`M 74 ${77 + i * 22} H ${[134, 122, 130, 116][i]}`} />
        </g>
      ))}
      {/* Launch */}
      <path className="art-line art-flow" d="M 156 100 H 190" />
      <circle className="art-accent-line camp-launch" cx={202} cy={100} r={9} />
      <path className="art-accent-fill camp-launch" d="M 199 96 L 207 100 L 199 104 Z" />
      <path className="art-line art-flow" d="M 214 100 H 232" />
      {/* Performance after launch */}
      <rect className="art-card" x={240} y={36} width={120} height={128} rx={7} />
      <path className="art-line" d="M 252 148 H 350 M 252 148 V 50" />
      <path className="art-line" d="M 270 148 V 52" strokeDasharray="3 4" />
      <path className="art-soft camp-area" d="M 254 146 L 270 142 C 286 138 292 110 306 96 C 318 84 326 64 342 58 L 348 58 L 348 146 Z" />
      <path
        className="art-accent-line camp-curve"
        pathLength={1}
        d="M 254 146 L 270 142 C 286 138 292 110 306 96 C 318 84 326 64 342 58 L 348 58"
      />
      <circle className="art-accent-fill camp-peak" cx={342} cy={58} r={3.5} />
    </>
  ),

  // Linked database tables (an ER diagram) feeding a rising score chart.
  "sports-scoring-database": () => (
    <>
      {[
        [48, 40], [48, 116], [158, 78],
      ].map(([x, y], i) => (
        <g key={i}>
          <rect className="art-card" x={x} y={y} width={84} height={52} rx={5} />
          <rect className={i === 2 ? "art-accent-soft" : "art-soft"} x={x} y={y} width={84} height={14} rx={5} />
          <path className="art-line" d={`M ${x + 8} ${y + 26} H ${x + 70} M ${x + 8} ${y + 38} H ${x + 56}`} />
        </g>
      ))}
      <path className="art-line" d="M 132 66 C 146 66 144 104 158 104 M 132 142 C 146 142 144 104 158 104" />
      <path className="art-accent-line art-signal" d="M 132 66 C 146 66 144 104 158 104" />
      <path className="art-accent-line art-signal art-delay-1" d="M 132 142 C 146 142 144 104 158 104" />
      <path className="art-line art-flow" d="M 246 104 H 270" />
      <rect className="art-card" x={278} y={56} width={84} height={96} rx={6} />
      <path className="art-line" d="M 290 136 H 352" />
      <path className="art-accent-line art-signal art-delay-2" d="M 292 128 L 306 118 L 318 122 L 332 100 L 348 86" />
      {[[292, 128], [306, 118], [318, 122], [332, 100], [348, 86]].map(([x, y], i) => (
        <circle key={i} className="art-accent-fill art-pulse" cx={x} cy={y} r={2.5} style={{ animationDelay: `${i * 0.3}s` }} />
      ))}
    </>
  ),

  // Hem (a soft blue star) with chat bubbles popping in.
  "ask-hemanth": () => (
    <>
      <circle className="art-soft art-pulse" cx={110} cy={100} r={46} />
      <path
        className="art-accent-fill art-float"
        d="M110 62 C116 62 118 76 124 80 C130 84 146 80 148 86 C150 92 136 100 134 106 C132 112 140 126 134 130 C128 134 116 124 110 124 C104 124 92 134 86 130 C80 126 88 112 86 106 C84 100 70 92 72 86 C74 80 90 84 96 80 C102 76 104 62 110 62 Z"
      />
      <rect className="art-eye" x={102} y={90} width={4} height={9} rx={2} />
      <rect className="art-eye" x={114} y={90} width={4} height={9} rx={2} />
      <g className="art-bubble">
        <rect className="art-accent-soft" x={238} y={50} width={112} height={26} rx={13} />
      </g>
      <g className="art-bubble art-delay-2">
        <rect className="art-card" x={190} y={88} width={150} height={44} rx={12} />
        <path className="art-line" d="M 204 104 H 324 M 204 116 H 296" />
      </g>
    </>
  ),

  // A resume page, retrieval highlights moving down it, feeding an answer bubble.
  "chat-with-resume": () => (
    <>
      <rect className="art-card" x={76} y={26} width={112} height={148} rx={6} />
      <rect className="art-soft" x={90} y={40} width={50} height={8} rx={2} />
      {[60, 72, 84, 100, 112, 124, 140, 152].map((y, i) => (
        <path key={y} className="art-line" d={`M 90 ${y} H ${[174, 160, 168, 174, 150, 166, 172, 140][i]}`} />
      ))}
      <rect className="art-accent-soft art-scan" x={86} y={56} width={92} height={10} rx={3} />
      <path className="art-line" d="M 196 100 H 234" />
      <path className="art-accent-line art-signal" d="M 196 100 H 234" />
      <g className="art-bubble art-delay-1">
        <rect className="art-card" x={242} y={74} width={112} height={52} rx={12} />
        <path className="art-line" d="M 256 92 H 338 M 256 104 H 326 M 256 116 H 300" />
      </g>
    </>
  ),
};

export function ProjectArt({ slug }: { slug: string }) {
  const art = ART[slug];
  return (
    <svg aria-hidden="true" viewBox={`0 0 ${W} ${H}`} className="project-art absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid meet">
      {art ? art() : <circle className="art-soft art-pulse" cx={W / 2} cy={H / 2} r={40} />}
    </svg>
  );
}
