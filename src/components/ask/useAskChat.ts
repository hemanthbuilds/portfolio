"use client";

import { useCallback, useRef, useState } from "react";
import { hemTalking, hemThinking } from "@/components/hem/heroLink";
import { hero } from "@/data/site";

/*
  The conversation behind the Ask chat (a new one each time it opens): a list of questions and
  answers. send() posts a question to /api/ask (the resume RAG pipeline) and streams the answer
  into the newest message. Hem looks thoughtful while it waits and "talks" while it streams.
  If the assistant called its open_profile tool, the reply carries a link: it opens in a new tab,
  and stays on the message as a button in case the browser blocked the tab.
*/

export type Message =
  | { id: number; role: "user"; text: string }
  | {
      id: number;
      role: "assistant";
      text: string;
      sources: string[];
      link?: { label: string; href: string };
      state: "thinking" | "streaming" | "done" | "error";
    };

export function useAskChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const nextId = useRef(0);
  const busy = messages.some((m) => m.role === "assistant" && (m.state === "thinking" || m.state === "streaming"));

  async function send(question: string) {
    const text = question.trim();
    if (!text || busy) return;
    const answerId = nextId.current + 1;
    nextId.current += 2;
    setMessages((current) => [
      ...current,
      { id: answerId - 1, role: "user", text },
      { id: answerId, role: "assistant", text: "", sources: [], state: "thinking" },
    ]);
    const update = (changes: Partial<Extract<Message, { role: "assistant" }>>) =>
      setMessages((current) => current.map((m) => (m.id === answerId && m.role === "assistant" ? { ...m, ...changes } : m)));

    hemThinking.set(1);
    try {
      const response = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: text }),
      });

      // Placeholder, off-topic replies, limits and errors come back as JSON.
      if (response.headers.get("Content-Type")?.includes("application/json") || !response.body) {
        const data = (await response.json()) as { answer?: string; error?: string; open?: { label: string; href: string } };
        if (!response.ok || !data.answer) update({ text: data.error ?? hero.ask.error, state: "error" });
        else update({ text: data.answer, link: data.open, state: "done" });
        if (data.open) window.open(data.open.href, "_blank", "noopener,noreferrer");
        return;
      }

      // A real answer streams in as plain text.
      const sources = parseSources(response.headers.get("X-Sources"));
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let answer = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        answer += decoder.decode(value, { stream: true });
        hemThinking.set(0); // the first words are in: he's done thinking, and starts "talking"
        hemTalking.set(1);
        update({ text: answer, state: "streaming" });
      }
      update(answer ? { text: answer, sources, state: "done" } : { text: hero.ask.error, state: "error" });
    } catch {
      update({ text: hero.ask.error, state: "error" });
    } finally {
      hemThinking.set(0);
      hemTalking.set(0);
    }
  }

  // Each time the chat is closed, the conversation ends; the next question starts a new one.
  // (An answer still streaming for the old conversation has nowhere to go and is dropped.)
  const reset = useCallback(() => {
    setMessages([]);
    hemThinking.set(0);
    hemTalking.set(0);
  }, []);

  return { messages, busy, send, reset };
}

function parseSources(header: string | null): string[] {
  try {
    const parsed: unknown = JSON.parse(decodeURIComponent(header ?? "[]"));
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}
