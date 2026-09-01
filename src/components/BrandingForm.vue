<script setup lang="ts">
import { computed, ref, watch } from "vue";
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
  /* Lets the settings page mirror unsaved edits in its preview panel. */
  preview: [values: { name: string; color: string; welcomeMessage: string }];
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

// The preview panel shows what the operator is typing, not what was last
// saved, so it updates as these three fields change.
watch(
  [name, color, welcomeMessage],
  ([nextName, nextColor, nextWelcome]) => {
    emit("preview", {
      name: nextName,
      color: nextColor,
      welcomeMessage: nextWelcome,
    });
  },
  { immediate: true },
);

const iconInitials = computed(
  () =>
    name.value
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0])
      .join("")
      .toUpperCase() || "?",
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
  <form id="branding-form" novalidate @submit.prevent="onSubmit">
    <div v-if="error" class="bb-notice danger bb-inline-notice" role="alert">
      <span>{{ error }}</span>
      <button
        type="button"
        class="bb-btn bb-btn-danger"
        :disabled="busy"
        @click="emit('retry')"
      >
        Retry
      </button>
    </div>

    <div v-if="busy && slow" class="bb-notice bb-inline-notice" role="status">
      <span>Still saving. The logo is uploading — leave this page open.</span>
    </div>

    <div class="bb-settings-col">
      <div class="bb-card">
        <div class="bb-card-header">
          <div>
            <h3>Identity</h3>
            <div class="bb-table-sub">
              Name, status and basic bot information.
            </div>
          </div>
        </div>
        <div class="bb-card-body">
          <div class="bb-form-grid">
            <div class="bb-form-group">
              <label class="bb-form-label" for="bot-name">Bot name</label>
              <input
                id="bot-name"
                v-model="name"
                class="bb-input"
                required
                :disabled="busy"
                :aria-invalid="Boolean(fieldErrors?.name)"
              />
              <div v-if="fieldErrors?.name" class="bb-field-error">
                {{ fieldErrors.name }}
              </div>
            </div>

            <div class="bb-form-group">
              <label class="bb-form-label" for="bot-status">Status</label>
              <select
                id="bot-status"
                v-model="status"
                class="bb-select"
                :disabled="busy"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div class="bb-form-group bb-span-2">
              <label class="bb-form-label" for="bot-description">
                Description
              </label>
              <textarea
                id="bot-description"
                v-model="description"
                class="bb-textarea"
                :disabled="busy"
                :aria-invalid="Boolean(fieldErrors?.description)"
              />
              <div v-if="fieldErrors?.description" class="bb-field-error">
                {{ fieldErrors.description }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="bb-card">
        <div class="bb-card-header">
          <div>
            <h3>Branding</h3>
            <div class="bb-table-sub">
              Keep the bot visually aligned with your product.
            </div>
          </div>
        </div>
        <div class="bb-card-body">
          <div class="bb-form-grid">
            <div class="bb-form-group">
              <label class="bb-form-label" for="bot-color">Brand colour</label>
              <div class="bb-color-row">
                <span class="bb-color-swatch">
                  <input
                    id="bot-color"
                    v-model="color"
                    type="color"
                    :disabled="busy"
                    aria-label="Choose brand colour"
                  />
                </span>
                <input
                  v-model="color"
                  class="bb-input"
                  :disabled="busy"
                  aria-label="Brand colour hex value"
                />
              </div>
              <div v-if="fieldErrors?.color" class="bb-field-error">
                {{ fieldErrors.color }}
              </div>
            </div>

            <div class="bb-form-group">
              <label class="bb-form-label" for="bot-icon">Bot icon</label>
              <input
                id="bot-icon"
                class="bb-input"
                :value="iconInitials"
                disabled
                readonly
              />
              <div class="bb-form-help">
                Taken from the bot's name — edit the name to change it.
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="bb-card">
        <div class="bb-card-header">
          <div>
            <h3>Conversation messages</h3>
            <div class="bb-table-sub">
              Messages shown when a chat starts or no answer is found.
            </div>
          </div>
        </div>
        <div class="bb-card-body">
          <div class="bb-form-group" style="margin-bottom: 16px">
            <label class="bb-form-label" for="bot-welcome">
              Welcome message
            </label>
            <textarea
              id="bot-welcome"
              v-model="welcomeMessage"
              class="bb-textarea"
              :disabled="busy"
            />
            <div class="bb-form-help">
              Shown at the top of the playground before the first question.
            </div>
          </div>

          <div class="bb-form-group" style="margin-bottom: 16px">
            <label class="bb-form-label" for="bot-fallback">
              Fallback message
            </label>
            <textarea
              id="bot-fallback"
              v-model="fallbackMessage"
              class="bb-textarea"
              :disabled="busy"
            />
            <div class="bb-form-help">
              Sent when nothing in the Q&amp;A content matches.
            </div>
          </div>

          <div class="bb-form-group">
            <label class="bb-form-label" for="bot-suggestion">
              Suggestion message
            </label>
            <textarea
              id="bot-suggestion"
              v-model="suggestionMessage"
              class="bb-textarea"
              :disabled="busy"
            />
            <div class="bb-form-help">
              Prompt shown in the playground to suggest what to ask.
            </div>
          </div>
        </div>
      </div>

      <div class="bb-card">
        <div class="bb-card-header">
          <div>
            <h3>Availability</h3>
            <div class="bb-table-sub">Optional behavior controls.</div>
          </div>
        </div>
        <div class="bb-card-body">
          <div class="bb-switch">
            <div>
              <strong style="font-size: 13px">Human handover</strong>
              <div class="bb-table-sub">
                Allow the bot to suggest a human support path.
              </div>
            </div>
            <button
              type="button"
              class="bb-switch-control"
              :class="handoverToHuman && 'on'"
              role="switch"
              :aria-checked="handoverToHuman"
              aria-label="Human handover"
              :disabled="busy"
              @click="handoverToHuman = !handoverToHuman"
            />
          </div>

          <div
            v-if="handoverToHuman"
            class="bb-form-group"
            style="margin-top: 16px"
          >
            <label class="bb-form-label" for="bot-handover-message">
              Hand-over message
            </label>
            <textarea
              id="bot-handover-message"
              v-model="handOverToHumanMessage"
              class="bb-textarea"
              :disabled="busy"
              :aria-invalid="Boolean(handoverMessageError)"
            />
            <div v-if="handoverMessageError" class="bb-field-error">
              {{ handoverMessageError }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </form>
</template>

<style scoped>
.bb-inline-notice {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 16px;
}

.bb-inline-notice .bb-btn {
  flex-shrink: 0;
}

.bb-field-error {
  margin-top: 6px;
  font-size: 11px;
  font-weight: 700;
  color: var(--bb-danger);
}
</style>
