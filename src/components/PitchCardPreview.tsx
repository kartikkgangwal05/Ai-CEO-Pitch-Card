import { useState } from 'react';
import { Check, Copy, Eye, EyeOff, Layers, Mic, Printer, RefreshCw } from 'lucide-react';
import type { CharacterId, Specialisation, VisitorCard } from '../types/pitch';
import { getCharacterById, getMascotForSpecialisation } from '../utils/characters';
import { TCG_THEMES, countWords, estimateReadSeconds, formatQrPlainText } from '../utils/pitch';
import { CharacterIllustrationSvg } from './CharacterIllustrationSvg';
import { PitchTextHighlight } from './PitchTextHighlight';
import { TcgPitchCard } from './TcgPitchCard';

interface PitchCardPreviewProps {
  card: VisitorCard | null;
  selectedSpecialisation: Specialisation;
  selectedCharacterId: CharacterId;
  capturedPhotoUrl: string;
  aiCharacterUrl: string;
  isGeneratingCharacter?: boolean;
  notice: string | null;
  queueCount: number;
  onRetryAi?: () => void;
  onQuickPrint: () => void;
  onOpenSayIt: () => void;
  onOpenPrint: () => void;
  onLoadSampleCard: () => void;
}

export function PitchCardPreview({
  card,
  selectedSpecialisation,
  selectedCharacterId,
  capturedPhotoUrl,
  aiCharacterUrl,
  isGeneratingCharacter = false,
  notice,
  queueCount,
  onRetryAi,
  onQuickPrint,
  onOpenSayIt,
  onOpenPrint,
  onLoadSampleCard,
}: PitchCardPreviewProps) {
  const [cardSide, setCardSide] = useState<'front' | 'back'>('front');
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
    const previewTheme = TCG_THEMES[selectedSpecialisation];
    const previewMascot =
      selectedCharacterId === 'auto'
        ? getMascotForSpecialisation(selectedSpecialisation)
        : getCharacterById(selectedCharacterId);
    const activePreviewPortrait = aiCharacterUrl || capturedPhotoUrl;

    return (
      <section
        aria-label="Pitch card preview"
        className="bg-[#081226]/95 backdrop-blur-sm border border-sky-400/30 rounded-2xl shadow-[0_14px_40px_rgba(0,140,255,0.12)] overflow-hidden flex flex-col justify-between min-h-[560px]"
      >
        <div className="bg-[#050C1B] px-6 py-4 border-b border-sky-400/25 flex items-center justify-between gap-2">
          <span className="text-sm font-semibold text-white tracking-tight">
            Dr. D. Y. Patil B-School, Pune · #DYPAICoE
          </span>
          <span className="text-xs font-mono-nums font-semibold text-[#00D4FF] tracking-wide whitespace-nowrap">
            {selectedSpecialisation} · 2.5 × 3.5 in
          </span>
        </div>

        {/* Dynamic Camera / AI Character & Sketch Container at the Top of Card Preview */}
        <div className="px-6 pt-6">
          <div
            data-testid="preview-svg-mascot-container"
            className="relative w-full max-w-md mx-auto rounded-2xl overflow-hidden border border-sky-400/50 shadow-[0_0_28px_rgba(0,212,255,0.22)]"
            style={{ background: previewTheme.artGradient }}
          >
            <div className="h-44 sm:h-48 w-full">
              {activePreviewPortrait ? (
                <img
                  src={activePreviewPortrait}
                  alt={aiCharacterUrl ? 'AI-generated card character or sketch' : 'Captured camera portrait'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <CharacterIllustrationSvg
                  characterId={previewMascot.id}
                  specialisation={selectedSpecialisation}
                  className="w-full h-full"
                />
              )}
            </div>
            <div className="bg-[#03091B]/90 border-t border-sky-400/30 px-4 py-2.5 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-white">
                  {isGeneratingCharacter
                    ? 'Rendering AI Character / Sketch...'
                    : aiCharacterUrl
                      ? 'Character / Sketch Ready'
                      : capturedPhotoUrl
                        ? 'Camera Photo Captured'
                        : previewMascot.label}
                </p>
                <p className="text-[11px] text-sky-300">
                  {isGeneratingCharacter
                    ? 'Stylizing portrait for your 2.5 × 3.5 in card'
                    : aiCharacterUrl
                      ? 'Custom styled for your 2.5 × 3.5 in card'
                      : capturedPhotoUrl
                        ? 'Click "Convert to AI Character" or mint directly'
                        : 'Open camera, upload photo, or click Generate AI Character'}
                </p>
              </div>
              <span className="text-[10px] font-mono-nums font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#00D4FF] text-[#030712] whitespace-nowrap">
                {previewTheme.typeLabel}
              </span>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center text-center px-8 py-7 max-w-md mx-auto">
          <p className="text-xs font-mono-nums font-semibold text-[#00D4FF] tracking-wider uppercase mb-1.5">
            Collector Card · 2.5 × 3.5 in (63.5 × 88.9 mm)
          </p>
          <h3 className="text-xl font-bold text-white mb-2 tracking-tight">
            Ready to mint your {selectedSpecialisation} card
          </h3>
          <p className="text-sm text-sky-100/80 leading-relaxed mb-5">
            Capture a photo or generate an AI Character / Ink Sketch, fill Strength 1 (Strength 2
            optional), and print in one tap.
          </p>
          <button
            type="button"
            onClick={onLoadSampleCard}
            className="inline-flex items-center justify-center rounded-xl border border-sky-400/50 bg-[#0B1C3D] hover:bg-[#102957] text-white text-sm font-semibold px-4 py-2.5 transition-colors cursor-pointer"
          >
            Preview sample collector card
          </button>
        </div>

        <div className="px-6 py-3.5 bg-[#050C1B] border-t border-sky-400/25 text-xs text-sky-200/80 flex items-center justify-between">
          <span>Session cards ready: {queueCount}</span>
          <span>2.5 × 3.5 in (63.5 × 88.9 mm)</span>
        </div>
      </section>
    );
  }

  const wordCount = countWords(card.pitch);
  const readSeconds = estimateReadSeconds(card.pitch);
  const qrPlainText = formatQrPlainText(card);

  return (
    <section
      data-testid="generated-pitch-card"
      aria-label="Generated pitch card"
      className="space-y-4"
    >
      {notice && (
        <div
          role="status"
          className="px-4 py-3 bg-sky-500/10 border border-sky-400/35 rounded-xl text-xs text-sky-100 flex flex-wrap items-center justify-between gap-2"
        >
          <span>{notice}</span>
          {onRetryAi && (
            <button
              type="button"
              onClick={onRetryAi}
              className="inline-flex items-center gap-1 font-semibold text-[#00D4FF] hover:underline cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" aria-hidden="true" />
              <span>Retry AI</span>
            </button>
          )}
        </div>
      )}

      {/* Split Display: Left = Interactive Front/Back 63x88 Card + Single-Tap Print, Right = Executive Pitch & QR Companion */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
        <div className="xl:col-span-6 space-y-3">
          {/* Front / Back Toggle Bar */}
          <div className="flex items-center justify-between gap-2 bg-[#081226] border border-sky-400/30 rounded-xl p-1 max-w-[356px] mx-auto">
            <button
              type="button"
              onClick={() => setCardSide('front')}
              aria-pressed={cardSide === 'front'}
              className={`flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                cardSide === 'front'
                  ? 'bg-[#00D4FF] text-[#030712]'
                  : 'text-sky-100 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Front: Pitch Card</span>
            </button>
            <button
              type="button"
              onClick={() => setCardSide('back')}
              aria-pressed={cardSide === 'back'}
              className={`flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                cardSide === 'back'
                  ? 'bg-[#00D4FF] text-[#030712]'
                  : 'text-sky-100 hover:text-white'
              }`}
            >
              <span>Back: Name Sticker</span>
            </button>
          </div>

          <TcgPitchCard card={card} mode="preview" side={cardSide} />

          {/* Single-Tap Print Bar right below the card */}
          <div className="max-w-[356px] mx-auto flex items-center gap-2">
            <button
              type="button"
              data-testid="single-tap-print-btn"
              onClick={onQuickPrint}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-[#00D4FF] hover:bg-sky-300 text-[#030712] text-xs font-bold py-2.5 px-4 shadow-[0_0_20px_rgba(0,212,255,0.3)] transition-colors cursor-pointer whitespace-nowrap"
            >
              <Printer className="w-4 h-4" aria-hidden="true" />
              <span>1-Tap Print Card (2.5×3.5&quot;)</span>
            </button>
            <button
              type="button"
              onClick={onOpenPrint}
              className="rounded-xl border border-sky-400/35 bg-[#081226] hover:bg-[#0D1E42] text-sky-100 hover:text-white text-xs font-semibold py-2.5 px-3 transition-colors cursor-pointer whitespace-nowrap"
              title="Open Print Sheet preview & queue switcher"
            >
              Queue ({queueCount})
            </button>
          </div>
        </div>

        <div className="xl:col-span-6 bg-[#081226]/95 border border-sky-400/30 rounded-2xl p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-sky-400/20 pb-3">
            <span className="text-xs font-semibold text-[#00D4FF] tracking-wide uppercase">
              30-Second Executive Pitch
            </span>
            <div className="flex items-center gap-2 text-xs font-mono-nums text-sky-100">
              <span>{wordCount} words</span>
              <span aria-hidden="true">·</span>
              <span>~{readSeconds}s</span>
              {card.generationMs !== undefined && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-sky-300">
                    {(card.generationMs / 1000).toFixed(1)}s
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="bg-[#040A17] border border-sky-400/25 rounded-xl p-4">
            <p className="text-sm leading-[1.7] text-white">
              <PitchTextHighlight text={card.pitch} />
            </p>
            <p className="mt-2.5 text-[11px] text-sky-200/80">
              Swap the highlighted <span className="text-[#00D4FF] font-semibold">[bracket]</span>{' '}
              detail with your verified milestone.
            </p>
          </div>

          {/* LinkedIn Headline */}
          <div>
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-xs font-semibold text-white">LinkedIn Headline</span>
              <div className="flex items-center gap-2.5">
                <span className="text-[11px] font-mono-nums text-sky-200/80">
                  {card.linkedin_headline.length}/200
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(card.linkedin_headline, 'headline')}
                  className="inline-flex items-center gap-1 text-xs font-medium text-[#00D4FF] hover:text-white cursor-pointer"
                >
                  {copiedType === 'headline' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>
            <p className="text-xs font-medium text-white bg-[#040A17] border border-sky-400/25 rounded-xl px-3.5 py-2.5 leading-relaxed">
              {card.linkedin_headline}
            </p>
          </div>

          {/* Inspect QR Text Toggle */}
          <div>
            <button
              type="button"
              onClick={() => setShowQrPlainText((prev) => !prev)}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-sky-200 hover:text-white cursor-pointer"
            >
              {showQrPlainText ? (
                <>
                  <EyeOff className="w-3.5 h-3.5 text-[#00D4FF]" aria-hidden="true" />
                  <span>Hide QR plain text</span>
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5 text-[#00D4FF]" aria-hidden="true" />
                  <span>Inspect QR plain text</span>
                </>
              )}
            </button>

            {showQrPlainText && (
              <div className="mt-2 bg-[#030712] border border-sky-400/30 text-sky-100 rounded-xl p-3 text-[11px] font-mono-nums whitespace-pre-wrap leading-relaxed max-h-44 overflow-y-auto">
                {qrPlainText}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="pt-2 border-t border-sky-400/20 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleCopy(qrPlainText, 'all')}
              className="inline-flex items-center gap-1.5 rounded-xl border border-sky-400/35 bg-[#040A17] hover:bg-[#0D1E42] text-white text-xs font-semibold px-3 py-2 transition-colors cursor-pointer whitespace-nowrap"
            >
              {copiedType === 'all' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
                  <span>Copied all</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Copy full text</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onOpenSayIt}
              className="inline-flex items-center gap-1.5 rounded-xl border border-sky-400/35 bg-[#040A17] hover:bg-[#0D1E42] text-white text-xs font-semibold px-3 py-2 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Mic className="w-3.5 h-3.5 text-[#00D4FF]" aria-hidden="true" />
              <span>Say It</span>
            </button>

            <button
              type="button"
              onClick={onQuickPrint}
              className="ml-auto inline-flex items-center gap-1.5 rounded-xl bg-[#00D4FF] hover:bg-sky-300 text-[#030712] text-xs font-bold px-3.5 py-2 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Printer className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Print Now</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
