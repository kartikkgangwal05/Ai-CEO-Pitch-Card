import { useState, type Dispatch, type ReactNode, type SetStateAction } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { CartoonStyleId, PersonaId, Specialisation, VisitorCard } from '../types/pitch';
import { STREAMS } from '../utils/streams';
import { getPersona } from '../utils/pitch';
import { playTick } from '../utils/sfx';
import { HoloTilt } from './HoloTilt';
import { TcgPitchCard } from './TcgPitchCard';

export interface Powers {
  strength: string;
  weakness: string;
  hobby: string;
}

const ROWS: { key: keyof Powers; label: string; icon: string; options: string[] }[] = [
  {
    key: 'strength',
    label: 'Strength',
    icon: '💪',
    options: ['Leadership', 'Creativity', 'Hustle', 'Humor', 'Charm', 'Coding', 'Strategy', 'Empathy', 'Focus', 'Negotiation'],
  },
  {
    key: 'weakness',
    label: 'Weakness',
    icon: '🫠',
    options: ['Coffee', 'Snacks', 'Mondays', 'Overthinking', 'Deadlines', 'Meetings', 'Memes', 'Sleep', 'Shopping', 'Notifications'],
  },
  {
    key: 'hobby',
    label: 'Hobby',
    icon: '🎯',
    options: ['Cricket', 'Music', 'Gaming', 'Travel', 'Dancing', 'Reading', 'Cooking', 'Gym', 'Movies', 'Photography'],
  },
];

const AI_WORD = '';

interface PowersStepProps {
  name: string;
  styleId: CartoonStyleId;
  personaId: PersonaId;
  powers: Powers;
  onChange: Dispatch<SetStateAction<Powers>>;
  /** Sample art for the chosen look. */
  previewUrl: string;
  /** When set, preview the ornate stream card. */
  stream?: Specialisation;
  /** Replaces the preview card (e.g. the AI conjuring loader while the portrait is painted). */
  previewSlot?: ReactNode;
}

/** Live preview card shown while picking stats: the chosen look's sample art + the chosen words. */
function buildPreviewCard(
  name: string,
  styleId: CartoonStyleId,
  personaId: PersonaId,
  powers: Powers,
  previewUrl: string,
  stream?: Specialisation
): VisitorCard {
  const persona = getPersona(personaId);
  return {
    visitorType: 'PGDM Student',
    name: name || 'Your Name',
    currentPosition: '',
    specialisation: stream ?? 'Business Analytics',
    design: stream ? 'arcane' : 'classic',
    capturedPhotoUrl: '',
    aiCharacterUrl: previewUrl,
    characterPrompt: '',
    cartoonStyle: styleId,
    personaId,
    stickerFont: 'cartoon',
    dreamRole: '',
    tone: 'Confident',
    title: stream ? STREAMS[stream].archetype : personaId !== 'none' ? `The ${persona.label} of ???` : 'Title forging…',
    intro: 'Your two-line legend is written by AI the moment you are scanned. Stand by for greatness.',
    hobby: powers.hobby || '🎲 AI',
    pitch: '',
    linkedin_headline: '',
    keywords: [],
    strength1: powers.strength || '🎲 AI',
    strength2: '',
    weakness: powers.weakness || '🎲 AI',
    tagline: '',
    motivationalLine: '',
    resolvedCharacterId: 'data-wizard',
    source: 'template',
    id: 'booth-preview',
    createdAt: 0,
    cardSerial: 0,
  };
}

