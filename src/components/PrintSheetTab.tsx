import { Printer, Sparkles } from 'lucide-react';
import type { VisitorCard } from '../types/pitch';
import { TcgPitchCard } from './TcgPitchCard';

interface PrintSheetTabProps {
  currentCard: VisitorCard | null;
  history: VisitorCard[];
  onSelectCard: (card: VisitorCard) => void;
  onLoadSampleCohort: () => void;
  onGoToCreate: () => void;
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
      <div className="no-print bg-[#081226]/95 border border-sky-400/30 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white">
            Double-Sided Collector Card Print · 2.5 × 3.5 in (63.5 × 88.9 mm)
          </h2>
          <p className="text-xs text-sky-200/85 mt-0.5">
            Prints exact 2.5 × 3.5 in (63.5 × 88.9 mm) Front (Pitch Card) and Back (Die-Cut Name
            Sticker) side-by-side with trim borders on A4 paper.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={onLoadSampleCohort}
            className="inline-flex items-center gap-1.5 rounded-xl border border-sky-400/35 bg-[#040A17] hover:bg-[#0D1E42] text-white text-xs font-semibold px-3.5 py-2 cursor-pointer whitespace-nowrap"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#00D4FF]" aria-hidden="true" />
            <span>Load 4 themed samples</span>
          </button>

          {!activeCard && (
            <button
              type="button"
              onClick={onGoToCreate}
              className="inline-flex items-center gap-1.5 rounded-xl border border-sky-400/50 text-sky-200 text-xs font-semibold px-3.5 py-2 cursor-pointer whitespace-nowrap"
            >
              <span>Create first card</span>
            </button>
          )}

          <button
            type="button"
            onClick={handlePrint}
            disabled={!activeCard}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#00D4FF] hover:bg-sky-300 disabled:opacity-50 text-[#030712] text-xs font-bold px-4 py-2 cursor-pointer whitespace-nowrap"
          >
            <Printer className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Print 2.5 × 3.5 in Card</span>
          </button>
        </div>
      </div>

      {/* Visitor Switcher when multiple cards exist */}
      {history.length > 0 && (
        <div className="no-print flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-sky-200">Select visitor card to print:</span>
          {history.map((item) => {
            const selected = activeCard?.id === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectCard(item)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer whitespace-nowrap ${
                  selected
                    ? 'bg-[#00D4FF] text-[#030712] border-[#00D4FF]'
                    : 'bg-[#081226] border-sky-400/30 text-white hover:border-sky-300'
                }`}
              >
                #{String(item.cardSerial).padStart(2, '0')} · {item.name} ({item.specialisation})
              </button>
            );
          })}
        </div>
      )}

      {/* Screen Preview of Exact 63 x 88 mm Front + Back Collector Pair */}
      <div className="no-print flex justify-center pb-6">
        {activeCard ? (
          <div
            data-testid="print-sheet-preview"
            className="p-5 sm:p-6 bg-[#081226]/95 rounded-2xl border border-sky-400/30 shadow-[0_18px_48px_rgba(0,0,0,0.65)]"
          >
            <div className="flex flex-wrap items-center justify-center gap-6">
              <div className="space-y-2 text-center">
                <p className="text-[11px] font-mono-nums text-sky-300 uppercase tracking-wider">
                  Front · Pitch Card (63.5 × 88.9 mm)
                </p>
                <div className="p-1.5 border border-dashed border-sky-400/50 rounded-xl bg-white/5">
                  <TcgPitchCard card={activeCard} mode="print" side="front" />
                </div>
              </div>

              <div className="space-y-2 text-center">
                <p className="text-[11px] font-mono-nums text-sky-300 uppercase tracking-wider">
                  Back · Name Sticker (63.5 × 88.9 mm)
                </p>
                <div className="p-1.5 border border-dashed border-sky-400/50 rounded-xl bg-white/5">
                  <TcgPitchCard card={activeCard} mode="print" side="back" />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div
            data-testid="print-sheet-preview"
            className="bg-[#081226]/95 border border-dashed border-sky-400/40 rounded-2xl flex flex-col items-center justify-center text-center p-8 max-w-md w-full"
          >
            <p className="text-sm font-bold text-white">No visitor card selected</p>
            <p className="text-xs text-sky-200/80 mt-1">
              Create a card or load the 4 themed samples above to preview and print an exact 2.5 ×
              3.5 in (63.5 × 88.9 mm) Front + Name Sticker Back card pair.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
