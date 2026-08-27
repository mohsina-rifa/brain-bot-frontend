import { computed, ref, type Ref } from "vue";
import client, { toMessage } from "@/api/client";
import type { Conversation, Message } from "@/types/api";

export function useConversation(botId: Ref<string>) {
  const conversation = ref<Conversation | null>(null);
  const sending = ref(false);
  const error = ref<string | null>(null);

  const failed = ref<string | null>(null);

  const messages = computed<Message[]>(() => conversation.value?.messages ?? []);
  const started = computed(() => conversation.value !== null);

  async function send(content: string): Promise<boolean> {
    const text = content.trim();
    if (!text || sending.value) return false;

    sending.value = true;
    error.value = null;
    failed.value = null;

    try {
      const res = await client.post<{ data: Conversation }>("/conversations", {
        botId: botId.value,
        conversationId: conversation.value?._id,
        message: { role: "user", content: text },
      });
      conversation.value = res.data.data;
      return true;
    } catch (err) {
      error.value = toMessage(err);
      failed.value = text;
      return false;
    } finally {
      sending.value = false;
    }
  }

  function retry() {
    return failed.value ? send(failed.value) : Promise.resolve(false);
  }

  function reset() {
    conversation.value = null;
    error.value = null;
    failed.value = null;
  }

  return {
    conversation,
    messages,
    started,
    sending,
    error,
    failed,
    send,
    retry,
    reset,
  };
}
