<script setup lang="ts">
import { ref } from "vue";
import { BButton, BSpinner } from "bootstrap-vue-next";
import type { Qna } from "@/types/api";

const props = defineProps<{
  rows: Qna[];
  /** Id of the row currently mid-write, so only that row shows as pending. */
  pendingId?: string | null;
  /** Active search term, so matches can be marked. Empty = no highlighting. */
  highlight?: string;
}>();

/** Escape the term so a user typing `.` or `(` searches for that character. */
function escapeRegExp(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Split text into matched and unmatched runs.
 *
 * Deliberately NOT v-html with <mark> injected: the text being highlighted is
 * user content from the knowledge base, and building HTML out of it would be an
 * XSS hole. Returning segments lets the template render ordinary text nodes.
 */
function segments(text: string): { text: string; match: boolean }[] {
  const term = props.highlight?.trim();
  if (!term) return [{ text, match: false }];
  const lower = term.toLowerCase();
  return text
    .split(new RegExp(`(${escapeRegExp(term)})`, "ig"))
    .filter((part) => part !== "")
    .map((part) => ({ text: part, match: part.toLowerCase() === lower }));
}

defineEmits<{ edit: [row: Qna]; remove: [row: Qna] }>();

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
          <tr :class="{ 'opacity-50': pendingId === row.id }">
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
            <td class="fw-semibold">
              <template v-for="(seg, i) in segments(row.question)" :key="i"
                ><mark v-if="seg.match" class="px-0">{{ seg.text }}</mark
                ><template v-else>{{ seg.text }}</template></template
              >
            </td>
            <td
              class="text-body-secondary"
              :class="expanded.has(row.id) ? '' : 'text-truncate'"
              style="max-width: 1px"
            >
              <template v-if="!expanded.has(row.id)"
                ><template v-for="(seg, i) in segments(row.answer)" :key="i"
                  ><mark v-if="seg.match" class="px-0">{{ seg.text }}</mark
                  ><template v-else>{{ seg.text }}</template></template
                ></template
              >
            </td>
            <td class="text-nowrap small text-body-secondary">
              {{ formatDate(row.updatedAt) }}
            </td>
            <td class="text-end text-nowrap">
              <template v-if="pendingId === row.id">
                <BSpinner small />
                <span class="small text-body-secondary ms-2">Saving…</span>
              </template>
              <template v-else>
                <BButton
                  size="sm"
                  variant="outline-secondary"
                  :disabled="Boolean(pendingId)"
                  @click="$emit('edit', row)"
                >
                  Edit
                </BButton>
                <BButton
                  size="sm"
                  variant="outline-danger"
                  class="ms-2"
                  :disabled="Boolean(pendingId)"
                  @click="$emit('remove', row)"
                >
                  Delete
                </BButton>
              </template>
            </td>
          </tr>

          <tr v-if="expanded.has(row.id)" class="table-light">
            <td />
            <td colspan="4" class="pt-0">
              <p class="mb-0 text-body-secondary" style="white-space: pre-wrap">
                <template v-for="(seg, i) in segments(row.answer)" :key="i"
                  ><mark v-if="seg.match" class="px-0">{{ seg.text }}</mark
                  ><template v-else>{{ seg.text }}</template></template
                >
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
