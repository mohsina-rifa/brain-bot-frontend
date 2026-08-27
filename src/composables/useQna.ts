import { computed, ref, type Ref } from "vue";
import client, { toMessage } from "@/api/client";
import { useApi } from "@/composables/useApi";
import type { Paginated, Qna } from "@/types/api";

interface QnaListQuery {
  botId: string;
  page: number;
  limit: number;
  q?: string;
}

export function useQna(botId: Ref<string>, initialLimit = 10) {
  const page = ref(1);
  const limit = ref(initialLimit);
  const search = ref("");

  const request = useApi<Paginated<Qna>, [QnaListQuery]>((signal, query) =>
    client
      .get<Paginated<Qna>>("/qna", { params: query, signal })
      .then((r) => r.data),
  );

  const rows = computed(() => request.data.value?.data ?? []);
  const total = computed(() => request.data.value?.total ?? 0);
  const pageCount = computed(() =>
    Math.max(1, Math.ceil(total.value / limit.value)),
  );

  function load() {
    return request.run({
      botId: botId.value,
      page: page.value,
      limit: limit.value,
      q: search.value || undefined,
    });
  }

  function goTo(next: number) {
    page.value = Math.min(Math.max(1, next), pageCount.value);
    return load();
  }

  function setLimit(next: number) {
    limit.value = next;
    page.value = 1;
    return load();
  }

  // --- mutations -----------------------------------------------------------

  const pendingId = ref<string | null>(null);
  const saving = ref(false);
  const mutationError = ref<string | null>(null);

  async function create(question: string, answer: string): Promise<Qna | null> {
    saving.value = true;
    mutationError.value = null;
    try {
      const res = await client.post<{ data: Qna }>("/qna", {
        question,
        answer,
        botId: botId.value,
      });
      await load();
      return res.data.data;
    } catch (err) {
      mutationError.value = toMessage(err);
      return null;
    } finally {
      saving.value = false;
    }
  }

  async function update(
    id: string,
    question: string,
    answer: string,
  ): Promise<Qna | null> {
    saving.value = true;
    pendingId.value = id;
    mutationError.value = null;
    try {
      const res = await client.put<{ data: Qna }>(`/qna/${id}`, {
        question,
        answer,
      });
      await load();
      return res.data.data;
    } catch (err) {
      mutationError.value = toMessage(err);
      return null;
    } finally {
      saving.value = false;
      pendingId.value = null;
    }
  }

  async function remove(id: string): Promise<boolean> {
    pendingId.value = id;
    mutationError.value = null;
    try {
      await client.delete(`/qna/${id}`);
      await load();
      if (!rows.value.length && page.value > 1) await goTo(page.value - 1);
      return true;
    } catch (err) {
      mutationError.value = toMessage(err);
      return false;
    } finally {
      pendingId.value = null;
    }
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
    setLimit,
    retry: request.retry,
    create,
    update,
    remove,
    saving,
    pendingId,
    mutationError,
  };
}
