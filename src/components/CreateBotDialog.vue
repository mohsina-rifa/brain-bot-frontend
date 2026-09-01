<script setup lang="ts">
import { ref, watch } from "vue";
import { BModal } from "bootstrap-vue-next";
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
    :no-close-on-backdrop="create.loading.value"
    scrollable
  >
    <template #header>
      <div class="bb-modal-title">
        <h3>Create new bot</h3>
        <p>Set the basics now. Branding can be refined later.</p>
      </div>
      <button
        type="button"
        class="bb-icon-btn"
        aria-label="Close"
        :disabled="create.loading.value"
        @click="show = false"
      >
        ×
      </button>
    </template>

    <div
      v-if="create.error.value"
      class="bb-notice danger bb-dialog-error"
      role="alert"
    >
      <span>{{ create.error.value }}</span>
      <button
        type="button"
        class="bb-btn bb-btn-danger"
        :disabled="create.loading.value"
        @click="onSubmit"
      >
        Retry
      </button>
    </div>

    <div
      v-if="create.loading.value && create.slow.value"
      class="bb-notice"
      style="margin-bottom: 16px"
      role="status"
    >
      Still creating — the server is taking longer than usual.
    </div>

    <form novalidate @submit.prevent="onSubmit">
      <div class="bb-form-grid">
        <div class="bb-form-group bb-span-2">
          <label class="bb-form-label" for="bot-name">Bot name</label>
          <input
            id="bot-name"
            v-model="name"
            class="bb-input"
            required
            maxlength="60"
            placeholder="e.g. Support Assistant"
            :disabled="create.loading.value"
          />
        </div>

        <div class="bb-form-group">
          <label class="bb-form-label" for="bot-color">Brand colour</label>
          <div class="bb-color-row">
            <span class="bb-color-swatch">
              <input
                id="bot-color"
                v-model="color"
                type="color"
                :disabled="create.loading.value"
                aria-label="Choose brand colour"
              />
            </span>
            <input
              v-model="color"
              class="bb-input"
              :disabled="create.loading.value"
              aria-label="Brand colour hex value"
            />
          </div>
        </div>

        <div class="bb-form-group">
          <label class="bb-form-label" for="bot-status">Status</label>
          <select
            id="bot-status"
            v-model="status"
            class="bb-select"
            :disabled="create.loading.value"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <div class="bb-form-group bb-span-2">
          <label class="bb-form-label" for="bot-description">Description</label>
          <textarea
            id="bot-description"
            v-model="description"
            class="bb-textarea"
            required
            maxlength="200"
            placeholder="What is this bot for?"
            :disabled="create.loading.value"
          />
          <div class="bb-form-help">
            Keep this short and useful for operators.
          </div>
        </div>
      </div>
    </form>

    <template #footer>
      <button
        type="button"
        class="bb-btn"
        :disabled="create.loading.value"
        @click="show = false"
      >
        Cancel
      </button>
      <button
        type="button"
        class="bb-btn bb-btn-primary"
        :disabled="create.loading.value || !name.trim() || !description.trim()"
        @click="onSubmit"
      >
        {{ create.loading.value ? "Creating…" : "Create bot" }}
      </button>
    </template>
  </BModal>
</template>

<style scoped>
.bb-dialog-error {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 16px;
}

.bb-dialog-error .bb-btn {
  flex-shrink: 0;
}
</style>
