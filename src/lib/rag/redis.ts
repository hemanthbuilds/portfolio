import { Redis } from "@upstash/redis";

/*
  Shared Upstash Redis client (rate limits + answer cache). Returns null when it isn't configured,
  and callers then simply skip limiting/caching.
  The Vercel integration names the variables with its own "KV_REST_API" part after our prefix;
  either naming works.
*/

let client: Redis | null | undefined;

export function redis() {
  if (client !== undefined) return client;
  const env = process.env;
  const url = env.UPSTASH_REDIS_REST_URL ?? env.UPSTASH_REDIS_REST_KV_REST_API_URL ?? env.KV_REST_API_URL;
  const token = env.UPSTASH_REDIS_REST_TOKEN ?? env.UPSTASH_REDIS_REST_KV_REST_API_TOKEN ?? env.KV_REST_API_TOKEN;
  client = url && token ? new Redis({ url, token }) : null;
  return client;
}
