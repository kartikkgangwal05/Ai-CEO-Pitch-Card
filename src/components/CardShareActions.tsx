import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { IdCard, Loader2, MessageCircle } from 'lucide-react';
import type { VisitorCard } from '../types/pitch';
import {
  canShareFiles,
  cardFileName,
  downloadBlob,
  renderCardNodeToPng,
  shareText,
} from '../utils/cardExport';
import { TcgPitchCard } from './TcgPitchCard';

interface CardShareActionsProps {
  card: VisitorCard;
  className?: string;
  /** 'compact' = small icon+label buttons for grids (history). */
  size?: 'normal' | 'compact';
}

/**
 * "Download card" and "Share on WhatsApp". The card is rendered off-screen at print size
 * (63.5 x 88.9 mm) and saved as a 750 x 1050 PNG (2.5 x 3.5 in at 300 dpi).
 */
export function CardShareActions({ card, className = '', size = 'normal' }: CardShareActionsProps) {
  const [busy, setBusy] = useState<'download' | 'share' | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const nodeRef = useRef<HTMLDivElement>(null);
  const waiter = useRef<((node: HTMLElement) => void) | null>(null);
  const cache = useRef<{ card: VisitorCard; blob: Blob } | null>(null);

  useEffect(() => {
    if (!mounted || !nodeRef.current || !waiter.current) return;
    const resolve = waiter.current;
    waiter.current = null;
    const node = nodeRef.current;
    requestAnimationFrame(() => requestAnimationFrame(() => resolve(node)));
  }, [mounted]);

  useEffect(() => {
    setHint(null);
  }, [card]);

  const getNode = (): Promise<HTMLElement> => {
    const node = nodeRef.current?.firstElementChild as HTMLElement | null;
    if (node) return Promise.resolve(node);
    return new Promise((resolve) => {
      waiter.current = (wrapper) => resolve((wrapper.firstElementChild as HTMLElement) ?? wrapper);
      setMounted(true);
    });
  };

  const getBlob = async (): Promise<Blob> => {
    if (cache.current?.card === card) return cache.current.blob;
    const blob = await renderCardNodeToPng(await getNode());
    cache.current = { card, blob };
    return blob;
  };

  const handleDownload = async () => {
    setBusy('download');
    setHint(null);
    try {
      downloadBlob(await getBlob(), cardFileName(card));
    } catch (err) {
      setHint(err instanceof Error ? err.message : 'Download failed.');
    } finally {
      setBusy(null);
    }
  };

  const handleShare = async () => {
    setBusy('share');
    setHint(null);
    const text = shareText(card);
    try {
      const blob = await getBlob();
      const file = new File([blob], cardFileName(card), { type: 'image/png' });
      if (canShareFiles()) {
        try {
          await navigator.share({ files: [file], title: `${card.name}'s Power Card`, text });
        } catch (err) {
          const name = err instanceof DOMException ? err.name : '';
          if (name === 'AbortError') return; // closed the share sheet
          if (name === 'NotAllowedError') {
            // The image took too long and the browser dropped the tap; it is cached now.
            setHint('Card is ready. Tap “Share on WhatsApp” again.');
            return;
          }
          throw err;
        }
        return;
      }
      // Desktop browsers cannot pass a file to WhatsApp: save the image, open WhatsApp with the message.
      downloadBlob(blob, file.name);
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
      setHint('Card image downloaded. Attach it in the WhatsApp chat that just opened.');
    } catch (err) {
      setHint(err instanceof Error ? err.message : 'Sharing failed.');
    } finally {
      setBusy(null);
    }
  };

  const compact = size === 'compact';
  const btn = compact
    ? 'inline-flex flex-1 items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-bold cursor-pointer whitespace-nowrap disabled:opacity-60'
    : 'inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold cursor-pointer whitespace-nowrap disabled:opacity-60';
  const icon = compact ? 'h-3.5 w-3.5' : 'h-4 w-4';

  return (
    <div className={`no-print w-full ${className}`}>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => void handleDownload()}
          disabled={busy !== null}
          data-testid="download-card-btn"
          className={`${btn} border border-sky-400/50 bg-[#081226] text-white hover:bg-[#0D1E42]`}
        >
          {busy === 'download' ? <Loader2 className={`${icon} animate-spin`} aria-hidden="true" /> : <IdCard className={icon} aria-hidden="true" />}
          <span>{compact ? 'Download' : 'Download card'}</span>
        </button>
        <button
          type="button"
          onClick={() => void handleShare()}
          disabled={busy !== null}
          data-testid="whatsapp-share-btn"
          className={`${btn} bg-[#25D366] text-[#052e16] hover:bg-[#3ee07a]`}
        >
          {busy === 'share' ? <Loader2 className={`${icon} animate-spin`} aria-hidden="true" /> : <MessageCircle className={icon} aria-hidden="true" />}
          <span>{compact ? 'WhatsApp' : 'Share on WhatsApp'}</span>
        </button>
      </div>
      {hint && <p className="mt-1.5 text-center text-[11px] text-sky-200/90">{hint}</p>}
      {mounted &&
        createPortal(
          // Off-screen (not display:none, so SVG gradients still paint) print-size copy used for the PNG.
          <div
            ref={nodeRef}
            aria-hidden="true"
            className="no-print"
            style={{ position: 'fixed', left: -10000, top: 0, pointerEvents: 'none' }}
          >
            <TcgPitchCard card={card} mode="print" />
          </div>,
          document.body
        )}
    </div>
  );
}
