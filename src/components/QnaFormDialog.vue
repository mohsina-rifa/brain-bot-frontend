<script setup lang="ts">
import { computed, ref, watch } from "vue";
import {
  BModal,
  BForm,
  BFormGroup,
  BFormTextarea,
  BButton,
  BAlert,
  BSpinner,
} from "bootstrap-vue-next";
import type { Qna } from "@/types/api";

const show = defineModel<boolean>({ default: false });

const props = defineProps<{
  busy?: boolean;
  error?: string | null;
}>();

const emit = defineEmits<{ submit: [question: string, answer: string] }>();

const question = ref("");
const answer = ref("");

watch(show, (open) => {
  if (!open) return;
  question.value = "";
  answer.value = "";
});

function onSubmit() {
  if (props.busy) return;
  emit("submit", question.value.trim(), answer.value.trim());
}
</script>

<template>
  <BModal
    v-model="show"
    :title="isEdit ? 'Edit Q&A entry' : 'Add Q&A entry'"
    :no-close-on-backdrop="busy"
    size="lg"
  >
    <BAlert v-if="error" :model-value="true" variant="danger" class="mb-3">
      {{ error }}
    </BAlert>

    <BForm novalidate @submit.prevent="onSubmit">
      <BFormGroup label="Question" label-for="qna-question" class="mb-3">
        <BFormTextarea
          id="qna-question"
          v-model="question"
          rows="2"
          max-rows="4"
          required
          placeholder="What are your support hours?"
          :disabled="busy"
        />
      </BFormGroup>

      <BFormGroup
        label="Answer"
        label-for="qna-answer"
        description="This is what the bot will reply with when the question matches."
      >
        <BFormTextarea
          id="qna-answer"
          v-model="answer"
          rows="5"
          max-rows="12"
          required
          placeholder="Our support team is available 9 AM to 6 PM, Sunday through Thursday."
          :disabled="busy"
        />
      </BFormGroup>
    </BForm>

    <template #footer>
      <BButton variant="outline-secondary" :disabled="busy" @click="show = false">
        Cancel
      </BButton>
      <BButton
        variant="primary"
        :disabled="busy || !question.trim() || !answer.trim()"
        @click="onSubmit"
      >
        <BSpinner v-if="busy" small class="me-2" />
        {{ busy ? "Saving…" : isEdit ? "Save changes" : "Add entry" }}
      </BButton>
    </template>
  </BModal>
</template>
