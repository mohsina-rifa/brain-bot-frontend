<script setup lang="ts">
import { BButton, type ButtonVariant } from "bootstrap-vue-next";

withDefaults(
  defineProps<{
    icon?: string;
    title: string;
    description?: string;
    actionLabel?: string;
    actionVariant?: ButtonVariant;
  }>(),
  {
    icon: "inbox",
    description: "",
    actionLabel: "",
    actionVariant: "primary",
  },
);

const emit = defineEmits<{ action: [] }>();
</script>

<template>
  <div class="text-center border rounded py-5 px-3">
    <i :class="`bi bi-${icon}`" class="fs-1 text-body-secondary d-block mb-2" />
    <p class="fw-semibold mb-1">{{ title }}</p>
    <p v-if="description || $slots.default" class="text-body-secondary mb-3">
      <slot>{{ description }}</slot>
    </p>
    <BButton
      v-if="actionLabel"
      :variant="actionVariant"
      @click="emit('action')"
    >
      {{ actionLabel }}
    </BButton>
  </div>
</template>
