<script setup lang="ts">
withDefaults(
  defineProps<{
    message: string;
    busy?: boolean;
    actionLabel?: string;
  }>(),
  { busy: false, actionLabel: "Retry" },
);

const emit = defineEmits<{ retry: [] }>();
</script>

<template>
  <div
    class="bb-notice danger bb-error-state"
    role="alert"
  >
    <span>{{ message }}</span>
    <button
      type="button"
      class="bb-btn bb-btn-danger"
      :disabled="busy"
      @click="emit('retry')"
    >
      {{ actionLabel }}
    </button>
  </div>
</template>

<style scoped>
.bb-error-state {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}

.bb-error-state .bb-btn {
  flex-shrink: 0;
}
</style>
