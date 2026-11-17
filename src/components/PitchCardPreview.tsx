import { useState } from 'react';
import { Award, Check, Copy, Eye, EyeOff, Mic, Printer, Quote, RefreshCw } from 'lucide-react';
import type { VisitorCard } from '../types/pitch';
import {
  SPECIALISATION_THEMES,
  countWords,
  estimateReadSeconds,
  formatQrPlainText,
} from '../utils/pitch';
import { PitchTextHighlight } from './PitchTextHighlight';
import { QrCodeImage } from './QrCodeImage';

interface PitchCardPreviewProps {
  card: VisitorCard | null;
  notice: string | null;
  queueCount: number;
  onRetryAi?: () => void;
  onOpenSayIt: () => void;
  onOpenPrint: () => void;
  onLoadSampleCard: () => void;
}

export function PitchCardPreview({
  card,
  notice,
  queueCount,
  onRetryAi,
  onOpenSayIt,
  onOpenPrint,
  onLoadSampleCard,
}: PitchCardPreviewProps) {
  const [copiedType, setCopiedType] = useState<'all' | 'headline' | null>(null);
  const [showQrPlainText, setShowQrPlainText] = useState(false);

  const handleCopy = async (text: string, type: 'all' | 'headline') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedType(type);
      setTimeout(() => setCopiedType(null), 1800);
    } catch {
      // Clipboard blocked in non-HTTPS or headless context
    }
  };

  if (!card) {
    return (
      <section
        aria-label="Pitch card preview"
        className="bg-white border border-slate-200/90 rounded-2xl shadow-[0_6px_24px_rgba(15,26,51,0.06)] overflow-hidden flex flex-col justify-between min-h-[500px]"
      >
        <div className="relative bg-[#0F1A33] px-6 py-5 border-b-[3px] border-[#F06429] overflow-hidden">
          <svg
            aria-hidden="true"
            className="absolute right-0 top-0 h-full w-48 pointer-events-none opacity-40"
            viewBox="0 0 200 100"
            fill="none"
          >
            <circle cx="170" cy="20" r="64" stroke="rgba(240,100,41,0.35)" strokeWidth="1.5" />
            <circle cx="170" cy="20" r="42" stroke="rgba(240,100,41,0.25)" strokeWidth="1.5" />
          </svg>
          <div className="relative flex items-center justify-between">
            <span className="text-sm font-semibold text-white tracking-tight">
              Dr. D. Y. Patil B-School, Pune
            </span>
            <span className="text-xs font-mono-nums font-semibold text-[#F06429] tracking-wide">
              #DYPAICoE · PASS STUDIO
            </span>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center text-center px-8 py-12 max-w-md mx-auto">
          <p className="text-xs font-mono-nums font-semibold text-[#F06429] tracking-wider uppercase mb-2">
            Bespoke A6 Career Card · 105 × 148 mm
          </p>
          <h3 className="text-2xl font-bold text-[#0F1A33] mb-2 tracking-tight">
            Ready for the next visitor
          </h3>
          <p className="text-sm text-slate-600 leading-relaxed mb-6">
            Enter 5 visitor details on the left to craft a polished executive pitch, key strength
            spotlight, unique motivational line, LinkedIn headline, 3 keywords, and offline QR pass.
          </p>
          <button
            type="button"
            onClick={onLoadSampleCard}
            className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-[#0F1A33] text-sm font-semibold px-4 py-2.5 transition-colors cursor-pointer"
          >
            Preview sample pass
          </button>
        </div>

        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
          <span>Session cards ready: {queueCount}</span>
          <span>Single A6 (105 × 148 mm) print ready</span>
        </div>
      </section>
    );
  }

  const theme = SPECIALISATION_THEMES[card.specialisation];
  const wordCount = countWords(card.pitch);
  const readSeconds = estimateReadSeconds(card.pitch);
  const qrPlainText = formatQrPlainText(card);
  const serialTag = `PASS #${String(card.cardSerial).padStart(3, '0')}`;

  return (
    <section
      data-testid="generated-pitch-card"
      aria-label="Generated pitch card"
      className="bg-white border border-slate-200/90 rounded-2xl shadow-[0_8px_30px_rgba(15,26,51,0.08)] overflow-hidden"
    >
      {/* Creative Pass Header with Architectural SVG Geometry */}
      <div
        className="relative px-6 py-5 overflow-hidden"
        style={{
          backgroundColor: theme.headerBg,
          borderBottom: `3px solid ${theme.accent}`,
        }}
      >
        <svg
          aria-hidden="true"
          className="absolute right-0 top-0 h-full w-64 pointer-events-none"
          viewBox="0 0 240 120"
          fill="none"
        >
          <circle cx="205" cy="18" r="76" stroke={theme.patternStroke} strokeWidth="1.5" />
          <circle cx="205" cy="18" r="50" stroke={theme.patternStroke} strokeWidth="1.5" />
          <line x1="110" y1="120" x2="220" y2="10" stroke={theme.patternStroke} strokeWidth="1" />
        </svg>

        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono-nums text-slate-300">
              <span style={{ color: theme.badgeText }} className="font-semibold">
                {serialTag}
              </span>
              <span aria-hidden="true">·</span>
              <span>#DYPAICoE</span>
              <span aria-hidden="true">·</span>
              <span>Dr. D. Y. Patil B-School, Pune</span>
            </div>
            <h3 className="text-2xl font-bold text-white tracking-tight mt-1">{card.name}</h3>
          </div>

          <div className="text-right">
            <p className="text-xs font-semibold" style={{ color: theme.badgeText }}>
              PGDM {card.specialisation} · {theme.name}
            </p>
            <p className="text-xs text-slate-300 mt-0.5">
              Target: {card.dreamRole} · {card.tone}
            </p>
          </div>
        </div>
      </div>

      {notice && (
        <div
          role="status"
          className="px-6 py-2.5 bg-amber-50 border-b border-amber-200 text-xs text-amber-900 flex flex-wrap items-center justify-between gap-2"
        >
          <span>{notice}</span>
          {onRetryAi && (
            <button
              type="button"
              onClick={onRetryAi}
              className="inline-flex items-center gap-1 font-semibold text-[#0F1A33] hover:underline cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" aria-hidden="true" />
              <span>Retry AI</span>
            </button>
          )}
        </div>
      )}

      <div className="p-6 space-y-5">
        {/* Main Pitch + QR Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-semibold text-slate-500 tracking-wide">
                30-Second Executive Pitch
              </span>
              <div className="flex items-center gap-3 text-xs font-mono-nums text-slate-600">
                <span>{wordCount} words</span>
                <span aria-hidden="true">·</span>
                <span>~{readSeconds}s spoken</span>
                {card.generationMs !== undefined && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="text-emerald-700 font-medium">
                      Ready in {(card.generationMs / 1000).toFixed(1)}s
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="bg-[#F8FAFC] border border-slate-200 rounded-xl p-5">
              <p className="text-[15.5px] leading-[1.68] text-slate-900 font-normal">
                <PitchTextHighlight text={card.pitch} />
              </p>
              <p className="mt-3 text-xs text-slate-500">
                Swap the highlighted <span className="text-[#9A3412] font-medium">[bracket]</span>{' '}
                detail with your verified campus or internship metric.
              </p>
            </div>
          </div>

          {/* Plain-Text QR Code Block */}
          <div className="lg:col-span-4 flex flex-col items-center text-center bg-slate-50/80 border border-slate-200 rounded-xl p-4">
            <div className="p-1.5 bg-white rounded-lg border border-slate-200">
              <QrCodeImage text={qrPlainText} size={320} className="w-36 h-36" />
            </div>
            <p className="mt-2.5 text-xs font-semibold text-[#0F1A33]">
              Scan to Save Pitch Text
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Plain text only · iOS & Android
            </p>
            <button
              type="button"
              onClick={() => setShowQrPlainText((prev) => !prev)}
              className="mt-2.5 inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-[#0F1A33] cursor-pointer"
            >
              {showQrPlainText ? (
                <>
                  <EyeOff className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Hide QR text</span>
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Inspect QR text</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Key Strength + Unique Mini Motivational Line (Required directly below pitch) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            data-testid="card-key-strength"
            className="rounded-xl border p-4"
            style={{
              backgroundColor: theme.accentSoft,
              borderColor: `${theme.accent}35`,
            }}
          >
            <div className="flex items-center gap-1.5 text-xs font-semibold mb-1" style={{ color: theme.accentText }}>
              <Award className="w-3.5 h-3.5" aria-hidden="true" />
              <span>1 Key Strength</span>
            </div>
            <p className="text-sm font-semibold text-slate-900 leading-snug capitalize">
              {card.strength}
            </p>
          </div>

          <div
            data-testid="card-motivational-line"
            className="rounded-xl border border-slate-200 bg-white p-4"
          >
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-1">
              <Quote className="w-3.5 h-3.5" style={{ color: theme.accent }} aria-hidden="true" />
              <span>Personal Launch Note</span>
            </div>
            <p className="text-sm italic font-medium text-[#0F1A33] leading-snug">
              “{card.motivationalLine}”
            </p>
          </div>
        </div>

        {showQrPlainText && (
          <div className="bg-slate-900 text-slate-100 rounded-xl p-4 text-xs font-mono-nums whitespace-pre-wrap leading-relaxed">
            {qrPlainText}
          </div>
        )}

        {/* LinkedIn Headline */}
        <div className="border-t border-slate-200 pt-4">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <span className="text-xs font-semibold text-slate-500 tracking-wide">
              LinkedIn Headline
            </span>
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono-nums text-slate-500">
                {card.linkedin_headline.length} / 200 chars
              </span>
              <button
                type="button"
                onClick={() => handleCopy(card.linkedin_headline, 'headline')}
                className="inline-flex items-center gap-1 text-xs font-medium text-[#0F1A33] hover:text-[#F06429] cursor-pointer"
              >
                {copiedType === 'headline' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Copy headline</span>
                  </>
                )}
              </button>
            </div>
          </div>
          <p className="text-sm font-medium text-slate-900 bg-slate-50/70 border border-slate-200 rounded-xl px-4 py-3">
            {card.linkedin_headline}
          </p>
        </div>

        {/* 3 Recruiter Keyword Chips */}
        <div>
          <span className="block text-xs font-semibold text-slate-500 tracking-wide mb-2">
            Top 3 Recruiter Search Keywords
          </span>
          <div className="flex flex-wrap gap-2">
            {card.keywords.map((kw) => (
              <span
                key={kw}
                className="inline-flex items-center px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-semibold text-[#0F1A33]"
              >
                {kw}
              </span>
            ))}
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="border-t border-slate-200 pt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => handleCopy(qrPlainText, 'all')}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold px-3.5 py-2 transition-colors cursor-pointer whitespace-nowrap"
            >
              {copiedType === 'all' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
                  <span>Copied pitch + headline</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Copy pitch + headline</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onOpenSayIt}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#0F1A33] bg-white hover:bg-[#0F1A33]/5 text-[#0F1A33] text-xs font-semibold px-3.5 py-2 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Mic className="w-3.5 h-3.5 text-[#F06429]" aria-hidden="true" />
              <span>Practice in “Say it”</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onOpenPrint}
            className="inline-flex items-center gap-1.5 rounded-xl text-white text-xs font-semibold px-4 py-2 transition-opacity hover:opacity-95 cursor-pointer whitespace-nowrap"
            style={{ backgroundColor: theme.accentText }}
          >
            <Printer className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Print Single Card (A6)</span>
          </button>
        </div>
      </div>
    </section>
  );
}
