import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { playCharge } from '../utils/sfx';
import type { Specialisation } from '../types/pitch';
import { ConjuringLoader } from './ConjuringLoader';

const MESSAGES = [
  'Locking biometric signature…',
  'Scanning your aura…',
  'Calibrating holo-emitters…',
  'Cartoonifying your face…',
  'Consulting the roast committee…',
  'Rolling the dice for POWER…',
  'Polishing the holographic foil…',
  'Teaching your strengths to behave…',
  'Almost legendary…',
];

interface SummoningOverlayProps {
  photoUrl?: string;
  /** Stream cards: show the themed conjuring loader instead of the generic one. */
  stream?: Specialisation;
}

/** Full-screen "summoning" loader shown while Gemini works. */
export function SummoningOverlay({ photoUrl, stream }: SummoningOverlayProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    playCharge();
    const timer = window.setInterval(() => setIndex((i) => (i + 1) % MESSAGES.length), 1700);
    return () => window.clearInterval(timer);
  }, []);

  if (stream && photoUrl) {
    return createPortal(
      <motion.div
        className="no-print fixed inset-0 z-[110] flex flex-col items-center justify-center overflow-hidden bg-[#020612]/96"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, transition: { duration: 0.35 } }}
      >
        <div aria-hidden="true" className="booth-aura absolute inset-0" />
        <p className="relative mb-8 font-mono-nums text-xs uppercase tracking-[0.4em] text-[#00D4FF]">Forging your power card</p>
        <div className="relative">
          <ConjuringLoader photo={photoUrl} stream={stream} size="full" />
        </div>
      </motion.div>,
      document.body
    );
  }

  return createPortal(
    <motion.div
      role="status"
      aria-live="polite"
      aria-label="Generating your power card"
      className="no-print fixed inset-0 z-[110] flex flex-col items-center justify-center overflow-hidden bg-[#020612]/95"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.35 } }}
    >
      {/* Pulsing aura */}
      <motion.div
        aria-hidden="true"
        className="absolute h-[70vmin] w-[70vmin] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(0,212,255,0.35), rgba(37,99,235,0.12) 45%, transparent 70%)' }}
        animate={{ scale: [0.85, 1.15, 0.85], opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Orbiting sparks */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          aria-hidden="true"
          className="absolute h-[46vmin] w-[46vmin]"
          style={{ rotate: i * 120 }}
          animate={{ rotate: [i * 120, i * 120 + 360] }}
          transition={{ duration: 5 + i, repeat: Infinity, ease: 'linear' }}
        >
          <span className="absolute left-1/2 top-0 h-3 w-3 -translate-x-1/2 rounded-full bg-[#00D4FF] shadow-[0_0_18px_6px_rgba(0,212,255,0.8)]" />
        </motion.div>
      ))}

      {/* Card silhouette with scan line */}
      <motion.div
        className="relative h-[46vmin] max-h-[360px] w-[32.9vmin] max-w-[257px] overflow-hidden rounded-2xl border-2 border-[#00D4FF]/70 bg-[#061430] shadow-[0_0_60px_rgba(0,212,255,0.45)]"
        animate={{ y: [0, -12, 0], rotateZ: [-1.5, 1.5, -1.5] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
      >
        {photoUrl && <img src={photoUrl} alt="" className="h-[62%] w-full object-cover opacity-70 grayscale" />}
        <div className="absolute inset-x-3 bottom-3 space-y-2">
          {[78, 100, 62].map((w, i) => (
            <motion.div
              key={w}
              className="h-3 rounded bg-sky-300/30"
              style={{ width: `${w}%` }}
              animate={{ opacity: [0.25, 0.8, 0.25] }}
              transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.25 }}
            />
          ))}
        </div>
        <motion.div
          aria-hidden="true"
          className="absolute inset-x-0 h-16 bg-gradient-to-b from-transparent via-[#00D4FF]/55 to-transparent"
          animate={{ top: ['-20%', '105%'] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent"
          animate={{ x: ['-120%', '120%'] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.div>

      <div className="relative mt-10 h-8 text-center">
        <AnimatePresence mode="wait">
          <motion.p
            key={index}
            className="font-display text-xl font-extrabold tracking-tight text-white sm:text-2xl"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            transition={{ duration: 0.35 }}
          >
            {MESSAGES[index]}
          </motion.p>
        </AnimatePresence>
      </div>

      <div className="relative mt-4 h-1.5 w-64 overflow-hidden rounded-full bg-sky-400/20">
        <motion.div
          className="absolute inset-y-0 w-1/3 rounded-full bg-gradient-to-r from-transparent via-[#00D4FF] to-transparent"
          animate={{ x: ['-100%', '300%'] }}
          transition={{ duration: 1.3, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>
    </motion.div>,
    document.body
  );
}
