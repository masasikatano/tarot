import { useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import type { DrawnCard, SpreadType } from './TarotApp';

interface Props {
  spread: SpreadType | null;
  drawnCards: DrawnCard[];
  reading: string;
  isStreaming: boolean;
  error: string | null;
}

const POSITION_LABELS = ['状況', '課題', '助言'];

function normalizeBoldMarkers(text: string): string {
  let count = 0;
  return text.replace(/\*\*/g, () => {
    count++;
    return count % 2 === 1 ? '<strong>' : '</strong>';
  });
}

export default function ReadingResult({ spread, drawnCards, reading, isStreaming, error }: Props) {
  const captureRef = useRef<HTMLDivElement>(null);
  const [sharing, setSharing] = useState(false);

  const handleShare = async () => {
    if (!captureRef.current) return;

    try {
      setSharing(true);
      const dataUrl = await toPng(captureRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
      });

      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const file = new File([blob], 'tarot-result.png', { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'TarotScryer',
          text: 'タロットのリーディング結果',
        });
      } else {
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = 'tarot-result.png';
        link.click();
      }
    } catch (e) {
      console.error('Share failed', e);
    } finally {
      setSharing(false);
    }
  };

  const canShowShareButton = !isStreaming && !error && reading;

  return (
    <div className="reading-result">
      <div ref={captureRef} className="capture-target">
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
                  crossOrigin="anonymous"
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
            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
              {normalizeBoldMarkers(reading)}
            </ReactMarkdown>
          ) : isStreaming ? (
            <span className="loading">
              占い師がカードを読んでいます<span className="dot">.</span><span className="dot">.</span><span className="dot">.</span>
            </span>
          ) : null}
        </div>

        {canShowShareButton && (
          <p className="disclaimer">
            占いは利用者の特定の目的に適合すること、期待する結果・価値・正確性・実現性を有すること及び利用者に不都合が生じないことについて、何らの保証をするものではありません。
          </p>
        )}
      </div>

      {canShowShareButton && (
        <button
          type="button"
          onClick={handleShare}
          disabled={sharing}
          className="share-btn"
        >
          {sharing ? '画像を作成中…' : '画像で保存 / 共有'}
        </button>
      )}
    </div>
  );
}
