<script setup lang="ts">
import { computed, nextTick, ref, toRef, watch } from "vue";
import { useConversation } from "@/composables/useConversation";
import { useActiveBotStore } from "@/stores/activeBot";
import MessageThread from "@/components/MessageThread.vue";
import MessageComposer from "@/components/MessageComposer.vue";
import ConfirmDialog from "@/components/ConfirmDialog.vue";
import type { Message } from "@/types/api";

const props = defineProps<{ id: string }>();

const activeBot = useActiveBotStore();
const {
  messages,
  started,
  sending,
  slow,
  error,
  failed,
  pending,
  matches,
  send,
  retry,
  reset,
} = useConversation(toRef(props, "id"));

watch(() => props.id, reset);

const panel = ref<HTMLElement | null>(null);

watch([() => messages.value.length, pending, failed, sending], async () => {
  await nextTick();
  const el = panel.value;
  if (el) el.scrollTop = el.scrollHeight;
});

const confirmingReset = ref(false);

function requestReset() {
  if (!messages.value.length && !failed.value && !pending.value) {
    reset();
    return;
  }
  confirmingReset.value = true;
}

function confirmReset() {
  reset();
  confirmingReset.value = false;
}

const welcome = computed<Message[]>(() => {
  const text = activeBot.bot?.welcomeMessage?.trim();
  return text ? [{ role: "bot", content: text }] : [];
});

const suggestion = computed(
  () =>
    activeBot.bot?.suggestionMessage?.trim() ||
    "Ask anything this bot should be able to answer. Replies come from its Q&A content, so this is a real test of the knowledge base.",
);

function initials(name?: string | null) {
  if (!name) return "??";
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0])
      .join("")
      .toUpperCase() || "?"
  );
}
</script>

<template>
  <div>
    <section class="bb-page-head">
      <div>
        <h1>Chatbot playground</h1>
        <p>
          Test the current knowledge base exactly as an end user would
          experience it.
        </p>
      </div>
      <div class="bb-page-actions">
        <button
          type="button"
          class="bb-btn"
          :disabled="!started || sending"
          @click="requestReset"
        >
          ↻ Reset conversation
        </button>
      </div>
    </section>

    <div
      v-if="activeBot.error"
      class="bb-notice warning bb-inline-notice"
      role="alert"
    >
      <span>
        {{ activeBot.error }} You can still chat, but this bot's welcome message
        and branding are not showing.
      </span>
      <button
        type="button"
        class="bb-btn"
        :disabled="activeBot.loading"
        @click="activeBot.retry"
      >
        Retry
      </button>
    </div>

    <section class="bb-chat-layout">
      <div class="bb-card bb-chat-panel">
        <div class="bb-chat-head">
          <div class="bb-chat-head-meta">
            <div
              class="bb-bot-icon bb-chat-icon"
              :style="{ '--bb-bot-color': activeBot.bot?.color ?? undefined }"
            >
              {{ initials(activeBot.bot?.name) }}
            </div>
            <div>
              <strong class="bb-chat-name">{{
                activeBot.bot?.name ?? "Bot"
              }}</strong>
              <span class="bb-chat-sub">
                Answers come from this bot's knowledge base
              </span>
            </div>
          </div>
          <span
            class="bb-badge"
            :class="activeBot.bot?.status === 'inactive' ? 'neutral' : 'success'"
          >
            <span class="bb-dot"></span>
            {{
              activeBot.bot?.status === "inactive"
                ? "Inactive"
                : "Knowledge ready"
            }}
          </span>
        </div>

        <div ref="panel" class="bb-chat-messages">
          <template v-if="!messages.length && !pending && !failed">
            <MessageThread
              v-if="welcome.length"
              :messages="welcome"
              :accent="activeBot.bot?.color"
            />
            <p class="bb-chat-hint">{{ suggestion }}</p>
          </template>

          <MessageThread
            v-else
            :messages="messages"
            :accent="activeBot.bot?.color"
            :pending="pending"
            :failed="failed"
            :thinking="sending"
            :slow="slow"
            :matches="matches"
            @retry="retry"
          />
        </div>

        <div v-if="error" class="bb-notice danger bb-chat-error" role="alert">
          <span>{{ error }}</span>
          <button
            type="button"
            class="bb-btn bb-btn-danger"
            :disabled="sending"
            @click="retry"
          >
            Retry
          </button>
        </div>

        <MessageComposer :busy="sending" @send="send" />
      </div>
    </section>

    <ConfirmDialog
      v-model="confirmingReset"
      title="Reset conversation?"
      subtitle="Start a clean test session for this bot."
      confirm-label="Reset conversation"
      variant="primary"
      @confirm="confirmReset"
    >
      <div class="bb-notice">
        The current test thread will be cleared from this playground view and a
        new conversation will begin. The previous one is kept on the server, but
        it will not be shown here again.
      </div>
    </ConfirmDialog>
  </div>
</template>

<style scoped>
.bb-inline-notice {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 16px;
}

.bb-inline-notice .bb-btn {
  flex-shrink: 0;
}

.bb-chat-icon {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  font-size: 12px;
}

.bb-chat-name {
  display: block;
  font-size: 13px;
}

.bb-chat-sub {
  font-size: 11px;
  color: var(--bb-muted);
}

.bb-chat-hint {
  margin: 14px 0 0;
  color: var(--bb-muted);
  font-size: 12px;
}

.bb-chat-error {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  margin: 0;
  border-radius: 0;
  border-left: 0;
  border-right: 0;
}

.bb-chat-error .bb-btn {
  flex-shrink: 0;
}
</style>
