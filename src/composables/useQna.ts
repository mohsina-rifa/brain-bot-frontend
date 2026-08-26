import { computed, ref, type Ref } from "vue";
import client from "@/api/client";
import { useApi } from "@/composables/useApi";
import type { Paginated, Qna } from "@/types/api";

interface QnaListQuery {
  botId: string;
  page: number;
  limit: number;
  q?: string;
}

export function useQna(botId: Ref<string>, limit = 10) {
  const page = ref(1);
  const search = ref("");

  const request = useApi<Paginated<Qna>, [QnaListQuery]>((signal, query) =>
    client
      .get<Paginated<Qna>>("/qna", { params: query, signal })
      .then((r) => r.data),
  );

  const rows = computed(() => request.data.value?.data ?? []);
  const total = computed(() => request.data.value?.total ?? 0);
  const pageCount = computed(() => Math.max(1, Math.ceil(total.value / limit)));

  function load() {
    return request.run({
      botId: botId.value,
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
    rows,
    total,
    limit,
    pageCount,
    loading: request.loading,
    error: request.error,
    slow: request.slow,
    load,
    goTo,
    retry: request.retry,
  };
}
