import { useRef, useState } from 'react';
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

// OpenRouter の free モデル経由でセーフティ判定文のみ返されることがあるため、
// 表示前に除去する（例: "User Safety: safe"）。
const SAFETY_CLASSIFICATION_PATTERNS = [
  /User Safety:\s*(safe|unsafe)\s*\n?/gi,
  /Response Safety:\s*(safe|unsafe)\s*\n?/gi,
  /Prompt Safety:\s*(safe|unsafe)\s*\n?/gi,
  /Content Safety:\s*(safe|unsafe)\s*\n?/gi,
];

function removeSafetyClassifications(text: string): string {
  return SAFETY_CLASSIFICATION_PATTERNS.reduce(
    (acc, pattern) => acc.replace(pattern, ''),
    text,
  );
}

function shuffleDeck(): TarotCard[] {
  const deck = [...CARDS];
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function createFaceDownCards(): { card: TarotCard; revealed: boolean; reversed: boolean }[] {
  const deck = shuffleDeck();
  const count = 9;
  return deck.slice(0, count).map((card) => ({ card, revealed: false, reversed: false }));
}

export default function TarotApp() {
  const mainRef = useRef<HTMLElement>(null);
  const [spread, setSpread] = useState<SpreadType | null>(null);
  const [faceDownCards, setFaceDownCards] = useState<{ card: TarotCard; revealed: boolean; reversed: boolean }[] | null>(null);
  const [worry, setWorry] = useState('');
  const [drawnCards, setDrawnCards] = useState<DrawnCard[]>([]);
  const [startedReading, setStartedReading] = useState(false);
  const [reading, setReading] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSelectSpread = (selected: SpreadType) => {
    setSpread(selected);
    setFaceDownCards(createFaceDownCards());
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

  const handleRetry = () => {
    if (!spread || drawnCards.length === 0) return;
    void runReading(spread, drawnCards);
  };

  const handleRestartWithWorry = () => {
    setFaceDownCards(createFaceDownCards());
    setDrawnCards([]);
    setStartedReading(false);
    setReading('');
    setError(null);
    mainRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSwitchToThree = () => {
    setSpread('three');
    setFaceDownCards(createFaceDownCards());
    setDrawnCards([]);
    setStartedReading(false);
    setReading('');
    setError(null);
    mainRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
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

    let willRetry = false;

    try {
      const res = await fetch('/api/reading', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = (await res.json().catch(() => ({}))) as { reading?: string; error?: string };

      if (!res.ok) {
        throw new Error(data?.error || `サーバーエラー (${res.status})`);
      }

      const readingText = data?.reading ? removeSafetyClassifications(data.reading) : '';
      if (!readingText.trim()) {
        throw new Error('解釈の内容が空でした。');
      }

      setReading(readingText);
    } catch (e) {
      const err = e as { message?: string };
      console.error('Reading error', { attempt, message: err?.message });

      if (attempt < maxRetries) {
        willRetry = true;
        setError(`占い師が解釈を熟考しています…（${attempt}/${maxRetries}）`);
        setTimeout(() => {
          void runReading(currentSpread, cards, attempt + 1);
        }, retryDelayMs);
      } else {
        setError(err?.message || '占いに失敗しました。');
      }
    } finally {
      if (!willRetry) {
        setIsStreaming(false);
      }
    }
  }

  return (
    <div className="tarot-app">
      <header className={`tarot-header ${spread === null ? 'tarot-header--hero' : ''}`}>
        <div className="text-[17px] font-bold tracking-tight">TarotScryer</div>
        <button onClick={handleReset} className="reset-btn" aria-label="最初からやり直す">
          最初から
        </button>
      </header>

      <main ref={mainRef} className="tarot-main">
        {spread === null && (
          <>
            <div className="intro">
              <div className="hero-icon" aria-hidden="true">🔮</div>
              <h1 className="hero-title">タロットで内側を覗く</h1>
              <p className="hero-subtitle">
                今日のメッセージを、カードと一緒に受け取りましょう。
              </p>
            </div>
            <div className="section-divider"><span>リーディングを選ぶ</span></div>
            <SpreadSelector onSelect={handleSelectSpread} />
          </>
        )}

        {spread !== null && !startedReading && (
          <div className="reading-setup">
            <h2 className="picker-title">
              背面のカードから{spread === 'single' ? 1 : 3}枚選んでください
            </h2>
            <div className="mb-1">
              <WorryInput value={worry} onChange={setWorry} />
            </div>
            <CardPicker
              spread={spread}
              cards={faceDownCards ?? []}
              drawnCount={drawnCards.length}
              onPick={handlePickCard}
            />
          </div>
        )}

        {startedReading && (
          <ReadingResult
            spread={spread}
            drawnCards={drawnCards}
            reading={reading}
            isStreaming={isStreaming}
            error={error}
            onRetry={handleRetry}
            onRestartWithWorry={handleRestartWithWorry}
            onSwitchToThree={handleSwitchToThree}
          />
        )}

        <footer className="tarot-footer">
          <div>占いは利用者の特定の目的に適合すること、期待する結果・正確性・実現性を有すること及び不都合が生じない事について、何らの保証をするものではありません。</div>
          <div>© TarotScryer</div>
        </footer>
      </main>
    </div>
  );
}
