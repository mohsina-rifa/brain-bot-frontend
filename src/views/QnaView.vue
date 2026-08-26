<script setup lang="ts">
import { onMounted, toRef, watch } from "vue";
import { BButton, BAlert, BSpinner } from "bootstrap-vue-next";
import { useQna } from "@/composables/useQna";
import { useActiveBotStore } from "@/stores/activeBot";
import QnaTable from "@/components/QnaTable.vue";

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
  retry,
} = useQna(toRef(props, "id"));

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
  const first = (page.value - 1) * limit + 1;
  const last = Math.min(page.value * limit, total.value);
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
      <p class="text-body-secondary mb-0">
        This bot has nothing to answer from. Add a question and answer to start
        building its knowledge base.
      </p>
    </div>

    <!-- Content -->
    <div v-else>
      <QnaTable :rows="rows" />

      <div
        v-if="pageCount > 1"
        class="d-flex justify-content-between align-items-center mt-3"
      >
        <small class="text-body-secondary">
          Page {{ page }} of {{ pageCount }}
        </small>
        <div class="d-flex gap-2">
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
  </div>
</template>
