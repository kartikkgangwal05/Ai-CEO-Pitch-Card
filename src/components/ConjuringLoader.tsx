import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { Specialisation } from '../types/pitch';
import { ICON_PATHS, STREAMS } from '../utils/streams';

interface ConjuringLoaderProps {
  photo: string;
  stream: Specialisation;
  /** When true, the bar fills to 100% and the loader shows "Ready". */
  done?: boolean;
  /** 'card' fits the Powers preview slot; 'full' is the full-screen overlay. */
  size?: 'card' | 'full';
}

/** Expected Cloudflare time; the bar eases towards 95% over this and completes when `done`. */
const EXPECTED_MS = 12000;

/**
 * Themed progress while Cloudflare paints the portrait: the visitor's photo inside rotating gold rune
 * rings with a scanning beam, stage-by-stage status in the stream's colour and an eased progress bar.
 */
export function ConjuringLoader({ photo, stream, done = false, size = 'card' }: ConjuringLoaderProps) {
  const t = STREAMS[stream];
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const start = performance.now();
    const id = window.setInterval(() => setElapsed(performance.now() - start), 120);
    return () => window.clearInterval(id);
  }, []);

  const stages = [
    'Reading your aura…',
    `Weaving your ${t.short.replace(' Stream', '')} robe…`,
    `Summoning ${t.archetype.replace(/^The /, '')} magic…`,
    'Lighting the academy towers…',
    'Polishing the gold…',
    'Final enchantments…',
  ];
  const stage = done ? 'Your portrait is ready' : stages[Math.min(stages.length - 1, Math.floor(elapsed / 2400))];
  const pct = done ? 100 : Math.round(95 * (1 - Math.exp(-elapsed / (EXPECTED_MS / 2.2))));
  const big = size === 'full';
  const ring = big ? 320 : 220;

  return (
    <div className="flex flex-col items-center text-center" role="status" aria-live="polite" aria-label={`${stage} ${pct}%`}>
      <div className="relative" style={{ width: ring, height: ring }}>
        {/* aura */}
        <motion.div
          aria-hidden="true"
          className="absolute inset-[-18%] rounded-full"
          style={{ background: `radial-gradient(circle, ${t.glow}88 0%, ${t.glow}22 45%, transparent 70%)` }}
          animate={{ scale: [0.92, 1.08, 0.92], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* rune rings */}
        {[0, 1].map((i) => (
          <motion.svg
            key={i}
            viewBox="0 0 100 100"
            aria-hidden="true"
            className="absolute inset-0 h-full w-full"
            animate={{ rotate: i ? -360 : 360 }}
            transition={{ duration: i ? 18 : 12, repeat: Infinity, ease: 'linear' }}
          >
            <circle cx="50" cy="50" r={i ? 49 : 46} fill="none" stroke={i ? '#E7B547' : t.light} strokeWidth={i ? 0.6 : 0.9} strokeDasharray={i ? '1 3' : '6 4'} />
            {!i &&
              Array.from({ length: 12 }).map((_, k) => {
                const a = (k / 12) * Math.PI * 2;
                return <circle key={k} cx={50 + Math.cos(a) * 46} cy={50 + Math.sin(a) * 46} r="1.3" fill="#E7B547" />;
              })}
          </motion.svg>
        ))}
        {/* photo */}
        <div className="absolute inset-[9%] overflow-hidden rounded-full border-2" style={{ borderColor: '#E7B547', boxShadow: `0 0 40px ${t.glow}` }}>
          <img src={photo} alt="" className="h-full w-full object-cover" style={{ filter: done ? 'none' : 'saturate(0.6) contrast(1.05)' }} />
          <div className="absolute inset-0 mix-blend-color" style={{ background: done ? 'transparent' : t.glow, opacity: 0.45 }} />
          {!done && (
            <motion.div
              aria-hidden="true"
              className="absolute inset-x-0 h-1/4"
              style={{ background: `linear-gradient(transparent, ${t.light}aa, transparent)` }}
              animate={{ top: ['-25%', '100%'] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: 'linear' }}
            />
          )}
        </div>
        {/* orbiting stream icons */}
        {!done &&
          t.icons.map((icon, i) => (
            <motion.div
              key={icon}
              aria-hidden="true"
              className="absolute inset-0"
              animate={{ rotate: [i * 120, i * 120 + 360] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
            >
              <svg viewBox="0 0 24 24" className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2" style={{ width: big ? 34 : 26, height: big ? 34 : 26, filter: `drop-shadow(0 0 6px ${t.glow})` }}>
                <path d={ICON_PATHS[icon]} fill="none" stroke={t.light} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </motion.div>
          ))}
      </div>

      <div className={`${big ? 'mt-10' : 'mt-6'} h-7`}>
        <AnimatePresence mode="wait">
          <motion.p
            key={stage}
            className={`font-extrabold ${big ? 'text-2xl' : 'text-lg'}`}
            style={{ fontFamily: 'Cinzel, Georgia, serif', color: done ? '#FFF1B8' : t.light }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {stage}
          </motion.p>
        </AnimatePresence>
      </div>
      <div className={`mt-4 h-2 ${big ? 'w-80' : 'w-60'} overflow-hidden rounded-full bg-white/10`}>
        <motion.div
          className="h-full rounded-full"
          style={{ background: `linear-gradient(90deg, ${t.glow}, #E7B547, ${t.light})` }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      </div>
      <p className="mt-2 font-mono-nums text-[11px] uppercase tracking-[0.3em] text-sky-300/70">
        {done ? 'Painted by Cloudflare AI' : `Painting with AI · ${pct}%`}
      </p>
    </div>
  );
}
