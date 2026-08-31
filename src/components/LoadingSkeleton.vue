<script setup lang="ts">
import { BButton } from "bootstrap-vue-next";

withDefaults(
  defineProps<{
    rows?: number;
    columns?: number;
    slow?: boolean;
    retrying?: boolean;
    cancellable?: boolean;
  }>(),
  {
    rows: 5,
    columns: 4,
    slow: false,
    retrying: false,
    cancellable: false,
  },
);

const emit = defineEmits<{ cancel: [] }>();
</script>

<template>
  <div>
    <div class="border rounded overflow-hidden" aria-hidden="true">
      <div
        v-for="row in rows"
        :key="row"
        class="d-flex gap-3 skeleton-row"
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

    <div v-if="slow" class="text-center mt-3">
      <p
        class="text-body-secondary small mb-0"
        role="status"
        aria-live="polite"
      >
        {{
          retrying
            ? "That did not go through. Trying again…"
            : "Still working — the server is taking longer than usual."
        }}
      </p>

      <BButton
        v-if="cancellable"
        size="sm"
        variant="outline-secondary"
        class="mt-2"
        @click="emit('cancel')"
      >
        Stop waiting
      </BButton>
    </div>

    <span class="visually-hidden" role="status">Loading</span>
  </div>
</template>

<style scoped>
.skeleton-row {
  padding: 1rem 0.75rem;
}

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
.skeleton-row {
  padding: 1rem 0.75rem;
}

.skeleton-cell {
    animation: none;
    opacity: 0.6;
  }
}
</style>
