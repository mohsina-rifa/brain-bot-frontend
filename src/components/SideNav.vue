<script setup lang="ts">
import { RouterLink } from "vue-router";

defineProps<{ botId: string | null; botName?: string | null }>();
</script>

<template>
  <!-- One nav, rendered twice: as the fixed sidebar from md up, and inside the
       offcanvas drawer below it. Keeping it here stops the two drifting apart. -->
  <ul class="nav nav-pills flex-column gap-1">
    <li class="nav-item">
      <RouterLink to="/bots" class="nav-link" active-class="active">
        <i class="bi bi-grid me-2" />Bots
      </RouterLink>
    </li>
  </ul>

  <template v-if="botId">
    <hr />
    <div class="text-uppercase small text-body-secondary mb-1">Selected bot</div>
    <div class="small fw-semibold text-truncate mb-2">
      {{ botName ?? "Loading…" }}
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
</template>
