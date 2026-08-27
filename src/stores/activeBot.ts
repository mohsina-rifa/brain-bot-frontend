import { defineStore } from "pinia";
import { ref } from "vue";
import client from "@/api/client";
import type { Bot } from "@/types/api";

export const useActiveBotStore = defineStore("activeBot", () => {
  const bot = ref<Bot | null>(null);
  const loading = ref(false);

  function replace(next: Bot) {
    if (bot.value?._id === next._id) bot.value = next;
  }

  function set(next: Bot) {
    bot.value = next;
  }

  function clear() {
    bot.value = null;
  }

  async function ensure(id: string): Promise<Bot | null> {
    if (bot.value?._id === id) return bot.value;

    loading.value = true;
    try {
      const res = await client.get<{ data: Bot }>(`/bots/${id}`);
      bot.value = res.data.data;
      return bot.value;
    } catch {
      bot.value = null;
      return null;
    } finally {
      loading.value = false;
    }
  }

  return { bot, loading, set, replace, clear, ensure };
});
