<script setup lang="ts">
import { ref, watch } from "vue";
import {
  BForm,
  BFormGroup,
  BFormInput,
  BFormSelect,
  BFormTextarea,
  BButton,
  BAlert,
  BSpinner,
} from "bootstrap-vue-next";
import type { Bot } from "@/types/api";

const props = defineProps<{
  bot: Bot | null;
  busy?: boolean;
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

watch(
  () => props.bot,
  (bot) => {
    if (!bot) return;
    name.value = bot.name ?? "";
    description.value = bot.description ?? "";
    color.value = bot.color ?? "#000000";
    status.value = bot.status ?? "active";
  },
  { immediate: true },
);

function onSubmit() {
  if (props.busy) return;
  emit("save", {
    name: name.value.trim(),
    description: description.value.trim(),
    color: color.value,
    status: status.value,
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

    <div class="row g-3 mb-4">
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

    <BButton type="submit" variant="primary" :disabled="busy || !name.trim()">
      <BSpinner v-if="busy" small class="me-2" />
      {{ busy ? "Saving…" : "Save changes" }}
    </BButton>
  </BForm>
</template>
