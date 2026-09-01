<script setup lang="ts">
import { ref, watch } from "vue";
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
    if (next !== text.value.trim()) text.value = next;
  },
);

const debounced = useDebouncedCallback(
  (term: string) => emit("search", term),
  300,
);

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
  <div class="bb-toolbar" style="width: 100%">
    <div class="bb-input-wrap">
      <span class="bb-search-icon">{{ searching ? "◌" : "⌕" }}</span>
      <input
        :value="text"
        class="bb-input search"
        type="search"
        placeholder="Search questions or answers..."
        aria-label="Search Q&amp;A content"
        @input="onInput(($event.target as HTMLInputElement).value)"
      />
    </div>
    <button v-if="text" type="button" class="bb-btn" @click="clear">
      Clear
    </button>
  </div>
</template>