/** Booth step: pick (or let AI pick) the one-word Strength / Weakness / Hobby, with a live card preview. */
export function PowersStep({ name, styleId, personaId, powers, onChange, previewUrl, stream, previewSlot }: PowersStepProps) {
  const [customFor, setCustomFor] = useState<keyof Powers | null>(null);
  const [customText, setCustomText] = useState('');

  const set = (key: keyof Powers, value: string) => {
    playTick(false);
    onChange((prev) => ({ ...prev, [key]: value }));
  };

  const commitCustom = () => {
    if (customFor) {
      const word = customText.replace(/[^\p{L}\p{N}]/gu, '').slice(0, 14);
      if (word) set(customFor, word.charAt(0).toUpperCase() + word.slice(1));
    }
    setCustomFor(null);
    setCustomText('');
  };

  const chip = (active: boolean) =>
    `rounded-full border px-3 py-1.5 text-[13px] font-semibold transition-colors duration-150 cursor-pointer ${
      active
        ? 'border-[#00D4FF] bg-[#00D4FF] text-[#02040b] shadow-[0_0_14px_rgba(0,212,255,0.6)]'
        : 'border-sky-800 bg-[#061026]/70 text-sky-100 hover:border-sky-400'
    }`;

  return (
    <div className="flex w-full flex-col items-center gap-8 lg:flex-row lg:items-center lg:justify-center lg:gap-12">
      {/* Live card preview */}
      <motion.div
        className="w-[260px] shrink-0 sm:w-[280px]"
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ type: 'spring', stiffness: 120, damping: 18 }}
      >
        <AnimatePresence mode="wait">
          {previewSlot ? (
            <motion.div key="slot" className="flex min-h-[360px] items-center justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
              {previewSlot}
            </motion.div>
          ) : (
            <motion.div
              key="card"
              initial={{ opacity: 0, scale: 0.85, rotateY: -25 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0 }}
              transition={{ type: 'spring', stiffness: 120, damping: 16 }}
            >
              <HoloTilt intensity={10} idle>
                <TcgPitchCard card={buildPreviewCard(name, styleId, personaId, powers, previewUrl, stream)} mode="preview" />
              </HoloTilt>
              <p className="mt-3 text-center font-mono-nums text-[10px] uppercase tracking-[0.3em] text-sky-400/70">Live preview</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <div className="w-full max-w-2xl space-y-5">
        {ROWS.map((row) => {
          const value = powers[row.key];
          const isCustom = value !== AI_WORD && !row.options.includes(value);
          return (
            <div key={row.key}>
              <p className="mb-2 font-mono-nums text-[11px] uppercase tracking-[0.3em] text-sky-300/80">
                <span aria-hidden="true">{row.icon}</span> {row.label}
                <span className="ml-2 text-white normal-case tracking-normal">{value || 'AI decides'}</span>
              </p>
              <div className="flex flex-wrap gap-2" role="group" aria-label={row.label}>
                <button type="button" data-testid={`power-${row.key}-ai`} onClick={() => set(row.key, AI_WORD)} aria-pressed={value === AI_WORD} className={chip(value === AI_WORD)}>
                  🎲 AI decides
                </button>
                {row.options.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    data-testid={`power-${row.key}-${opt}`}
                    onClick={() => set(row.key, opt)}
                    aria-pressed={value === opt}
                    className={chip(value === opt)}
                  >
                    {opt}
                  </button>
                ))}
                {customFor === row.key ? (
                  <input
                    ref={(el) => el?.focus({ preventScroll: true })}
                    value={customText}
                    onChange={(e) => setCustomText(e.target.value.replace(/\s+/g, '').slice(0, 14))}
                    onBlur={commitCustom}
                    onKeyDown={(e) => {
                      e.stopPropagation();
                      if (e.key === 'Enter') commitCustom();
                      if (e.key === 'Escape') setCustomFor(null);
                    }}
                    placeholder="One word"
                    aria-label={`Custom ${row.label}`}
                    className="w-32 rounded-full border border-[#00D4FF] bg-[#061026] px-3 py-1.5 text-[13px] text-white focus:outline-none"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setCustomFor(row.key);
                      setCustomText(isCustom ? value : '');
                    }}
                    aria-pressed={isCustom}
                    className={chip(isCustom)}
                  >
                    ✏️ {isCustom ? value : 'Custom'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
