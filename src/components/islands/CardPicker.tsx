import { useState } from 'react';
import type { TarotCard } from '@/lib/tarotData';
import type { SpreadType } from './TarotApp';

interface Props {
  spread: SpreadType;
  cards: { card: TarotCard; revealed: boolean; reversed: boolean }[];
  drawnCount: number;
  onPick: (index: number) => void;
}

const POSITION_LABELS = ['状況', '課題', '助言'];

export default function CardPicker({ spread, cards, drawnCount, onPick }: Props) {
  const needed = spread === 'single' ? 1 : 3;
  const nextIsLastPick = drawnCount + 1 === needed;
  const [flipped, setFlipped] = useState<Set<number>>(new Set());
  const [lastPicked, setLastPicked] = useState<Set<number>>(new Set());
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());

  const handlePick = (index: number) => {
    if (cards[index].revealed || drawnCount >= needed) return;

    setFlipped((prev) => new Set(prev).add(index));
    if (nextIsLastPick) {
      setLastPicked((prev) => new Set(prev).add(index));
    }

    const imageUrl = cards[index].card.imageUrl;
    if (!loadedImages.has(imageUrl)) {
      const img = new Image();
      img.src = imageUrl;
    }

    onPick(index);
  };

  const handleImageLoad = (imageUrl: string) => {
    setLoadedImages((prev) => new Set(prev).add(imageUrl));
  };

  return (
    <div className="card-picker">
      <h2 className="picker-title">
        背面のカードから{needed}枚選んでください
      </h2>
      <p className="picker-subtitle">
        直感で選んだカードが、あなたへのメッセージになります。
      </p>

      <div className="card-grid">
        {cards.map((item, index) => {
          const isRevealed = item.revealed;
          const isFlipped = flipped.has(index);
          const isLastPicked = lastPicked.has(index);
          const position = isRevealed ? cards.slice(0, index + 1).filter((c) => c.revealed).length - 1 : -1;
          const isImageLoaded = loadedImages.has(item.card.imageUrl);

          return (
            <button
              key={index}
              type="button"
              onClick={() => handlePick(index)}
              disabled={isRevealed || drawnCount >= needed}
              className={`card-slot ${isFlipped ? 'flipped' : ''} ${(nextIsLastPick && !isRevealed) || isLastPicked ? 'last-pick' : ''}`}
              aria-label={isRevealed ? `${item.card.nameJp}` : 'カードを選ぶ'}
            >
              <div className="card-inner">
                <div className="card-face">
                  <div className="card-back-pattern">✦</div>
                </div>
                <div className="card-face-back">
                  {!isImageLoaded && (
                    <div className="card-spinner" aria-hidden="true">
                      <span className="card-spinner-dot" />
                      <span className="card-spinner-dot" />
                      <span className="card-spinner-dot" />
                    </div>
                  )}
                  <img
                    src={item.card.imageUrl}
                    alt={item.card.nameJp}
                    className={`picker-card-image ${isImageLoaded ? 'loaded' : ''} ${item.reversed ? 'reversed' : ''}`}
                    loading="eager"
                    onLoad={() => handleImageLoad(item.card.imageUrl)}
                  />
                  <div className="card-name">{item.card.nameJp}</div>
                  {spread === 'three' && position >= 0 && (
                    <div className="card-position">{POSITION_LABELS[position]}</div>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
