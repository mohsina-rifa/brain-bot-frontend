import { computed, ref } from "vue";
import client, { toMessage } from "@/api/client";
import { useApi } from "@/composables/useApi";
import { useSlowFlag } from "@/composables/useSlowFlag";
import type { Bot, ListQuery, Paginated } from "@/types/api";

export function useBots(limit = 10) {
  const page = ref(1);
  const search = ref("");

  const request = useApi<Paginated<Bot>, [ListQuery]>(
    (signal, query) =>
      client
        .get<Paginated<Bot>>("/bots", { params: query, signal })
        .then((r) => r.data),
    { attempts: 3 },
  );

  const bots = computed(() => request.data.value?.data ?? []);
  const hasLoaded = computed(() => request.data.value !== null);
  const total = computed(() => request.data.value?.total ?? 0);
  const pageCount = computed(() => Math.max(1, Math.ceil(total.value / limit)));

  function load() {
    return request.run({
      page: page.value,
      limit,
      q: search.value || undefined,
    });
  }

  function goTo(next: number) {
    page.value = Math.min(Math.max(1, next), pageCount.value);
    return load();
  }

  const removing = ref<string | null>(null);
  const removeError = ref<string | null>(null);

  const {
    slow: slowRemove,
    start: startSlowRemove,
    stop: stopSlowRemove,
  } = useSlowFlag();

  async function remove(id: string): Promise<boolean> {
    removing.value = id;
    removeError.value = null;
    startSlowRemove();
    try {
      await client.delete(`/bots/${id}`);
      await load();
      if (!bots.value.length && page.value > 1) await goTo(page.value - 1);
      return true;
    } catch (err) {
      removeError.value = toMessage(err);
      return false;
    } finally {
      removing.value = null;
      stopSlowRemove();
    }
  }

  return {
    page,
    search,
    bots,
    hasLoaded,
    total,
    pageCount,
    loading: request.loading,
    error: request.error,
    slow: request.slow,
    retrying: request.retrying,
    load,
    goTo,
    retry: request.retry,
    cancel: request.cancel,
    remove,
    removing,
    removeError,
    slowRemove,
  };
}
