import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { isOffline } from "@/api/client";

export interface QueuedWrite {
  id: number;
  label: string;
  run: () => Promise<boolean>;
}

let nextId = 1;

export const useWriteQueueStore = defineStore("writeQueue", () => {
  const items = ref<QueuedWrite[]>([]);
  const flushing = ref(false);
  const sent = ref(0);

  const count = computed(() => items.value.length);
  const pending = computed(() => items.value.length > 0);

  function enqueueIfOffline(
    err: unknown,
    label: string,
    run: () => Promise<boolean>,
  ): boolean {
    if (flushing.value) return false;
    if (!isOffline(err)) return false;

    items.value = [...items.value, { id: nextId++, label, run }];
    return true;
  }

  async function flush(): Promise<void> {
    if (flushing.value || !items.value.length) return;

    flushing.value = true;
    sent.value = 0;
    try {
      while (items.value.length) {
        const ok = await items.value[0].run();
        if (!ok) break;
        items.value = items.value.slice(1);
        sent.value += 1;
      }
    } finally {
      flushing.value = false;
    }
  }

  function discard(id: number) {
    items.value = items.value.filter((item) => item.id !== id);
  }

  function clear() {
    items.value = [];
    sent.value = 0;
  }

  return {
    items,
    count,
    pending,
    flushing,
    sent,
    enqueueIfOffline,
    flush,
    discard,
    clear,
  };
});
