import { Fragment, type ReactNode } from "react";

// Light formatting for an answer: "- " / "* " lines become bullets and **text** becomes bold
// (the model sometimes uses them); everything else is shown as plain paragraphs.
export function AnswerText({ text }: { text: string }) {
  return (
    <>
      {text
        .split("\n")
        .filter((line) => line.trim())
        .map((line, i) => {
          const bullet = /^\s*[-*•]\s+/.exec(line);
          const content = inlineBold(bullet ? line.slice(bullet[0].length) : line);
          return bullet ? (
            <p key={i} className="flex gap-2 pl-1">
              <span aria-hidden="true" className="text-muted-foreground">
                •
              </span>
              <span>{content}</span>
            </p>
          ) : (
            <p key={i}>{content}</p>
          );
        })}
    </>
  );
}

function inlineBold(text: string): ReactNode {
  const parts = text.split(/\*\*(.+?)\*\*/g); // odd indexes are the bold parts
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <strong key={i} className="font-medium text-foreground">
        {part}
      </strong>
    ) : (
      <Fragment key={i}>{part.replace(/\*\*/g, "")}</Fragment>
    ),
  );
}
