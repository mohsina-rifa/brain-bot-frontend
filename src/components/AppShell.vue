<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useRoute, useRouter, RouterLink, RouterView } from "vue-router";
import { BButton, BOffcanvas, BOrchestrator } from "bootstrap-vue-next";
import { useAuthStore } from "@/stores/auth";
import { useActiveBotStore } from "@/stores/activeBot";
import SideNav from "@/components/SideNav.vue";

const auth = useAuthStore();
const activeBot = useActiveBotStore();
const router = useRouter();
const route = useRoute();

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

// Tapping a link in the drawer should navigate and get the drawer out of the
// way, not leave it covering the page it just opened.
watch(() => route.fullPath, () => (showNav.value = false));

function onLogout() {
  auth.logout();
  activeBot.clear();
  router.push({ name: "login" });
}
</script>

<template>
  <div class="d-flex flex-column min-vh-100">
    <a href="#main-content" class="visually-hidden-focusable skip-link">
      Skip to main content
    </a>

    <header class="border-bottom bg-body-tertiary">
      <div class="d-flex align-items-center justify-content-between py-2 px-3">
        <div class="d-flex align-items-center gap-2">
          <BButton
            variant="outline-secondary"
            size="sm"
            class="d-md-none"
            aria-label="Open navigation"
            @click="showNav = true"
          >
            <i class="bi bi-list" />
          </BButton>

          <RouterLink
            to="/bots"
            class="fw-semibold text-decoration-none text-body"
          >
            <i class="bi bi-robot me-2" />BrainBot
          </RouterLink>
        </div>

        <div class="d-flex align-items-center gap-3">
          <BButton variant="outline-secondary" size="sm" @click="onLogout">
            <i class="bi bi-box-arrow-right me-1" />
            <span class="d-none d-sm-inline">Log out</span>
            <span class="visually-hidden d-sm-none">Log out</span>
          </BButton>
        </div>
      </div>
    </header>

    <div class="d-flex flex-grow-1" style="min-width: 0">
      <nav
        class="border-end bg-body-tertiary p-3 d-none d-md-block flex-shrink-0"
        style="width: 15rem"
        aria-label="Main"
      >
        <SideNav :bot-id="botId" :bot-name="activeBot.bot?.name" />
      </nav>

      <main id="main-content" class="flex-grow-1" style="min-width: 0">
        <RouterView />
      </main>
    </div>

    <BOffcanvas v-model="showNav" placement="start" title="Menu" class="d-md-none">
      <SideNav :bot-id="botId" :bot-name="activeBot.bot?.name" />
    </BOffcanvas>

    <BOrchestrator />
  </div>
</template>
