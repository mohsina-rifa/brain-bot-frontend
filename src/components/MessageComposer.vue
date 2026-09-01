<script setup lang="ts">
import { ref } from "vue";

const props = defineProps<{ busy?: boolean }>();
const emit = defineEmits<{ send: [content: string] }>();

const text = ref("");

function submit() {
  const content = text.value.trim();
  if (!content || props.busy) return;
  emit("send", content);
  text.value = "";
}

function onKeydown(event: KeyboardEvent) {
  if (event.key !== "Enter" || event.shiftKey) return;
  event.preventDefault();
  submit();
}
</script>

<template>
  <form class="bb-composer" @submit.prevent="submit">
    <textarea
      v-model="text"
      rows="1"
      placeholder="Ask a test question..."
      aria-label="Message"
      :disabled="busy"
      @keydown="onKeydown"
    />
    <button
      type="submit"
      class="bb-btn bb-btn-primary"
      style="align-self: flex-end"
      :disabled="busy || !text.trim()"
    >
      {{ busy ? "Sending…" : "Send ↑" }}
    </button>
  </form>
</template>
