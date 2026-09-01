<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { useBots } from "@/composables/useBots";
import { useDebouncedCallback } from "@/composables/useDebounce";
import { useWorkspaceMetrics, useBotCounts } from "@/composables/useMetrics";
import { useActiveBotStore } from "@/stores/activeBot";
import CreateBotDialog from "@/components/CreateBotDialog.vue";
import ConfirmDialog from "@/components/ConfirmDialog.vue";
import LoadingSkeleton from "@/components/LoadingSkeleton.vue";
import ErrorState from "@/components/ErrorState.vue";
import EmptyState from "@/components/EmptyState.vue";
import type { Bot } from "@/types/api";

const {
  page,
  search,
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
  cancel,
  remove,
  removing,
  removeError,
  slowRemove,
} = useBots();

const router = useRouter();
const activeBot = useActiveBotStore();
const metrics = useWorkspaceMetrics();
const { counts, load: loadCounts } = useBotCounts();

const showCreate = ref(false);
const pendingDelete = ref<Bot | null>(null);

const term = ref("");

const { invoke: applySearch } = useDebouncedCallback((value: string) => {
  search.value = value;
  page.value = 1;
  void load();
}, 300);

watch(term, (value) => applySearch(value));

// The per-card counts follow whichever bots are on screen, so they refresh
// after a page change, a search, a create or a delete.
watch(bots, (rows) => {
  if (rows.length) void loadCounts(rows.map((bot) => bot._id));
});

async function refresh() {
  await load();
  void metrics.load();
}

onMounted(refresh);

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0])
      .join("")
      .toUpperCase() || "?"
  );
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(
    new Date(iso),
  );
}

function open(bot: Bot) {
  activeBot.set(bot);
  router.push(`/bots/${bot._id}/qna`);
}

function onRequestDelete(bot: Bot) {
  removeError.value = null;
  pendingDelete.value = bot;
}

async function confirmDelete() {
  const bot = pendingDelete.value;
  if (!bot) return;

  const ok = await remove(bot._id);
  if (!ok) return;

  if (activeBot.bot?._id === bot._id) activeBot.clear();
  pendingDelete.value = null;
  void metrics.load();
}
</script>

