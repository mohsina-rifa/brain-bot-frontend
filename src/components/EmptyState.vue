<script setup lang="ts">
import { computed } from "vue";
import type { ButtonVariant } from "bootstrap-vue-next";

type Illustration = "bots" | "qna" | "search";

const props = withDefaults(
  defineProps<{
    icon?: string;
    illustration?: Illustration | null;
    title: string;
    description?: string;
    actionLabel?: string;
    actionVariant?: ButtonVariant;
    /** Drop the card chrome when the empty state already sits inside a card. */
    flush?: boolean;
  }>(),
  {
    icon: "inbox",
    illustration: null,
    description: "",
    actionLabel: "",
    actionVariant: "primary",
    flush: false,
  },
);

const emit = defineEmits<{ action: [] }>();

/*
 * The prototype's empty state is a single tinted tile rather than a drawing, so
 * the three illustrations collapse to the glyph that best stands for each. The
 * prop stays in place — every call site keeps working unchanged.
 */
const glyph = computed(() => {
  switch (props.illustration) {
    case "bots":
      return "🤖";
    case "qna":
      return "⌁";
    case "search":
      return "⌕";
    default:
      return null;
  }
});
</script>

<template>
  <div class="bb-empty" :class="!flush && 'bb-card'">
    <div>
      <div class="bb-empty-icon">
        <span v-if="glyph">{{ glyph }}</span>
        <i v-else :class="`bi bi-${icon}`" aria-hidden="true" />
      </div>

      <h3>{{ title }}</h3>
      <p v-if="description || $slots.default">
        <slot>{{ description }}</slot>
      </p>

      <button
        v-if="actionLabel"
        type="button"
        class="bb-btn"
        :class="actionVariant === 'primary' && 'bb-btn-primary'"
        @click="emit('action')"
      >
        {{ actionLabel }}
      </button>
    </div>
  </div>
</template>
