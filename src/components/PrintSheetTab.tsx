import { useState } from 'react';
import { memberNo } from '../utils/foundingMember';
import { Maximize2, Pencil, Printer, Sparkles } from 'lucide-react';
import type { VisitorCard } from '../types/pitch';
import { CardEditPanel } from './CardEditPanel';
import { CardFullscreenModal } from './CardFullscreenModal';
import { CardShareActions } from './CardShareActions';
import { TcgPitchCard } from './TcgPitchCard';

interface PrintSheetTabProps {
  currentCard: VisitorCard | null;
  history: VisitorCard[];
  onSelectCard: (card: VisitorCard) => void;
  onUpdateCard: (updated: VisitorCard) => void;
  onLoadSampleCohort: () => void;
  onGoToCreate: () => void;
}

export function PrintSheetTab({
  currentCard,
  history,
  onSelectCard,
  onUpdateCard,
  onLoadSampleCohort,
  onGoToCreate,
}: PrintSheetTabProps) {
  const activeCard = currentCard ?? history[0] ?? null;
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);
  const [modalInitialEdit, setModalInitialEdit] = useState(false);
  const [isInlineEditing, setIsInlineEditing] = useState(false);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  // Unsaved edits from the inline editor, shown live on the card.
  const [draftCard, setDraftCard] = useState<VisitorCard | null>(null);
  const shownCard = (isInlineEditing && draftCard?.id === activeCard?.id ? draftCard : null) ?? activeCard;

  const handlePrint = () => {
    window.print();
  };

  const handleOpenFullscreen = (editMode = false) => {
    if (!activeCard) return;
    setModalInitialEdit(editMode);
    setIsFullscreenOpen(true);
  };

  const handleSaveCard = (updated: VisitorCard) => {
    onUpdateCard(updated);
    setIsInlineEditing(false);
    setSaveNotice(`Updated ${updated.name}'s collector card and synced print sheet.`);
  };

  return (
    <div className="space-y-6">
      {/* Screen-only toolbar */}
      <div className="no-print bg-[#081226]/95 border border-sky-400/30 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white">
            Power Card Print · Front Only · 2.5 × 3.5 in (63.5 × 88.9 mm)
          </h2>
          <p className="text-xs text-sky-200/85 mt-0.5">
            Prints one card per page at exact size. Click the card for a full-screen preview, or edit it here.
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

          {activeCard ? (
            <>
              <button
                type="button"
                onClick={() => handleOpenFullscreen(false)}
                data-testid="open-fullscreen-preview-btn"
                className="inline-flex items-center gap-1.5 rounded-xl border border-sky-400/45 bg-[#040A17] hover:bg-[#0D1E42] text-white text-xs font-semibold px-3.5 py-2 cursor-pointer whitespace-nowrap"
              >
                <Maximize2 className="w-3.5 h-3.5 text-[#00D4FF]" aria-hidden="true" />
                <span>Full-Screen Preview</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSaveNotice(null);
                  setIsInlineEditing((prev) => !prev);
                }}
                aria-expanded={isInlineEditing}
                data-testid="toggle-inline-edit-btn"
                className={`inline-flex items-center gap-1.5 rounded-xl border text-xs font-semibold px-3.5 py-2 cursor-pointer whitespace-nowrap ${
                  isInlineEditing
                    ? 'bg-sky-400/20 border-[#00D4FF] text-white'
                    : 'border-sky-400/45 bg-[#040A17] hover:bg-[#0D1E42] text-white'
                }`}
              >
                <Pencil className="w-3.5 h-3.5 text-[#00D4FF]" aria-hidden="true" />
                <span>{isInlineEditing ? 'Hide Editor' : 'Edit Card'}</span>
              </button>
            </>
          ) : (
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

      {saveNotice && (
        <div
          role="status"
          className="no-print rounded-xl border border-emerald-400/40 bg-emerald-500/15 px-4 py-2.5 text-xs font-medium text-emerald-100 flex items-center justify-between gap-2"
        >
          <span>{saveNotice}</span>
          <button
            type="button"
            onClick={() => setSaveNotice(null)}
            className="text-emerald-200/80 hover:text-white text-[11px] font-semibold cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

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
                onClick={() => {
                  onSelectCard(item);
                  setSaveNotice(null);
                }}
                className={`px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer whitespace-nowrap ${
                  selected
                    ? 'bg-[#00D4FF] text-[#030712] border-[#00D4FF]'
                    : 'bg-[#081226] border-sky-400/30 text-white hover:border-sky-300'
                }`}
              >
                #{memberNo(item)} · {item.name} ({item.specialisation})
              </button>
            );
          })}
        </div>
      )}

      {/* Screen Preview + Optional Inline Edit Panel Side-by-Side / Stacked */}
      <div className={`no-print pb-6 ${isInlineEditing && activeCard ? 'grid grid-cols-1 lg:grid-cols-12 gap-6 items-start' : 'flex justify-center'}`}>
        {activeCard ? (
          <div
            data-testid="print-sheet-preview"
            className={`${isInlineEditing ? 'lg:col-span-6' : ''} p-5 sm:p-6 bg-[#081226]/95 rounded-2xl border border-sky-400/30 shadow-[0_18px_48px_rgba(0,0,0,0.65)]`}
          >
            <div className="flex flex-wrap items-center justify-center gap-6">
              <div className="space-y-2 text-center">
                <p className="text-[11px] font-mono-nums text-sky-300 uppercase tracking-wider">
                  Power Card (63.5 × 88.9 mm)
                </p>
                <button
                  type="button"
                  onClick={() => handleOpenFullscreen(false)}
                  data-testid="print-card-front-trigger"
                  aria-label={`Open full-screen preview for ${activeCard.name} front card`}
                  className="group relative block p-1.5 border border-dashed border-sky-400/50 hover:border-[#00D4FF] rounded-xl bg-white/5 transition-all hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-[#00D4FF] cursor-pointer text-left"
                >
                  <TcgPitchCard card={shownCard ?? activeCard} mode="print" />
                  <span className="mt-1.5 inline-flex items-center justify-center gap-1 w-full text-[10px] font-semibold text-sky-300 group-hover:text-[#00D4FF]">
                    <Maximize2 className="w-3 h-3" aria-hidden="true" />
                    <span>Click card for full-screen preview</span>
                  </span>
                </button>
                <CardShareActions card={activeCard} className="pt-3" />
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
              Create a card or load the 4 themed samples above to preview, edit, and print an exact
              2.5 × 3.5 in (63.5 × 88.9 mm) power card.
            </p>
          </div>
        )}

        {isInlineEditing && activeCard && (
          <div className="lg:col-span-6">
            <CardEditPanel
              card={activeCard}
              onSave={handleSaveCard}
              onCancel={() => setIsInlineEditing(false)}
              onPreview={setDraftCard}
            />
          </div>
        )}
      </div>

      {/* Full-Screen Visitor Preview & Optional Split Edit Modal */}
      {isFullscreenOpen && activeCard && (
        <CardFullscreenModal
          card={activeCard}
          initialEditMode={modalInitialEdit}
          onClose={() => setIsFullscreenOpen(false)}
          onSaveCard={handleSaveCard}
          onPrint={handlePrint}
        />
      )}
    </div>
  );
}
