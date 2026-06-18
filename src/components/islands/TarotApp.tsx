import { useState } from 'react';
import type { TarotCard } from '@/lib/tarotData';
import { CARDS } from '@/lib/tarotData';
import SpreadSelector from './SpreadSelector';
import WorryInput from './WorryInput';
import CardPicker from './CardPicker';
import ReadingResult from './ReadingResult';

export type SpreadType = 'single' | 'three';

export interface DrawnCard {
  card: TarotCard;
  reversed: boolean;
  position: number;
}

function shuffleDeck(): TarotCard[] {
  const deck = [...CARDS];
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function createFaceDownCards(spread: SpreadType): { card: TarotCard; revealed: boolean; reversed: boolean }[] {
  const deck = shuffleDeck();
  const count = spread === 'single' ? 5 : 7;
  return deck.slice(0, count).map((card) => ({ card, revealed: false, reversed: false }));
}

export default function TarotApp() {
  const [spread, setSpread] = useState<SpreadType | null>(null);
  const [worry, setWorry] = useState('');
  const [faceDownCards, setFaceDownCards] = useState<{ card: TarotCard; revealed: boolean; reversed: boolean }[] | null>(null);
  const [drawnCards, setDrawnCards] = useState<DrawnCard[]>([]);
  const [startedReading, setStartedReading] = useState(false);
  const [reading, setReading] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSelectSpread = (selected: SpreadType) => {
    setSpread(selected);
    setFaceDownCards(createFaceDownCards(selected));
    setDrawnCards([]);
    setStartedReading(false);
    setReading('');
    setError(null);
  };

  const handlePickCard = (index: number) => {
    if (!faceDownCards || !spread) return;
    if (faceDownCards[index].revealed) return;

    const needed = spread === 'single' ? 1 : 3;
    if (drawnCards.length >= needed) return;

    const reversed = Math.random() < 0.5;

    const next = [...faceDownCards];
    next[index] = { ...next[index], revealed: true, reversed };
    setFaceDownCards(next);

    const drawn: DrawnCard = {
      card: next[index].card,
      reversed,
      position: drawnCards.length,
    };
    const updatedDrawn = [...drawnCards, drawn];
    setDrawnCards(updatedDrawn);

    if (updatedDrawn.length === needed) {
      const flipDelay = needed === 1 ? 900 : 600;
      setTimeout(() => {
        void runReading(spread, updatedDrawn);
      }, flipDelay);
    }
  };

  const handleReset = () => {
    setSpread(null);
    setWorry('');
    setFaceDownCards(null);
    setDrawnCards([]);
    setStartedReading(false);
    setReading('');
    setError(null);
  };

  async function runReading(currentSpread: SpreadType, cards: DrawnCard[], attempt = 1) {
    const maxRetries = 3;
    const retryDelayMs = 2000;

    setStartedReading(true);
    setIsStreaming(true);
    setError(null);
    if (attempt === 1) {
      setReading('');
    }

    const payload = {
      spread: currentSpread,
      cards: cards.map((c) => ({
        name: c.card.name,
        nameJp: c.card.nameJp,
        reversed: c.reversed,
        position: c.position,
      })),
      worry: worry.trim() || undefined,
    };

    try {
      const res = await fetch('/api/reading', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || `サーバーエラー (${res.status})`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      let content = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed === 'data: [DONE]') continue;
          if (trimmed.startsWith('data: ')) {
            const jsonStr = trimmed.slice(6);
            try {
              const data = JSON.parse(jsonStr);
              const delta = data?.choices?.[0]?.delta?.content;
              if (typeof delta === 'string' && delta.length > 0) {
                content += delta;
                setReading(content);
              }
            } catch {
              // ignore partial lines
            }
          }
        }
      }
    } catch (e) {
      const err = e as { message?: string };
      console.error('Reading error', { attempt, message: err?.message });

      if (attempt < maxRetries) {
        setError(`占い師が解釈を熟考しています…（${attempt}/${maxRetries}）`);
        setTimeout(() => {
          void runReading(currentSpread, cards, attempt + 1);
        }, retryDelayMs);
        return;
      }

      setError(err?.message || '占いに失敗しました。');
    } finally {
      if (attempt >= maxRetries) {
        setIsStreaming(false);
      }
    }
  }

  return (
    <div className="tarot-app">
      <header className="tarot-header">
        <div className="text-[17px] font-semibold tracking-[-0.2px]">ScryTarot</div>
        <button onClick={handleReset} className="reset-btn" aria-label="最初からやり直す">
          最初から
        </button>
      </header>

      <main className="tarot-main">
        {spread === null && (
          <div className="intro">
            <div className="text-3xl mb-2">🔮</div>
            <h1 className="text-[21px] font-semibold tracking-tight mb-1.5">ScryTarot</h1>
            <p className="text-[#555] text-[13.5px] leading-relaxed mb-5">
              タロットで内側を覗いてみましょう。
            </p>
            <SpreadSelector onSelect={handleSelectSpread} />
            <div className="mt-5">
              <WorryInput value={worry} onChange={setWorry} />
            </div>
          </div>
        )}

        {spread !== null && !startedReading && (
          <CardPicker
            spread={spread}
            cards={faceDownCards ?? []}
            drawnCount={drawnCards.length}
            onPick={handlePickCard}
          />
        )}

        {startedReading && (
          <ReadingResult
            spread={spread}
            drawnCards={drawnCards}
            reading={reading}
            isStreaming={isStreaming}
            error={error}
          />
        )}
      </main>
    </div>
  );
}
