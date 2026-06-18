import type { SpreadType } from './TarotApp';

interface Props {
  onSelect: (spread: SpreadType) => void;
}

export default function SpreadSelector({ onSelect }: Props) {
  return (
    <div className="spread-selector">
      <button
        type="button"
        onClick={() => onSelect('single')}
        className="spread-card"
        aria-label="今日のメッセージを1枚引く"
      >
        <div className="spread-icon">☀️</div>
        <div className="spread-title">今日のメッセージ</div>
        <div className="spread-desc">1枚引き</div>
      </button>
      <button
        type="button"
        onClick={() => onSelect('three')}
        className="spread-card"
        aria-label="内省スプレッドを3枚引く"
      >
        <div className="spread-icon">🌙</div>
        <div className="spread-title">内省スプレッド</div>
        <div className="spread-desc">3枚：状況・課題・助言</div>
      </button>
    </div>
  );
}
