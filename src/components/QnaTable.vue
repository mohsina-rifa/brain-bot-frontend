<script setup lang="ts">
import { ref } from "vue";
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
  <div class="bb-table-wrap bb-qna-scroll">
    <table class="bb-table">
      <thead class="bb-sticky-head">
        <tr>
          <th style="width: 29%">Question</th>
          <th>Answer</th>
          <th class="bb-nowrap">Updated</th>
          <th style="width: 1%">Status</th>
          <th style="width: 1%; text-align: right">Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="row in rows"
          :key="row.id"
          :style="{ opacity: pendingId === row.id ? 0.5 : 1 }"
        >
          <td>
            <div class="bb-table-title">
              <template v-for="(seg, i) in segments(row.question)" :key="i"
                ><mark v-if="seg.match">{{ seg.text }}</mark
                ><template v-else>{{ seg.text }}</template></template
              >
            </div>
            <button
              type="button"
              class="bb-table-sub bb-link"
              :aria-expanded="expanded.has(row.id)"
              :aria-label="
                expanded.has(row.id)
                  ? `Collapse answer to ${row.question}`
                  : `Expand answer to ${row.question}`
              "
              @click="toggle(row.id)"
            >
              {{ expanded.has(row.id) ? "Hide full answer" : "Show full answer" }}
            </button>
          </td>

          <td>
            <div :class="expanded.has(row.id) ? 'bb-qna-full' : 'bb-qna-answer'">
              <template v-for="(seg, i) in segments(row.answer)" :key="i"
                ><mark v-if="seg.match">{{ seg.text }}</mark
                ><template v-else>{{ seg.text }}</template></template
              >
            </div>
          </td>

          <td class="bb-nowrap">{{ formatDate(row.updatedAt) }}</td>

          <td>
            <span
              class="bb-badge"
              :class="pendingId === row.id ? 'warning' : 'success'"
            >
              <span class="bb-dot"></span
              >{{ pendingId === row.id ? "Saving" : "Ready" }}
            </span>
          </td>

          <td>
            <div class="bb-row-actions">
              <button
                type="button"
                class="bb-icon-btn"
                :disabled="Boolean(pendingId)"
                :aria-label="`Edit ${row.question}`"
                title="Edit entry"
                @click="$emit('edit', row)"
              >
                ✎
              </button>
              <button
                type="button"
                class="bb-icon-btn"
                :disabled="Boolean(pendingId)"
                :aria-label="`Delete ${row.question}`"
                title="Delete entry"
                @click="$emit('remove', row)"
              >
                ⌫
              </button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.bb-qna-scroll {
  max-height: calc(100vh - 22rem);
  overflow-y: auto;
}

.bb-sticky-head th {
  position: sticky;
  top: 0;
  z-index: 1;
}

.bb-nowrap {
  white-space: nowrap;
}

/* Expanded rows drop the single-line clamp and wrap in place, so the row grows
   instead of pushing a second <tr> in underneath it. */
.bb-qna-full {
  color: var(--bb-muted);
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.bb-link {
  border: 0;
  background: none;
  padding: 0;
  color: var(--bb-primary);
  font-size: 12px;
  font-weight: 700;
}

.bb-link:hover {
  text-decoration: underline;
}

mark {
  padding: 0;
  background: color-mix(in srgb, var(--bb-warning) 30%, transparent);
  color: inherit;
  border-radius: 3px;
}
</style>
