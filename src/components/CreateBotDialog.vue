<script setup lang="ts">
import { ref, watch } from "vue";
import {
  BModal,
  BForm,
  BFormGroup,
  BFormInput,
  BFormSelect,
  BButton,
  BAlert,
  BSpinner,
} from "bootstrap-vue-next";
import client from "@/api/client";
import { useApi } from "@/composables/useApi";
import type { Bot } from "@/types/api";

const show = defineModel<boolean>({ default: false });
const emit = defineEmits<{ created: [bot: Bot] }>();

const name = ref("");
const description = ref("");
const color = ref("#3a4fb8");
const status = ref<"active" | "inactive">("active");

const create = useApi<Bot, [FormData]>((signal, form) =>
  client.post<Bot>("/bots", form, { signal }).then((r) => r.data),
);

watch(show, (open) => {
  if (!open) create.error.value = null;
});

function reset() {
  name.value = "";
  description.value = "";
  color.value = "#3a4fb8";
  status.value = "active";
  create.error.value = null;
}

async function onSubmit() {
  const form = new FormData();
  form.append("name", name.value.trim());
  form.append("description", description.value.trim());
  form.append("color", color.value);
  form.append("status", status.value);
  form.append("handOverToHumanMessage", "");

  const bot = await create.run(form);

  if (!bot) return;

  emit("created", bot);
  show.value = false;
  reset();
}
</script>

<template>
  <BModal
    v-model="show"
    title="Create bot"
    :no-close-on-backdrop="create.loading.value"
    scrollable
  >
    <BAlert
      v-if="create.error.value"
      :model-value="true"
      variant="danger"
      class="mb-3 d-flex justify-content-between align-items-center gap-3"
    >
      <span>{{ create.error.value }}</span>
      <BButton
        variant="outline-danger"
        size="sm"
        class="flex-shrink-0"
        :disabled="create.loading.value"
        @click="onSubmit"
      >
        Retry
      </BButton>
    </BAlert>

    <BAlert
      v-if="create.loading.value && create.slow.value"
      :model-value="true"
      variant="info"
      class="mb-3 d-flex align-items-center gap-2"
    >
      <BSpinner small />
      <span>Still creating — the server is taking longer than usual.</span>
    </BAlert>

    <BForm novalidate @submit.prevent="onSubmit">
      <BFormGroup label="Name" label-for="bot-name" class="mb-3">
        <BFormInput
          id="bot-name"
          v-model="name"
          required
          maxlength="60"
          placeholder="Customer Support Bot"
          :disabled="create.loading.value"
        />
      </BFormGroup>

      <BFormGroup label="Description" label-for="bot-description" class="mb-3">
        <BFormInput
          id="bot-description"
          v-model="description"
          required
          maxlength="200"
          placeholder="What this bot helps with"
          :disabled="create.loading.value"
        />
      </BFormGroup>

      <div class="row g-3">
        <div class="col-6">
          <BFormGroup label="Colour" label-for="bot-color">
            <BFormInput
              id="bot-color"
              v-model="color"
              type="color"
              class="form-control-color"
              :disabled="create.loading.value"
            />
          </BFormGroup>
        </div>
        <div class="col-6">
          <BFormGroup label="Status" label-for="bot-status">
            <BFormSelect
              id="bot-status"
              v-model="status"
              :options="['active', 'inactive']"
              :disabled="create.loading.value"
            />
          </BFormGroup>
        </div>
      </div>
    </BForm>

    <template #footer>
      <BButton
        variant="outline-secondary"
        :disabled="create.loading.value"
        @click="show = false"
      >
        Cancel
      </BButton>
      <BButton
        variant="primary"
        :disabled="create.loading.value || !name.trim() || !description.trim()"
        @click="onSubmit"
      >
        <BSpinner v-if="create.loading.value" small class="me-2" />
        {{ create.loading.value ? "Creating…" : "Create bot" }}
      </BButton>
    </template>
  </BModal>
</template>
