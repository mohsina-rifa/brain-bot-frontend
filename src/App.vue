<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useRoute, RouterView } from "vue-router";
import { BButton } from "bootstrap-vue-next";
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

  // Send first, announce after: "back online" while three changes are still
  // going out would be the wrong half of the story.
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

/**
 * One banner, five things it might need to say. Kept as a single computed so
 * the states cannot overlap — an offline notice sitting under a "back online"
 * one is exactly the sort of double message this app avoids elsewhere.
 */
const notice = computed(() => {
  if (!online.value) {
    return {
      tone: "text-bg-warning",
      icon: "wifi-off",
      text: queue.count
        ? `You are offline. ${queue.count} ${plural(queue.count)} waiting to send.`
        : "You are offline. Edits you make now are held and sent when the connection is back.",
      retry: false,
    };
  }

  if (queue.flushing) {
    return {
      tone: "text-bg-info",
      icon: "arrow-repeat",
      text: `Sending ${queue.count} queued ${plural(queue.count)}…`,
      retry: false,
    };
  }

  // Online, but the flush stopped early. This one stays until it is resolved:
  // unsent work is not something to let scroll past on a four-second timer.
  if (queue.count) {
    return {
      tone: "text-bg-danger",
      icon: "exclamation-triangle",
      text: `${queue.count} ${plural(queue.count)} could not be sent.`,
      retry: true,
    };
  }

  if (queue.sent) {
    return {
      tone: "text-bg-success",
      icon: "check2",
      text: `Back online. ${queue.sent} ${plural(queue.sent)} sent.`,
      retry: false,
    };
  }

  return {
    tone: "text-bg-success",
    icon: "wifi",
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
    class="position-fixed top-0 start-50 translate-middle-x mt-2 px-3 py-2 rounded shadow-sm small d-flex align-items-center gap-2"
    :class="notice.tone"
    style="z-index: 1080; max-width: calc(100vw - 1.5rem)"
    role="status"
    aria-live="polite"
  >
    <i class="bi" :class="`bi-${notice.icon}`" />
    <span>{{ notice.text }}</span>
    <BButton
      v-if="notice.retry"
      size="sm"
      variant="light"
      class="py-0 flex-shrink-0"
      @click="queue.flush()"
    >
      Send now
    </BButton>
  </div>

  <ErrorBoundary v-if="isPublic">
    <RouterView />
  </ErrorBoundary>
  <AppShell v-else />
</template>
