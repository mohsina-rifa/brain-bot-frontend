<script setup lang="ts">
import { computed } from "vue";
import { useRoute, useRouter, RouterLink, RouterView } from "vue-router";
import { BButton } from "bootstrap-vue-next";
import { useAuthStore } from "@/stores/auth";

const auth = useAuthStore();
const router = useRouter();
const route = useRoute();

const botId = computed(() =>
  typeof route.params.id === "string" ? route.params.id : null,
);

function onLogout() {
  auth.logout();
  router.push({ name: "login" });
}
</script>

<template>
  <div class="d-flex flex-column min-vh-100">
    <header class="border-bottom bg-body-tertiary">
      <div class="d-flex align-items-center justify-content-between py-2 px-3">
        <RouterLink
          to="/bots"
          class="fw-semibold text-decoration-none text-body"
        >
          <i class="bi bi-robot me-2" />BrainBot
        </RouterLink>

        <div class="d-flex align-items-center gap-3">
          <span
            v-if="auth.user?.role"
            class="small text-body-secondary d-none d-sm-inline"
          >
            {{ auth.user.role }}
          </span>
          <BButton variant="outline-secondary" size="sm" @click="onLogout">
            <i class="bi bi-box-arrow-right me-1" />Log out
          </BButton>
        </div>
      </div>
    </header>

    <div class="d-flex flex-grow-1">
      <nav
        class="border-end bg-body-tertiary p-3 d-none d-md-block"
        style="width: 15rem"
      >
        <ul class="nav nav-pills flex-column gap-1">
          <li class="nav-item">
            <RouterLink to="/bots" class="nav-link" active-class="active">
              <i class="bi bi-grid me-2" />Bots
            </RouterLink>
          </li>
        </ul>

        <template v-if="botId">
          <hr />
          <div class="text-uppercase small text-body-secondary mb-2">
            Selected bot
          </div>
          <ul class="nav nav-pills flex-column gap-1">
            <li class="nav-item">
              <RouterLink
                :to="`/bots/${botId}/qna`"
                class="nav-link"
                active-class="active"
              >
                <i class="bi bi-chat-square-text me-2" />Q&amp;A
              </RouterLink>
            </li>
            <li class="nav-item">
              <RouterLink
                :to="`/bots/${botId}/playground`"
                class="nav-link"
                active-class="active"
              >
                <i class="bi bi-play-circle me-2" />Playground
              </RouterLink>
            </li>
            <li class="nav-item">
              <RouterLink
                :to="`/bots/${botId}/settings`"
                class="nav-link"
                active-class="active"
              >
                <i class="bi bi-sliders me-2" />Settings
              </RouterLink>
            </li>
          </ul>
        </template>
      </nav>

      <main class="flex-grow-1">
        <RouterView />
      </main>
    </div>
  </div>
</template>
