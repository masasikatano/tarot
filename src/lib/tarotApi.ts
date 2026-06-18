import { CARDS, getCardByName, type TarotCard } from '@/lib/tarotData';

// Public tarot API used as an optional enrichment source.
// MVP uses local data as the source of truth and falls back to it on any failure.
const TAROT_API_BASE = 'https://tarotapi.dev/api/v1';
const REQUEST_TIMEOUT_MS = 8000;

interface TarotApiCard {
  name: string;
  name_short?: string;
  value?: string;
  value_int?: number;
  suit?: string;
  meaning_up?: string;
  meaning_rev?: string;
  desc?: string;
}

async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function fetchCardFromApi(name: string): Promise<TarotCard | null> {
  try {
    const res = await fetchWithTimeout(
      `${TAROT_API_BASE}/cards/search?q=${encodeURIComponent(name)}`,
      REQUEST_TIMEOUT_MS,
    );
    if (!res.ok) return null;

    const data = (await res.json()) as { cards?: TarotApiCard[] } | TarotApiCard[];
    const cards = Array.isArray(data) ? data : data.cards;
    if (!cards || cards.length === 0) return null;

    const apiCard = cards[0];
    const local = getCardByName(name);
    if (!local) return null;

    return {
      ...local,
      keywords: apiCard.meaning_up ? apiCard.meaning_up.split(/[,;]/).map((s) => s.trim()).filter(Boolean) : local.keywords,
      keywordsReversed: apiCard.meaning_rev ? apiCard.meaning_rev.split(/[,;]/).map((s) => s.trim()).filter(Boolean) : local.keywordsReversed,
    };
  } catch {
    return null;
  }
}

export async function enrichCards(cards: TarotCard[]): Promise<TarotCard[]> {
  // Attempt to enrich each card from the external API, but never fail the reading
  // because of an external API issue. Local data is the reliable fallback.
  const enriched = await Promise.all(
    cards.map(async (card) => {
      const fromApi = await fetchCardFromApi(card.name);
      return fromApi ?? card;
    }),
  );
  return enriched;
}

export { CARDS, getCardByName, type TarotCard };
