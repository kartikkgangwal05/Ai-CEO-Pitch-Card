import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { ArrowRight, Printer, Volume2, VolumeX, X } from 'lucide-react';
import type { VisitorCard } from '../types/pitch';
import { TCG_THEMES } from '../utils/pitch';
import { isMuted, playReveal, setMuted } from '../utils/sfx';
import { HoloTilt } from './HoloTilt';
import { CardShareActions } from './CardShareActions';
import { TcgPitchCard } from './TcgPitchCard';

// The on-screen preview card is 356 x 498 px (5:7). We scale it up to fill the projector.
const CARD_W = 356;
const CARD_H = 498;

interface RevealStageProps {
  card: VisitorCard;
  /** Operator-facing note, e.g. the AI portrait fell back to the offline filter. */
  warning?: string | null;
  onClose: () => void;
  onPrint: () => void;
  onNext: () => void;
  /** Label for the Next button (e.g. "Back to cards" when showing an old card). */
  nextLabel?: string;
}

function useFitScale() {
  const compute = () => Math.max(0.8, Math.min((window.innerHeight * 0.78) / CARD_H, (window.innerWidth * 0.88) / CARD_W));
  const [scale, setScale] = useState(compute);
  useEffect(() => {
    const onResize = () => setScale(compute());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return scale;
}

/** Full-screen "wow" reveal: card flies in face-down, flips, flashes and showers confetti. */
export function RevealStage({ card, warning, onClose, onPrint, onNext, nextLabel = 'Next person' }: RevealStageProps) {
  const scale = useFitScale();
  const theme = TCG_THEMES[card.specialisation];
  const [muted, setMutedState] = useState(isMuted);
  const [revealed, setRevealed] = useState(false);
  // Don't start the reveal until the portrait is decoded, so the card never appears half-drawn.
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const src = card.aiCharacterUrl || card.capturedPhotoUrl;
    if (!src) {
      setReady(true);
      return;
    }
    let done = false;
    const finish = () => {
      if (!done) {
        done = true;
        setReady(true);
      }
    };
    const img = new Image();
    img.src = src;
    img.decode().then(finish, finish);
    const t = window.setTimeout(finish, 1500);
    return () => window.clearTimeout(t);
  }, [card.aiCharacterUrl, card.capturedPhotoUrl]);
  // Keep the latest handlers in a ref so the key listener and sound timer are set up only once.
  const handlers = useRef({ onClose, onPrint, onNext });
  handlers.current = { onClose, onPrint, onNext };

  const celebrate = useCallback(() => {
    const colors = [theme.accentHex, '#00D4FF', '#ffffff', '#FFD54A', '#FF4DA6', '#7CFFB2'];
    const base = { colors, zIndex: 200, disableForReducedMotion: true, ticks: 220 };
    confetti({ ...base, particleCount: 120, spread: 90, startVelocity: 55, origin: { x: 0.5, y: 0.55 } });
    window.setTimeout(() => {
      confetti({ ...base, particleCount: 70, angle: 60, spread: 65, startVelocity: 60, origin: { x: 0, y: 0.75 } });
      confetti({ ...base, particleCount: 70, angle: 120, spread: 65, startVelocity: 60, origin: { x: 1, y: 0.75 } });
    }, 250);
    window.setTimeout(() => {
      confetti({ ...base, particleCount: 60, spread: 360, startVelocity: 25, gravity: 0.6, scalar: 1.2, origin: { x: 0.5, y: 0.3 } });
    }, 700);
    setRevealed(true);
  }, [theme.accentHex]);

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (!['escape', 'p', 'enter', 'n'].includes(k)) return;
      // Consume the key so nothing underneath (the booth) reacts to the same press.
      e.preventDefault();
      e.stopImmediatePropagation();
      if (k === 'escape') handlers.current.onClose();
      else if (k === 'p') handlers.current.onPrint();
      else handlers.current.onNext();
    };
    window.addEventListener('keydown', onKey, { capture: true });
    const sound = window.setTimeout(playReveal, 250);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey, { capture: true });
      window.clearTimeout(sound);
    };
  }, []);

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    setMutedState(next);
  };

  return createPortal(
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={`${card.title}, power card for ${card.name}`}
      data-testid="reveal-stage"
      className="no-print fixed inset-0 z-[120] overflow-hidden bg-[#010409]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.3 } }}
    >
      {/* Spotlight + rotating light rays */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{ background: `radial-gradient(circle at 50% 46%, ${theme.accentHex}33 0%, #06132e 38%, #010409 75%)` }}
      />
      <motion.div
        aria-hidden="true"
        className="absolute left-1/2 top-[46%] h-[220vmax] w-[220vmax] -translate-x-1/2 -translate-y-1/2 opacity-[0.22]"
        style={{
          backgroundImage:
            'repeating-conic-gradient(from 0deg, rgba(255,255,255,0.0) 0deg 9deg, rgba(0,212,255,0.55) 9deg 11deg, rgba(255,255,255,0.0) 11deg 20deg)',
          maskImage: 'radial-gradient(circle, black 0%, transparent 38%)',
          WebkitMaskImage: 'radial-gradient(circle, black 0%, transparent 38%)',
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 80, repeat: Infinity, ease: 'linear' }}
      />

      {/* Floating dust */}
      {Array.from({ length: 22 }).map((_, i) => (
        <motion.span
          key={i}
          aria-hidden="true"
          className="absolute rounded-full bg-sky-200"
          style={{ left: `${(i * 37) % 100}%`, top: `${(i * 53) % 100}%`, width: 2 + (i % 3), height: 2 + (i % 3), opacity: 0.5 }}
          animate={{ y: [0, -40 - (i % 5) * 12, 0], opacity: [0.15, 0.7, 0.15] }}
          transition={{ duration: 4 + (i % 5), repeat: Infinity, delay: (i % 7) * 0.4, ease: 'easeInOut' }}
        />
      ))}

      {ready && (
        <>
          {/* Power-up shock rings as the card locks in */}
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              aria-hidden="true"
              className="absolute left-1/2 top-[46%] h-[40vmin] w-[40vmin] -translate-x-1/2 -translate-y-1/2 rounded-full border-2"
              style={{ borderColor: theme.accentHex }}
              initial={{ scale: 0.3, opacity: 0 }}
              animate={{ scale: [0.3, 2.6], opacity: [0.9, 0] }}
              transition={{ duration: 1.2, delay: 0.75 + i * 0.2, ease: 'easeOut' }}
            />
          ))}

          {/* The card: materialises FRONT-FIRST with a holographic scan wipe, then settles */}
          <div className="absolute left-1/2 top-[46%]" style={{ marginLeft: -CARD_W / 2, marginTop: -CARD_H / 2 }}>
            <div
              style={{ width: CARD_W, height: CARD_H, transform: `scale(${scale})`, transformOrigin: 'center', '--stat-base': '0.95s' } as React.CSSProperties}
            >
              <HoloTilt radius={13} intensity={13} idle>
                <motion.div
                  className="relative"
                  style={{ width: CARD_W, height: CARD_H }}
                  initial={{ opacity: 0, scale: 0.82, y: 40, rotateX: 18, clipPath: 'inset(100% 0% 0% 0% round 13px)' }}
                  animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0, clipPath: 'inset(0% 0% 0% 0% round 13px)' }}
                  transition={{
                    clipPath: { duration: 0.85, ease: [0.65, 0, 0.35, 1] },
                    opacity: { duration: 0.25 },
                    default: { type: 'spring', stiffness: 90, damping: 14 },
                  }}
                  onAnimationComplete={() => {
                    if (!revealed) celebrate();
                  }}
                >
                  <TcgPitchCard key={`front-${card.id}`} card={card} mode="preview" />
                  {/* Scan beam riding the wipe edge */}
                  <motion.div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-[-6%] h-10 bg-gradient-to-b from-transparent via-[#00D4FF] to-transparent opacity-90 blur-[2px]"
                    initial={{ top: '100%', opacity: 1 }}
                    animate={{ top: '-8%', opacity: [1, 1, 0] }}
                    transition={{ duration: 0.85, ease: [0.65, 0, 0.35, 1] }}
                  />
                </motion.div>
              </HoloTilt>
            </div>
          </div>

          {/* Soft flash as it locks in */}
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-white"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.55, 0] }}
            transition={{ duration: 0.7, times: [0, 0.3, 1], delay: 0.75 }}
          />
        </>
      )}

      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            className="h-24 w-24 rounded-full border-2 border-[#00D4FF]/30 border-t-[#00D4FF]"
            animate={{ rotate: 360 }}
            transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
          />
        </div>
      )}

      {warning && (
        <p className="absolute left-4 top-4 max-w-sm rounded-xl border border-amber-400/40 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-200">
          ⚠ {warning}
        </p>
      )}

      {/* Top controls */}
      <div className="absolute right-4 top-4 flex items-center gap-2">
        <button
          type="button"
          onClick={toggleMute}
          aria-label={muted ? 'Unmute sound effects' : 'Mute sound effects'}
          className="rounded-full border border-sky-400/40 bg-[#081226]/80 p-2.5 text-sky-100 hover:text-white cursor-pointer"
        >
          {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </button>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close showcase (Esc)"
          className="rounded-full border border-sky-400/40 bg-[#081226]/80 p-2.5 text-sky-100 hover:text-white cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Bottom bar */}
      <AnimatePresence>
        {revealed && (
          <motion.div
            className="absolute inset-x-0 bottom-5 flex flex-col items-center gap-3 px-4"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 120, damping: 16 }}
          >
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={onPrint}
                className="inline-flex items-center gap-2 rounded-xl bg-[#00D4FF] px-5 py-3 text-sm font-bold text-[#030712] shadow-[0_0_30px_rgba(0,212,255,0.45)] hover:bg-sky-300 cursor-pointer"
              >
                <Printer className="h-4 w-4" aria-hidden="true" />
                Print card <kbd className="rounded bg-black/15 px-1.5 text-[10px]">P</kbd>
              </button>
              <button
                type="button"
                onClick={onNext}
                className="inline-flex items-center gap-2 rounded-xl border border-sky-400/50 bg-[#081226]/85 px-5 py-3 text-sm font-bold text-white hover:bg-[#0D1E42] cursor-pointer"
              >
                {nextLabel} <ArrowRight className="h-4 w-4" aria-hidden="true" />
                <kbd className="rounded bg-white/10 px-1.5 text-[10px]">Enter</kbd>
              </button>
            </div>
            <CardShareActions card={card} className="max-w-sm" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>,
    document.body
  );
}
