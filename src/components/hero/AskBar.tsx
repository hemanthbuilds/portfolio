"use client";

import { useCallback, useId, useRef, useState } from "react";
import { AskChat } from "@/components/ask/AskChat";
import { useAskChat } from "@/components/ask/useAskChat";
import { hero } from "@/data/site";

/*
  "Ask me" bar in the hero. Asking a question opens the Ask chat over the page (see AskChat):
  the site blurs out and the conversation continues there. Closing it (✕, Esc or a click outside)
  brings the page back as it was and ends the conversation; the next question starts a new one.
*/

export function AskBar() {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [question, setQuestion] = useState("");
  const [open, setOpen] = useState(false);
  const chat = useAskChat();
  const copy = hero.ask;

  // Closing ends the conversation: the next question opens a fresh chat. The messages are cleared
  // only once the closing animation has finished, so they don't vanish while it fades out.
  const close = useCallback(() => {
    setOpen(false);
    inputRef.current?.focus({ preventScroll: true });
  }, []);

  return (
    <div className="mx-auto mt-10 w-full max-w-xl text-left">
      <form
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          if (!question.trim()) return;
          setOpen(true);
          chat.send(question);
          setQuestion("");
        }}
        className="flex h-12 items-center gap-2 rounded-full border border-border bg-card pr-1.5 pl-5 transition-colors duration-500 focus-within:border-foreground/15"
      >
        <label htmlFor={inputId} className="sr-only">
          {copy.label}
        </label>
        <input
          ref={inputRef}
          id={inputId}
          type="text"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder={copy.placeholder}
          maxLength={500}
          autoComplete="off"
          className="min-w-0 flex-1 bg-transparent text-[0.9375rem] text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:outline-none"
        />
        <button
          type="submit"
          aria-label={copy.submit}
          disabled={!question.trim()}
          className="glass-button glass-quiet grid size-9 shrink-0 place-items-center rounded-full"
        >
          <svg aria-hidden="true" viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.75">
            <path d="M8 13V3M3.5 7.5 8 3l4.5 4.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </form>

      <AskChat
        open={open}
        onClose={close}
        onExited={chat.reset}
        messages={chat.messages}
        busy={chat.busy}
        onSend={chat.send}
      />
    </div>
  );
}
