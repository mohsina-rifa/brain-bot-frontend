<script setup lang="ts">
import type { Message, QnaMatch } from "@/types/api";

defineProps<{
  messages: Message[];
  pending?: string | null;
  failed?: string | null;
  thinking?: boolean;
  slow?: boolean;
  matches?: QnaMatch[];
  accent?: string;
}>();

defineEmits<{ retry: [] }>();
</script>

<template>
  <div class="bb-thread">
    <div
      v-for="(message, i) in messages"
      :key="i"
      class="bb-msg"
      :class="message.role === 'user' ? 'user' : 'bot'"
    >
      <div
        class="bb-msg-avatar"
        :style="
          message.role === 'bot' && accent
            ? { background: `color-mix(in srgb, ${accent} 18%, transparent)`, color: accent }
            : undefined
        "
      >
        {{ message.role === "user" ? "YOU" : "BOT" }}
      </div>

      <div class="bb-bubble">
        {{ message.content }}

        <details
          v-if="
            message.role === 'bot' &&
            i === messages.length - 1 &&
            matches &&
            matches.length
          "
          class="bb-matches"
        >
          <summary>
            Matched {{ matches.length }}
            {{ matches.length === 1 ? "entry" : "entries" }}
          </summary>
          <ul>
            <li v-for="m in matches" :key="m.id">
              <span class="bb-badge neutral">
                {{ (m.cosine_similarity * 100).toFixed(0) }}%
              </span>
              <span>{{ m.question }}</span>
            </li>
          </ul>
        </details>
      </div>
    </div>

    <div v-if="pending" class="bb-msg user" style="opacity: 0.7">
      <div class="bb-msg-avatar">YOU</div>
      <div class="bb-bubble">
        {{ pending }}<small>Sending…</small>
      </div>
    </div>

    <div v-if="failed" class="bb-msg user">
      <div class="bb-msg-avatar">YOU</div>
      <div class="bb-bubble bb-bubble-failed">
        {{ failed }}
        <small>Not sent</small>
        <button type="button" class="bb-btn bb-btn-danger" @click="$emit('retry')">
          Retry
        </button>
      </div>
    </div>

    <div v-if="thinking" class="bb-msg bot">
      <div class="bb-msg-avatar">BOT</div>
      <div class="bb-bubble bb-thinking">
        {{
          slow
            ? "Still thinking — the reply is taking longer than usual."
            : "Bot is thinking…"
        }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.bb-thread {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.bb-msg.user .bb-bubble.bb-bubble-failed {
  border-color: var(--bb-danger);
  background: var(--bb-danger-soft);
  color: var(--bb-danger);
}

.bb-msg.user .bb-bubble.bb-bubble-failed .bb-btn {
  margin-top: 10px;
}

.bb-msg.bot .bb-bubble.bb-thinking {
  color: var(--bb-muted);
  font-style: italic;
}

.bb-matches {
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px solid var(--bb-border);
  font-size: 11px;
}

.bb-matches summary {
  cursor: pointer;
  color: var(--bb-muted);
  font-weight: 700;
}

.bb-matches ul {
  list-style: none;
  margin: 8px 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.bb-matches li {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  color: var(--bb-muted);
}
</style>
