<script setup lang="ts">
import { onMounted, toRef, watch } from "vue";
import { BButton } from "bootstrap-vue-next";
import { useQna } from "@/composables/useQna";
import { useActiveBotStore } from "@/stores/activeBot";
import QnaTable from "@/components/QnaTable.vue";

const props = defineProps<{ id: string }>();

const activeBot = useActiveBotStore();
const { page, rows, total, limit, pageCount, load, goTo } = useQna(
  toRef(props, "id"),
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
          {{ activeBot.bot?.name ?? "Knowledge base" }} · {{ rangeLabel() }}
        </p>
      </div>
    </div>

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
</template>
