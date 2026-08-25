<script setup lang="ts">
import { useRouter } from "vue-router";
import { BButton } from "bootstrap-vue-next";
import { useAuthStore } from "@/stores/auth";

const auth = useAuthStore();
const router = useRouter();

function onLogout() {
  auth.logout();
  router.push({ name: "login" });
}
</script>

<template>
  <div class="container py-4">
    <div class="d-flex justify-content-between align-items-start mb-3">
      <div>
        <h1 class="h4 mb-1">Bots</h1>
        <p class="text-body-secondary mb-0">Not built yet — SUBTASK-2.2.</p>
      </div>
      <BButton variant="outline-secondary" size="sm" @click="onLogout">
        <i class="bi bi-box-arrow-right me-1" />
        Log out
      </BButton>
    </div>
  </div>
</template>
