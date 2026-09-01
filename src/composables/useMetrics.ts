import { ref } from "vue";
import client from "@/api/client";
import type { Bot, Paginated } from "@/types/api";

/*
 * Counts for the dashboard tiles the prototype shows.
 *
 * Every list endpoint is paginated and reports a `total`, so asking for a
 * single row is enough to learn how many there are — these requests carry
 * limit=1 and read only the count.
 *
 * Metrics are decoration around the real work of the page. A count that fails
 * resolves to null and renders as an em dash; it never surfaces an error or
 * blocks the bot list from loading.
 */
async function count(
  path: string,
  params: Record<string, unknown> = {},
): Promise<number | null> {
  try {
    const res = await client.get<Paginated<unknown>>(path, {
      params: { ...params, page: 1, limit: 1 },
    });
    // The API returns total:null for some filtered queries rather than 0.
    return typeof res.data?.total === "number" ? res.data.total : null;
  } catch {
    return null;
  }
}

// How many bots we are willing to pull in order to count the active ones.
// Beyond this the tile reports nothing rather than an undercount.
const ACTIVE_SCAN_LIMIT = 100;

export function useWorkspaceMetrics() {
  const totalBots = ref<number | null>(null);
  const activeBots = ref<number | null>(null);
  const qnaEntries = ref<number | null>(null);
  const conversations = ref<number | null>(null);
  const unresolved = ref<number | null>(null);

  /*
   * Two of these tiles need the whole bot list rather than a count:
   *
   *  - "Active" has no server-side status filter, so it is counted from rows.
   *  - "Q&A entries" has no workspace-wide total either — /qna reports
   *    total:null unless it is given a botId — so it is the sum of each bot's
   *    own count.
   *
   * Both are wrong if there are more bots than we fetched, so past that limit
   * they report nothing rather than an undercount.
   */
  async function loadFromAllBots(): Promise<{
    active: number | null;
    qna: number | null;
  }> {
    try {
      const res = await client.get<Paginated<Bot>>("/bots", {
        params: { page: 1, limit: ACTIVE_SCAN_LIMIT },
      });
      const rows = res.data?.data ?? [];
      const total = res.data?.total;

      if (typeof total === "number" && total > rows.length) {
        return { active: null, qna: null };
      }

      const active = rows.filter((bot) => bot.status === "active").length;

      const perBot = await Promise.all(
        rows.map((bot) => count("/qna", { botId: bot._id })),
      );

      // One unreadable bot makes the sum an undercount, so the tile stays blank.
      const qna = perBot.some((n) => n === null)
        ? null
        : perBot.reduce((sum: number, n) => sum + (n ?? 0), 0);

      return { active, qna };
    } catch {
      return { active: null, qna: null };
    }
  }

  async function load() {
    const [bots, fromBots, convs, unres] = await Promise.all([
      count("/bots"),
      loadFromAllBots(),
      count("/conversations"),
      count("/unresolved-queries"),
    ]);

    totalBots.value = bots;
    activeBots.value = fromBots.active;
    qnaEntries.value = fromBots.qna;
    conversations.value = convs;
    unresolved.value = unres;
  }

  return { totalBots, activeBots, qnaEntries, conversations, unresolved, load };
}

export interface BotCounts {
  qna: number | null;
  conversations: number | null;
}

export function useBotCounts() {
  const counts = ref<Record<string, BotCounts>>({});

  async function load(ids: string[]) {
    const results = await Promise.all(
      ids.map(async (id) => {
        const [qna, conversations] = await Promise.all([
          count("/qna", { botId: id }),
          count("/conversations", { botId: id }),
        ]);
        return [id, { qna, conversations }] as const;
      }),
    );

    counts.value = Object.fromEntries(results);
  }

  return { counts, load };
}
