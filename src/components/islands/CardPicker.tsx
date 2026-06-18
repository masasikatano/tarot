import type { TarotCard } from '@/lib/tarotData';
import type { SpreadType } from './TarotApp';

interface Props {
  spread: SpreadType;
  cards: { card: TarotCard; revealed: boolean }[];
  drawnCount: number;
  onPick: (index: number) => void;
}

const POSITION_LABELS = ['状況', '課題', '助言'];

export default function CardPicker({ spread, cards, drawnCount, onPick }: Props) {
  const needed = spread === 'single' ? 1 : 3;

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
          const position = isRevealed ? cards.slice(0, index + 1).filter((c) => c.revealed).length - 1 : -1;

          return (
            <button
              key={index}
              type="button"
              onClick={() => onPick(index)}
              disabled={isRevealed || drawnCount >= needed}
              className={`card-slot ${isRevealed ? 'revealed' : 'face-down'}`}
              aria-label={isRevealed ? `${item.card.nameJp}` : 'カードを選ぶ'}
            >
              {isRevealed ? (
                <div className="revealed-card">
                  <img
                    src={item.card.imageUrl}
                    alt={item.card.nameJp}
                    className="card-image"
                    loading="lazy"
                  />
                  <div className="card-name">{item.card.nameJp}</div>
                  {spread === 'three' && position >= 0 && (
                    <div className="card-position">{POSITION_LABELS[position]}</div>
                  )}
                </div>
              ) : (
                <div className="card-back">
                  <div className="card-back-pattern">✦</div>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
