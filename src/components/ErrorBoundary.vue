<script setup lang="ts">
import { onErrorCaptured, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { BButton } from "bootstrap-vue-next";

/**
 * The last line of defence.
 *
 * Everything else in this app handles failures it expected — a request that
 * 500s, a list that comes back empty. This catches the one it did not: a bug in
 * a component, thrown while rendering. Without it Vue tears the tree down and
 * the operator is left staring at a blank white page with no way back.
 */
const error = ref<Error | null>(null);
const route = useRoute();

onErrorCaptured((err) => {
  error.value = err as Error;
  // Stop here rather than letting it climb. Vue's dev overlay would otherwise
  // cover the recovery screen we just rendered, and in production nothing above
  // this could do anything more useful with it.
  return false;
});

// Navigating away is itself a recovery: the broken screen is gone, so the
// fallback should be too. Without this the whole shell stays stuck.
watch(
  () => route.fullPath,
  () => {
    error.value = null;
  },
);

function reload() {
  window.location.reload();
}
</script>

<template>
  <div
    v-if="error"
    class="container-fluid py-5 px-4 d-flex justify-content-center"
  >
    <div class="text-center" style="max-width: 32rem">
      <i class="bi bi-exclamation-octagon fs-1 text-danger d-block mb-3" />
      <h1 class="h5 mb-2">This screen ran into a problem</h1>
      <p class="text-body-secondary">
        Something went wrong rendering this page. Nothing you had already saved
        is affected — reload, or pick another screen from the menu.
      </p>

      <div class="d-flex gap-2 justify-content-center mb-3">
        <BButton variant="primary" @click="reload">Reload the page</BButton>
        <BButton variant="outline-secondary" to="/bots">Go to bots</BButton>
      </div>

      <!-- Kept visible on purpose: an operator reporting this is far more use
           to whoever fixes it with the message in hand than without. -->
      <details v-if="error.message" class="text-start small">
        <summary class="text-body-secondary">Technical detail</summary>
        <pre
          class="mt-2 p-2 bg-body-tertiary border rounded overflow-auto mb-0"
          style="max-height: 12rem"
          >{{ error.message }}</pre
        >
      </details>
    </div>
  </div>

  <slot v-else />
</template>
