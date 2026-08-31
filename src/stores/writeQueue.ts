import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { isOffline } from "@/api/client";

export interface QueuedWrite {
  id: number;
  /** What the user will see in the pending list — "Add Q&A entry". */
  label: string;
  /**
   * The same thunk the Retry button would have called. Resolves true when the
   * write landed, false when it did not — the queue never inspects the error.
   */
  run: () => Promise<boolean>;
}

let nextId = 1;

/**
 * Writes the browser could not send because it was offline, held until the
 * connection is back.
 *
 * Scoped on purpose. Only content edits go in here — Q&A add/edit/delete and
 * branding. Deleting a bot is destructive enough that it should happen while
 * someone is watching, and a chat message already keeps its own text with a
 * Retry beside it, which is a better answer than replaying it minutes later
 * into a conversation that has moved on.
 *
 * Held in memory, not localStorage: surviving a reload would mean replaying a
 * change against a session that may have expired and a screen that no longer
 * exists, with no one there to see it fail.
 */
export const useWriteQueueStore = defineStore("writeQueue", () => {
  const items = ref<QueuedWrite[]>([]);
  const flushing = ref(false);
  /** How many the last flush got through — drives the "3 changes sent" notice. */
  const sent = ref(0);

  const count = computed(() => items.value.length);
  const pending = computed(() => items.value.length > 0);

  /**
   * Queue a failed write, but only if it failed for the one reason a later
   * attempt actually fixes. Returns whether it was taken, so the caller knows
   * to say "will send later" instead of "could not save".
   */
  function enqueueIfOffline(
    err: unknown,
    label: string,
    run: () => Promise<boolean>,
  ): boolean {
    // A replay that fails again is the queue's own business: the item stays
    // where it is rather than being added a second time.
    if (flushing.value) return false;
    if (!isOffline(err)) return false;

    items.value = [...items.value, { id: nextId++, label, run }];
    return true;
  }

  /**
   * Send what is waiting, oldest first, stopping at the first failure.
   *
   * Order is kept because these are edits to the same content: an add followed
   * by an edit of that entry only makes sense in that sequence. And stopping
   * rather than skipping means a still-broken connection costs one attempt, not
   * one per queued item.
   */
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

  /**
   * Drop everything unsent. Called at a session boundary: a queued write closes
   * over the bot and the credentials of the session that made it, and replaying
   * it under whoever signs in next would be worse than losing it.
   */
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
