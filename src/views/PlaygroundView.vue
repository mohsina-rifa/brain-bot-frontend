<script setup lang="ts">
import { toRef, watch } from "vue";
import { BAlert, BButton } from "bootstrap-vue-next";
import { useConversation } from "@/composables/useConversation";
import { useActiveBotStore } from "@/stores/activeBot";
import MessageThread from "@/components/MessageThread.vue";
import MessageComposer from "@/components/MessageComposer.vue";

// `props: true` on /bots/:id/playground, so the bot id arrives as a prop.
const props = defineProps<{ id: string }>();

const activeBot = useActiveBotStore();
const { messages, started, sending, error, send, retry, reset } = useConversation(
  toRef(props, "id"),
);

// Switching bots mid-thread must not carry the old conversation across —
// a conversation belongs to exactly one bot.
watch(() => props.id, reset);
</script>

<template>
  <div class="container-fluid py-4 px-4 d-flex flex-column" style="min-height: 0">
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
        @click="reset"
      >
        <i class="bi bi-arrow-counterclockwise me-1" />Reset
      </BButton>
    </div>

    <div class="border rounded p-3 mb-3" style="min-height: 24rem">
      <p v-if="!messages.length" class="text-body-secondary mb-0">
        Send a question to start testing this bot.
      </p>
      <MessageThread
        v-else
        :messages="messages"
        :accent="activeBot.bot?.color"
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
  </div>
</template>
