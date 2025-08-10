<template>
  <main>
    <h1>Voice Diary</h1>
    <section class="m-8 border space-y-6 p-6">
      <h2>Upload Audio</h2>
      <div class="flex gap-2 items-center">
        <input
          type="file"
          @change="handleFileUpload"
          accept="audio/*"
          ref="fileInput"
        />
        <button class="border" @click="uploadAudio" :disabled="!audioFile">
          Upload Voice Note
        </button>
      </div>
    </section>

    <section class="m-8 border space-y-6 p-6">
      <h2>Audio Entries</h2>
      <ul>
        <li
          v-for="entry in audioEntries"
          :key="`audio-entry-${entry.id}`"
          class="flex gap-2 items-center"
        >
          <span>{{ entry.file.filename }}</span>
          <button class="border p-2" @click="() => transcribleAudio(entry)">
            Transcrible this audio entry
          </button>
        </li>
      </ul>
    </section>

    <section class="m-8 border space-y-6 p-6">
      <h2>Transcribed Text</h2>
      <p class="font-serif">{{ transcribedText }}</p>
    </section>
  </main>
</template>

<script setup lang="ts">
import type { ElevenLabsResponse } from "~~/server/api/transcribe.post";
import { type AudioEntry, getAudioEntries } from "../server/api/audioStorage";

const audioFile = ref<File | null>(null);

const audioEntries = ref<AudioEntry[]>([]);

const transcribedText = ref<string>("");

interface FileUploadEvent extends Event {
  target: HTMLInputElement;
}

const handleFileUpload = (event: FileUploadEvent) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    audioFile.value = target.files[0];
  }
};

const uploadAudio = async () => {
  const formData = new FormData();
  if (audioFile.value) {
    try {
      formData.append("audio", audioFile.value);

      const data = await $fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      console.log(data);
    } catch (error) {
      console.log("Upload failed", error);
    }
  }
};

const transcribleAudio = async (audio: AudioEntry) => {
  try {
    const transcribeResult: ElevenLabsResponse = await $fetch(
      "/api/transcribe",
      {
        method: "POST",
        body: {
          audio,
        },
      }
    );

    transcribedText.value = transcribeResult.text;

    console.log({ transcribeResult });
  } catch (error) {
    console.error(error);
  }
};

onMounted(async () => {
  try {
    const entriesFetched = await useFetch("/api/audioEntries");

    if (entriesFetched.data.value) {
      audioEntries.value = entriesFetched.data.value;
    }
  } catch (error) {
    console.error(error);
  }
});
</script>

<style lang="scss">
@import "./assets/css/tailwind.css";
</style>
