<script setup lang="ts">
import { BModal, BButton, BSpinner } from "bootstrap-vue-next";

const show = defineModel<boolean>({ default: false });

withDefaults(
  defineProps<{
    title?: string;
    message?: string;
    confirmLabel?: string;
    variant?: "danger" | "primary";
    busy?: boolean;
  }>(),
  {
    title: "Are you sure?",
    message: "",
    confirmLabel: "Confirm",
    variant: "danger",
    busy: false,
  },
);

const emit = defineEmits<{ confirm: [] }>();
</script>

<template>
  <BModal v-model="show" :title="title" :no-close-on-backdrop="busy">
    <p class="mb-0">
      <slot>{{ message }}</slot>
    </p>

    <template #footer>
      <BButton
        variant="outline-secondary"
        :disabled="busy"
        @click="show = false"
      >
        Cancel
      </BButton>
      <BButton :variant="variant" :disabled="busy" @click="emit('confirm')">
        <BSpinner v-if="busy" small class="me-2" />
        {{ confirmLabel }}
      </BButton>
    </template>
  </BModal>
</template>
