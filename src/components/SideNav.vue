<script setup lang="ts">
import { RouterLink } from "vue-router";

defineProps<{ botId: string | null; botName?: string | null }>();
</script>

<template>
  <div class="side-nav">
    <ul class="nav nav-pills flex-column gap-1">
      <li class="nav-item">
        <RouterLink to="/bots" class="nav-link" active-class="active">
          <i class="bi bi-grid" />Bots
        </RouterLink>
      </li>
    </ul>

    <template v-if="botId">
      <div class="side-nav-label">Selected bot</div>
      <div class="side-nav-bot text-truncate">{{ botName ?? "Loading…" }}</div>

      <ul class="nav nav-pills flex-column gap-1">
        <li class="nav-item">
          <RouterLink
            :to="`/bots/${botId}/qna`"
            class="nav-link"
            active-class="active"
          >
            <i class="bi bi-chat-square-text" />Q&amp;A
          </RouterLink>
        </li>
        <li class="nav-item">
          <RouterLink
            :to="`/bots/${botId}/playground`"
            class="nav-link"
            active-class="active"
          >
            <i class="bi bi-play-circle" />Playground
          </RouterLink>
        </li>
        <li class="nav-item">
          <RouterLink
            :to="`/bots/${botId}/settings`"
            class="nav-link"
            active-class="active"
          >
            <i class="bi bi-sliders" />Settings
          </RouterLink>
        </li>
      </ul>
    </template>
  </div>
</template>

<style scoped>
.side-nav {
  --side-nav-hover: color-mix(in srgb, var(--bs-emphasis-color) 7%, transparent);
  --side-nav-active: color-mix(in srgb, var(--bs-primary) 12%, transparent);
}

.side-nav .nav-link {
  --bs-nav-link-color: var(--bs-body-color);
  --bs-nav-link-hover-color: var(--bs-emphasis-color);
  --bs-nav-pills-link-active-bg: transparent;
  --bs-nav-pills-link-active-color: var(--bs-emphasis-color);

  position: relative;
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.5rem 0.75rem 0.5rem 0.875rem;
  border-radius: 0.5rem;
  font-size: 0.9375rem;
  font-weight: 500;
  transition: background-color 0.12s ease;
}

.side-nav .nav-link:hover {
  background-color: var(--side-nav-hover);
}

.side-nav .nav-link.active {
  background-color: var(--side-nav-active);
  font-weight: 600;
}

.side-nav .nav-link.active::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0.375rem;
  bottom: 0.375rem;
  width: 0.1875rem;
  border-radius: 0.1875rem;
  background: var(--bs-primary);
}

.side-nav .nav-link i {
  font-size: 1rem;
  opacity: 0.65;
}

.side-nav .nav-link.active i {
  opacity: 1;
}

/*
 * The section heading replaces a plain <hr>: a hairline above it does the
 * dividing, so the group reads as one unit instead of two stacked lists.
 */
.side-nav-label {
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid var(--bs-border-color);
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--bs-secondary-color);
}

.side-nav-bot {
  margin-bottom: 0.75rem;
  font-size: 0.9375rem;
  font-weight: 600;
}
</style>
