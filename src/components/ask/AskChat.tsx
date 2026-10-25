"use client";

import { AnimatePresence, LazyMotion, domAnimation, m, useReducedMotion } from "motion/react";
import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { hemTyping } from "@/components/hem/heroLink";
import { ArrowIcon } from "@/components/ui/ArrowIcon";
import { hero } from "@/data/site";
import { AnswerText } from "./AnswerText";
import type { Message } from "./useAskChat";

/*
  The chat that opens over the website once someone asks a question. The page behind blurs out,
  slow-moving gradients in shades of the site blue drift behind a frosted layer, and the
  conversation sits in a clean column with a follow-up box at the bottom.
  Close with the ✕ button, Esc, or a click on the empty background; the page is just as it was.
*/

const EASE = [0.22, 1, 0.36, 1] as const; // quick start, long soft finish
const EASE_OUT = [0.4, 0, 0.2, 1] as const; // for closing: smooth all the way, no snap at the end

type Props = {
  open: boolean;
  onClose: () => void;
  onExited?: () => void; // after the closing animation has fully finished
  messages: Message[];
  busy: boolean;
  onSend: (question: string) => void;
};

export function AskChat(props: Props) {
  // Portals need the browser's document, so only render after hydration.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  if (!mounted) return null;
  return createPortal(
    <LazyMotion features={domAnimation}>
      <AnimatePresence onExitComplete={props.onExited}>{props.open && <ChatPanel key="chat" {...props} />}</AnimatePresence>
    </LazyMotion>,
    document.body,
  );
}

