<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useRoute, RouterView } from "vue-router";
import AppShell from "@/components/AppShell.vue";
import ErrorBoundary from "@/components/ErrorBoundary.vue";
import { useOnline } from "@/composables/useOnline";
import { useWriteQueueStore } from "@/stores/writeQueue";

const route = useRoute();

const isPublic = computed(() => Boolean(route.meta.public));

const online = useOnline();
const queue = useWriteQueueStore();

const reconnected = ref(false);

let clearReconnected: ReturnType<typeof setTimeout> | null = null;

watch(online, async (isOnline, wasOnline) => {
  if (!isOnline || wasOnline !== false) return;

  if (queue.pending) await queue.flush();

  reconnected.value = true;
  if (clearReconnected) clearTimeout(clearReconnected);
  clearReconnected = setTimeout(() => {
    reconnected.value = false;
  }, 4000);
});

function plural(n: number) {
  return n === 1 ? "change" : "changes";
}

const notice = computed(() => {
  if (!online.value) {
    return {
      tone: "warning",
      text: queue.count
        ? `You are offline. ${queue.count} ${plural(queue.count)} waiting to send.`
        : "You are offline. Edits you make now are held and sent when the connection is back.",
      retry: false,
    };
  }

  if (queue.flushing) {
    return {
      tone: "",
      text: `Sending ${queue.count} queued ${plural(queue.count)}…`,
      retry: false,
    };
  }

  if (queue.count) {
    return {
      tone: "danger",
      text: `${queue.count} ${plural(queue.count)} could not be sent.`,
      retry: true,
    };
  }

  if (queue.sent) {
    return {
      tone: "success",
      text: `Back online. ${queue.sent} ${plural(queue.sent)} sent.`,
      retry: false,
    };
  }

  return {
    tone: "success",
    text: "Back online. Retry anything that failed.",
    retry: false,
  };
});

const showNotice = computed(
  () => !online.value || reconnected.value || queue.pending || queue.flushing,
);
</script>

<template>
  <div
    v-if="showNotice"
    class="bb-notice bb-connection-notice"
    :class="notice.tone"
    role="status"
    aria-live="polite"
  >
    <span>{{ notice.text }}</span>
    <button
      v-if="notice.retry"
      type="button"
      class="bb-btn"
      @click="queue.flush()"
    >
      Send now
    </button>
  </div>

  <ErrorBoundary v-if="isPublic">
    <RouterView />
  </ErrorBoundary>
  <AppShell v-else />
</template>

<style scoped>
/*
 * Pinned above everything, including the sticky topbar (z-index 20) and an open
 * modal, so losing the connection is visible even mid-dialog.
 */
.bb-connection-notice {
  position: fixed;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1080;
  max-width: calc(100vw - 24px);
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: var(--bb-shadow-sm);
  font-weight: 700;
}

.bb-connection-notice .bb-btn {
  flex-shrink: 0;
  min-height: 30px;
  padding: 4px 10px;
}
</style>
