<script setup lang="ts">
import { computed, nextTick, ref, toRef, watch } from "vue";
import { BAlert, BButton } from "bootstrap-vue-next";
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
  if (!messages.length && !failed && !pending) {
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
</script>

<template>
  <div
    class="container-fluid py-4 px-4 d-flex flex-column"
    style="min-height: 0"
  >
    <div class="d-flex justify-content-between align-items-start mb-3">
      <div>
        <h1 class="h4 mb-1">Playground</h1>
        <p class="text-body-secondary mb-0">
          {{ activeBot.bot?.name ?? "Bot" }} · answers come from this bot's
          knowledge base
        </p>
      </div>
      <BButton
        variant="outline-secondary"
        :disabled="!started || sending"
        @click="requestReset"
      >
        <i class="bi bi-arrow-counterclockwise me-1" />Reset
      </BButton>
    </div>

    <div
      ref="panel"
      class="border rounded p-3 mb-3"
      style="
        min-height: 24rem;
        max-height: calc(100vh - 22rem);
        overflow-y: auto;
      "
    >
      <template v-if="!messages.length && !pending && !failed">
        <MessageThread
          v-if="welcome.length"
          :messages="welcome"
          :accent="activeBot.bot?.color"
        />
        <p
          class="text-body-secondary small mb-0"
          :class="welcome.length && 'mt-3'"
        >
          Ask anything this bot should be able to answer. Replies come from its
          Q&amp;A content, so this is a real test of the knowledge base.
        </p>
      </template>
      <MessageThread
        v-else
        :messages="messages"
        :accent="activeBot.bot?.color"
        :pending="pending"
        :failed="failed"
        :thinking="sending"
        :matches="matches"
        @retry="retry"
      />
    </div>

    <BAlert
      v-if="error"
      :model-value="true"
      variant="danger"
      class="mb-3 d-flex justify-content-between align-items-center gap-3"
    >
      <span>{{ error }}</span>
      <BButton
        variant="outline-danger"
        size="sm"
        class="flex-shrink-0"
        :disabled="sending"
        @click="retry"
      >
        Retry
      </BButton>
    </BAlert>

    <MessageComposer :busy="sending" @send="send" />

    <ConfirmDialog
      v-model="confirmingReset"
      title="Reset conversation"
      confirm-label="Start fresh"
      variant="primary"
      @confirm="confirmReset"
    >
      Clear this thread and start a new conversation? The previous one is kept on
      the server, but it will not be shown here again.
    </ConfirmDialog>
  </div>
</template>
