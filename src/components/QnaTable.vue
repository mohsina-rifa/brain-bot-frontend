<script setup lang="ts">
import { ref } from "vue";
import { BButton } from "bootstrap-vue-next";
import type { Qna } from "@/types/api";

defineProps<{ rows: Qna[] }>();

defineEmits<{ edit: [row: Qna] }>();

const expanded = ref<Set<string>>(new Set());

function toggle(id: string) {
  const next = new Set(expanded.value);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  expanded.value = next;
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}
</script>

<template>
  <div class="table-responsive border rounded qna-scroll">
    <table class="table table-hover align-middle mb-0">
      <thead class="table-light qna-sticky-head">
        <tr>
          <th scope="col" style="width: 2.5rem">
            <span class="visually-hidden">Expand</span>
          </th>
          <th scope="col" style="width: 32%">Question</th>
          <th scope="col">Answer</th>
          <th scope="col" class="text-nowrap">Updated</th>
          <th scope="col" class="text-end">Actions</th>
        </tr>
      </thead>
      <tbody>
        <template v-for="row in rows" :key="row.id">
          <tr>
            <td>
              <button
                type="button"
                class="btn btn-sm btn-link p-0 text-body-secondary"
                :aria-expanded="expanded.has(row.id)"
                :aria-label="
                  expanded.has(row.id)
                    ? `Collapse answer to ${row.question}`
                    : `Expand answer to ${row.question}`
                "
                @click="toggle(row.id)"
              >
                <i
                  class="bi"
                  :class="
                    expanded.has(row.id)
                      ? 'bi-chevron-down'
                      : 'bi-chevron-right'
                  "
                />
              </button>
            </td>
            <td class="fw-semibold">{{ row.question }}</td>
            <td
              class="text-body-secondary"
              :class="expanded.has(row.id) ? '' : 'text-truncate'"
              style="max-width: 1px"
            >
              {{ expanded.has(row.id) ? "" : row.answer }}
            </td>
            <td class="text-nowrap small text-body-secondary">
              {{ formatDate(row.updatedAt) }}
            </td>
            <td class="text-end text-nowrap">
              <BButton
                size="sm"
                variant="outline-secondary"
                @click="$emit('edit', row)"
              >
                Edit
              </BButton>
            </td>
          </tr>

          <tr v-if="expanded.has(row.id)" class="table-light">
            <td />
            <td colspan="4" class="pt-0">
              <p class="mb-0 text-body-secondary" style="white-space: pre-wrap">
                {{ row.answer }}
              </p>
            </td>
          </tr>
        </template>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.qna-scroll {
  max-height: calc(100vh - 18rem);
  overflow-y: auto;
}

.qna-sticky-head th {
  position: sticky;
  top: 0;
  z-index: 1;
  background-color: var(--bs-table-bg, var(--bs-tertiary-bg));
}
</style>
