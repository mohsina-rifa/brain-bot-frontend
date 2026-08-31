<script setup lang="ts">
import { onMounted, ref, toRef, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
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
import QnaSearchBar from "@/components/QnaSearchBar.vue";
import QnaFormDialog from "@/components/QnaFormDialog.vue";
import ConfirmDialog from "@/components/ConfirmDialog.vue";
import LoadingSkeleton from "@/components/LoadingSkeleton.vue";
import ErrorState from "@/components/ErrorState.vue";
import EmptyState from "@/components/EmptyState.vue";
import type { Qna } from "@/types/api";

const props = defineProps<{ id: string }>();

const activeBot = useActiveBotStore();
const {
  page,
  rows,
  hasLoaded,
  total,
  limit,
  pageCount,
  loading,
  error,
  slow,
  retrying,
  load,
  goTo,
  setLimit,
  setSearch,
  search,
  retry,
  create,
  update,
  remove,
  findDuplicate,
  saving,
  slowSave,
  pendingId,
  mutationError,
  fieldErrors,
  failedAction,
  retryMutation,
  clearMutationError,
} = useQna(toRef(props, "id"));

const toast = useToast();

const route = useRoute();
const router = useRouter();

const fromUrl = typeof route.query.q === "string" ? route.query.q : "";
if (fromUrl) search.value = fromUrl;

function onSearch(term: string) {
  setSearch(term);

  router.replace({
    query: { ...route.query, q: term || undefined },
  });
}

watch(
  () => route.query.q,
  (next) => {
    const term = typeof next === "string" ? next : "";
    if (term !== search.value) setSearch(term);
  },
);

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

// --- the form: one dialog, two modes ---------------------------------------

const showForm = ref(false);

const editing = ref<Qna | null>(null);

const duplicateOf = ref<Qna | null>(null);

function openCreate() {
  editing.value = null;
  duplicateOf.value = null;
  clearMutationError();
  showForm.value = true;
}

function openEdit(row: Qna) {
  editing.value = row;
  duplicateOf.value = null;
  clearMutationError();
  showForm.value = true;
}

function notifySaved(title: string) {
  toast.create({ title, variant: "success", value: 3000, pos: "bottom-end" });
}

function notifyFailed(title: string) {
  toast.create({
    title,
    body: mutationError.value ?? undefined,
    variant: "danger",
    value: 6000,
    pos: "bottom-end",
  });
}

async function onSubmit(question: string, answer: string) {
  if (!duplicateOf.value) {
    const match = await findDuplicate(question, editing.value?.id);
    if (match) {
      duplicateOf.value = match;
      return;
    }
  }
  duplicateOf.value = null;

  const wasEdit = Boolean(editing.value);
  const saved = editing.value
    ? await update(editing.value.id, question, answer)
    : await create(question, answer);

  if (saved) {
    showForm.value = false;
    notifySaved(wasEdit ? "Entry updated" : "Entry added");
  } else {
    notifyFailed(wasEdit ? "Could not update entry" : "Could not add entry");
  }
}

async function onRetry() {
  const wasDelete = failedAction.value === "delete";

  const result = await retryMutation();
  if (result === null || result === false) {
    notifyFailed(wasDelete ? "Still could not delete" : "Still could not save");
    return;
  }
  showForm.value = false;
  pendingDelete.value = null;
  notifySaved(wasDelete ? "Entry deleted" : "Entry saved");
}

// --- delete ----------------------------------------------------------------

const pendingDelete = ref<Qna | null>(null);

function onRequestDelete(row: Qna) {
  clearMutationError();
  pendingDelete.value = row;
}

async function confirmDelete() {
  const row = pendingDelete.value;
  if (!row) return;
  const ok = await remove(row.id);
  
  if (ok) {
    pendingDelete.value = null;
    notifySaved("Entry deleted");
  } else {
    notifyFailed("Could not delete entry");
  }
}
</script>

<template>
  <div class="container-fluid py-4 px-4">
    <div
      class="d-flex flex-wrap gap-2 justify-content-between align-items-start mb-3"
    >
      <div>
        <h1 class="h4 mb-1">Q&amp;A content</h1>
        <p class="text-body-secondary mb-0">
          {{ activeBot.bot?.name ?? "Knowledge base" }} ·
          <span v-if="loading && !hasLoaded">loading…</span>
          <span v-else-if="error">unavailable</span>
          <span v-else>{{ rangeLabel() }}</span>
          <!-- Refetch: the table stays put and only this marker moves. -->
          <BSpinner v-if="loading && hasLoaded" small class="ms-2" />
        </p>
      </div>
      <BButton variant="primary" @click="openCreate">
        <i class="bi bi-plus-lg me-1" />Add entry
      </BButton>
    </div>

    <div class="mb-3">
      <QnaSearchBar
        :initial="search"
        :searching="loading && Boolean(search)"
        @search="onSearch"
      />
    </div>

    <LoadingSkeleton
      v-if="loading && !hasLoaded"
      :rows="5"
      :columns="3"
      :slow="slow"
      :retrying="retrying"
    />

    <ErrorState
      v-else-if="error"
      :message="error"
      :busy="loading"
      @retry="retry"
    />

    <EmptyState
      v-else-if="!rows.length && search"
      icon="search"
      :title="`No entries match “${search}”`"
      action-label="Clear search"
      action-variant="outline-secondary"
      @action="onSearch('')"
    >
      This bot has {{ hasLoaded ? "other" : "" }} entries, just none containing
      that text. Try a different word, or clear the search.
    </EmptyState>

    <EmptyState
      v-else-if="!rows.length"
      icon="chat-square-text"
      title="No Q&A entries yet"
      description="This bot has nothing to answer from. Add a question and answer to start building its knowledge base."
      action-label="Add entry"
      @action="openCreate"
    />

    <!-- Content -->
    <div v-else>
      <div
        :class="{ 'opacity-50': loading }"
        :aria-busy="loading"
        style="transition: opacity 120ms ease"
      >
      <QnaTable
        :rows="rows"
        :highlight="search"
        :pending-id="pendingId"
        @edit="openEdit"
        @remove="onRequestDelete"
      />
      </div>

      <div
        class="d-flex flex-wrap justify-content-between align-items-center mt-3 gap-3"
      >
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
      :slow="slowSave"
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
      <BAlert
        v-if="mutationError"
        :model-value="true"
        variant="danger"
        class="mb-3 d-flex justify-content-between align-items-center gap-3"
      >
        <span>{{ mutationError }}</span>
        <BButton
          variant="outline-danger"
          size="sm"
          class="flex-shrink-0"
          :disabled="pendingId !== null"
          @click="onRetry"
        >
          Retry
        </BButton>
      </BAlert>

      Delete <strong>{{ pendingDelete?.question }}</strong
      >? The bot will no longer be able to answer from it. This cannot be undone.
    </ConfirmDialog>
  </div>
</template>
