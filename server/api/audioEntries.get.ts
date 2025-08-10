import { Redis } from "@upstash/redis";

import { AUDIO_ENTRIES_KEY, type AudioEntry } from "./audioStorage";

// Initialize Redis
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export default defineEventHandler(async () => {
  const limit = 16;
  try {
    const entries = await redis.get(AUDIO_ENTRIES_KEY);
    const entriesArray: AudioEntry[] = Array.isArray(entries)
      ? (entries as AudioEntry[])
      : [];

    console.log("Retrieved from Redis:", entriesArray.length, "audio entries");

    // Convert date strings back to Date objects
    const convertedEntries = entriesArray.map((entry) => ({
      ...(entry as AudioEntry),
      timestamp: new Date((entry as AudioEntry).timestamp),
      sentAt: (entry as AudioEntry).sentAt
        ? new Date((entry as any).sentAt)
        : undefined,
    }));

    return convertedEntries.slice(0, limit);
  } catch (error) {
    console.error("Error getting audio entries from Redis:", error);
    return [];
  }
});
