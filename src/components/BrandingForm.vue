<script setup lang="ts">
import { computed, ref, watch } from "vue";
import {
  BForm,
  BFormGroup,
  BFormInput,
  BFormSelect,
  BFormTextarea,
  BFormCheckbox,
  BButton,
  BAlert,
  BSpinner,
} from "bootstrap-vue-next";
import type { Bot } from "@/types/api";

const props = defineProps<{
  bot: Bot | null;
  busy?: boolean;
  slow?: boolean;
  error?: string | null;
  fieldErrors?: Record<string, string>;
}>();

const emit = defineEmits<{
  save: [values: Record<string, string>];
  retry: [];
}>();

const name = ref("");
const description = ref("");
const color = ref("#000000");
const status = ref<"active" | "inactive">("active");
const welcomeMessage = ref("");
const fallbackMessage = ref("");
const suggestionMessage = ref("");
const handoverToHuman = ref(false);
const handOverToHumanMessage = ref("");

watch(
  () => props.bot,
  (bot) => {
    if (!bot) return;
    name.value = bot.name ?? "";
    description.value = bot.description ?? "";
    color.value = bot.color ?? "#000000";
    status.value = bot.status ?? "active";
    welcomeMessage.value = bot.welcomeMessage ?? "";
    fallbackMessage.value = bot.fallbackMessage ?? "";
    suggestionMessage.value = bot.suggestionMessage ?? "";
    handoverToHuman.value = bot.handoverToHuman ?? false;
    handOverToHumanMessage.value = bot.handOverToHumanMessage ?? "";
  },
  { immediate: true },
);

const handoverMessageMissing = computed(
  () => handoverToHuman.value && !handOverToHumanMessage.value.trim(),
);

const handoverMessageError = computed(() =>
  handoverMessageMissing.value
    ? "Required while hand over to a human is on."
    : props.fieldErrors?.handOverToHumanMessage,
);

function onSubmit() {
  if (props.busy || handoverMessageMissing.value) return;
  emit("save", {
    name: name.value.trim(),
    description: description.value.trim(),
    color: color.value,
    status: status.value,
    welcomeMessage: welcomeMessage.value.trim(),
    fallbackMessage: fallbackMessage.value.trim(),
    suggestionMessage: suggestionMessage.value.trim(),
    handoverToHuman: String(handoverToHuman.value),
    handOverToHumanMessage: handOverToHumanMessage.value.trim(),
  });
}
</script>

<template>
  <BForm novalidate @submit.prevent="onSubmit">
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
      v-if="busy && slow"
      :model-value="true"
      variant="info"
      class="mb-3 d-flex align-items-center gap-2"
    >
      <BSpinner small />
      <span>Still saving. The logo is uploading — leave this page open.</span>
    </BAlert>

    <h2 class="form-section">Identity</h2>

    <BFormGroup
      label="Name"
      label-for="bot-name"
      class="mb-3"
      description="At least three characters."
      :state="fieldErrors?.name ? false : null"
      :invalid-feedback="fieldErrors?.name"
    >
      <BFormInput
        id="bot-name"
        v-model="name"
        required
        :disabled="busy"
        :state="fieldErrors?.name ? false : null"
      />
    </BFormGroup>

    <BFormGroup
      label="Description"
      label-for="bot-description"
      class="mb-3"
      :state="fieldErrors?.description ? false : null"
      :invalid-feedback="fieldErrors?.description"
    >
      <BFormTextarea
        id="bot-description"
        v-model="description"
        rows="2"
        max-rows="4"
        :disabled="busy"
      />
    </BFormGroup>

    <div class="row g-3">
      <div class="col-sm-6">
        <BFormGroup
          label="Colour"
          label-for="bot-color"
          description="Used for the bot's accent in the playground."
          :state="fieldErrors?.color ? false : null"
          :invalid-feedback="fieldErrors?.color"
        >
          <div class="d-flex align-items-center gap-2">
            <BFormInput
              id="bot-color"
              v-model="color"
              type="color"
              class="form-control-color"
              :disabled="busy"
            />
            <code class="small text-body-secondary">{{ color }}</code>
          </div>
        </BFormGroup>
      </div>
      <div class="col-sm-6">
        <BFormGroup
          label="Status"
          label-for="bot-status"
          :state="fieldErrors?.status ? false : null"
          :invalid-feedback="fieldErrors?.status"
        >
          <BFormSelect
            id="bot-status"
            v-model="status"
            :options="['active', 'inactive']"
            :disabled="busy"
          />
        </BFormGroup>
      </div>
    </div>

    <h2 class="form-section form-section-divided">Messages</h2>

    <BFormGroup
      label="Welcome message"
      label-for="bot-welcome"
      class="mb-3"
      description="Greets the visitor when a conversation opens."
      :state="fieldErrors?.welcomeMessage ? false : null"
      :invalid-feedback="fieldErrors?.welcomeMessage"
    >
      <BFormTextarea
        id="bot-welcome"
        v-model="welcomeMessage"
        rows="2"
        max-rows="4"
        :disabled="busy"
        :state="fieldErrors?.welcomeMessage ? false : null"
      />
    </BFormGroup>

    <BFormGroup
      label="Fallback message"
      label-for="bot-fallback"
      class="mb-3"
      description="Sent when the bot finds no confident answer."
      :state="fieldErrors?.fallbackMessage ? false : null"
      :invalid-feedback="fieldErrors?.fallbackMessage"
    >
      <BFormTextarea
        id="bot-fallback"
        v-model="fallbackMessage"
        rows="2"
        max-rows="4"
        :disabled="busy"
        :state="fieldErrors?.fallbackMessage ? false : null"
      />
    </BFormGroup>

    <BFormGroup
      label="Suggestion message"
      label-for="bot-suggestion"
      class="mb-3"
      description="Nudges the visitor towards what to ask next."
      :state="fieldErrors?.suggestionMessage ? false : null"
      :invalid-feedback="fieldErrors?.suggestionMessage"
    >
      <BFormTextarea
        id="bot-suggestion"
        v-model="suggestionMessage"
        rows="2"
        max-rows="4"
        :disabled="busy"
        :state="fieldErrors?.suggestionMessage ? false : null"
      />
    </BFormGroup>

    <BFormCheckbox
      id="bot-handover"
      v-model="handoverToHuman"
      switch
      class="mb-3"
      :disabled="busy"
    >
      Hand over to a human when the bot cannot help
    </BFormCheckbox>

    <BFormGroup
      v-if="handoverToHuman"
      label="Hand-over message"
      label-for="bot-handover-message"
      class="mb-3"
      description="Shown as the bot passes the conversation to a person."
      :state="handoverMessageError ? false : null"
      :invalid-feedback="handoverMessageError"
    >
      <BFormTextarea
        id="bot-handover-message"
        v-model="handOverToHumanMessage"
        rows="2"
        max-rows="4"
        :disabled="busy"
        :state="handoverMessageError ? false : null"
      />
    </BFormGroup>

    <div class="form-actions">
      <BButton
        type="submit"
        variant="primary"
        :disabled="busy || !name.trim() || handoverMessageMissing"
      >
        <BSpinner v-if="busy" small class="me-2" />
        {{ busy ? "Saving…" : "Save changes" }}
      </BButton>
    </div>
  </BForm>
</template>
