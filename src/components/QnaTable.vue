<script setup lang="ts">
import type { Qna } from "@/types/api";

defineProps<{ rows: Qna[] }>();

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}
</script>

<template>
  <div class="table-responsive border rounded">
    <table class="table table-hover align-middle mb-0">
      <thead class="table-light">
        <tr>
          <th scope="col" style="width: 35%">Question</th>
          <th scope="col">Answer</th>
          <th scope="col" class="text-nowrap">Updated</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in rows" :key="row.id">
          <td class="fw-semibold">{{ row.question }}</td>
          <td class="text-body-secondary text-truncate" style="max-width: 1px">
            {{ row.answer }}
          </td>
          <td class="text-nowrap small text-body-secondary">
            {{ formatDate(row.updatedAt) }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
