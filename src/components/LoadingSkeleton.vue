<script setup lang="ts">
withDefaults(
  defineProps<{
    rows?: number;
    columns?: number;
    slow?: boolean;
    retrying?: boolean;
  }>(),
  { rows: 5, columns: 4, slow: false, retrying: false },
);
</script>

<template>
  <div>
    <div class="border rounded overflow-hidden" aria-hidden="true">
      <div
        v-for="row in rows"
        :key="row"
        class="d-flex gap-3 px-3 py-3"
        :class="row < rows && 'border-bottom'"
      >
        <div
          v-for="column in columns"
          :key="column"
          class="skeleton-cell rounded"
          :style="{ flex: column === 1 ? 3 : 1 }"
        />
      </div>
    </div>

    <p
      v-if="slow"
      class="text-body-secondary small mt-3 mb-0 text-center"
      role="status"
      aria-live="polite"
    >
      {{
        retrying
          ? "That did not go through. Trying again…"
          : "Still working — the server is taking longer than usual."
      }}
    </p>

    <span class="visually-hidden" role="status">Loading</span>
  </div>
</template>

<style scoped>
.skeleton-cell {
  height: 1rem;
  background: var(--bs-secondary-bg);
  animation: skeleton-pulse 1.4s ease-in-out infinite;
}

@keyframes skeleton-pulse {
  0%,
  100% {
    opacity: 0.45;
  }
  50% {
    opacity: 0.9;
  }
}

@media (prefers-reduced-motion: reduce) {
  .skeleton-cell {
    animation: none;
    opacity: 0.6;
  }
}
</style>
