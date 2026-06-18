import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { DrawnCard, SpreadType } from './TarotApp';

interface Props {
  spread: SpreadType | null;
  drawnCards: DrawnCard[];
  reading: string;
  isStreaming: boolean;
  error: string | null;
}

const POSITION_LABELS = ['状況', '課題', '助言'];

export default function ReadingResult({ spread, drawnCards, reading, isStreaming, error }: Props) {
  return (
    <div className="reading-result">
      <h2 className="result-title">
        {spread === 'single' ? '今日のメッセージ' : '内省スプレッド'}
      </h2>

      <div className="result-cards">
        {drawnCards.map((drawn, idx) => (
          <div key={idx} className="result-card">
            <div className="result-card-image">
              <img
                src={drawn.card.imageUrl}
                alt={drawn.card.nameJp}
                className={`card-image ${drawn.reversed ? 'reversed' : ''}`}
                loading="lazy"
              />
            </div>
            <div className="result-card-info">
              {spread === 'three' && (
                <div className="result-position">{POSITION_LABELS[drawn.position]}</div>
              )}
              <div className="result-name">{drawn.card.nameJp}</div>
              <div className="result-name-en">{drawn.card.name}</div>
              <div className={`result-orientation ${drawn.reversed ? 'reversed' : ''}`}>
                {drawn.reversed ? '逆位置' : '正位置'}
              </div>
              <div className="result-keywords">
                {(drawn.reversed ? drawn.card.keywordsReversed : drawn.card.keywords).slice(0, 4).join(' · ')}
              </div>
            </div>
          </div>
        ))}
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="reading-text">
        {reading ? (
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{reading}</ReactMarkdown>
        ) : isStreaming ? (
          <span className="loading">
            占い師がカードを読んでいます<span className="dot">.</span><span className="dot">.</span><span className="dot">.</span>
          </span>
        ) : null}
      </div>

      {!isStreaming && !error && reading && (
        <p className="disclaimer">
          この結果はエンターテイメント・内省のきっかけであり、専門的な助言ではありません。
        </p>
      )}
    </div>
  );
}
