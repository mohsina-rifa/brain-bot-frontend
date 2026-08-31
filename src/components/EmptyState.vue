<script setup lang="ts">
import { BButton, type ButtonVariant } from "bootstrap-vue-next";

type Illustration = "bots" | "qna" | "search";

withDefaults(
  defineProps<{
    icon?: string;
    illustration?: Illustration | null;
    title: string;
    description?: string;
    actionLabel?: string;
    actionVariant?: ButtonVariant;
  }>(),
  {
    icon: "inbox",
    illustration: null,
    description: "",
    actionLabel: "",
    actionVariant: "primary",
  },
);

const emit = defineEmits<{ action: [] }>();
</script>

<template>
  <div class="text-center border rounded empty-state">
    <svg
      v-if="illustration"
      class="empty-state-art"
      viewBox="0 0 96 72"
      fill="none"
      aria-hidden="true"
    >
      <template v-if="illustration === 'bots'">
        <rect
          x="26" y="22" width="44" height="34" rx="8"
          stroke="currentColor" stroke-width="2"
        />
        <path d="M48 22v-8" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
        <circle cx="48" cy="11" r="3.5" class="art-accent-stroke" stroke-width="2" />
        <circle cx="39" cy="38" r="3.5" class="art-accent-fill" />
        <circle cx="57" cy="38" r="3.5" class="art-accent-fill" />
        <path
          d="M41 47h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"
        />
        <path
          d="M26 36h-6M76 36h-6" stroke="currentColor" stroke-width="2"
          stroke-linecap="round" opacity=".5"
        />
      </template>

      <template v-else-if="illustration === 'qna'">
        <path
          d="M14 18a6 6 0 0 1 6-6h34a6 6 0 0 1 6 6v14a6 6 0 0 1-6 6H30l-10 8v-8a6 6 0 0 1-6-6z"
          stroke="currentColor" stroke-width="2" stroke-linejoin="round"
        />
        <path
          d="M26 22h20M26 29h12" stroke="currentColor" stroke-width="2"
          stroke-linecap="round" opacity=".55"
        />
        <path
          d="M82 40a6 6 0 0 0-6-6H50a6 6 0 0 0-6 6v10a6 6 0 0 0 6 6h16l10 8v-8a6 6 0 0 0 6-6z"
          class="art-accent-stroke art-occlude" stroke-width="2" stroke-linejoin="round"
        />
        <path
          d="M54 44h16M54 51h9" class="art-accent-stroke" stroke-width="2"
          stroke-linecap="round" opacity=".55"
        />
      </template>

      <template v-else>
        <rect
          x="20" y="10" width="40" height="52" rx="6"
          stroke="currentColor" stroke-width="2"
        />
        <path
          d="M30 24h20M30 33h20M30 42h12" stroke="currentColor" stroke-width="2"
          stroke-linecap="round" opacity=".5"
        />
        <circle cx="63" cy="45" r="14" class="art-accent-stroke" stroke-width="2" />
        <path
          d="M73 55l9 9" class="art-accent-stroke" stroke-width="2" stroke-linecap="round"
        />
      </template>
    </svg>

    <i
      v-else
      :class="`bi bi-${icon}`"
      class="fs-1 text-body-secondary d-block mb-2"
    />

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

<style scoped>
.empty-state {
  padding: 3rem 1.5rem;
}

.empty-state-art {
  display: block;
  width: 100%;
  max-width: 11rem;
  height: auto;
  margin: 0 auto 1rem;
  color: var(--bs-secondary-color);
}

.art-accent-stroke {
  stroke: var(--bs-primary);
  fill: none;
}

.art-occlude {
  fill: var(--bs-body-bg);
}

.art-accent-fill {
  fill: var(--bs-primary);
}
</style>