function ChatPanel({ onClose, messages, busy, onSend }: Props) {
  const reduceMotion = useReducedMotion() ?? false;
  const titleId = useId();
  const inputId = useId();
  const [draft, setDraft] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const copy = hero.ask;

  // While open: Esc closes, and the page behind doesn't scroll.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKeyDown);
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      root.style.overflow = previous;
    };
  }, [onClose]);

  // Keep the newest message in view as answers stream in.
  useEffect(() => {
    const list = listRef.current;
    list?.scrollTo({ top: list.scrollHeight, behavior: reduceMotion ? "auto" : "smooth" });
  }, [messages, reduceMotion]);

  return (
    <m.div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-[60]"
      // The layers below animate in turn; this just keeps the chat on screen until they've finished.
      initial={{ opacity: 1 }}
      exit={{ opacity: 1, transition: { duration: reduceMotion ? 0 : 0.5 } }}
    >
      {/* The website, blurred, with slow blue gradients moving behind a frosted layer. */}
      {/* 1. The website gently blurs and dims (the blur itself animates, so it eases in, not pops). */}
      {/* A fixed blur faded in and out with opacity: smooth, unlike animating the blur strength. */}
      <m.div
        className="absolute inset-0 bg-background/60 backdrop-blur-[28px]"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, transition: { duration: reduceMotion ? 0 : 0.5, ease: EASE_OUT } }}
        transition={{ duration: reduceMotion ? 0 : 0.6, ease: EASE }}
      />
      {/* 2. The blue glows bloom in behind the conversation. */}
      <m.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
        initial={{ opacity: 0, scale: 1.08 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, transition: { duration: reduceMotion ? 0 : 0.4, ease: EASE_OUT } }}
        transition={{ duration: reduceMotion ? 0 : 1.1, ease: EASE, delay: reduceMotion ? 0 : 0.1 }}
      >
        <span className="chat-blob chat-blob-a" />
        <span className="chat-blob chat-blob-b" />
        <span className="chat-blob chat-blob-c" />
        <span className="chat-blob chat-blob-d" />
      </m.div>

      <m.div
        className="pointer-events-none relative mx-auto flex h-full w-full max-w-2xl flex-col px-4 pt-5 pb-5 md:pt-8 md:pb-8"
        // 3. The conversation rises softly into focus.
        initial={{ y: 26, opacity: 0, filter: "blur(8px)" }}
        animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
        exit={{ y: 10, opacity: 0, transition: { duration: reduceMotion ? 0 : 0.28, ease: EASE_OUT } }}
        transition={{ duration: reduceMotion ? 0 : 0.65, ease: EASE, delay: reduceMotion ? 0 : 0.18 }}
      >
        {/* Hem's seat: he hops up here when the chat opens and answers from it (see HemCompanion). */}
        <header className="relative flex flex-col items-center pb-3">
          <div data-hem-chat aria-hidden="true" className="h-[92px] w-[170px]" />
          <h2 id={titleId} className="text-[0.9375rem] font-medium text-foreground/90">
            {copy.chatTitle}
          </h2>
          <div className="pointer-events-auto absolute top-0 right-0 flex items-center gap-3">
            <span className="hidden text-xs text-muted-foreground sm:inline">{copy.closeHint}</span>
            <button
              type="button"
              onClick={onClose}
              aria-label={copy.close}
              data-hem="leaving"
              className="glass-button glass-quiet grid size-8 place-items-center rounded-full text-foreground/80 hover:text-foreground"
            >
              <svg aria-hidden="true" viewBox="0 0 16 16" className="size-3" fill="none" stroke="currentColor" strokeWidth="1.75">
                <path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </header>

        <div
          ref={listRef}
          aria-live="polite"
          className="chat-scroll pointer-events-auto -mr-4 -ml-2 flex flex-1 flex-col gap-4 overflow-y-auto py-4 pr-4 pl-2"
        >
          {messages.map((message) =>
            message.role === "user" ? (
              <m.p
                key={message.id}
                initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-[85%] self-end rounded-2xl rounded-br-md border border-primary/30 bg-primary/15 px-4 py-2.5 text-[0.9375rem] text-foreground"
              >
                {message.text}
              </m.p>
            ) : (
              <m.div
                key={message.id}
                initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-[92%] self-start rounded-2xl rounded-bl-md border border-border/70 bg-card/70 px-5 py-4 text-[0.9375rem] leading-relaxed text-card-foreground backdrop-blur-md"
              >
                {message.state === "thinking" ? (
                  <span className="flex h-6 items-center gap-1.5" aria-label={copy.thinking}>
                    <span className="chat-dot" />
                    <span className="chat-dot [animation-delay:0.15s]" />
                    <span className="chat-dot [animation-delay:0.3s]" />
                  </span>
                ) : message.state === "error" ? (
                  <p className="text-destructive">{message.text}</p>
                ) : (
                  <div className="space-y-1.5">
                    <AnswerText text={message.text} />
                  </div>
                )}
                {message.state === "done" && message.link && (
                  <a
                    href={message.link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-1.5 text-sm text-foreground hover:text-foreground/80"
                  >
                    Open {message.link.label}
                    <ArrowIcon />
                  </a>
                )}
                {message.state === "done" && message.sources.length > 0 && (
                  <p className="mt-3 text-xs text-muted-foreground">
                    {copy.sources} {message.sources.join(", ")}
                  </p>
                )}
              </m.div>
            ),
          )}
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (!draft.trim() || busy) return;
            onSend(draft);
            setDraft("");
          }}
          className="pointer-events-auto mt-4 flex h-12 shrink-0 items-center gap-2 rounded-full border border-border bg-card/80 pr-1.5 pl-5 backdrop-blur-md transition-colors duration-500 focus-within:border-foreground/15"
        >
          <label htmlFor={inputId} className="sr-only">
            {copy.label}
          </label>
          <input
            id={inputId}
            type="text"
            value={draft}
            onChange={(event) => {
              setDraft(event.target.value);
              hemTyping.set(hemTyping.get() + 1); // Hem watches the visitor type
            }}
            placeholder={copy.followUp}
            maxLength={500}
            autoComplete="off"
            autoFocus
            className="min-w-0 flex-1 bg-transparent text-[0.9375rem] text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:outline-none"
          />
          <button
            type="submit"
            aria-label={copy.submit}
            disabled={!draft.trim() || busy}
            className="glass-button glass-quiet grid size-9 shrink-0 place-items-center rounded-full"
          >
            <svg aria-hidden="true" viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.75">
              <path d="M8 13V3M3.5 7.5 8 3l4.5 4.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </form>
      </m.div>
    </m.div>
  );
}
