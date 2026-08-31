import { defineStore } from "pinia";
import { ref } from "vue";
import client from "@/api/client";
import { useApi } from "@/composables/useApi";
import type { Bot } from "@/types/api";

export const useActiveBotStore = defineStore("activeBot", () => {
  const bot = ref<Bot | null>(null);

  const request = useApi<Bot, [string]>(
    (signal, id) =>
      client
        .get<{ data: Bot }>(`/bots/${id}`, { signal })
        .then((r) => r.data.data),
    { attempts: 3 },
  );

  const { loading, error, slow, retrying } = request;

  function replace(next: Bot) {
    if (bot.value?._id === next._id) bot.value = next;
  }

  function set(next: Bot) {
    bot.value = next;
    error.value = null;
  }

  function clear() {
    bot.value = null;
    error.value = null;
  }

  async function ensure(id: string): Promise<Bot | null> {
    if (bot.value?._id === id) return bot.value;

    bot.value = null;

    const next = await request.run(id);
    if (next) bot.value = next;
    return next;
  }

  async function retry(): Promise<Bot | null> {
    const next = await request.retry();
    if (next) bot.value = next;
    return next;
  }

  return {
    bot,
    loading,
    error,
    slow,
    retrying,
    set,
    replace,
    clear,
    ensure,
    retry,
  };
});
