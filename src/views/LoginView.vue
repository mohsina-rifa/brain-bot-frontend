<script setup lang="ts">
import { ref } from "vue";
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

const auth = useAuthStore();
const router = useRouter();
const route = useRoute();

const email = ref("");
const password = ref("");
const showPassword = ref(false);
const submitting = ref(false);
const error = ref<string | null>(null);

async function onSubmit() {
  error.value = null;
  submitting.value = true;
  try {
    await auth.login(email.value, password.value);
    const next =
      typeof route.query.next === "string" ? route.query.next : "/bots";
    await router.replace(next);
  } catch (err) {
    error.value = toMessage(err);
  } finally {
    submitting.value = false;
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

      <BAlert v-if="error" :model-value="true" variant="danger" class="mb-3">
        {{ error }}
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
              @click="showPassword = !showPassword"
            >
              <i :class="showPassword ? 'bi bi-eye-slash' : 'bi bi-eye'" />
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
