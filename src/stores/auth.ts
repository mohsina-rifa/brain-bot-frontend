import { defineStore } from "pinia";
import { ref, computed } from "vue";
import client, { setSessionEnded } from "@/api/client";
import type { LoginResponse } from "@/types/api";

const TOKEN_KEY = "token";

export interface AuthUser {
  id?: string;
  role?: string;
  loginTime?: number;
}

function decodeToken(jwt: string): AuthUser | null {
  try {
    const [, payload] = jwt.split(".");
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    const claims = JSON.parse(json);
    return {
      id: claims._id,
      role: claims.roleId?.name,
      loginTime: claims.loginTime,
    };
  } catch {
    return null;
  }
}

export const useAuthStore = defineStore("auth", () => {
  const token = ref<string | null>(localStorage.getItem(TOKEN_KEY));
  const user = ref<AuthUser | null>(
    token.value ? decodeToken(token.value) : null,
  );

  const isAuthenticated = computed(() => Boolean(token.value));

  async function login(email: string, password: string) {
    const res = await client.post<LoginResponse>("/auth/admin-login", {
      email,
      password,
    });
    const value = res.data.data.token;
    token.value = value;
    user.value = decodeToken(value);
    localStorage.setItem(TOKEN_KEY, value);
    setSessionEnded(false);
  }

  function logout() {
    token.value = null;
    user.value = null;
    localStorage.removeItem(TOKEN_KEY);
  }

  return { token, user, isAuthenticated, login, logout };
});
