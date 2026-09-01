<script setup lang="ts">
import { onMounted, ref, toRef, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useToast } from "bootstrap-vue-next";
import { isSessionEnded } from "@/api/client";
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
  cancel,
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
  queued,
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

function notifyQueued(title: string) {
  toast.create({
    title,
    body: "You are offline. It will be sent when the connection is back.",
    variant: "warning",
    value: 5000,
    pos: "bottom-end",
  });
}

function notifyFailed(title: string) {
  if (isSessionEnded()) return;
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
  } else if (queued.value) {
    showForm.value = false;
    notifyQueued(wasEdit ? "Edit waiting to send" : "Entry waiting to send");
  } else {
    notifyFailed(wasEdit ? "Could not update entry" : "Could not add entry");
  }
}

async function onRetry() {
  const wasDelete = failedAction.value === "delete";

  const result = await retryMutation();
  if (result === null || result === false) {
    if (queued.value) {
      showForm.value = false;
      pendingDelete.value = null;
      notifyQueued(
        wasDelete ? "Deletion waiting to send" : "Change waiting to send",
      );
      return;
    }
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
  } else if (queued.value) {
    pendingDelete.value = null;
    notifyQueued("Deletion waiting to send");
  } else {
    notifyFailed("Could not delete entry");
  }
}
</script>

<template>
  <div>
    <section class="bb-page-head">
      <div>
        <h1>Q&amp;A content</h1>
        <p>
          Curate the supported knowledge used by
          <strong>{{ activeBot.bot?.name ?? "this bot" }}</strong
          >. Keep answers concise, accurate and easy to maintain.
        </p>
      </div>
      <div class="bb-page-actions">
        <button type="button" class="bb-btn bb-btn-primary" @click="openCreate">
          ＋ Add Q&amp;A
        </button>
      </div>
    </section>

    <LoadingSkeleton
      v-if="loading && !hasLoaded"
      :rows="5"
      :columns="4"
      :slow="slow"
      :retrying="retrying"
      cancellable
      @cancel="cancel"
    />

    <ErrorState
      v-else-if="error"
      :message="error"
      :busy="loading"
      @retry="retry"
    />

    <section v-else class="bb-card">
      <div class="bb-card-header">
        <QnaSearchBar
          :initial="search"
          :searching="loading && Boolean(search)"
          @search="onSearch"
        />
      </div>

      <EmptyState
        v-if="!rows.length && search"
        flush
        illustration="search"
        :title="`No entries match “${search}”`"
        action-label="Clear search"
        action-variant="secondary"
        @action="onSearch('')"
      >
        This bot has other entries, just none containing that text. Try a
        different word, or clear the search.
      </EmptyState>

      <EmptyState
        v-else-if="!rows.length"
        flush
        illustration="qna"
        title="No Q&A entries yet"
        description="This bot has nothing to answer from. Add a question and answer to start building its knowledge base."
        action-label="Add entry"
        @action="openCreate"
      />

      <template v-else>
        <div
          :style="{
            opacity: loading ? 0.5 : 1,
            transition: 'opacity 120ms ease',
          }"
          :aria-busy="loading"
        >
          <QnaTable
            :rows="rows"
            :highlight="search"
            :pending-id="pendingId"
            @edit="openEdit"
            @remove="onRequestDelete"
          />
        </div>

        <div class="bb-pagination">
          <span>Showing {{ rangeLabel() }} entries</span>

          <div class="bb-pagination-controls">
            <label for="qna-page-size">Rows</label>
            <select
              id="qna-page-size"
              class="bb-select bb-page-size"
              :value="limit"
              @change="
                setLimit(Number(($event.target as HTMLSelectElement).value))
              "
            >
              <option :value="10">10</option>
              <option :value="25">25</option>
              <option :value="50">50</option>
            </select>

            <div v-if="pageCount > 1" class="bb-pager">
              <button
                type="button"
                :disabled="page <= 1"
                aria-label="Previous page"
                @click="goTo(page - 1)"
              >
                ‹
              </button>
              <button type="button" class="current" disabled>{{ page }}</button>
              <button
                type="button"
                :disabled="page >= pageCount"
                aria-label="Next page"
                @click="goTo(page + 1)"
              >
                ›
              </button>
            </div>
          </div>
        </div>
      </template>
    </section>

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
      title="Delete item?"
      subtitle="This action cannot be undone."
      confirm-label="Delete"
      :busy="pendingId !== null"
      :slow="slowSave"
      @update:model-value="
        (v: boolean) => {
          if (!v) pendingDelete = null;
        }
      "
      @confirm="confirmDelete"
    >
      <div
        v-if="mutationError"
        class="bb-notice danger bb-confirm-error"
        role="alert"
      >
        <span>{{ mutationError }}</span>
        <button
          type="button"
          class="bb-btn bb-btn-danger"
          :disabled="pendingId !== null"
          @click="onRetry"
        >
          Retry
        </button>
      </div>

      <div class="bb-notice danger">
        <strong>{{ pendingDelete?.question }}</strong> will be permanently
        removed. The bot will no longer be able to answer from it.
      </div>
    </ConfirmDialog>
  </div>
</template>

<style scoped>
.bb-confirm-error {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 16px;
}

.bb-confirm-error .bb-btn {
  flex-shrink: 0;
}

.bb-pagination-controls {
  display: flex;
  align-items: center;
  gap: 10px;
}

.bb-page-size {
  width: auto;
  min-height: 34px;
  padding: 6px 10px;
  border-radius: 10px;
}
</style>
