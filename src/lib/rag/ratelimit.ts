import { Ratelimit } from "@upstash/ratelimit";
import { RAG } from "./config";
import { redis } from "./redis";

/*
  Per-visitor limits (by IP address) so bots can't use up the free Gemini quota. Real visitors
  won't notice them. Uses Upstash Redis; if it isn't configured (e.g. local dev), no limit applies.
*/

let limiters: { minute: Ratelimit; day: Ratelimit } | null | undefined;

function getLimiters() {
  if (limiters !== undefined) return limiters;
  const client = redis();
  if (!client) return (limiters = null);
  limiters = {
    minute: new Ratelimit({ redis: client, prefix: "ask:min", limiter: Ratelimit.slidingWindow(RAG.perMinute, "1 m") }),
    day: new Ratelimit({ redis: client, prefix: "ask:day", limiter: Ratelimit.fixedWindow(RAG.perDay, "1 d") }),
  };
  return limiters;
}

// Returns null when allowed, or a message to show the visitor when they've hit a limit.
export async function checkRateLimit(visitor: string) {
  const l = getLimiters();
  if (!l) return null;
  const [minute, day] = await Promise.all([l.minute.limit(visitor), l.day.limit(visitor)]);
  if (!day.success) return "You've asked a lot today! Please come back tomorrow, or email Hemanth directly.";
  if (!minute.success) return "That's a lot of questions in a row. Give it a few seconds and try again.";
  return null;
}
