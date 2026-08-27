<script setup lang="ts">
import { ref } from "vue";
import { BButton, BFormTextarea, BSpinner } from "bootstrap-vue-next";

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
  <form class="d-flex gap-2 align-items-end" @submit.prevent="submit">
    <BFormTextarea
      v-model="text"
      rows="1"
      max-rows="5"
      placeholder="Ask this bot something…"
      aria-label="Message"
      :disabled="busy"
      @keydown="onKeydown"
    />
    <BButton type="submit" variant="primary" :disabled="busy || !text.trim()">
      <BSpinner v-if="busy" small />
      <i v-else class="bi bi-send" />
      <span class="visually-hidden">Send</span>
    </BButton>
  </form>
</template>
