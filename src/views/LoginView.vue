<script setup lang="ts">
import { computed, ref } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { toMessage } from "@/api/client";
import { useSlowFlag } from "@/composables/useSlowFlag";
import { useTheme } from "@/composables/useTheme";

const auth = useAuthStore();
const router = useRouter();
const route = useRoute();
const { theme, toggle: toggleTheme } = useTheme();

const email = ref("");
const password = ref("");
const showPassword = ref(false);
const submitting = ref(false);
const error = ref<string | null>(null);

const { slow, start: startSlow, stop: stopSlow } = useSlowFlag();

const expired = computed(() => route.query.reason === "expired");

async function onSubmit() {
  error.value = null;
  submitting.value = true;
  startSlow();
  try {
    await auth.login(email.value, password.value);
    const next =
      typeof route.query.next === "string" ? route.query.next : "/bots";
    await router.replace(next);
  } catch (err) {
    error.value = toMessage(err);
  } finally {
    submitting.value = false;
    stopSlow();
  }
}
</script>

<template>
  <div class="bb-app">
    <button
      type="button"
      class="bb-icon-btn bb-theme-login"
      :title="theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
      :aria-label="
        theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'
      "
      @click="toggleTheme"
    >
      {{ theme === "dark" ? "☀️" : "🌙" }}
    </button>

    <main class="bb-auth-page">
      <section class="bb-auth-visual">
        <div class="bb-auth-grid"></div>

        <div class="bb-auth-visual-content">
          <div class="bb-brand" style="padding: 0">
            <div class="bb-brand-mark">✦</div>
            <div class="bb-brand-text">
              <strong>Brain Bot</strong
              ><span style="color: #94a3b8">Operator Console</span>
            </div>
          </div>
        </div>

        <div class="bb-auth-visual-content">
          <h1>Manage knowledge.<br />Test answers.<br />Ship confidently.</h1>
          <p>
            A focused workspace for operators to manage bots, curate Q&amp;A
            content, test conversations and maintain branding.
          </p>
          <div class="bb-auth-feature">
            <div>
              <strong>Knowledge</strong><span>Curate supported Q&amp;A</span>
            </div>
            <div>
              <strong>Playground</strong><span>Test real bot answers</span>
            </div>
            <div>
              <strong>Branding</strong><span>Keep every bot on-brand</span>
            </div>
          </div>
        </div>

        <div
          class="bb-auth-visual-content"
          style="font-size: 11px; color: #94a3b8"
        >
          Operator workspace · secure access
        </div>
      </section>

      <section class="bb-auth-form-wrap">
        <form class="bb-auth-form" novalidate @submit.prevent="onSubmit">
          <div class="bb-logo-line">
            <div class="bb-brand-mark">✦</div>
            <div>
              <strong>Brain Bot</strong>
              <div style="font-size: 11px; color: var(--bb-muted)">
                Operator Console
              </div>
            </div>
          </div>

          <h2>Welcome back</h2>
          <p>Sign in to manage your chatbot workspace.</p>

          <div
            v-if="expired && !error"
            class="bb-notice warning"
            style="margin-bottom: 16px"
            role="status"
          >
            Your session has expired. Sign in again to pick up where you left
            off.
          </div>

          <div
            v-if="error"
            class="bb-notice danger"
            style="margin-bottom: 16px"
            role="alert"
          >
            {{ error }}
          </div>

          <div
            v-if="submitting && slow"
            class="bb-notice"
            style="margin-bottom: 16px"
            role="status"
          >
            Still signing in. The server may be starting up — give it a moment.
          </div>

          <div class="bb-form-group">
            <label class="bb-form-label" for="email">Email address</label>
            <input
              id="email"
              v-model="email"
              class="bb-input"
              type="email"
              required
              autocomplete="username"
              placeholder="admin@bs23.com"
              :disabled="submitting"
            />
          </div>

          <div class="bb-form-group">
            <label class="bb-form-label" for="password">Password</label>
            <div class="bb-color-row">
              <input
                id="password"
                v-model="password"
                class="bb-input"
                :type="showPassword ? 'text' : 'password'"
                required
                autocomplete="current-password"
                :disabled="submitting"
              />
              <button
                type="button"
                class="bb-icon-btn"
                :disabled="submitting"
                :aria-label="showPassword ? 'Hide password' : 'Show password'"
                :aria-pressed="showPassword"
                @click="showPassword = !showPassword"
              >
                <i
                  :class="showPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"
                  aria-hidden="true"
                />
              </button>
            </div>
          </div>

          <button
            type="submit"
            class="bb-btn bb-btn-primary"
            :disabled="submitting || !email || !password"
          >
            {{ submitting ? "Signing in…" : "Sign in →" }}
          </button>

          <div class="bb-auth-foot">
            Operator access only · sessions expire automatically
          </div>
        </form>
      </section>
    </main>
  </div>
</template>
