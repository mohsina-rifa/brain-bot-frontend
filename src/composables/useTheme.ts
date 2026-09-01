import { ref, watchEffect } from "vue";

type Theme = "light" | "dark";

const STORAGE_KEY = "brainbot-theme";

function preferred(): Theme {
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function stored(): Theme | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === "light" || value === "dark" ? value : null;
  } catch {
    // Private browsing and blocked site data both throw here. The toggle still
    // works for the session; it just will not be remembered.
    return null;
  }
}

// Module scope, so every toggle in the app reads and writes one value rather
// than each component keeping its own copy.
const theme = ref<Theme>(stored() ?? preferred());

watchEffect(() => {
  const root = document.documentElement;
  root.dataset.theme = theme.value;
  // Bootstrap's own components — the modal, offcanvas and toasts we keep for
  // behaviour — follow data-bs-theme, so both attributes move together.
  root.dataset.bsTheme = theme.value;
  try {
    localStorage.setItem(STORAGE_KEY, theme.value);
  } catch {
    // Not being able to persist the choice is not a reason to reject it.
  }
});

export function useTheme() {
  function toggle() {
    theme.value = theme.value === "dark" ? "light" : "dark";
  }

  return { theme, toggle };
}
