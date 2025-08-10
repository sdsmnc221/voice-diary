import { Redis } from "@upstash/redis";
import { MultiPartData } from "h3";

// Initialize Redis
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export const AUDIO_ENTRIES_KEY = "voice-diary-audio";

export interface AudioEntry {
  id: string;
  timestamp: string | Date;
  sentAt?: Date;
  file: MultiPartData;
}

export async function getAudioEntries(limit = 50): Promise<AudioEntry[]> {
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
}

export async function getAudioEntryById(
  id: string
): Promise<AudioEntry | null> {
  try {
    // First try to get from individual key
    const entry = await redis.get(`audio-entry:${id}`);
    if (entry) {
      return {
        ...(entry as AudioEntry),
        timestamp: new Date((entry as AudioEntry).timestamp),
        sentAt: (entry as AudioEntry).sentAt
          ? new Date((entry as any).sentAt)
          : undefined,
      };
    }

    // Fallback: search in entries list
    const entries = await getAudioEntries();
    return entries.find((e) => e.id === id) || null;
  } catch (error) {
    console.error("Error getting audiol entry by ID " + id, error);
    return null;
  }
}

export async function saveAudioEntry(
  entryData: AudioEntry
): Promise<AudioEntry> {
  try {
    // Get existing entries
    const existingData = await redis.get(AUDIO_ENTRIES_KEY);
    const entries = Array.isArray(existingData) ? existingData : [];

    console.log("Current audio entries before save:", entries.length);

    // Add new entry to the beginning
    entries.unshift(entryData);

    // Keep only last 100 entries
    if (entries.length > 100) {
      entries.splice(100);
    }

    // Save the updated list back to Redis
    await redis.set(AUDIO_ENTRIES_KEY, entries);

    // Also save individual entry with expiration (30 days)
    await redis.set(`audio-entry:${entryData.id}`, entryData, {
      ex: 30 * 24 * 60 * 60, // 30 days in seconds
    });

    console.log("Audio entry saved to Redis. Total now:", entries.length);
    console.log("New entry ID:", entryData.id);
    return entryData;
  } catch (error) {
    console.error("Error saving audio entry to Redis:", error);
    return entryData;
  }
}

export async function updateAudioEntry(
  id: string,
  updates: Partial<AudioEntry>
): Promise<AudioEntry | null> {
  try {
    console.log("Updating email entry:", id, "with:", updates);

    // Get the existing entry
    const existingEntry = await getAudioEntryById(id);
    if (!existingEntry) {
      console.log("Entry not found for update:", id);
      return null;
    }

    // Merge updates
    const updatedEntry: AudioEntry = {
      ...existingEntry,
      ...updates,
      id, // Ensure ID doesn't change
    };

    // Save individual entry
    await redis.set(`audio-entry:${id}`, updatedEntry, {
      ex: 30 * 24 * 60 * 60, // 30 days in seconds
    });

    // Update in the main list
    const existingData = await redis.get(AUDIO_ENTRIES_KEY);
    const entries = Array.isArray(existingData) ? existingData : [];

    const entryIndex = entries.findIndex((entry: any) => entry.id === id);
    if (entryIndex !== -1) {
      entries[entryIndex] = updatedEntry;
      await redis.set(AUDIO_ENTRIES_KEY, entries);
    }

    console.log("Audio entry updated successfully:", id);
    return updatedEntry;
  } catch (error) {
    console.error("Error updating email entry:", error);
    return null;
  }
}

export async function deleteAudioEntry(id: string): Promise<boolean> {
  try {
    // Remove individual entry
    await redis.del(`audio-entry:${id}`);

    // Remove from main list
    const existingData = await redis.get(AUDIO_ENTRIES_KEY);
    const entries = Array.isArray(existingData) ? existingData : [];

    const filteredEntries = entries.filter((entry: any) => entry.id !== id);
    await redis.set(AUDIO_ENTRIES_KEY, filteredEntries);

    console.log("Audio entry deleted:", id);
    return true;
  } catch (error) {
    console.error("Error deleting email entry:", error);
    return false;
  }
}

export async function getAudioStorageStats() {
  try {
    const entriesData = await redis.get(AUDIO_ENTRIES_KEY);
    const entries = Array.isArray(entriesData) ? entriesData : [];
    const keys = await redis.keys("audio-entry:*");

    return {
      totalEntries: entries.length,
      individualKeys: keys.length,
      redisConnected: true,
    };
  } catch (error: any) {
    console.error("Error getting email storage stats:", error);
    return {
      totalEntries: 0,
      individualKeys: 0,
      redisConnected: false,
      error: error.message,
    };
  }
}
