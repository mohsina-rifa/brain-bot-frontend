<script setup lang="ts">
import { computed } from "vue";
import { RouterLink } from "vue-router";

const props = defineProps<{
  botId: string | null;
  botName?: string | null;
}>();

defineEmits<{ logout: [] }>();

/*
 * The prototype's sidebar always lists all four destinations. Three of them are
 * bot-scoped routes (/bots/:id/...), so with no bot chosen they have nowhere to
 * point — they keep their place in the list but render inert.
 */
const links = computed(() => [
  { label: "Bots", icon: "🤖", to: "/bots", enabled: true },
  {
    label: "Q&A Content",
    icon: "⌁",
    to: props.botId ? `/bots/${props.botId}/qna` : null,
    enabled: Boolean(props.botId),
  },
  {
    label: "Playground",
    icon: "▶",
    to: props.botId ? `/bots/${props.botId}/playground` : null,
    enabled: Boolean(props.botId),
  },
  {
    label: "Settings",
    icon: "⚙",
    to: props.botId ? `/bots/${props.botId}/settings` : null,
    enabled: Boolean(props.botId),
  },
]);
</script>

<template>
  <div class="bb-brand">
    <div class="bb-brand-mark">✦</div>
    <div class="bb-brand-text">
      <strong>Brain Bot</strong><span>Operator Console</span>
    </div>
  </div>

  <div>
    <div class="bb-nav-section-title">Workspace</div>
    <nav class="bb-nav" aria-label="Main">
      <template v-for="link in links" :key="link.label">
        <RouterLink
          v-if="link.enabled && link.to"
          :to="link.to"
          active-class="active"
        >
          <span class="bb-icon">{{ link.icon }}</span>{{ link.label }}
        </RouterLink>
        <span
          v-else
          class="bb-nav-disabled"
          aria-disabled="true"
          title="Select a bot first"
        >
          <span class="bb-icon">{{ link.icon }}</span>{{ link.label }}
        </span>
      </template>
    </nav>
  </div>

  <div class="bb-sidebar-footer">
    <div v-if="botId" class="bb-notice">
      Selected bot<br /><strong>{{ botName ?? "Loading…" }}</strong>
    </div>

    <div class="bb-user-card">
      <div class="bb-avatar">AD</div>
      <div class="bb-user-meta">
        <strong>Admin User</strong><span>Operator</span>
      </div>
      <button
        type="button"
        class="bb-icon-btn"
        title="Sign out"
        aria-label="Sign out"
        @click="$emit('logout')"
      >
        ↗
      </button>
    </div>
  </div>
</template>