<template>
  <div>
    <section class="bb-page-head">
      <div>
        <h1>Your bots</h1>
        <p>
          Create and manage chatbot workspaces. Each bot keeps its own Q&amp;A
          knowledge, conversations and branding.
        </p>
      </div>
      <div class="bb-page-actions">
        <button
          type="button"
          class="bb-btn bb-btn-primary"
          @click="showCreate = true"
        >
          ＋ Create bot
        </button>
      </div>
    </section>

    <section class="bb-metric-grid">
      <div class="bb-card bb-metric">
        <div class="bb-metric-top">
          <span class="bb-metric-label">Total bots</span><span>🤖</span>
        </div>
        <div class="bb-metric-value">{{ metrics.totalBots.value ?? "—" }}</div>
        <div class="bb-metric-note">Across this workspace</div>
      </div>

      <div class="bb-card bb-metric">
        <div class="bb-metric-top">
          <span class="bb-metric-label">Active</span>
          <span class="bb-badge success"><span class="bb-dot"></span>Healthy</span>
        </div>
        <div class="bb-metric-value">{{ metrics.activeBots.value ?? "—" }}</div>
        <div class="bb-metric-note">Ready to answer users</div>
      </div>

      <div class="bb-card bb-metric">
        <div class="bb-metric-top">
          <span class="bb-metric-label">Q&amp;A entries</span><span>▤</span>
        </div>
        <div class="bb-metric-value">{{ metrics.qnaEntries.value ?? "—" }}</div>
        <div class="bb-metric-note">Managed knowledge items</div>
      </div>

      <div class="bb-card bb-metric">
        <div class="bb-metric-top">
          <span class="bb-metric-label">Test conversations</span><span>◌</span>
        </div>
        <div class="bb-metric-value">
          {{ metrics.conversations.value ?? "—" }}
        </div>
        <div class="bb-metric-note">Created in playground</div>
      </div>
    </section>

    <div class="bb-toolbar" style="margin-bottom: 16px">
      <div class="bb-input-wrap">
        <span class="bb-search-icon">⌕</span>
        <input
          v-model="term"
          class="bb-input search"
          type="search"
          placeholder="Search bots by name..."
          aria-label="Search bots by name"
        />
      </div>
      <span v-if="hasLoaded" class="bb-metric-label">
        {{ total }} {{ total === 1 ? "bot" : "bots" }}
      </span>
    </div>

    <LoadingSkeleton
      v-if="loading && !hasLoaded"
      :rows="3"
      :columns="3"
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

    <EmptyState
      v-else-if="!bots.length && search"
      illustration="search"
      title="No bots match that search"
      description="Try a different name, or clear the search to see every bot."
      action-label="Clear search"
      action-variant="secondary"
      @action="term = ''"
    />

    <EmptyState
      v-else-if="!bots.length"
      illustration="bots"
      title="No bots yet"
      description="Create your first bot to start building a knowledge base."
      action-label="Create bot"
      @action="showCreate = true"
    />

    <template v-else>
      <section
        class="bb-bot-grid"
        :style="{ opacity: loading ? 0.5 : 1, transition: 'opacity 120ms ease' }"
        :aria-busy="loading"
      >
        <article
          v-for="bot in bots"
          :key="bot._id"
          class="bb-card bb-bot-card"
          :style="{ '--bb-bot-color': bot.color }"
        >
          <div class="bb-bot-card-head">
            <div class="bb-bot-icon">{{ initials(bot.name) }}</div>
            <span
              class="bb-badge"
              :class="bot.status === 'active' ? 'success' : 'neutral'"
            >
              <span class="bb-dot"></span
              >{{ bot.status === "active" ? "Active" : "Inactive" }}
            </span>
          </div>

          <h3>{{ bot.name }}</h3>
          <p>{{ bot.description }}</p>

          <div class="bb-bot-stats">
            <div class="bb-bot-stat">
              <strong>{{ counts[bot._id]?.qna ?? "—" }}</strong>
              <span>Q&amp;A entries</span>
            </div>
            <div class="bb-bot-stat">
              <strong>{{ counts[bot._id]?.conversations ?? "—" }}</strong>
              <span>Test chats</span>
            </div>
          </div>

          <div class="bb-bot-card-actions">
            <button type="button" class="bb-btn" @click="open(bot)">
              Manage
            </button>
            <button
              type="button"
              class="bb-btn bb-btn-primary"
              @click="
                activeBot.set(bot);
                router.push(`/bots/${bot._id}/playground`);
              "
            >
              Test bot
            </button>
            <button
              type="button"
              class="bb-icon-btn"
              :disabled="removing === bot._id"
              :aria-label="`Delete ${bot.name}`"
              title="Delete bot"
              @click="onRequestDelete(bot)"
            >
              ⌫
            </button>
          </div>

          <div class="bb-metric-note">Created {{ formatDate(bot.createdAt) }}</div>
        </article>
      </section>

      <div v-if="pageCount > 1" class="bb-pagination">
        <span>Page {{ page }} of {{ pageCount }} · {{ total }} bots</span>
        <div class="bb-pager">
          <button
            type="button"
            :disabled="page <= 1 || loading"
            aria-label="Previous page"
            @click="goTo(page - 1)"
          >
            ‹
          </button>
          <button
            type="button"
            :disabled="page >= pageCount || loading"
            aria-label="Next page"
            @click="goTo(page + 1)"
          >
            ›
          </button>
        </div>
      </div>
    </template>

    <CreateBotDialog v-model="showCreate" @created="refresh" />

    <ConfirmDialog
      :model-value="pendingDelete !== null"
      title="Delete bot?"
      subtitle="This action cannot be undone."
      confirm-label="Delete"
      :busy="removing !== null"
      :slow="slowRemove"
      @update:model-value="
        (v: boolean) => {
          if (!v) {
            pendingDelete = null;
            removeError = null;
          }
        }
      "
      @confirm="confirmDelete"
    >
      <div
        v-if="removeError"
        class="bb-notice danger bb-confirm-error"
        role="alert"
      >
        <span>{{ removeError }}</span>
        <button
          type="button"
          class="bb-btn bb-btn-danger"
          :disabled="removing !== null"
          @click="confirmDelete"
        >
          Retry
        </button>
      </div>

      <div class="bb-notice danger">
        <strong>{{ pendingDelete?.name }}</strong> will be permanently removed.
        Its Q&amp;A content and conversations will no longer be reachable.
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

.bb-bot-card .bb-metric-note {
  margin-top: 12px;
}
</style>
