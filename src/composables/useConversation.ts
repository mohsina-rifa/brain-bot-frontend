import { computed, ref, type Ref } from "vue";
import client, { toMessage } from "@/api/client";
import { useSlowFlag } from "@/composables/useSlowFlag";
import type { Conversation, Message, QnaMatch } from "@/types/api";

export function useConversation(botId: Ref<string>) {
  const conversation = ref<Conversation | null>(null);
  const sending = ref(false);
  const error = ref<string | null>(null);

  const failed = ref<string | null>(null);

  const pending = ref<string | null>(null);

  const matches = ref<QnaMatch[]>([]);

  // A reply has to be embedded and matched before it comes back, so a slow
  // model or a cold index can take a while. Say so rather than spin silently.
  const { slow, start: startSlow, stop: stopSlow } = useSlowFlag();

  async function loadMatches(question: string, conversationId?: string) {
    try {
      const res = await client.post<{ data: QnaMatch[] }>(
        "/qna/search/best-by-question",
        { question, botId: botId.value, limit: 3 },
      );
      matches.value = res.data.data ?? [];

      // Nothing matched, so the bot fell back. Record the question as an
      // unresolved query the operator can turn into new Q&A content later.
      if (!matches.value.length && conversationId) {
        await client.post("/unresolved-queries", {
          botId: botId.value,
          conversationId,
          query: question,
          status: "pending",
        });
      }
    } catch {
      matches.value = [];
    }
  }

  const messages = computed<Message[]>(() => conversation.value?.messages ?? []);
  const started = computed(() => conversation.value !== null);

  async function send(content: string): Promise<boolean> {
    const text = content.trim();
    if (!text || sending.value) return false;

    sending.value = true;
    error.value = null;
    failed.value = null;
    pending.value = text;
    matches.value = [];
    startSlow();

    try {
      const res = await client.post<{ data: Conversation }>("/conversations", {
        botId: botId.value,
        conversationId: conversation.value?._id,
        message: { role: "user", content: text },
      });
      conversation.value = res.data.data;
      pending.value = null;
      void loadMatches(text, conversation.value?._id);
      return true;
    } catch (err) {
      error.value = toMessage(err);
      // The message is kept, not lost, so Retry re-sends exactly what was typed.
      failed.value = text;
      pending.value = null;
      return false;
    } finally {
      sending.value = false;
      stopSlow();
    }
  }

  function retry() {
    return failed.value ? send(failed.value) : Promise.resolve(false);
  }

  function reset() {
    conversation.value = null;
    error.value = null;
    failed.value = null;
    pending.value = null;
    matches.value = [];
    stopSlow();
  }

  return {
    conversation,
    messages,
    started,
    sending,
    slow,
    error,
    failed,
    pending,
    matches,
    send,
    retry,
    reset,
  };
}
