<script setup lang="ts">
import { ref, toRef, watch } from "vue";
import { BSpinner, useToast } from "bootstrap-vue-next";
import client, { toFieldErrors, toMessage } from "@/api/client";
import { useActiveBotStore } from "@/stores/activeBot";
import BrandingForm from "@/components/BrandingForm.vue";
import type { Bot } from "@/types/api";

const props = defineProps<{ id: string }>();

const activeBot = useActiveBotStore();
const toast = useToast();

const saving = ref(false);
const error = ref<string | null>(null);
const fieldErrors = ref<Record<string, string>>({});

let lastValues: Record<string, string> | null = null;

watch(toRef(props, "id"), (id) => activeBot.ensure(id), { immediate: true });

async function save(values: Record<string, string>) {
  lastValues = values;
  saving.value = true;
  error.value = null;
  fieldErrors.value = {};

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
  } catch (err) {
    error.value = toMessage(err);
    fieldErrors.value = toFieldErrors(err);
    toast.create({
      title: "Could not save branding",
      body: error.value ?? undefined,
      variant: "danger",
      value: 6000,
      pos: "bottom-end",
    });
  } finally {
    saving.value = false;
  }
}

function retry() {
  if (lastValues) save(lastValues);
}
</script>

<template>
  <div class="container-fluid py-4 px-4">
    <div class="mb-3">
      <h1 class="h4 mb-1">Branding</h1>
      <p class="text-body-secondary mb-0">
        {{ activeBot.bot?.name ?? "Bot" }} · how this bot presents itself in the
        playground
      </p>
    </div>

    <div v-if="!activeBot.bot" class="text-center py-5">
      <BSpinner />
    </div>

    <div v-else style="max-width: 42rem">
      <BrandingForm
        :bot="activeBot.bot"
        :busy="saving"
        :error="error"
        :field-errors="fieldErrors"
        @save="save"
        @retry="retry"
      />
    </div>
  </div>
</template>
