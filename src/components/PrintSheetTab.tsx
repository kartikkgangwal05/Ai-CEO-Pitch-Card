import { Printer, Sparkles } from 'lucide-react';
import type { VisitorCard } from '../types/pitch';
import { SPECIALISATION_THEMES, formatQrPlainText } from '../utils/pitch';
import { QrCodeImage } from './QrCodeImage';

interface PrintSheetTabProps {
  currentCard: VisitorCard | null;
  history: VisitorCard[];
  onSelectCard: (card: VisitorCard) => void;
  onLoadSampleCohort: () => void;
  onGoToCreate: () => void;
}

function SingleA6Card({ card }: { card: VisitorCard }) {
  const theme = SPECIALISATION_THEMES[card.specialisation];
  const qrText = formatQrPlainText(card);
  const serialTag = `PASS #${String(card.cardSerial).padStart(3, '0')}`;

  return (
    <article
      data-testid="single-a6-card"
      className="relative flex flex-col justify-between bg-white border border-slate-300 overflow-hidden"
      style={{ width: '105mm', height: '148mm' }}
    >
      {/* Top Creative Pass Header */}
      <div>
        <header
          className="relative px-4 py-3 overflow-hidden"
          style={{
            backgroundColor: theme.headerBg,
            borderBottom: `3px solid ${theme.accent}`,
          }}
        >
          <svg
            aria-hidden="true"
            className="absolute right-0 top-0 h-full w-32 pointer-events-none"
            viewBox="0 0 120 80"
            fill="none"
          >
            <circle cx="102" cy="14" r="44" stroke={theme.patternStroke} strokeWidth="1.2" />
            <circle cx="102" cy="14" r="28" stroke={theme.patternStroke} strokeWidth="1.2" />
          </svg>

          <div className="relative flex items-center justify-between gap-2 text-[8px] font-mono-nums font-semibold tracking-wider uppercase">
            <span style={{ color: theme.badgeText }}>
              {serialTag} · #DYPAICoE
            </span>
            <span className="text-slate-300 normal-case font-sans font-medium truncate">
              Dr. D. Y. Patil B-School, Pune
            </span>
          </div>
          <h3 className="relative text-[15px] font-bold text-white leading-tight mt-1 truncate">
            {card.name}
          </h3>
          <p className="relative text-[9.5px] text-slate-200 font-medium truncate">
            PGDM {card.specialisation} · {card.dreamRole}
          </p>
        </header>

        {/* Executive Pitch */}
        <div className="px-4 pt-3 pb-2">
          <p
            className="text-[8px] font-bold uppercase tracking-wider mb-1"
            style={{ color: theme.accentText }}
          >
            30-Second Executive Pitch
          </p>
          <p className="text-[9.5px] leading-[1.42] text-slate-900">
            {card.pitch}
          </p>
        </div>

        {/* Key Strength + Mini Motivational Line */}
        <div className="px-4 pb-2 space-y-1.5">
          <div
            className="rounded px-2.5 py-1.5 border"
            style={{
              backgroundColor: theme.accentSoft,
              borderColor: `${theme.accent}35`,
            }}
          >
            <p className="text-[7.5px] font-bold uppercase tracking-wider" style={{ color: theme.accentText }}>
              1 Key Strength
            </p>
            <p className="text-[8.8px] font-semibold text-slate-900 leading-snug capitalize line-clamp-2">
              {card.strength}
            </p>
          </div>

          <div className="px-1 pt-0.5">
            <p className="text-[8.6px] italic font-medium text-[#0F1A33] leading-snug">
              “{card.motivationalLine}”
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Headline + Keywords + QR */}
      <div className="px-4 pb-3 pt-2 border-t border-slate-200 bg-slate-50/70 space-y-1.5">
        <div>
          <p className="text-[7.5px] font-bold uppercase tracking-wider" style={{ color: theme.accentText }}>
            LinkedIn Headline
          </p>
          <p className="text-[8.5px] leading-[1.3] font-semibold text-[#0F1A33] line-clamp-2 mt-0.5">
            {card.linkedin_headline}
          </p>
        </div>

        <div className="flex items-center justify-between gap-2.5 pt-0.5">
          <div className="space-y-1 flex-1 min-w-0">
            <div className="flex flex-wrap gap-1">
              {card.keywords.map((kw) => (
                <span
                  key={kw}
                  className="text-[7.3px] font-semibold text-[#0F1A33] bg-white border border-slate-200 px-1.5 py-0.5 rounded-[3px] truncate max-w-full"
                >
                  {kw}
                </span>
              ))}
            </div>
            <p className="text-[7.3px] text-slate-500">
              Scan QR for plain-text pitch & headline
            </p>
          </div>

          <div className="shrink-0 p-1 bg-white border border-slate-200 rounded-[3px]">
            <QrCodeImage
              text={qrText}
              size={240}
              className="w-[21mm] h-[21mm]"
              alt={`Plain-text QR code for ${card.name}`}
            />
          </div>
        </div>
      </div>
    </article>
  );
}

