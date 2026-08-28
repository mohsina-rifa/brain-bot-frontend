import { computed, ref, type Ref } from "vue";
import client, { toFieldErrors, toMessage } from "@/api/client";
import { useApi } from "@/composables/useApi";
import { useSlowFlag } from "@/composables/useSlowFlag";
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

  // Reading a list is safe to repeat, so this one retries with backoff.
  const request = useApi<Paginated<Qna>, [QnaListQuery]>(
    (signal, query) =>
      client
        .get<Paginated<Qna>>("/qna", { params: query, signal })
        .then((r) => r.data),
    { attempts: 3 },
  );

  const rows = computed(() => request.data.value?.data ?? []);

  const hasLoaded = computed(() => request.data.value !== null);
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

  function setSearch(term: string) {
    search.value = term;
    page.value = 1;
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

  const fieldErrors = ref<Record<string, string>>({});

  // Creating an entry has to embed the answer before it returns, which is the
  // slowest thing in the app. Warn rather than let it look frozen.
  const { slow: slowSave, start: startSlow, stop: stopSlow } = useSlowFlag();

  let lastFailed: (() => Promise<unknown>) | null = null;

  function retryMutation() {
    return lastFailed ? lastFailed() : Promise.resolve(null);
  }

  function clearMutationError() {
    mutationError.value = null;
    fieldErrors.value = {};
    lastFailed = null;
  }

  function recordFailure(err: unknown, retry: () => Promise<unknown>) {
    mutationError.value = toMessage(err);
    fieldErrors.value = toFieldErrors(err);
    // Every failed mutation leaves behind the exact call that failed, so the
    // Retry button re-runs the real thing instead of being decorative.
    lastFailed = retry;
  }

  async function create(question: string, answer: string): Promise<Qna | null> {
    saving.value = true;
    clearMutationError();
    startSlow();
    try {
      const res = await client.post<{ data: Qna }>("/qna", {
        question,
        answer,
        botId: botId.value,
      });
      await load();
      return res.data.data;
    } catch (err) {
      recordFailure(err, () => create(question, answer));
      return null;
    } finally {
      saving.value = false;
      stopSlow();
    }
  }

  async function update(
    id: string,
    question: string,
    answer: string,
  ): Promise<Qna | null> {
    saving.value = true;
    pendingId.value = id;
    clearMutationError();
    startSlow();
    try {
      const res = await client.put<{ data: Qna }>(`/qna/${id}`, {
        question,
        answer,
      });
      await load();
      return res.data.data;
    } catch (err) {
      recordFailure(err, () => update(id, question, answer));
      return null;
    } finally {
      saving.value = false;
      pendingId.value = null;
      stopSlow();
    }
  }

  async function remove(id: string): Promise<boolean> {
    pendingId.value = id;
    clearMutationError();
    startSlow();
    try {
      await client.delete(`/qna/${id}`);
      await load();
      if (!rows.value.length && page.value > 1) await goTo(page.value - 1);
      return true;
    } catch (err) {
      recordFailure(err, () => remove(id));
      return false;
    } finally {
      pendingId.value = null;
      stopSlow();
    }
  }

  async function findDuplicate(
    question: string,
    excludeId?: string,
  ): Promise<Qna | null> {
    const text = question.trim().toLowerCase();
    if (!text) return null;
    try {
      const res = await client.get<Paginated<Qna>>("/qna", {
        params: { botId: botId.value, page: 1, limit: 200 },
      });
      return (
        res.data.data.find(
          (row) =>
            row.id !== excludeId && row.question.trim().toLowerCase() === text,
        ) ?? null
      );
    } catch {
      // A duplicate check that cannot run must not block the save.
      return null;
    }
  }

  return {
    page,
    search,
    rows,
    hasLoaded,
    total,
    limit,
    pageCount,
    loading: request.loading,
    error: request.error,
    slow: request.slow,
    retrying: request.retrying,
    load,
    goTo,
    setLimit,
    setSearch,
    retry: request.retry,
    create,
    update,
    remove,
    findDuplicate,
    saving,
    slowSave,
    pendingId,
    mutationError,
    fieldErrors,
    retryMutation,
    clearMutationError,
  };
}
