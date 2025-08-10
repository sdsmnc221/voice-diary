import type { H3Event } from "h3";
import { saveAudioEntry } from "./audioStorage";

export default defineEventHandler(async (event: H3Event) => {
  const form = await readMultipartFormData(event);

  if (!form) {
    return { success: false, error: "No form data received" };
  }

  const audioFile = form.find((field) => field.name === "audio");

  // Store in Vercel Blob
  if (audioFile) {
    try {
      const audioId = Date.now().toString();

      const uploadAudioData = await saveAudioEntry({
        id: audioId,
        timestamp: audioId,
        file: audioFile,
      });

      return { success: true, uploadAudioData };
    } catch (error) {
      console.error("Fail to store", error);
    }
  }
});
