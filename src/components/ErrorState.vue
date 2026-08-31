<script setup lang="ts">
import { BAlert, BButton } from "bootstrap-vue-next";

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
  <BAlert
    :model-value="true"
    variant="danger"
    class="d-flex justify-content-between align-items-center gap-3"
  >
    <span>{{ message }}</span>
    <BButton
      variant="outline-danger"
      size="sm"
      class="flex-shrink-0"
      :disabled="busy"
      @click="emit('retry')"
    >
      {{ actionLabel }}
    </BButton>
  </BAlert>
</template>
