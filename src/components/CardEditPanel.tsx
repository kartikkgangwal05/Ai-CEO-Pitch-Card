import { useEffect, useState, type FormEvent } from 'react';
import { selectOnFocus } from '../utils/selectOnFocus';
import { cleanMemberNo, memberNo } from '../utils/foundingMember';
import { Check, Sparkles, X } from 'lucide-react';
import type {
  Specialisation,
  StickerFontId,
  VisitorCard,
  VisitorType,
} from '../types/pitch';
import {
  SPECIALISATIONS,
  STICKER_FONT_OPTIONS,
  VISITOR_TYPES,
  generateUniqueMotivationalLine,
  oneWord,
} from '../utils/pitch';

interface CardEditPanelProps {
  card: VisitorCard;
  onSave: (updated: VisitorCard) => void;
  onCancel: () => void;
}

export function CardEditPanel({ card, onSave, onCancel }: CardEditPanelProps) {
  const [visitorType, setVisitorType] = useState<VisitorType>(card.visitorType);
  const [name, setName] = useState(card.name);
  const [foundingMemberNo, setFoundingMemberNo] = useState(memberNo(card));
  const [currentPosition, setCurrentPosition] = useState(card.currentPosition);
  const [specialisation, setSpecialisation] = useState<Specialisation>(card.specialisation);
  const [dreamRole, setDreamRole] = useState(card.dreamRole);
  const [stickerFont, setStickerFont] = useState<StickerFontId>(card.stickerFont);
  const [tagline, setTagline] = useState(card.tagline);
  const [strength1, setStrength1] = useState(card.strength1);
  const [title, setTitle] = useState(card.title);
  const [intro, setIntro] = useState(card.intro);
  const [hobby, setHobby] = useState(card.hobby);
  const [weakness, setWeakness] = useState(card.weakness);
  const [motivationalLine, setMotivationalLine] = useState(card.motivationalLine);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    setVisitorType(card.visitorType);
    setName(card.name);
    setFoundingMemberNo(memberNo(card));
    setCurrentPosition(card.currentPosition);
    setSpecialisation(card.specialisation);
    setDreamRole(card.dreamRole);
    setStickerFont(card.stickerFont);
    setTagline(card.tagline);
    setStrength1(card.strength1);
    setTitle(card.title);
    setIntro(card.intro);
    setHobby(card.hobby);
    setWeakness(card.weakness);
    setMotivationalLine(card.motivationalLine);
    setErrorMsg(null);
  }, [card]);

  const handleRefreshMotivational = () => {
    const line = generateUniqueMotivationalLine(
      {
        name: name.trim() || card.name,
        specialisation,
        dreamRole: dreamRole.trim() || specialisation,
        strength1: strength1.trim() || card.strength1,
      },
      Date.now() % 97
    );
    setMotivationalLine(line);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) {
      setErrorMsg('Visitor name must be at least 2 characters.');
      return;
    }
    if (title.trim().length < 2 || intro.trim().length < 5) {
      setErrorMsg('Title and intro cannot be empty.');
      return;
    }

    onSave({
      ...card,
      visitorType,
      name: name.trim(),
      foundingMemberNo: cleanMemberNo(foundingMemberNo).trim() || memberNo(card),
      currentPosition: currentPosition.trim(),
      specialisation,
      dreamRole: dreamRole.trim(),
      stickerFont,
      tagline: tagline.trim() || card.tagline,
      title: title.trim(),
      intro: intro.trim(),
      strength1: oneWord(strength1, card.strength1),
      strength2: '',
      weakness: oneWord(weakness, card.weakness),
      hobby: oneWord(hobby, card.hobby),
      motivationalLine: motivationalLine.trim() || card.motivationalLine,
      linkedin_headline: title.trim(),
      pitch: intro.trim(),
    });
  };

  const inputClass =
    'w-full rounded-lg border border-sky-400/35 bg-[#040A17] px-3 py-2 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00D4FF]/50 focus:border-[#00D4FF]';

  return (
    <form
      onSubmit={handleSubmit}
      data-testid="print-edit-panel"
      className="no-print bg-[#081226]/95 border border-[#00D4FF]/40 rounded-2xl p-5 space-y-4 shadow-[0_14px_38px_rgba(0,0,0,0.65)]"
    >
      <div className="flex items-center justify-between gap-3 border-b border-sky-400/20 pb-3">
        <div>
          <h3 className="text-base font-bold text-white">Edit Power Card</h3>
          <p className="text-[11px] text-sky-200/80">
            Updates the card and print sheet immediately.
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          aria-label="Close card editor"
          className="inline-flex items-center gap-1 rounded-lg border border-sky-400/30 bg-[#040A17] hover:bg-[#0D1E42] text-sky-200 text-xs font-semibold px-2.5 py-1.5 cursor-pointer"
        >
          <X className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Close</span>
        </button>
      </div>

      {errorMsg && (
        <div
          role="alert"
          className="rounded-lg border border-rose-400/40 bg-rose-500/15 px-3 py-2 text-xs text-rose-200"
        >
          {errorMsg}
        </div>
      )}

      {/* Visitor Profile */}
      <div>
        <span className="block text-[11px] font-medium text-sky-200 mb-1.5">Visitor Profile</span>
        <div className="grid grid-cols-3 gap-2">
          {VISITOR_TYPES.map((vt) => {
            const active = visitorType === vt;
            return (
              <button
                key={vt}
                type="button"
                onClick={() => setVisitorType(vt)}
                aria-pressed={active}
                className={`px-2 py-1.5 rounded-lg border text-[11px] font-semibold cursor-pointer whitespace-nowrap truncate ${
                  active
                    ? 'bg-[#00D4FF] text-[#030712] border-[#00D4FF]'
                    : 'bg-[#040A17] text-sky-100 border-sky-400/30 hover:border-sky-300'
                }`}
              >
                {vt === 'Company Owner / Founder' ? 'Owner / Founder' : vt}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="edit-card-name" className="block text-[11px] font-medium text-sky-200 mb-1">
            Full Name
          </label>
          <input
            id="edit-card-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="edit-card-member-no" className="block text-[11px] font-medium text-sky-200 mb-1">
            Founding Member No.
          </label>
          <input
            id="edit-card-member-no"
            type="text"
            inputMode="numeric"
            value={foundingMemberNo}
            onChange={(e) => setFoundingMemberNo(cleanMemberNo(e.target.value))}
            {...selectOnFocus}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="edit-card-position" className="block text-[11px] font-medium text-sky-200 mb-1">
            Current Position / Role (optional)
          </label>
          <input
            id="edit-card-position"
            type="text"
            value={currentPosition}
            onChange={(e) => setCurrentPosition(e.target.value)}
            placeholder="Optional"
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="edit-card-spec" className="block text-[11px] font-medium text-sky-200 mb-1">
            Specialisation
          </label>
          <select
            id="edit-card-spec"
            value={specialisation}
            onChange={(e) => setSpecialisation(e.target.value as Specialisation)}
            className={inputClass}
          >
            {SPECIALISATIONS.map((spec) => (
              <option key={spec} value={spec}>
                {spec}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="edit-card-role" className="block text-[11px] font-medium text-sky-200 mb-1">
            Dream Role / Focus
          </label>
          <input
            id="edit-card-role"
            type="text"
            value={dreamRole}
            onChange={(e) => setDreamRole(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      {/* Back Sticker Font Selector */}
      <div>
        <span className="block text-[11px] font-medium text-sky-200 mb-1.5">
          Back Sticker Name Font
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {STICKER_FONT_OPTIONS.map((font) => {
            const active = stickerFont === font.id;
            return (
              <button
                key={font.id}
                type="button"
                onClick={() => setStickerFont(font.id)}
                aria-pressed={active}
                className={`px-2 py-1.5 rounded-lg border text-left cursor-pointer ${
                  active
                    ? 'bg-[#00D4FF] text-[#030712] border-[#00D4FF]'
                    : 'bg-[#040A17] text-white border-sky-400/25 hover:border-sky-300'
                }`}
              >
                <span className={`block text-xs leading-tight ${font.className}`}>Aa</span>
                <span className="block text-[10px] font-semibold mt-0.5 truncate">{font.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label htmlFor="edit-card-title" className="block text-[11px] font-medium text-sky-200 mb-1">
          Funny Title
        </label>
        <input
          id="edit-card-title"
          type="text"
          maxLength={30}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="edit-card-intro" className="block text-[11px] font-medium text-sky-200 mb-1">
          Two-line Intro
        </label>
        <textarea
          id="edit-card-intro"
          rows={3}
          maxLength={170}
          value={intro}
          onChange={(e) => setIntro(e.target.value)}
          className={`${inputClass} resize-y leading-relaxed`}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="edit-card-s1" className="block text-[11px] font-medium text-sky-200 mb-1">
            Strength (one word)
          </label>
          <input
            id="edit-card-s1"
            type="text"
            value={strength1}
            onChange={(e) => setStrength1(e.target.value.replace(/\s+/g, ''))}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="edit-card-hobby" className="block text-[11px] font-medium text-sky-200 mb-1">
            Hobby (one word)
          </label>
          <input
            id="edit-card-hobby"
            type="text"
            maxLength={14}
            value={hobby}
            onChange={(e) => setHobby(e.target.value.replace(/\s+/g, ''))}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="edit-card-weakness" className="block text-[11px] font-medium text-sky-200 mb-1">
            Weakness (one word)
          </label>
          <input
            id="edit-card-weakness"
            type="text"
            value={weakness}
            onChange={(e) => setWeakness(e.target.value.replace(/\s+/g, ''))}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="edit-card-tagline" className="block text-[11px] font-medium text-sky-200 mb-1">
            Card Tagline
          </label>
          <input
            id="edit-card-tagline"
            type="text"
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between gap-2 mb-1">
          <label htmlFor="edit-card-motivation" className="text-[11px] font-medium text-sky-200">
            Motivational Line (Bottom Box)
          </label>
          <button
            type="button"
            onClick={handleRefreshMotivational}
            className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#00D4FF] hover:text-sky-300 cursor-pointer"
          >
            <Sparkles className="w-3 h-3" aria-hidden="true" />
            <span>New quote</span>
          </button>
        </div>
        <input
          id="edit-card-motivation"
          type="text"
          value={motivationalLine}
          onChange={(e) => setMotivationalLine(e.target.value)}
          className={inputClass}
        />
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2 border-t border-sky-400/20">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-sky-400/30 bg-[#040A17] hover:bg-[#0D1E42] text-white text-xs font-semibold px-4 py-2 cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          data-testid="save-card-edits-btn"
          className="inline-flex items-center gap-1.5 rounded-xl bg-[#00D4FF] hover:bg-sky-300 text-[#030712] text-xs font-bold px-4 py-2 cursor-pointer shadow-[0_6px_18px_rgba(0,212,255,0.28)]"
        >
          <Check className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Save Card Changes</span>
        </button>
      </div>
    </form>
  );
}