export function PrintSheetTab({
  currentCard,
  history,
  onSelectCard,
  onLoadSampleCohort,
  onGoToCreate,
}: PrintSheetTabProps) {
  const activeCard = currentCard ?? history[0] ?? null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Screen-only toolbar */}
      <div className="no-print bg-white border border-slate-200 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-[#0F1A33]">
            Single A6 Collectible Card Print (105 × 148 mm)
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Prints one unique, specialisation-themed A6 card per visitor so every student walks away
            with their own custom card.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={onLoadSampleCohort}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold px-3.5 py-2 cursor-pointer whitespace-nowrap"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#F06429]" aria-hidden="true" />
            <span>Load 4 themed samples</span>
          </button>

          {!activeCard && (
            <button
              type="button"
              onClick={onGoToCreate}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#0F1A33] text-[#0F1A33] text-xs font-semibold px-3.5 py-2 cursor-pointer whitespace-nowrap"
            >
              <span>Create first card</span>
            </button>
          )}

          <button
            type="button"
            onClick={handlePrint}
            disabled={!activeCard}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#0F1A33] hover:bg-[#1B2C52] disabled:opacity-50 text-white text-xs font-semibold px-4 py-2 cursor-pointer whitespace-nowrap"
          >
            <Printer className="w-3.5 h-3.5 text-[#F06429]" aria-hidden="true" />
            <span>Print Single A6 Card</span>
          </button>
        </div>
      </div>

      {/* Visitor Switcher when multiple cards exist */}
      {history.length > 0 && (
        <div className="no-print flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-slate-600">Select visitor card to print:</span>
          {history.map((item) => {
            const selected = activeCard?.id === item.id;
            const t = SPECIALISATION_THEMES[item.specialisation];
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectCard(item)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer whitespace-nowrap ${
                  selected
                    ? 'text-white'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                }`}
                style={
                  selected
                    ? { backgroundColor: t.headerBg, borderColor: t.accent }
                    : undefined
                }
              >
                #{String(item.cardSerial).padStart(2, '0')} · {item.name} ({item.specialisation})
              </button>
            );
          })}
        </div>
      )}

      {/* Screen Preview of the Single 105 x 148 mm A6 Card */}
      <div className="no-print flex justify-center pb-6">
        {activeCard ? (
          <div
            data-testid="print-sheet-preview"
            className="p-3 bg-white rounded-2xl border border-slate-200 shadow-[0_12px_36px_rgba(15,26,51,0.1)]"
          >
            <SingleA6Card card={activeCard} />
          </div>
        ) : (
          <div
            data-testid="print-sheet-preview"
            className="bg-white border border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center text-center p-8"
            style={{ width: '105mm', height: '148mm' }}
          >
            <p className="text-sm font-bold text-[#0F1A33]">No visitor card selected</p>
            <p className="text-xs text-slate-500 mt-1 max-w-[65mm]">
              Create a card or load the 4 themed samples above to preview and print a single 105 ×
              148 mm A6 card.
            </p>
          </div>
        )}
      </div>

      {/* Print-Only Exact Single A6 Card */}
      {activeCard && (
        <div
          className="hidden print-only-single-card bg-white"
          style={{ width: '105mm', height: '148mm' }}
        >
          <SingleA6Card card={activeCard} />
        </div>
      )}
    </div>
  );
}
