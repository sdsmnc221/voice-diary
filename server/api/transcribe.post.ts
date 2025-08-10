// server/api/transcribe.post.ts
import type { H3Event, MultiPartData } from "h3";
import { AudioEntry, getAudioEntryById } from "./audioStorage";

import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

const elevenlabs = new ElevenLabsClient();

interface TranscribeRequest {
  audio: AudioEntry;
}

export interface ElevenLabsResponse {
  text: string;
  lang: string;
  audioId: string;
}

export default defineEventHandler(async (event: H3Event) => {
  const { audio } = await readBody<TranscribeRequest>(event);

  if (!audio) {
    return { error: "Missing audioId" };
  }

  try {
    // Get audio file from storage
    const audioEntry: AudioEntry = audio;
    if (audioEntry && audioEntry.file) {
      const audioBuffer: MultiPartData = audioEntry.file;

      let buffer: Buffer;

      if (
        audioBuffer.data &&
        typeof audioBuffer.data === "object" &&
        "data" in audioBuffer
      ) {
        buffer = Buffer.from(audioBuffer.data.data as number[]);
      } else if (Buffer.isBuffer(audioBuffer.data)) {
        buffer = audioBuffer.data;
      } else {
        buffer = Buffer.from(audioBuffer.data as any);
      }

      const blob: Blob = new Blob([buffer], {
        type: audioBuffer.type || "audio/mp3",
      });

      console.log("Blob created:", {
        size: blob.size,
        type: blob.type,
        originalFilename: audioBuffer.filename,
      });

      const transcription = (await elevenlabs.speechToText.convert({
        file: blob,
        modelId: "scribe_v1",
      })) as {
        languageCode?: string;
        languageProbability?: number;
        text: string;
        words: any[];
      };

      console.log({ transcription });

      return {
        text: transcription.text,
        lang: transcription.languageCode,
        audioId: audioEntry.id,
      } as ElevenLabsResponse;
    } else {
      return { error: "No audio file found in entry" };
    }
  } catch (error) {
    console.error(error);
  }
});
