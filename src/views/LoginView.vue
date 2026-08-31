<script setup lang="ts">
import { computed, ref } from "vue";
import { useRouter, useRoute } from "vue-router";
import {
  BForm,
  BFormGroup,
  BFormInput,
  BButton,
  BAlert,
  BSpinner,
} from "bootstrap-vue-next";
import { useAuthStore } from "@/stores/auth";
import { toMessage } from "@/api/client";
import { useSlowFlag } from "@/composables/useSlowFlag";

const auth = useAuthStore();
const router = useRouter();
const route = useRoute();

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
  <div class="container" style="max-width: 26rem">
    <div class="py-5">
      <h1 class="h3 mb-1">Sign in</h1>
      <p class="text-body-secondary mb-4">
        Manage your bots and their knowledge base.
      </p>

      <BAlert
        v-if="expired && !error"
        :model-value="true"
        variant="warning"
        class="mb-3"
      >
        Your session has expired. Sign in again to pick up where you left off.
      </BAlert>

      <BAlert v-if="error" :model-value="true" variant="danger" class="mb-3">
        {{ error }}
      </BAlert>

      <BAlert
        v-if="submitting && slow"
        :model-value="true"
        variant="info"
        class="mb-3 d-flex align-items-center gap-2"
      >
        <BSpinner small />
        <span>Still signing in. The server may be starting up — give it a
          moment.</span>
      </BAlert>

      <BForm novalidate @submit.prevent="onSubmit">
        <BFormGroup label="Email" label-for="email" class="mb-3">
          <BFormInput
            id="email"
            v-model="email"
            type="email"
            required
            autocomplete="username"
            placeholder="admin@bs23.com"
            :disabled="submitting"
          />
        </BFormGroup>

        <BFormGroup label="Password" label-for="password" class="mb-4">
          <div class="input-group">
            <BFormInput
              id="password"
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              required
              autocomplete="current-password"
              :disabled="submitting"
            />
            <BButton
              variant="outline-secondary"
              type="button"
              :disabled="submitting"
              :aria-label="showPassword ? 'Hide password' : 'Show password'"
              :aria-pressed="showPassword"
              @click="showPassword = !showPassword"
            >
              <i
                :class="showPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"
                aria-hidden="true"
              />
            </BButton>
          </div>
        </BFormGroup>

        <BButton
          type="submit"
          variant="primary"
          class="w-100"
          :disabled="submitting || !email || !password"
        >
          <BSpinner v-if="submitting" small class="me-2" />
          {{ submitting ? "Signing in…" : "Sign in" }}
        </BButton>
      </BForm>
    </div>
  </div>
</template>
