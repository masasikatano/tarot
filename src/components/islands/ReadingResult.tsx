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
  onRetry: () => void;
  onRestartWithWorry?: () => void;
  onSwitchToThree?: () => void;
}

const POSITION_LABELS = ['状況', '課題', '助言'];

function normalizeBoldMarkers(text: string): string {
  let count = 0;
  return text.replace(/\*\*/g, () => {
    count++;
    return count % 2 === 1 ? '<strong>' : '</strong>';
  });
}

export default function ReadingResult({ spread, drawnCards, reading, isStreaming, error, onRetry, onRestartWithWorry, onSwitchToThree }: Props) {
  const captureRef = useRef<HTMLDivElement>(null);
  const imageDataUrlRef = useRef<string | null>(null);
  const [generating, setGenerating] = useState(false);

  const canShowActions = !isStreaming && !error && reading;

  const ensureImage = async (): Promise<string | null> => {
    if (imageDataUrlRef.current) return imageDataUrlRef.current;
    if (!captureRef.current) return null;

    try {
      setGenerating(true);
      const dataUrl = await toPng(captureRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
      });
      imageDataUrlRef.current = dataUrl;
      return dataUrl;
    } catch (e) {
      console.error('Image generation failed', e);
      return null;
    } finally {
      setGenerating(false);
    }
  };

  const dataUrlToFile = async (dataUrl: string): Promise<File> => {
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    return new File([blob], 'tarot-result.png', { type: 'image/png' });
  };

  const handleSave = async () => {
    const dataUrl = await ensureImage();
    if (!dataUrl) return;

    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = 'tarot-result.png';
    link.click();
  };

  const handleShare = async () => {
    const dataUrl = await ensureImage();
    if (!dataUrl) return;

    try {
      const file = await dataUrlToFile(dataUrl);
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'TarotScryer',
          text: 'タロットのリーディング結果',
        });
        return;
      }
    } catch (e) {
      // ユーザーが共有シートをキャンセルした場合も含む
      if ((e as Error)?.name === 'AbortError') return;
      console.error('Share failed', e);
    }

    // ファイル共有未対応の場合は保存にフォールバック
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = 'tarot-result.png';
    link.click();
  };

  return (
    <div className="reading-result">
      <div ref={captureRef} className="capture-target">
        <h2 className="result-title">
          <span>{spread === 'single' ? '今日のメッセージ' : '内省スプレッド'}</span>
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

        {canShowActions && (
          <p className="disclaimer">
            タロットは未来を決定づけるものではなく、内省のきっかけとしてご活用ください。
          </p>
        )}
      </div>

      {canShowActions && (
        <div className="result-actions">
          {spread === 'single' ? (
            <div className="save-share-row">
              <button
                type="button"
                onClick={onRestartWithWorry}
                disabled={generating}
                className="action-btn action-btn-secondary"
              >
                悩みを書いて引き直し
              </button>
              <button
                type="button"
                onClick={onSwitchToThree}
                disabled={generating}
                className="action-btn action-btn-secondary"
              >
                3枚を引いて占う
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onRestartWithWorry}
              disabled={generating}
              className="action-btn action-btn-secondary"
            >
              悩みを書いて引き直す
            </button>
          )}
          <button
            type="button"
            onClick={onRetry}
            disabled={generating}
            className="retry-btn"
          >
            占い師にもう一度尋ねる
          </button>
          <div className="save-share-row">
            <button
              type="button"
              onClick={handleSave}
              disabled={generating}
              className="action-btn action-btn-secondary"
            >
              {generating ? '作成中…' : '画像を保存'}
            </button>
            <button
              type="button"
              onClick={handleShare}
              disabled={generating}
              className="action-btn action-btn-primary"
            >
              {generating ? '作成中…' : '共有する'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
