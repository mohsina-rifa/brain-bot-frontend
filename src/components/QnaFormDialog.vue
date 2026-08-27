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
  entry?: Qna | null;
  fieldErrors?: Record<string, string>;
  duplicateQuestion?: string | null;
}>();

const emit = defineEmits<{
  submit: [question: string, answer: string];
  retry: [];
  dismissDuplicate: [];
}>();

const question = ref("");
const answer = ref("");

const isEdit = computed(() => Boolean(props.entry));

const initial = ref({ question: "", answer: "" });

const isDirty = computed(
  () =>
    question.value !== initial.value.question ||
    answer.value !== initial.value.answer,
);

const confirmingDiscard = ref(false);

watch(show, (open) => {
  if (!open) return;
  question.value = props.entry?.question ?? "";
  answer.value = props.entry?.answer ?? "";
  initial.value = { question: question.value, answer: answer.value };
  confirmingDiscard.value = false;
});

function onHide(event: { preventDefault: () => void }) {
  if (!isDirty.value || props.busy) return;
  event.preventDefault();
  confirmingDiscard.value = true;
}

function discardAndClose() {
  confirmingDiscard.value = false;
  // Re-baseline so onHide does not immediately re-trigger on the way out.
  initial.value = { question: question.value, answer: answer.value };
  show.value = false;
}

function requestClose() {
  if (isDirty.value) {
    confirmingDiscard.value = true;
    return;
  }
  show.value = false;
}

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
    @hide="onHide"
  >
    <BAlert
      v-if="confirmingDiscard"
      :model-value="true"
      variant="warning"
      class="mb-3 d-flex justify-content-between align-items-center gap-3"
    >
      <span>You have unsaved changes. Close without saving?</span>
      <span class="d-flex gap-2 flex-shrink-0">
        <BButton variant="outline-secondary" size="sm" @click="confirmingDiscard = false">
          Keep editing
        </BButton>
        <BButton variant="warning" size="sm" @click="discardAndClose">Discard</BButton>
      </span>
    </BAlert>

    <BAlert
      v-if="error"
      :model-value="true"
      variant="danger"
      class="mb-3 d-flex justify-content-between align-items-center gap-3"
    >
      <span>{{ error }}</span>
      <BButton
        variant="outline-danger"
        size="sm"
        class="flex-shrink-0"
        :disabled="busy"
        @click="emit('retry')"
      >
        Retry
      </BButton>
    </BAlert>

    <BAlert
      v-if="duplicateQuestion"
      :model-value="true"
      variant="warning"
      class="mb-3"
    >
      <div class="fw-semibold mb-1">This question already exists</div>
      <div class="small mb-2">
        “{{ duplicateQuestion }}” is already in this knowledge base. Two close
        matches make it harder for the bot to pick the right answer.
      </div>
      <div class="d-flex gap-2">
        <BButton variant="warning" size="sm" :disabled="busy" @click="onSubmit">
          Save anyway
        </BButton>
        <BButton
          variant="outline-secondary"
          size="sm"
          :disabled="busy"
          @click="emit('dismissDuplicate')"
        >
          Let me change it
        </BButton>
      </div>
    </BAlert>

    <BForm novalidate @submit.prevent="onSubmit">
      <BFormGroup
        label="Question"
        label-for="qna-question"
        class="mb-3"
        :state="fieldErrors?.question ? false : null"
        :invalid-feedback="fieldErrors?.question"
      >
        <BFormTextarea
          id="qna-question"
          v-model="question"
          rows="2"
          max-rows="4"
          required
          placeholder="What are your support hours?"
          :disabled="busy"
          :state="fieldErrors?.question ? false : null"
        />
      </BFormGroup>

      <BFormGroup
        label="Answer"
        label-for="qna-answer"
        description="This is what the bot will reply with when the question matches."
        :state="fieldErrors?.answer ? false : null"
        :invalid-feedback="fieldErrors?.answer"
      >
        <BFormTextarea
          id="qna-answer"
          v-model="answer"
          rows="5"
          max-rows="12"
          required
          placeholder="Our support team is available 9 AM to 6 PM, Sunday through Thursday."
          :disabled="busy"
          :state="fieldErrors?.answer ? false : null"
        />
      </BFormGroup>
    </BForm>

    <template #footer>
      <BButton variant="outline-secondary" :disabled="busy" @click="requestClose">
        Cancel
      </BButton>
      <BButton
        variant="primary"
        :disabled="busy || !question || !answer"
        @click="onSubmit"
      >
        <BSpinner v-if="busy" small class="me-2" />
        {{ busy ? "Saving…" : isEdit ? "Save changes" : "Add entry" }}
      </BButton>
    </template>
  </BModal>
</template>
