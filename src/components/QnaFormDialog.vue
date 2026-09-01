<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";
import { BModal } from "bootstrap-vue-next";
import type { Qna } from "@/types/api";

const show = defineModel<boolean>({ default: false });

const props = defineProps<{
  busy?: boolean;
  slow?: boolean;
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

const closingAfterSubmit = ref(false);

watch(show, (open) => {
  if (!open) return;
  closingAfterSubmit.value = false;
  question.value = props.entry?.question ?? "";
  answer.value = props.entry?.answer ?? "";
  initial.value = { question: question.value, answer: answer.value };
  confirmingDiscard.value = false;
});

function onHide(event: { preventDefault: () => void }) {
  if (closingAfterSubmit.value) {
    closingAfterSubmit.value = false;
    return;
  }
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
  closingAfterSubmit.value = true;
  emit("submit", question.value.trim(), answer.value.trim());
}

watch(
  () => props.busy,
  async (busy, wasBusy) => {
    if (busy || !wasBusy || !show.value) return;
    await nextTick();
    const dialog = document.querySelector(".modal.show");
    const target =
      dialog?.querySelector<HTMLElement>("[data-retry]") ??
      document.getElementById("qna-question");
    target?.focus();
  },
);

watch(
  () => [props.error, props.duplicateQuestion],
  ([err, dup]) => {
    if (err || dup) closingAfterSubmit.value = false;
  },
);
</script>

<template>
  <BModal
    v-model="show"
    :no-close-on-backdrop="busy"
    size="lg"
    scrollable
    @hide="onHide"
  >
    <template #header>
      <div class="bb-modal-title">
        <h3>{{ isEdit ? "Edit Q&A entry" : "Add Q&A entry" }}</h3>
        <p>
          This content will become part of the bot's managed knowledge.
        </p>
      </div>
      <button
        type="button"
        class="bb-icon-btn"
        aria-label="Close"
        :disabled="busy"
        @click="requestClose"
      >
        ×
      </button>
    </template>

    <div v-if="confirmingDiscard" class="bb-notice warning bb-stack" role="alert">
      <span>You have unsaved changes. Close without saving?</span>
      <span class="bb-stack-actions">
        <button type="button" class="bb-btn" @click="confirmingDiscard = false">
          Keep editing
        </button>
        <button type="button" class="bb-btn bb-btn-danger" @click="discardAndClose">
          Discard
        </button>
      </span>
    </div>

    <div v-if="error" class="bb-notice danger bb-stack" role="alert">
      <span>{{ error }}</span>
      <button
        data-retry
        type="button"
        class="bb-btn bb-btn-danger"
        :disabled="busy"
        @click="emit('retry')"
      >
        Retry
      </button>
    </div>

    <div v-if="duplicateQuestion" class="bb-notice warning" role="alert">
      <div class="bb-notice-title">This question already exists</div>
      <p class="bb-notice-body">
        “{{ duplicateQuestion }}” is already in this knowledge base. Two close
        matches make it harder for the bot to pick the right answer.
      </p>
      <div class="bb-stack-actions">
        <button
          type="button"
          class="bb-btn bb-btn-primary"
          :disabled="busy"
          @click="onSubmit"
        >
          Save anyway
        </button>
        <button
          type="button"
          class="bb-btn"
          :disabled="busy"
          @click="emit('dismissDuplicate')"
        >
          Let me change it
        </button>
      </div>
    </div>

    <div v-if="busy && slow" class="bb-notice" role="status">
      Still saving. The server embeds the answer before it replies, which can
      take a few seconds — leave this open.
    </div>

    <form novalidate @submit.prevent="onSubmit">
      <div class="bb-form-group" style="margin-bottom: 16px">
        <label class="bb-form-label" for="qna-question">Question</label>
        <textarea
          id="qna-question"
          v-model="question"
          class="bb-textarea"
          style="min-height: 80px"
          required
          placeholder="What should users ask?"
          :disabled="busy"
          :aria-invalid="Boolean(fieldErrors?.question)"
        />
        <div v-if="fieldErrors?.question" class="bb-field-error">
          {{ fieldErrors.question }}
        </div>
      </div>

      <div class="bb-form-group">
        <label class="bb-form-label" for="qna-answer">Answer</label>
        <textarea
          id="qna-answer"
          v-model="answer"
          class="bb-textarea"
          style="min-height: 160px"
          required
          placeholder="Write the supported answer..."
          :disabled="busy"
          :aria-invalid="Boolean(fieldErrors?.answer)"
        />
        <div v-if="fieldErrors?.answer" class="bb-field-error">
          {{ fieldErrors.answer }}
        </div>
        <div class="bb-form-help">
          Saving may take a few seconds while the entry is processed.
        </div>
      </div>
    </form>

    <template #footer>
      <button type="button" class="bb-btn" :disabled="busy" @click="requestClose">
        Cancel
      </button>
      <button
        type="button"
        class="bb-btn bb-btn-primary"
        :disabled="busy || !question || !answer"
        @click="onSubmit"
      >
        {{ busy ? "Saving…" : isEdit ? "Save changes" : "Add entry" }}
      </button>
    </template>
  </BModal>
</template>

<style scoped>
.bb-notice {
  margin-bottom: 16px;
}

.bb-stack {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}

.bb-stack-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.bb-notice-title {
  font-weight: 800;
  margin-bottom: 4px;
}

.bb-notice-body {
  margin: 0 0 10px;
}

.bb-field-error {
  margin-top: 6px;
  font-size: 11px;
  font-weight: 700;
  color: var(--bb-danger);
}
</style>
