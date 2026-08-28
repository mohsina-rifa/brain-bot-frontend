<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useRoute, RouterView } from "vue-router";
import AppShell from "@/components/AppShell.vue";
import { useOnline } from "@/composables/useOnline";

const route = useRoute();

const isPublic = computed(() => Boolean(route.meta.public));

const online = useOnline();
const reconnected = ref(false);

let clearReconnected: ReturnType<typeof setTimeout> | null = null;

watch(online, (isOnline, wasOnline) => {
  if (!isOnline || wasOnline !== false) return;
  reconnected.value = true;
  if (clearReconnected) clearTimeout(clearReconnected);
  clearReconnected = setTimeout(() => {
    reconnected.value = false;
  }, 4000);
});
</script>

<template>
  <div
    v-if="!online || reconnected"
    class="position-fixed top-0 start-50 translate-middle-x mt-2 px-3 py-2 rounded shadow-sm small d-flex align-items-center gap-2"
    :class="online ? 'text-bg-success' : 'text-bg-warning'"
    style="z-index: 1080; max-width: calc(100vw - 1.5rem)"
    role="status"
    aria-live="polite"
  >
    <template v-if="online">
      <i class="bi bi-wifi" />
      <span>Back online. Retry anything that failed.</span>
    </template>
    <template v-else>
      <i class="bi bi-wifi-off" />
      <span>
        You are offline. Changes will not save until the connection is back.
      </span>
    </template>
  </div>

  <RouterView v-if="isPublic" />
  <AppShell v-else />
</template>
