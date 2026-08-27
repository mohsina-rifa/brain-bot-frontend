<script setup lang="ts">
import { onMounted, ref, toRef, watch } from "vue";
import {
  BButton,
  BAlert,
  BSpinner,
  BFormSelect,
  useToast,
} from "bootstrap-vue-next";
import { useQna } from "@/composables/useQna";
import { useActiveBotStore } from "@/stores/activeBot";
import QnaTable from "@/components/QnaTable.vue";
import type { Qna } from "@/types/api";
import QnaFormDialog from "@/components/QnaFormDialog.vue";
import ConfirmDialog from "@/components/ConfirmDialog.vue";

const props = defineProps<{ id: string }>();

const activeBot = useActiveBotStore();
const {
  page,
  rows,
  total,
  limit,
  pageCount,
  loading,
  error,
  slow,
  load,
  goTo,
  setLimit,
  retry,
  create,
  saving,
  mutationError,
} = useQna(toRef(props, "id"));

const showCreate = ref(false);

async function onCreate(question: string, answer: string) {
  const created = await create(question, answer);
  if (created) showCreate.value = false;
}

onMounted(load);

watch(
  () => props.id,
  () => {
    page.value = 1;
    load();
  },
);

function rangeLabel() {
  if (!total.value) return "0 entries";
  const first = (page.value - 1) * limit.value + 1;
  const last = Math.min(page.value * limit.value, total.value);
  return `${first}–${last} of ${total.value}`;
}
</script>

<template>
  <div class="container-fluid py-4 px-4">
    <div class="d-flex justify-content-between align-items-start mb-3">
      <div>
        <h1 class="h4 mb-1">Q&amp;A content</h1>
        <p class="text-body-secondary mb-0">
          {{ activeBot.bot?.name ?? "Knowledge base" }} ·
          <span v-if="loading">loading…</span>
          <span v-else-if="error">unavailable</span>
          <span v-else>{{ rangeLabel() }}</span>
        </p>
      </div>
      <BButton variant="primary" @click="openCreate">
        <i class="bi bi-plus-lg me-1" />Add entry
      </BButton>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="text-center py-5">
      <BSpinner />
      <p v-if="slow" class="text-body-secondary small mt-3 mb-0">
        Still working — the server is taking longer than usual.
      </p>
    </div>

    <!-- Error -->
    <BAlert
      v-else-if="error"
      :model-value="true"
      variant="danger"
      class="d-flex justify-content-between align-items-center"
    >
      <span>{{ error }}</span>
      <BButton variant="outline-danger" size="sm" @click="retry">Retry</BButton>
    </BAlert>

    <!-- Empty -->
    <div v-else-if="!rows.length" class="text-center border rounded py-5 px-3">
      <i class="bi bi-chat-square-text fs-1 text-body-secondary d-block mb-2" />
      <p class="fw-semibold mb-1">No Q&amp;A entries yet</p>
      <p class="text-body-secondary mb-3">
        This bot has nothing to answer from. Add a question and answer to start
        building its knowledge base.
      </p>
      <BButton variant="primary" @click="openCreate">Add entry</BButton>
    </div>

    <!-- Content -->
    <div v-else>
      <QnaTable
        :rows="rows"
        :pending-id="pendingId"
        @edit="openEdit"
        @remove="(row: Qna) => (pendingDelete = row)"
      />

      <div class="d-flex justify-content-between align-items-center mt-3 gap-3">
        <div class="d-flex align-items-center gap-2">
          <label
            for="qna-page-size"
            class="form-label mb-0 small text-body-secondary"
          >
            Rows per page
          </label>
          <BFormSelect
            id="qna-page-size"
            :model-value="limit"
            size="sm"
            style="width: auto"
            :options="[10, 25, 50]"
            @update:model-value="(v: unknown) => setLimit(Number(v))"
          />
          <small v-if="pageCount > 1" class="text-body-secondary ms-2">
            Page {{ page }} of {{ pageCount }}
          </small>
        </div>
        <div v-if="pageCount > 1" class="d-flex gap-2">
          <BButton
            size="sm"
            variant="outline-secondary"
            :disabled="page <= 1"
            @click="goTo(page - 1)"
          >
            Previous
          </BButton>
          <BButton
            size="sm"
            variant="outline-secondary"
            :disabled="page >= pageCount"
            @click="goTo(page + 1)"
          >
            Next
          </BButton>
        </div>
      </div>
    </div>

    <QnaFormDialog
      v-model="showForm"
      :entry="editing"
      :busy="saving"
      :error="mutationError"
      :field-errors="fieldErrors"
      :duplicate-question="duplicateOf?.question ?? null"
      @submit="onSubmit"
      @retry="onRetry"
      @dismiss-duplicate="duplicateOf = null"
    />

    <ConfirmDialog
      :model-value="pendingDelete !== null"
      title="Delete entry"
      confirm-label="Delete entry"
      :busy="pendingId !== null"
      @update:model-value="(v: boolean) => { if (!v) pendingDelete = null }"
      @confirm="confirmDelete"
    >
      Delete <strong>{{ pendingDelete?.question }}</strong
      >? The bot will no longer be able to answer from it. This cannot be undone.
    </ConfirmDialog>
  </div>
</template>
