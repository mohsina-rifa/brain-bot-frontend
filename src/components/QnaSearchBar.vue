<script setup lang="ts">
import { ref, watch } from "vue";
import { BButton, BFormInput, BSpinner } from "bootstrap-vue-next";
import { useDebouncedCallback } from "@/composables/useDebounce";

const props = withDefaults(
  defineProps<{
    initial?: string;
    searching?: boolean;
  }>(),
  { initial: "", searching: false },
);

const emit = defineEmits<{ search: [term: string] }>();

const text = ref(props.initial);

watch(
  () => props.initial,
  (next) => {
    if (next !== text.value) text.value = next;
  },
);

const debounced = useDebouncedCallback((term: string) => emit("search", term), 300);

function onInput(value: string) {
  text.value = value;
  debounced.invoke(value.trim());
}

function clear() {
  text.value = "";
  debounced.flush("");
}
</script>

<template>
  <div class="input-group" style="max-width: 28rem">
    <span class="input-group-text bg-body">
      <BSpinner v-if="searching" small />
      <i v-else class="bi bi-search" />
    </span>
    <BFormInput
      :model-value="text"
      type="search"
      placeholder="Search questions and answers"
      aria-label="Search Q&amp;A content"
      @update:model-value="(v: unknown) => onInput(String(v ?? ''))"
    />
    <BButton
      v-if="text"
      variant="outline-secondary"
      aria-label="Clear search"
      @click="clear"
    >
      Clear
    </BButton>
  </div>
</template>
