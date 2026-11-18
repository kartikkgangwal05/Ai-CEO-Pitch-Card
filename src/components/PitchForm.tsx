import type { FormEvent } from 'react';
import { Loader2, RotateCcw, Sparkles, Timer } from 'lucide-react';
import type {
  CartoonStyleId,
  PitchInput,
  Specialisation,
  StickerFontId,
  Tone,
  VisitorType,
} from '../types/pitch';
import {
  SPECIALISATIONS,
  STICKER_FONT_OPTIONS,
  TONES,
  VISITOR_TYPES,
} from '../utils/pitch';
import { CameraCharacterCapture } from './CameraCharacterCapture';

interface PitchFormProps {
  input: PitchInput;
  errors: Partial<Record<keyof PitchInput, string>>;
  isGenerating: boolean;
  isGeneratingCharacter: boolean;
  characterError: string | null;
  elapsedSeconds: number;
  onChange: <K extends keyof PitchInput>(field: K, value: PitchInput[K]) => void;
  onPhotoCapturedAndCartoonify: (dataUrl: string) => void;
  onGenerateAiCharacter: (isEdit?: boolean) => void;
  onClearCharacterMedia: () => void;
  onSubmit: (e: FormEvent) => void;
  onFillSample: () => void;
  onUseTemplate: () => void;
  onReset: () => void;
}

