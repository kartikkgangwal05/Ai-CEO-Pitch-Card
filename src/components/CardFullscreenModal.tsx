import { useEffect, useState } from 'react';
import { memberNo } from '../utils/foundingMember';
import { createPortal } from 'react-dom';
import { Pencil, Printer, X } from 'lucide-react';
import type { VisitorCard } from '../types/pitch';
import { CardEditPanel } from './CardEditPanel';
import { CardShareActions } from './CardShareActions';
import { TcgPitchCard } from './TcgPitchCard';

interface CardFullscreenModalProps {
  card: VisitorCard;
  initialEditMode?: boolean;
  onClose: () => void;
  onSaveCard: (updated: VisitorCard) => void;
  onPrint: () => void;
}

export function CardFullscreenModal({
  card,
  initialEditMode = false,
  onClose,
  onSaveCard,
  onPrint,
}: CardFullscreenModalProps) {
  const [isEditing, setIsEditing] = useState(initialEditMode);

  useEffect(() => {
    setIsEditing(initialEditMode);
  }, [initialEditMode, card.id]);

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [onClose]);

  const handleSave = (updated: VisitorCard) => {
    onSaveCard(updated);
    setIsEditing(false);
  };

  const modalContent = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="fullscreen-card-title"
      data-testid="print-fullscreen-modal"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      className="no-print fixed inset-0 z-[100] bg-[#020612]/95 backdrop-blur-md overflow-y-auto p-4 sm:p-6"
    >
      <div className="max-w-6xl mx-auto space-y-6 pb-10">
        {/* Top Full-Screen Showcase Toolbar */}
        <div className="bg-[#081226]/95 border border-sky-400/35 rounded-2xl px-4 sm:px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-20 shadow-[0_14px_40px_rgba(0,0,0,0.75)]">
          <div>
            <p className="text-[11px] font-mono-nums font-semibold text-[#00D4FF] uppercase tracking-wider">
              Full-Screen Visitor Card Preview · Founding Member #{memberNo(card)} · 2.5 × 3.5 in
            </p>
            <h2 id="fullscreen-card-title" className="text-base sm:text-lg font-bold text-white">
              {card.name} — {card.specialisation}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setIsEditing((prev) => !prev)}
              aria-expanded={isEditing}
              data-testid="modal-edit-card-btn"
              className={`inline-flex items-center gap-1.5 rounded-xl border text-xs font-bold px-3.5 py-2 cursor-pointer whitespace-nowrap ${
                isEditing
                  ? 'bg-sky-400/20 border-[#00D4FF] text-white'
                  : 'bg-[#040A17] hover:bg-[#0D1E42] border-sky-400/45 text-sky-100'
              }`}
            >
              <Pencil className="w-3.5 h-3.5 text-[#00D4FF]" aria-hidden="true" />
              <span>{isEditing ? 'View Full Preview' : 'Edit Card'}</span>
            </button>

            <button
              type="button"
              onClick={onPrint}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#00D4FF] hover:bg-sky-300 text-[#030712] text-xs font-bold px-4 py-2 cursor-pointer whitespace-nowrap"
            >
              <Printer className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Print 2.5 × 3.5&quot;</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              data-testid="modal-close-btn"
              aria-label="Close full-screen card preview"
              className="inline-flex items-center gap-1 rounded-xl border border-sky-400/35 bg-[#040A17] hover:bg-rose-500/20 hover:border-rose-400/50 text-white text-xs font-semibold px-3 py-2 cursor-pointer whitespace-nowrap"
            >
              <X className="w-4 h-4" aria-hidden="true" />
              <span>Close</span>
            </button>
          </div>
        </div>

        {/* Full-Screen Body: Showcase View OR Split Live Edit View */}
        {isEditing ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-5 space-y-4">
              <TcgPitchCard card={card} mode="preview" />
            </div>

            <div className="lg:col-span-7">
              <CardEditPanel
                card={card}
                onSave={handleSave}
                onCancel={() => setIsEditing(false)}
              />
            </div>
          </div>
        ) : (
          <div className="pt-2 pb-10 flex flex-wrap items-start justify-center gap-8">
            <div className="w-full max-w-[360px] space-y-2.5 text-center">
              <p className="text-xs font-mono-nums text-sky-300 uppercase tracking-wider">
                Power Card · 2.5 × 3.5 in
              </p>
              <div className="sm:scale-[1.05] origin-top transition-transform">
                <TcgPitchCard card={card} mode="preview" />
              </div>
              <CardShareActions card={card} className="pt-4" />
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
}
