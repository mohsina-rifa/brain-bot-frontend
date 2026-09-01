<script setup lang="ts">
import { onErrorCaptured, ref, watch } from "vue";
import { RouterLink, useRoute } from "vue-router";

const error = ref<Error | null>(null);
const route = useRoute();

onErrorCaptured((err) => {
  error.value = err as Error;
  return false;
});

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
  <div v-if="error" class="bb-empty">
    <div>
      <div class="bb-empty-icon bb-error-icon">!</div>

      <h3>This screen ran into a problem</h3>
      <p>
        Something went wrong rendering this page. Nothing you had already saved
        is affected — reload, or pick another screen from the menu.
      </p>

      <div class="bb-error-actions">
        <button type="button" class="bb-btn bb-btn-primary" @click="reload">
          Reload the page
        </button>
        <RouterLink to="/bots" class="bb-btn">Go to bots</RouterLink>
      </div>

      <details v-if="error.message" class="bb-error-detail">
        <summary>Technical detail</summary>
        <pre>{{ error.message }}</pre>
      </details>
    </div>
  </div>

  <slot v-else />
</template>

<style scoped>
.bb-error-icon {
  background: var(--bb-danger-soft);
  color: var(--bb-danger);
  font-size: 26px;
  font-weight: 850;
}

.bb-error-actions {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-bottom: 18px;
}

.bb-error-detail {
  text-align: left;
  font-size: 12px;
}

.bb-error-detail summary {
  cursor: pointer;
  color: var(--bb-muted);
}

.bb-error-detail pre {
  margin: 10px 0 0;
  padding: 12px;
  background: var(--bb-surface-2);
  border: 1px solid var(--bb-border);
  border-radius: 12px;
  max-height: 12rem;
  overflow: auto;
  font-size: 11px;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
</style>