export function PitchForm({
  input,
  errors,
  isGenerating,
  isGeneratingCharacter,
  characterError,
  elapsedSeconds,
  onChange,
  onPhotoCapturedAndCartoonify,
  onGenerateAiCharacter,
  onClearCharacterMedia,
  onSubmit,
  onFillSample,
  onUseTemplate,
  onReset,
}: PitchFormProps) {
  const overBudget = elapsedSeconds > 90;
  const isVip = input.visitorType !== 'PGDM Student';

  return (
    <section
      aria-labelledby="visitor-intake-heading"
      className="bg-[#081226]/95 backdrop-blur-sm border border-sky-400/30 rounded-2xl shadow-[0_14px_40px_rgba(0,140,255,0.12)] overflow-hidden"
    >
      <div className="bg-[#050C1B] px-6 py-4 border-b border-sky-400/25 flex items-center justify-between gap-4">
        <div>
          <h2 id="visitor-intake-heading" className="text-base font-semibold text-white tracking-tight">
            Power Card Builder
          </h2>
          <p className="text-xs text-sky-200/80 mt-0.5">
            Funny title, two-line intro and one-word stats, written by AI
          </p>
        </div>

        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono-nums whitespace-nowrap shrink-0 border ${
            overBudget
              ? 'bg-sky-400/20 border-sky-300 text-white'
              : 'bg-sky-500/10 border-sky-400/30 text-sky-100'
          }`}
          title="Elapsed session time toward 90-second booth target"
        >
          <Timer className="w-3.5 h-3.5 text-sky-400" aria-hidden="true" />
          <span>{String(elapsedSeconds).padStart(2, '0')}s / 90s</span>
        </div>
      </div>

      <form onSubmit={onSubmit} noValidate className="p-5 sm:p-6 space-y-4">
        {/* Visitor Profile Role Switcher (Student vs Owner / Founder vs Director / CXO) */}
        <div>
          <span className="block text-xs font-semibold text-white mb-1.5">Visitor Profile</span>
          <div className="grid grid-cols-3 gap-1 bg-[#040916] border border-sky-400/25 rounded-xl p-1">
            {VISITOR_TYPES.map((vType) => {
              const active = input.visitorType === vType;
              const shortLabel =
                vType === 'Company Owner / Founder' ? 'Owner / Founder' : vType;
              return (
                <button
                  key={vType}
                  type="button"
                  onClick={() => onChange('visitorType', vType as VisitorType)}
                  aria-pressed={active}
                  aria-label={vType}
                  className={`px-2 py-2 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                    active
                      ? 'bg-[#00D4FF] text-[#030712] shadow-sm'
                      : 'text-sky-100/80 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {shortLabel}
                </button>
              );
            })}
          </div>
        </div>

        {/* Name + Optional Current Position / Role */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label htmlFor="visitor-name" className="block text-xs font-semibold text-white mb-1.5">
              Full Name
            </label>
            <input
              id="visitor-name"
              name="name"
              type="text"
              value={input.name}
              onChange={(e) => onChange('name', e.target.value)}
              placeholder={isVip ? 'e.g., Vikramaditya Rao' : 'e.g., Aarav Kulkarni'}
              autoComplete="name"
              className={`w-full rounded-xl border px-3.5 py-2.5 text-sm text-white placeholder:text-slate-400 bg-[#040A17] focus:outline-none focus:ring-2 focus:ring-sky-400/50 focus:border-sky-400 transition-colors ${
                errors.name ? 'border-rose-500' : 'border-sky-400/30'
              }`}
            />
            {errors.name && (
              <p className="mt-1 text-xs text-rose-400" role="alert">
                {errors.name}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="visitor-current-pos" className="block text-xs font-semibold text-white mb-1.5">
              Fun facts <span className="text-sky-300/75 font-normal">(optional, makes the jokes land)</span>
            </label>
            <input
              id="visitor-current-pos"
              name="currentPosition"
              type="text"
              value={input.currentPosition}
              onChange={(e) => onChange('currentPosition', e.target.value)}
              placeholder="e.g., 5 chais a day, debugs at 2am"
              className="w-full rounded-xl border border-sky-400/30 bg-[#040A17] px-3.5 py-2.5 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400/50 focus:border-sky-400 transition-colors"
            />
          </div>
        </div>

        {/* Card theme */}
        <div>
          <label htmlFor="visitor-specialisation" className="block text-xs font-semibold text-white mb-1.5">
            Card theme
          </label>
          <select
            id="visitor-specialisation"
            name="specialisation"
            value={input.specialisation}
            onChange={(e) => onChange('specialisation', e.target.value as Specialisation)}
            className="w-full rounded-xl border border-sky-400/30 bg-[#040A17] px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-400/50 focus:border-sky-400 transition-colors"
          >
            {SPECIALISATIONS.map((spec) => (
              <option key={spec} value={spec}>
                {spec}
              </option>
            ))}
          </select>
        </div>

        {/* Camera -> Cartoon Character Studio */}
        <CameraCharacterCapture
          capturedPhotoUrl={input.capturedPhotoUrl}
          aiCharacterUrl={input.aiCharacterUrl}
          characterPrompt={input.characterPrompt}
          cartoonStyle={input.cartoonStyle}
          personaId={input.personaId}
          specialisation={input.specialisation}
          isGeneratingCharacter={isGeneratingCharacter}
          characterError={characterError}
          onPhotoCaptured={onPhotoCapturedAndCartoonify}
          onCartoonStyleChange={(style: CartoonStyleId) => onChange('cartoonStyle', style)}
          onPersonaChange={(persona) => onChange('personaId', persona)}
          onPromptChange={(prompt) => onChange('characterPrompt', prompt)}
          onGenerateAiCharacter={onGenerateAiCharacter}
          onClearMedia={onClearCharacterMedia}
        />

        {/* Card Back Name Sticker Font Selector */}
        <div>
          <span className="block text-xs font-semibold text-white mb-1.5">
            Back Sticker Name Font
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            {STICKER_FONT_OPTIONS.map((fontOpt) => {
              const active = input.stickerFont === fontOpt.id;
              return (
                <button
                  key={fontOpt.id}
                  type="button"
                  onClick={() => onChange('stickerFont', fontOpt.id as StickerFontId)}
                  aria-pressed={active}
                  className={`px-2 py-1.5 rounded-xl border text-center transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#00D4FF] text-[#030712] border-[#00D4FF]'
                      : 'bg-[#040A17] text-white border-sky-400/25 hover:border-sky-300'
                  }`}
                >
                  <span className={`block text-xs leading-tight ${fontOpt.className}`}>
                    Aa
                  </span>
                  <span className="block text-[10px] font-semibold mt-0.5 whitespace-nowrap">
                    {fontOpt.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* One-word stats (all optional: AI invents funny ones when blank) */}
        <div>
          <span className="block text-xs font-semibold text-white mb-1.5">
            Three words <span className="text-sky-300/75 font-normal">(one word each, leave blank and AI picks funny ones)</span>
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {(
              [
                { field: 'strength1', label: 'Strength', placeholder: 'e.g., Hustle' },
                { field: 'weakness', label: 'Weakness', placeholder: 'e.g., Snacks' },
                { field: 'hobby', label: 'Hobby', placeholder: 'e.g., Karaoke' },
              ] as const
            ).map(({ field, label, placeholder }) => (
              <div key={field}>
                <label htmlFor={`visitor-${field}`} className="block text-[11px] font-medium text-sky-200 mb-1">
                  {label}
                </label>
                <input
                  id={`visitor-${field}`}
                  name={field}
                  type="text"
                  maxLength={14}
                  value={input[field]}
                  onChange={(e) => onChange(field, e.target.value.replace(/\s+/g, ''))}
                  placeholder={placeholder}
                  className="w-full rounded-xl border border-sky-400/30 bg-[#040A17] px-3.5 py-2.5 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400/50 focus:border-sky-400 transition-colors"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="pt-2 space-y-3">
          <button
            type="submit"
            disabled={isGenerating}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#00D4FF] hover:bg-sky-300 disabled:opacity-60 text-[#030712] font-bold text-sm px-5 py-3 shadow-[0_0_24px_rgba(0,212,255,0.35)] transition-colors cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                <span>Summoning power card...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" aria-hidden="true" />
                <span>Make my power card</span>
              </>
            )}
          </button>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
            <button
              type="button"
              onClick={onFillSample}
              className="text-sky-200 hover:text-white underline underline-offset-4 cursor-pointer whitespace-nowrap"
            >
              Fill sample visitor
            </button>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onUseTemplate}
                className="text-sky-200 hover:text-white underline underline-offset-4 cursor-pointer whitespace-nowrap"
                title="Generate instantly using built-in smart phrasing & collector card template"
              >
                Use instant template
              </button>
              <button
                type="button"
                onClick={onReset}
                className="inline-flex items-center gap-1 text-slate-300 hover:text-white cursor-pointer whitespace-nowrap"
              >
                <RotateCcw className="w-3 h-3" aria-hidden="true" />
                <span>Clear</span>
              </button>
            </div>
          </div>
        </div>
      </form>
    </section>
  );
}
