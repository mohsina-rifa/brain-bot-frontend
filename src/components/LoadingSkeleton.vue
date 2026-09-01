<script setup lang="ts">
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
    <div class="bb-skeleton" aria-hidden="true">
      <div
        v-for="row in rows"
        :key="row"
        class="bb-skeleton-row"
        :class="row < rows && 'bb-skeleton-divided'"
      >
        <div
          v-for="column in columns"
          :key="column"
          class="bb-skeleton-cell"
          :style="{ flex: column === 1 ? 3 : 1 }"
        />
      </div>
    </div>

    <div v-if="slow" class="bb-skeleton-note">
      <p role="status" aria-live="polite">
        {{
          retrying
            ? "That did not go through. Trying again…"
            : "Still working — the server is taking longer than usual."
        }}
      </p>

      <button
        v-if="cancellable"
        type="button"
        class="bb-btn"
        @click="emit('cancel')"
      >
        Stop waiting
      </button>
    </div>

    <span class="visually-hidden" role="status">Loading</span>
  </div>
</template>

<style scoped>
.bb-skeleton {
  border: 1px solid var(--bb-border);
  border-radius: var(--bb-radius);
  overflow: hidden;
  background: var(--bb-surface);
}

.bb-skeleton-row {
  display: flex;
  gap: 14px;
  /* Matches the 14px/18px of a real .bb-table cell, so the rows do not shift
     height when data replaces the placeholder. */
  padding: 14px 18px;
}

.bb-skeleton-divided {
  border-bottom: 1px solid var(--bb-border);
}

.bb-skeleton-cell {
  height: 16px;
  border-radius: 6px;
  background: var(--bb-surface-3);
  animation: bb-skeleton-pulse 1.4s ease-in-out infinite;
}

@keyframes bb-skeleton-pulse {
  0%,
  100% {
    opacity: 0.45;
  }
  50% {
    opacity: 0.9;
  }
}

.bb-skeleton-note {
  text-align: center;
  margin-top: 14px;
}

.bb-skeleton-note p {
  margin: 0;
  color: var(--bb-muted);
  font-size: 12px;
}

.bb-skeleton-note .bb-btn {
  margin-top: 10px;
}

@media (prefers-reduced-motion: reduce) {
  .bb-skeleton-cell {
    animation: none;
    opacity: 0.6;
  }
}
</style>
