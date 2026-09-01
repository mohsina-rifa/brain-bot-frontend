<script setup lang="ts">
import { BModal } from "bootstrap-vue-next";

const show = defineModel<boolean>({ default: false });

withDefaults(
  defineProps<{
    title?: string;
    subtitle?: string;
    message?: string;
    confirmLabel?: string;
    variant?: "danger" | "primary";
    busy?: boolean;
    slow?: boolean;
  }>(),
  {
    title: "Are you sure?",
    subtitle: "",
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
  <BModal v-model="show" :no-close-on-backdrop="busy" scrollable>
    <template #header>
      <div class="bb-modal-title">
        <h3>{{ title }}</h3>
        <p v-if="subtitle">{{ subtitle }}</p>
      </div>
      <button
        type="button"
        class="bb-icon-btn"
        aria-label="Close"
        :disabled="busy"
        @click="show = false"
      >
        ×
      </button>
    </template>

    <slot>{{ message }}</slot>

    <div v-if="busy && slow" class="bb-notice" style="margin-top: 16px">
      Still working. The server is taking longer than usual — this is still
      going, so leave the dialog open.
    </div>

    <template #footer>
      <button type="button" class="bb-btn" :disabled="busy" @click="show = false">
        Cancel
      </button>
      <button
        type="button"
        class="bb-btn"
        :class="variant === 'danger' ? 'bb-btn-danger' : 'bb-btn-primary'"
        :disabled="busy"
        @click="emit('confirm')"
      >
        {{ busy ? "Working…" : confirmLabel }}
      </button>
    </template>
  </BModal>
</template>
