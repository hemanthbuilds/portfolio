/*
  A band along the bottom of the hero, with a line above and below, where the motto scrolls
  endlessly. Hovering pauses it; with reduced motion it stays still.
*/

const REPEATS = 4; // copies of the motto per half, so the band is always wider than the screen

export function Ticker({ words }: { words: readonly string[] }) {
  const sequence = Array.from({ length: REPEATS }, () => words).flat();

  return (
    <div className="group absolute inset-x-0 bottom-0 overflow-hidden border-y border-border bg-background py-2">
      <p className="sr-only">{words.join(", ")}</p>
      <div
        aria-hidden="true"
        className="flex w-max animate-[ticker_40s_linear_infinite] group-hover:[animation-play-state:paused] motion-reduce:animate-none"
      >
        {/* Two identical halves: when the first has scrolled fully off, the loop restarts invisibly. */}
        {[0, 1].map((half) => (
          <ul key={half} className="flex shrink-0 items-center">
            {sequence.map((word, i) => (
              <li key={i} className="flex items-center text-[0.8125rem] text-foreground/80">
                <span className="px-5">{word}</span>
                <span className="size-1 rounded-full bg-primary" />
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  );
}
