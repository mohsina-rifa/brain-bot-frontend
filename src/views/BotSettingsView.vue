<script setup lang="ts">
import { ref, toRef, watch } from "vue";
import { RouterLink } from "vue-router";
import { useToast } from "bootstrap-vue-next";
import client, { isSessionEnded, toFieldErrors, toMessage } from "@/api/client";
import { useActiveBotStore } from "@/stores/activeBot";
import { useWriteQueueStore } from "@/stores/writeQueue";
import { useSlowFlag } from "@/composables/useSlowFlag";
import BrandingForm from "@/components/BrandingForm.vue";
import LoadingSkeleton from "@/components/LoadingSkeleton.vue";
import ErrorState from "@/components/ErrorState.vue";
import type { Bot } from "@/types/api";

const props = defineProps<{ id: string }>();

const activeBot = useActiveBotStore();
const queue = useWriteQueueStore();
const toast = useToast();

const saving = ref(false);
const error = ref<string | null>(null);
const fieldErrors = ref<Record<string, string>>({});

const { slow: slowSave, start: startSlow, stop: stopSlow } = useSlowFlag();

let lastValues: Record<string, string> | null = null;

watch(
  toRef(props, "id"),
  (id) => {
    error.value = null;
    fieldErrors.value = {};
    lastValues = null;
    activeBot.ensure(id);
  },
  { immediate: true },
);

async function save(values: Record<string, string>): Promise<boolean> {
  lastValues = values;
  saving.value = true;
  error.value = null;
  fieldErrors.value = {};
  startSlow();

  try {
    const form = new FormData();
    for (const [key, value] of Object.entries(values)) form.append(key, value);

    const res = await client.patch<{ data: Bot }>(`/bots/${props.id}`, form);

    activeBot.replace(res.data.data);

    toast.create({
      title: "Branding saved",
      variant: "success",
      value: 3000,
      pos: "bottom-end",
    });
    return true;
  } catch (err) {
    if (queue.enqueueIfOffline(err, "Branding changes", () => save(values))) {
      toast.create({
        title: "Branding waiting to send",
        body: "You are offline. It will be saved when the connection is back.",
        variant: "warning",
        value: 5000,
        pos: "bottom-end",
      });
      return false;
    }

    error.value = toMessage(err);
    fieldErrors.value = toFieldErrors(err);
    if (isSessionEnded()) return false;
    toast.create({
      title: "Could not save branding",
      body: error.value ?? undefined,
      variant: "danger",
      value: 6000,
      pos: "bottom-end",
    });
    return false;
  } finally {
    saving.value = false;
    stopSlow();
  }
}

function retry() {
  if (lastValues) void save(lastValues);
}

/*
 * The preview panel follows what is being typed rather than what was last
 * saved, so BrandingForm reports its live values up here.
 */
const preview = ref({ name: "", color: "#4f46e5", welcomeMessage: "" });

function onPreview(values: {
  name: string;
  color: string;
  welcomeMessage: string;
}) {
  preview.value = values;
}


</script>

<template>
  <div>
    <section class="bb-page-head">
      <div>
        <h1>Bot settings</h1>
        <p>
          Manage how
          <strong>{{ activeBot.bot?.name ?? "this bot" }}</strong> is presented
          in the playground and to end users.
        </p>
      </div>
      <div class="bb-page-actions">
        <RouterLink :to="`/bots/${props.id}/playground`" class="bb-btn">
          Preview in playground
        </RouterLink>
        <button
          type="submit"
          form="branding-form"
          class="bb-btn bb-btn-primary"
          :disabled="saving || !activeBot.bot"
        >
          {{ saving ? "Saving…" : "Save changes" }}
        </button>
      </div>
    </section>

    <LoadingSkeleton
      v-if="activeBot.loading && !activeBot.bot"
      :rows="6"
      :columns="1"
      :slow="activeBot.slow"
      :retrying="activeBot.retrying"
      cancellable
      @cancel="activeBot.cancel"
    />

    <ErrorState
      v-else-if="!activeBot.bot"
      :message="
        activeBot.error ??
        'This bot could not be loaded. Try again, or go back to the bots list.'
      "
      :busy="activeBot.loading"
      @retry="activeBot.retry"
    />

    <section v-else class="bb-settings-layout">
      <BrandingForm
        :bot="activeBot.bot"
        :busy="saving"
        :slow="slowSave"
        :error="error"
        :field-errors="fieldErrors"
        @save="save"
        @retry="retry"
        @preview="onPreview"
      />

      <aside class="bb-card bb-preview-card">
        <div
          class="bb-preview-top"
          :style="{ '--bb-bot-preview': preview.color }"
        >
          <strong>{{ preview.name || "Untitled bot" }}</strong>
          <span>Typically replies instantly</span>
        </div>

        <div class="bb-preview-body">
          <div class="bb-preview-bubble">
            {{
              preview.welcomeMessage ||
              "No welcome message set — the playground opens with an empty thread."
            }}
          </div>
          <div class="bb-preview-bubble user">How do I reset my password?</div>
          <div class="bb-preview-bubble" style="margin-top: 18px">
            Answers come from this bot's Q&amp;A content.
          </div>
        </div>

        <div class="bb-preview-input">
          <div>Type your message…</div>
          <button
            type="button"
            class="bb-btn bb-btn-primary"
            disabled
            aria-label="Preview only"
          >
            ↑
          </button>
        </div>

        <div class="bb-preview-foot">
          A visual preview of the branding above. It is not a live chat — use
          the playground to test real answers.
        </div>
      </aside>
    </section>
  </div>
</template>

<style scoped>
.bb-preview-foot {
  padding: 12px 18px;
  border-top: 1px solid var(--bb-border);
  color: var(--bb-muted);
  font-size: 11px;
  background: var(--bb-surface);
}
</style>
