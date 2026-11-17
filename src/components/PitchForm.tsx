import type { FormEvent } from 'react';
import { Loader2, RotateCcw, Sparkles, Timer } from 'lucide-react';
import type { PitchInput, Specialisation, Tone } from '../types/pitch';
import { SPECIALISATIONS, SPECIALISATION_THEMES, TONES } from '../utils/pitch';

interface PitchFormProps {
  input: PitchInput;
  errors: Partial<Record<keyof PitchInput, string>>;
  isGenerating: boolean;
  elapsedSeconds: number;
  onChange: <K extends keyof PitchInput>(field: K, value: PitchInput[K]) => void;
  onSubmit: (e: FormEvent) => void;
  onFillSample: () => void;
  onUseTemplate: () => void;
  onReset: () => void;
}

export function PitchForm({
  input,
  errors,
  isGenerating,
  elapsedSeconds,
  onChange,
  onSubmit,
  onFillSample,
  onUseTemplate,
  onReset,
}: PitchFormProps) {
  const overBudget = elapsedSeconds > 90;
  const activeTheme = SPECIALISATION_THEMES[input.specialisation];

  return (
    <section
      aria-labelledby="visitor-intake-heading"
      className="bg-white border border-slate-200/90 rounded-2xl shadow-[0_6px_24px_rgba(15,26,51,0.06)] overflow-hidden"
    >
      <div
        className="px-6 py-4 flex items-center justify-between gap-4 transition-colors"
        style={{
          backgroundColor: activeTheme.headerBg,
          borderBottom: `3px solid ${activeTheme.accent}`,
        }}
      >
        <div>
          <h2 id="visitor-intake-heading" className="text-base font-semibold text-white tracking-tight">
            Visitor Intake
          </h2>
          <p className="text-xs text-slate-300 mt-0.5">
            5 quick inputs · theme: {activeTheme.name}
          </p>
        </div>

        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono-nums whitespace-nowrap shrink-0 ${
            overBudget ? 'bg-amber-500/20 text-amber-200' : 'bg-white/10 text-slate-100'
          }`}
          title="Elapsed session time toward 90-second booth target"
        >
          <Timer className="w-3.5 h-3.5" style={{ color: activeTheme.badgeText }} aria-hidden="true" />
          <span>{String(elapsedSeconds).padStart(2, '0')}s / 90s</span>
        </div>
      </div>

      <form onSubmit={onSubmit} noValidate className="p-6 space-y-4">
        <div>
          <label htmlFor="visitor-name" className="block text-sm font-medium text-slate-800 mb-1.5">
            Your Name
          </label>
          <input
            id="visitor-name"
            name="name"
            type="text"
            value={input.name}
            onChange={(e) => onChange('name', e.target.value)}
            placeholder="e.g., Aarav Kulkarni"
            autoComplete="name"
            className={`w-full rounded-xl border px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#F06429]/35 focus:border-[#0F1A33] transition-colors ${
              errors.name ? 'border-red-500 bg-red-50/40' : 'border-slate-300 bg-white'
            }`}
          />
          {errors.name && (
            <p className="mt-1 text-xs text-red-600" role="alert">
              {errors.name}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="visitor-specialisation" className="block text-sm font-medium text-slate-800 mb-1.5">
              Specialisation
            </label>
            <select
              id="visitor-specialisation"
              name="specialisation"
              value={input.specialisation}
              onChange={(e) => onChange('specialisation', e.target.value as Specialisation)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#F06429]/35 focus:border-[#0F1A33] transition-colors"
            >
              {SPECIALISATIONS.map((spec) => (
                <option key={spec} value={spec}>
                  {spec}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="visitor-tone" className="block text-sm font-medium text-slate-800 mb-1.5">
              Tone
            </label>
            <select
              id="visitor-tone"
              name="tone"
              value={input.tone}
              onChange={(e) => onChange('tone', e.target.value as Tone)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#F06429]/35 focus:border-[#0F1A33] transition-colors"
            >
              {TONES.map((tone) => (
                <option key={tone} value={tone}>
                  {tone}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="visitor-strength" className="block text-sm font-medium text-slate-800 mb-1.5">
            1 Key Strength
          </label>
          <input
            id="visitor-strength"
            name="strength"
            type="text"
            value={input.strength}
            onChange={(e) => onChange('strength', e.target.value)}
            placeholder="e.g., synthesizing retail telemetry into executive pricing dashboards"
            className={`w-full rounded-xl border px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#F06429]/35 focus:border-[#0F1A33] transition-colors ${
              errors.strength ? 'border-red-500 bg-red-50/40' : 'border-slate-300 bg-white'
            }`}
          />
          {errors.strength && (
            <p className="mt-1 text-xs text-red-600" role="alert">
              {errors.strength}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="visitor-dream-role" className="block text-sm font-medium text-slate-800 mb-1.5">
            Dream Role
          </label>
          <input
            id="visitor-dream-role"
            name="dreamRole"
            type="text"
            value={input.dreamRole}
            onChange={(e) => onChange('dreamRole', e.target.value)}
            placeholder="e.g., Product Analyst"
            className={`w-full rounded-xl border px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#F06429]/35 focus:border-[#0F1A33] transition-colors ${
              errors.dreamRole ? 'border-red-500 bg-red-50/40' : 'border-slate-300 bg-white'
            }`}
          />
          {errors.dreamRole && (
            <p className="mt-1 text-xs text-red-600" role="alert">
              {errors.dreamRole}
            </p>
          )}
        </div>

        <div className="pt-2 space-y-3">
          <button
            type="submit"
            disabled={isGenerating}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl text-white font-semibold text-sm px-5 py-3 transition-opacity hover:opacity-95 disabled:opacity-60 cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F06429]"
            style={{ backgroundColor: activeTheme.headerBg }}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" style={{ color: activeTheme.badgeText }} aria-hidden="true" />
                <span>Crafting Pitch Card...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" style={{ color: activeTheme.badgeText }} aria-hidden="true" />
                <span>Make my pitch</span>
              </>
            )}
          </button>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
            <button
              type="button"
              onClick={onFillSample}
              className="text-slate-600 hover:text-[#0F1A33] underline underline-offset-4 cursor-pointer whitespace-nowrap"
            >
              Fill sample student
            </button>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onUseTemplate}
                className="text-slate-600 hover:text-[#0F1A33] underline underline-offset-4 cursor-pointer whitespace-nowrap"
                title="Generate instantly using the built-in fill-in-the-blanks backup template"
              >
                Use instant template
              </button>
              <button
                type="button"
                onClick={onReset}
                className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-800 cursor-pointer whitespace-nowrap"
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
