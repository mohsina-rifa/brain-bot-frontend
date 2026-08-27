<script setup lang="ts">
import type { Message } from "@/types/api";

defineProps<{
  messages: Message[];
  accent?: string;
}>();
</script>

<template>
  <div class="d-flex flex-column gap-3">
    <div
      v-for="(message, i) in messages"
      :key="i"
      class="d-flex"
      :class="message.role === 'user' ? 'justify-content-end' : 'justify-content-start'"
    >
      <div
        class="px-3 py-2 rounded-3 shadow-sm"
        style="max-width: min(42rem, 80%); white-space: pre-wrap"
        :class="message.role === 'user' ? 'text-bg-primary' : 'bg-body-tertiary border'"
        :style="
          message.role === 'bot' && accent
            ? { borderLeft: `3px solid ${accent}` }
            : undefined
        "
      >
        <div class="small fw-semibold mb-1 opacity-75">
          {{ message.role === "user" ? "You" : "Bot" }}
        </div>
        {{ message.content }}
      </div>
    </div>
  </div>
</template>
