<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useRoute, useRouter, RouterView } from "vue-router";
import { BOffcanvas, BOrchestrator } from "bootstrap-vue-next";
import { useAuthStore } from "@/stores/auth";
import { useActiveBotStore } from "@/stores/activeBot";
import { useWriteQueueStore } from "@/stores/writeQueue";
import { useTheme } from "@/composables/useTheme";
import SideNav from "@/components/SideNav.vue";
import ErrorBoundary from "@/components/ErrorBoundary.vue";

const auth = useAuthStore();
const activeBot = useActiveBotStore();
const queue = useWriteQueueStore();
const router = useRouter();
const route = useRoute();
const { theme, toggle: toggleTheme } = useTheme();

const botId = computed(() =>
  typeof route.params.id === "string" ? route.params.id : null,
);

watch(
  botId,
  (id) => {
    if (id) activeBot.ensure(id);
    else activeBot.clear();
  },
  { immediate: true },
);

const showNav = ref(false);

watch(
  () => route.fullPath,
  () => (showNav.value = false),
);

const heading = computed(() => {
  const bot = activeBot.bot?.name;

  switch (route.name) {
    case "qna":
      return {
        title: "Q&A Content",
        subtitle: bot ? `${bot} · Knowledge management` : "Knowledge management",
      };
    case "playground":
      return {
        title: "Playground",
        subtitle: "Test the current knowledge base",
      };
    case "settings":
      return {
        title: "Settings",
        subtitle: bot ? `${bot} · Branding and behavior` : "Branding and behavior",
      };
    default:
      return { title: "Bots", subtitle: "Manage chatbot workspaces" };
  }
});

function onLogout() {
  auth.logout();
  activeBot.clear();
  queue.clear();
  router.push({ name: "login" });
}
</script>

<template>
  <div class="bb-app bb-shell">
    <a href="#main-content" class="bb-skip-link visually-hidden-focusable">
      Skip to main content
    </a>

    <aside class="bb-sidebar">
      <SideNav
        :bot-id="botId"
        :bot-name="activeBot.bot?.name"
        @logout="onLogout"
      />
    </aside>

    <div class="bb-main">
      <header class="bb-topbar">
        <div style="display: flex; align-items: center; gap: 10px">
          <button
            type="button"
            class="bb-icon-btn bb-menu-btn"
            aria-label="Open navigation"
            @click="showNav = true"
          >
            ☰
          </button>
          <div class="bb-page-title">
            <strong>{{ heading.title }}</strong
            ><span>{{ heading.subtitle }}</span>
          </div>
        </div>

        <div class="bb-top-actions">
          <button
            type="button"
            class="bb-icon-btn"
            :title="theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
            :aria-label="
              theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'
            "
            @click="toggleTheme"
          >
            {{ theme === "dark" ? "☀️" : "🌙" }}
          </button>
        </div>
      </header>

      <main id="main-content" class="bb-content">
        <ErrorBoundary>
          <RouterView />
        </ErrorBoundary>
      </main>
    </div>

    <BOffcanvas v-model="showNav" placement="start" title="Menu">
      <SideNav
        :bot-id="botId"
        :bot-name="activeBot.bot?.name"
        @logout="onLogout"
      />
    </BOffcanvas>

    <BOrchestrator />
  </div>
</template>
