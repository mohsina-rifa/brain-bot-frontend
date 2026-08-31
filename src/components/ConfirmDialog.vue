<script setup lang="ts">
import { BModal, BButton, BSpinner, BAlert } from "bootstrap-vue-next";

const show = defineModel<boolean>({ default: false });

withDefaults(
  defineProps<{
    title?: string;
    message?: string;
    confirmLabel?: string;
    variant?: "danger" | "primary";
    busy?: boolean;
    slow?: boolean;
  }>(),
  {
    title: "Are you sure?",
    message: "",
    confirmLabel: "Confirm",
    variant: "danger",
    busy: false,
    slow: false,
  },
);

const emit = defineEmits<{ confirm: [] }>();
</script>

<template>
  <BModal v-model="show" :title="title" :no-close-on-backdrop="busy" scrollable>
    <div class="mb-0">
      <slot>{{ message }}</slot>
    </div>

    <BAlert
      v-if="busy && slow"
      :model-value="true"
      variant="info"
      class="mt-3 mb-0 d-flex align-items-center gap-2"
    >
      <BSpinner small />
      <span>Still working. The server is taking longer than usual — this is
        still going, so leave the dialog open.</span>
    </BAlert>

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
