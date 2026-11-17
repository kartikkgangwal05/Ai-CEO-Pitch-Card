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
            Collector Card Builder
          </h2>
          <p className="text-xs text-sky-200/80 mt-0.5">
            AI rephrases raw strengths & weakness in background
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
              Current Position / Role <span className="text-sky-300/75 font-normal">(optional)</span>
            </label>
            <input
              id="visitor-current-pos"
              name="currentPosition"
              type="text"
              value={input.currentPosition}
              onChange={(e) => onChange('currentPosition', e.target.value)}
              placeholder={isVip ? 'e.g., Founder & MD, Pune' : 'e.g., PGDM Scholar'}
              className="w-full rounded-xl border border-sky-400/30 bg-[#040A17] px-3.5 py-2.5 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400/50 focus:border-sky-400 transition-colors"
            />
          </div>
        </div>

        {/* Domain / Specialisation + Target Role / Strategic Focus */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label htmlFor="visitor-specialisation" className="block text-xs font-semibold text-white mb-1.5">
              {isVip ? 'Domain / Focus' : 'Specialisation'}
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

          <div>
            <label htmlFor="visitor-dream-role" className="block text-xs font-semibold text-white mb-1.5">
              {isVip ? (
                <>
                  Strategic Vision / Focus <span className="text-sky-300/75 font-normal">(optional)</span>
                </>
              ) : (
                'Dream Role'
              )}
            </label>
            <input
              id="visitor-dream-role"
              name="dreamRole"
              type="text"
              value={input.dreamRole}
              onChange={(e) => onChange('dreamRole', e.target.value)}
              placeholder={isVip ? 'e.g., AI Industry Partnerships' : 'e.g., Product Analyst'}
              className={`w-full rounded-xl border px-3.5 py-2.5 text-sm text-white placeholder:text-slate-400 bg-[#040A17] focus:outline-none focus:ring-2 focus:ring-sky-400/50 focus:border-sky-400 transition-colors ${
                errors.dreamRole ? 'border-rose-500' : 'border-sky-400/30'
              }`}
            />
            {errors.dreamRole && (
              <p className="mt-1 text-xs text-rose-400" role="alert">
                {errors.dreamRole}
              </p>
            )}
          </div>
        </div>

        {/* Camera -> Cartoon Character Studio */}
        <CameraCharacterCapture
          capturedPhotoUrl={input.capturedPhotoUrl}
          aiCharacterUrl={input.aiCharacterUrl}
          characterPrompt={input.characterPrompt}
          cartoonStyle={input.cartoonStyle}
          specialisation={input.specialisation}
          isGeneratingCharacter={isGeneratingCharacter}
          characterError={characterError}
          onPhotoCaptured={onPhotoCapturedAndCartoonify}
          onCartoonStyleChange={(style: CartoonStyleId) => onChange('cartoonStyle', style)}
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

        {/* Strength 1 & Strength 2 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label htmlFor="visitor-strength-1" className="block text-xs font-semibold text-white mb-1.5">
              Strength 1 <span className="text-sky-300/75 font-normal">(AI refines)</span>
            </label>
            <input
              id="visitor-strength-1"
              name="strength1"
              type="text"
              value={input.strength1}
              onChange={(e) => onChange('strength1', e.target.value)}
              placeholder="e.g., good at excel & BI charts"
              className={`w-full rounded-xl border px-3.5 py-2.5 text-sm text-white placeholder:text-slate-400 bg-[#040A17] focus:outline-none focus:ring-2 focus:ring-sky-400/50 focus:border-sky-400 transition-colors ${
                errors.strength1 ? 'border-rose-500' : 'border-sky-400/30'
              }`}
            />
            {errors.strength1 && (
              <p className="mt-1 text-xs text-rose-400" role="alert">
                {errors.strength1}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="visitor-strength-2" className="block text-xs font-semibold text-white mb-1.5">
              Strength 2 <span className="text-sky-300/75 font-normal">(optional — shown if filled)</span>
            </label>
            <input
              id="visitor-strength-2"
              name="strength2"
              type="text"
              value={input.strength2}
              onChange={(e) => onChange('strength2', e.target.value)}
              placeholder="Leave blank if 1 strength only"
              className="w-full rounded-xl border border-sky-400/30 bg-[#040A17] px-3.5 py-2.5 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400/50 focus:border-sky-400 transition-colors"
            />
          </div>
        </div>

        {/* Weakness + Pitch Tone */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label htmlFor="visitor-weakness" className="block text-xs font-semibold text-white mb-1.5">
              Weakness <span className="text-sky-300/75 font-normal">(AI reframes cleanly)</span>
            </label>
            <input
              id="visitor-weakness"
              name="weakness"
              type="text"
              value={input.weakness}
              onChange={(e) => onChange('weakness', e.target.value)}
              placeholder="e.g., stage fear or overthinking"
              className={`w-full rounded-xl border px-3.5 py-2.5 text-sm text-white placeholder:text-slate-400 bg-[#040A17] focus:outline-none focus:ring-2 focus:ring-sky-400/50 focus:border-sky-400 transition-colors ${
                errors.weakness ? 'border-rose-500' : 'border-sky-400/30'
              }`}
            />
            {errors.weakness && (
              <p className="mt-1 text-xs text-rose-400" role="alert">
                {errors.weakness}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="visitor-tone" className="block text-xs font-semibold text-white mb-1.5">
              Pitch Tone
            </label>
            <select
              id="visitor-tone"
              name="tone"
              value={input.tone}
              onChange={(e) => onChange('tone', e.target.value as Tone)}
              className="w-full rounded-xl border border-sky-400/30 bg-[#040A17] px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-400/50 focus:border-sky-400 transition-colors"
            >
              {TONES.map((tone) => (
                <option key={tone} value={tone}>
                  {tone}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tagline + Motivational Line */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label htmlFor="visitor-tagline" className="block text-xs font-semibold text-white mb-1.5">
              1 Tagline <span className="text-sky-300/75 font-normal">(optional)</span>
            </label>
            <input
              id="visitor-tagline"
              name="tagline"
              type="text"
              value={input.tagline}
              onChange={(e) => onChange('tagline', e.target.value)}
              placeholder="Auto-crafted if left blank"
              className="w-full rounded-xl border border-sky-400/30 bg-[#040A17] px-3.5 py-2.5 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400/50 focus:border-sky-400 transition-colors"
            />
          </div>

          <div>
            <label htmlFor="visitor-motivation" className="block text-xs font-semibold text-white mb-1.5">
              Motivational Line <span className="text-sky-300/75 font-normal">(optional)</span>
            </label>
            <input
              id="visitor-motivation"
              name="motivationalLine"
              type="text"
              value={input.motivationalLine}
              onChange={(e) => onChange('motivationalLine', e.target.value)}
              placeholder="Unique line added automatically"
              className="w-full rounded-xl border border-sky-400/30 bg-[#040A17] px-3.5 py-2.5 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400/50 focus:border-sky-400 transition-colors"
            />
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
                <span>AI Refining Terms & Minting Card...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" aria-hidden="true" />
                <span>Make my pitch</span>
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
