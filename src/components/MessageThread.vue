<script setup lang="ts">
import { BButton, BSpinner } from "bootstrap-vue-next";
import type { Message, QnaMatch } from "@/types/api";

defineProps<{
  messages: Message[];
  pending?: string | null;
  failed?: string | null;
  thinking?: boolean;
  matches?: QnaMatch[];
  accent?: string;
}>();

defineEmits<{ retry: [] }>();
</script>

<template>
  <div class="d-flex flex-column gap-3">
    <div
      v-for="(message, i) in messages"
      :key="i"
      class="d-flex"
      :class="
        message.role === 'user'
          ? 'justify-content-end'
          : 'justify-content-start'
      "
    >
      <div
        class="px-3 py-2 rounded-3 shadow-sm"
        style="max-width: min(42rem, 80%); white-space: pre-wrap"
        :class="
          message.role === 'user'
            ? 'text-bg-primary'
            : 'bg-body-tertiary border'
        "
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

        <details
          v-if="
            message.role === 'bot' &&
            i === messages.length - 1 &&
            matches &&
            matches.length
          "
          class="mt-2 pt-2 border-top small"
        >
          <summary class="text-body-secondary" style="cursor: pointer">
            Matched {{ matches.length }}
            {{ matches.length === 1 ? "entry" : "entries" }}
          </summary>
          <ul class="list-unstyled mb-0 mt-2 d-flex flex-column gap-1">
            <li v-for="m in matches" :key="m.id" class="d-flex gap-2">
              <span class="badge text-bg-secondary flex-shrink-0">
                {{ (m.cosine_similarity * 100).toFixed(0) }}%
              </span>
              <span class="text-body-secondary">{{ m.question }}</span>
            </li>
          </ul>
        </details>
      </div>
    </div>

    <div v-if="pending" class="d-flex justify-content-end">
      <div
        class="px-3 py-2 rounded-3 shadow-sm text-bg-primary opacity-75"
        style="max-width: min(42rem, 80%); white-space: pre-wrap"
      >
        <div class="small fw-semibold mb-1 opacity-75">You</div>
        {{ pending }}
      </div>
    </div>

    <div v-if="failed" class="d-flex justify-content-end">
      <div
        class="px-3 py-2 rounded-3 border border-danger"
        style="max-width: min(42rem, 80%); white-space: pre-wrap"
      >
        <div class="small fw-semibold mb-1 text-danger">Not sent</div>
        {{ failed }}
        <div class="mt-2">
          <BButton size="sm" variant="outline-danger" @click="$emit('retry')">
            Retry
          </BButton>
        </div>
      </div>
    </div>

    <div v-if="thinking" class="d-flex justify-content-start">
      <div
        class="px-3 py-2 rounded-3 bg-body-tertiary border d-flex align-items-center gap-2"
      >
        <BSpinner small />
        <span class="small text-body-secondary">Bot is thinking…</span>
      </div>
    </div>
  </div>
</template>
