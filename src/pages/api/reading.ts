import type { APIRoute } from 'astro';
import { z } from 'zod';
import { jsonResponse } from '@/lib/api-response';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';
import {
  getSystemPrompt,
  readingToMarkdown,
  SingleCardReadingSchema,
  ThreeCardReadingSchema,
  type ReadingResult,
} from '@/lib/prompts';
import { OPENROUTER_API_KEY, LLM_MODEL } from 'astro:env/server';

const CardSchema = z.object({
  name: z.string().min(1),
  nameJp: z.string().min(1),
  reversed: z.boolean(),
  position: z.number().int().min(0).max(2),
});

const BodySchema = z.object({
  spread: z.enum(['single', 'three']),
  cards: z.array(CardSchema).min(1).max(3),
  worry: z.string().max(1000).optional(),
});

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const REQUEST_TIMEOUT_MS = 45000;
const RATE_LIMIT = 12;
const RATE_WINDOW_MS = 5 * 60 * 1000;

const POSITION_LABELS: Record<number, string> = {
  0: '状況',
  1: '課題',
  2: '助言',
};

function buildUserPrompt(spread: 'single' | 'three', cards: z.infer<typeof BodySchema>['cards'], worry?: string): string {
  const spreadLabel = spread === 'single' ? '今日のメッセージ（1枚引き）' : '内省スプレッド（3枚引き：状況→課題→助言）';
  let prompt = `スプレッド: ${spreadLabel}\n\n引かれたカード:\n`;

  for (const card of cards) {
    const positionLabel = spread === 'three' ? `[${POSITION_LABELS[card.position]}] ` : '';
    const orientation = card.reversed ? '逆位置' : '正位置';
    prompt += `${positionLabel}${card.nameJp}（${card.name}）— ${orientation}\n`;
  }

  if (worry && worry.trim().length > 0) {
    prompt += `\nユーザーからの悩み・状況:\n${worry.trim()}\n`;
  }

  prompt += '\n上記のカードを使って、指定されたJSONスキーマに従った解釈を出力してください。';
  return prompt;
}

function validateReading(spread: 'single' | 'three', data: unknown): ReadingResult {
  if (spread === 'single') {
    return SingleCardReadingSchema.parse(data);
  }
  return ThreeCardReadingSchema.parse(data);
}

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

export const POST: APIRoute = async ({ request }) => {
  const ip = getClientIp(request);

  if (!checkRateLimit(ip, RATE_LIMIT, RATE_WINDOW_MS)) {
    return jsonResponse(
      { error: 'レート制限を超えました。しばらく経ってからお試しください。' },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'リクエストの形式が正しくありません。' }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return jsonResponse({ error: 'リクエストの内容に不備があります。' }, { status: 400 });
  }

  const { spread, cards, worry } = parsed.data;
  const apiKey = OPENROUTER_API_KEY;

  if (!apiKey) {
    console.error('OPENROUTER_API_KEY is not configured');
    return jsonResponse({ error: 'サーバーの準備ができていません。しばらくしてからお試しください。' }, { status: 500 });
  }

  const model = LLM_MODEL || 'openrouter/free';
  const referer = 'https://tarot.scryer.workers.dev';

  const messages = [
    { role: 'system' as const, content: getSystemPrompt(spread) },
    { role: 'user' as const, content: buildUserPrompt(spread, cards, worry) },
  ];

  try {
    const upstreamRes = await fetchWithTimeout(
      OPENROUTER_URL,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': referer,
          'X-Title': 'TarotScryer',
        },
        body: JSON.stringify({
          model,
          messages,
          stream: false,
          temperature: 0.7,
          max_tokens: 2000,
          response_format: { type: 'json_object' },
        }),
      },
      REQUEST_TIMEOUT_MS,
    );

    if (!upstreamRes.ok) {
      const errorText = await upstreamRes.text().catch(() => '');
      console.error('OpenRouter upstream error', {
        status: upstreamRes.status,
        statusText: upstreamRes.statusText,
        body: errorText.slice(0, 500),
        model,
      });

      let retryAfter = 60;
      try {
        const errBody = JSON.parse(errorText) as {
          error?: { metadata?: { retry_after_seconds?: number } };
        };
        const rawRetry = errBody?.error?.metadata?.retry_after_seconds;
        if (typeof rawRetry === 'number' && rawRetry > 0) {
          retryAfter = Math.ceil(rawRetry);
        }
      } catch {
        // ignore parse errors
      }

      return jsonResponse(
        { error: '解釈の生成に失敗しました。少し待ってからもう一度お試しください。' },
        { status: 502, headers: { 'Retry-After': String(retryAfter) } },
      );
    }

    const upstreamData = (await upstreamRes.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
      error?: { message?: string };
    };

    const content = upstreamData.choices?.[0]?.message?.content;
    if (!content) {
      console.error('OpenRouter returned empty content', { upstreamData, model });
      return jsonResponse(
        { error: '解釈の内容を取得できませんでした。もう一度お試しください。' },
        { status: 502 },
      );
    }

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(content);
    } catch (parseErr) {
      console.error('Failed to parse LLM JSON', { content: content.slice(0, 500), model, parseErr });
      return jsonResponse(
        { error: '解釈の形式が正しくありませんでした。もう一度お試しください。' },
        { status: 502 },
      );
    }

    const reading = validateReading(spread, parsedJson);
    const markdown = readingToMarkdown(reading, spread);

    return jsonResponse({ reading: markdown });
  } catch (err: unknown) {
    const error = err as { name?: string; message?: string };
    console.error('Reading proxy error', { name: error?.name, message: error?.message, model });
    if (error?.name === 'AbortError') {
      return jsonResponse({ error: '解釈の生成が時間内に終わりませんでした。もう一度お試しください。' }, { status: 504 });
    }
    return jsonResponse({ error: '予期せぬエラーが発生しました。時間をおいてからお試しください。' }, { status: 500 });
  }
};
