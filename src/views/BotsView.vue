<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { BButton, BAlert, BSpinner } from "bootstrap-vue-next";
import { useBots } from "@/composables/useBots";
import { useActiveBotStore } from "@/stores/activeBot";
import CreateBotDialog from "@/components/CreateBotDialog.vue";
import ConfirmDialog from "@/components/ConfirmDialog.vue";
import LoadingSkeleton from "@/components/LoadingSkeleton.vue";
import ErrorState from "@/components/ErrorState.vue";
import EmptyState from "@/components/EmptyState.vue";
import type { Bot } from "@/types/api";

const {
  page,
  bots,
  hasLoaded,
  total,
  pageCount,
  loading,
  error,
  slow,
  retrying,
  load,
  goTo,
  retry,
  remove,
  retryRemove,
  removing,
  removeError,
} = useBots();

const router = useRouter();
const activeBot = useActiveBotStore();

const showCreate = ref(false);
const pendingDelete = ref<Bot | null>(null);

onMounted(load);

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(
    new Date(iso),
  );
}

function open(bot: Bot) {
  activeBot.set(bot);
  router.push(`/bots/${bot._id}/qna`);
}

async function confirmDelete() {
  const bot = pendingDelete.value;
  if (!bot) return;

  const ok = await remove(bot._id);
  if (!ok) return;

  if (activeBot.bot?._id === bot._id) activeBot.clear();
  pendingDelete.value = null;
}

async function onRetryDelete() {
  const ok = await retryRemove();
  if (ok) pendingDelete.value = null;
}
</script>

<template>
  <div class="container-fluid py-4 px-4">
    <div
      class="d-flex flex-wrap gap-2 justify-content-between align-items-start mb-3"
    >
      <div>
        <h1 class="h4 mb-1">Bots</h1>
        <p class="text-body-secondary mb-0 d-flex align-items-center gap-2">
          <span v-if="!hasLoaded && loading">Loading…</span>
          <span v-else-if="error">Unavailable</span>
          <span v-else>{{ total }} {{ total === 1 ? "bot" : "bots" }}</span>
          <BSpinner v-if="hasLoaded && loading" small />
        </p>
      </div>
      <BButton variant="primary" @click="showCreate = true">
        <i class="bi bi-plus-lg me-1" />Create bot
      </BButton>
    </div>

    <BAlert
      v-if="removeError"
      :model-value="true"
      variant="danger"
      class="mb-3 d-flex justify-content-between align-items-center gap-3"
    >
      <span>{{ removeError }}</span>
      <span class="d-flex gap-2 flex-shrink-0">
        <BButton
          variant="outline-danger"
          size="sm"
          :disabled="removing !== null"
          @click="onRetryDelete"
        >
          Retry delete
        </BButton>
        <BButton
          variant="outline-secondary"
          size="sm"
          @click="removeError = null"
        >
          Dismiss
        </BButton>
      </span>
    </BAlert>

    <LoadingSkeleton
      v-if="loading && !hasLoaded"
      :rows="5"
      :columns="4"
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
      v-else-if="!bots.length"
      icon="robot"
      title="No bots yet"
      description="Create your first bot to start building a knowledge base."
      action-label="Create bot"
      @action="showCreate = true"
    />

    <!-- Table -->
    <div v-else>
      <div
        class="table-responsive border rounded"
        :class="{ 'opacity-50': loading }"
        :aria-busy="loading"
        style="transition: opacity 120ms ease"
      >
        <table class="table table-hover align-middle mb-0">
          <thead class="table-light">
            <tr>
              <th scope="col">Name</th>
              <th scope="col">Status</th>
              <th scope="col">Created</th>
              <th scope="col" class="text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="bot in bots" :key="bot._id">
              <td>
                <button
                  type="button"
                  class="btn btn-link p-0 fw-semibold text-decoration-none"
                  @click="open(bot)"
                >
                  <span
                    class="d-inline-block rounded-circle me-2 align-middle"
                    :style="{
                      width: '.6rem',
                      height: '.6rem',
                      backgroundColor: bot.color,
                    }"
                  />
                  {{ bot.name }}
                </button>
                <div class="small text-body-secondary">
                  {{ bot.description }}
                </div>
              </td>
              <td>
                <span
                  class="badge"
                  :class="
                    bot.status === 'active'
                      ? 'text-bg-success'
                      : 'text-bg-secondary'
                  "
                >
                  {{ bot.status }}
                </span>
              </td>
              <td class="text-nowrap">{{ formatDate(bot.createdAt) }}</td>
              <td class="text-end text-nowrap">
                <BButton
                  size="sm"
                  variant="outline-secondary"
                  @click="open(bot)"
                >
                  Open
                </BButton>
                <BButton
                  size="sm"
                  variant="outline-danger"
                  class="ms-2"
                  :disabled="removing === bot._id"
                  @click="pendingDelete = bot"
                >
                  <BSpinner v-if="removing === bot._id" small />
                  <span v-else>Delete</span>
                </BButton>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div
        v-if="pageCount > 1"
        class="d-flex justify-content-between align-items-center mt-3"
      >
        <small class="text-body-secondary"
          >Page {{ page }} of {{ pageCount }}</small
        >
        <div class="d-flex gap-2">
          <BButton
            size="sm"
            variant="outline-secondary"
            :disabled="page <= 1 || loading"
            @click="goTo(page - 1)"
          >
            Previous
          </BButton>
          <BButton
            size="sm"
            variant="outline-secondary"
            :disabled="page >= pageCount || loading"
            @click="goTo(page + 1)"
          >
            Next
          </BButton>
        </div>
      </div>
    </div>

    <CreateBotDialog v-model="showCreate" @created="load" />

    <ConfirmDialog
      :model-value="pendingDelete !== null"
      title="Delete bot"
      confirm-label="Delete bot"
      :busy="removing !== null"
      @update:model-value="
        (v: boolean) => {
          if (!v) pendingDelete = null;
        }
      "
      @confirm="confirmDelete"
    >
      Delete <strong>{{ pendingDelete?.name }}</strong
      >? Its Q&amp;A content and conversations will no longer be reachable. This
      cannot be undone.
    </ConfirmDialog>
  </div>
</template>
