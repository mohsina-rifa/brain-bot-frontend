import { computed, ref } from "vue";
import client from "@/api/client";
import { useApi } from "@/composables/useApi";
import type { Bot, ListQuery, Paginated } from "@/types/api";

export function useBots(limit = 10) {
  const page = ref(1);
  const search = ref("");

  const request = useApi<Paginated<Bot>, [ListQuery]>((signal, query) =>
    client
      .get<Paginated<Bot>>("/bots", { params: query, signal })
      .then((r) => r.data),
  );

  const bots = computed(() => request.data.value?.data ?? []);
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

  return {
    page,
    search,
    bots,
    total,
    pageCount,
    loading: request.loading,
    error: request.error,
    slow: request.slow,
    load,
    goTo,
    retry: request.retry,
  };
}
