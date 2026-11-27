import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import type { Specialisation, VisitorCard } from '../types/pitch';
import { STREAMS } from '../utils/streams';
import { buildFallbackPitch } from '../utils/pitch';
import { ArcaneCard } from './ArcaneCard';

interface AttractHeroProps {
  onStart: () => void;
  sampleArt: (id: Specialisation) => string;
}

const FAN: { stream: Specialisation; name: string }[] = [
  { stream: 'HR', name: 'Ananya' },
  { stream: 'Business Analytics', name: 'Arjun' },
  { stream: 'Finance', name: 'Meera' },
  { stream: 'Marketing', name: 'Kabir' },
];

function sampleCard(stream: Specialisation, name: string, art: string): VisitorCard {
  const t = STREAMS[stream];
  const input = {
    visitorType: 'PGDM Student' as const,
    name,
    currentPosition: '',
    specialisation: stream,
    characterId: 'auto' as const,
    capturedPhotoUrl: '',
    aiCharacterUrl: art,
    characterPrompt: '',
    cartoonStyle: 'bold-toon' as const,
    personaId: 'none' as const,
    design: 'arcane' as const,
    stickerFont: 'cartoon' as const,
    strength1: t.words[0],
    strength2: '',
    weakness: t.words[1],
    hobby: t.words[2],
    dreamRole: '',
    tagline: '',
    motivationalLine: '',
    tone: 'Confident' as const,
  };
  return {
    ...input,
    ...buildFallbackPitch(input, 1),
    title: t.archetype,
    intro: `${name} turns ideas into magic and meetings into momentum.`,
    strength1: t.words[0],
    weakness: t.words[1],
    hobby: t.words[2],
    aiCharacterUrl: art,
    id: `sample-${stream}`,
    createdAt: 0,
    cardSerial: 0,
  };
}

/** Original gothic skyline (procedural spires), drawn as one SVG path. */
function Skyline() {
  const spires = [
    [40, 210], [95, 150], [140, 230], [190, 120], [235, 200], [280, 90], [330, 170], [380, 60], [430, 150],
    [480, 30], [530, 140], [580, 75], [630, 180], [680, 110], [730, 210], [780, 140], [830, 230], [880, 170], [930, 240],
  ];
  let d = 'M0 320 L0 260';
  for (const [x, top] of spires) d += ` L${x - 16} 260 L${x - 16} ${top + 34} L${x} ${top} L${x + 16} ${top + 34} L${x + 16} 260`;
  d += ' L1000 260 L1000 320 Z';
  return (
    <svg viewBox="0 0 1000 320" preserveAspectRatio="xMidYMax slice" className="absolute inset-x-0 bottom-0 h-[55%] w-full" aria-hidden="true">
      <defs>
        <linearGradient id="sky-castle" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1a1630" />
          <stop offset="1" stopColor="#05040a" />
        </linearGradient>
      </defs>
      <path d={d} fill="url(#sky-castle)" />
      {spires.map(([x, top], i) =>
        i % 2 ? (
          <rect key={x} x={x - 3} y={top + 60 + (i % 3) * 18} width="6" height="10" rx="3" fill="#ffcc66" opacity="0.75">
            <animate attributeName="opacity" values="0.75;0.35;0.75" dur={`${3 + (i % 4)}s`} repeatCount="indefinite" />
          </rect>
        ) : null
      )}
    </svg>
  );
}

/** Gold-framed live camera mirror: "This could be you". Falls back to a glowing silhouette. */
function MirrorCard() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [live, setLive] = useState(false);
  useEffect(() => {
    let stream: MediaStream | null = null;
    let cancelled = false;
    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 640 } }, audio: false })
      .then((s) => {
        if (cancelled) return s.getTracks().forEach((t) => t.stop());
        stream = s;
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          void videoRef.current.play().catch(() => {});
        }
        setLive(true);
      })
      .catch(() => setLive(false));
    return () => {
      cancelled = true;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return (
    <div
      className="relative overflow-hidden"
      style={{
        width: 240,
        aspectRatio: '5 / 7',
        padding: 5,
        borderRadius: 14,
        background: 'linear-gradient(145deg, #FFF1B8, #E7B547 25%, #8A5A12 50%, #E7B547 75%, #FFF1B8)',
        boxShadow: '0 0 60px rgba(231,181,71,0.55), 0 0 140px rgba(0,212,255,0.25)',
      }}
    >
      <div className="relative flex h-full flex-col overflow-hidden rounded-[10px] bg-[#0b0820]">
        <p className="pt-2 text-center text-sm font-extrabold tracking-wider" style={{ fontFamily: 'Cinzel, serif', color: '#FFE7A8' }}>
          #DYPBSAICOE
        </p>
        <div className="relative mx-2 mt-1 flex-1 overflow-hidden rounded-md border border-[#E7B547]/60">
          <video
            ref={videoRef}
            playsInline
            muted
            className={`h-full w-full -scale-x-100 object-cover transition-opacity duration-700 ${live ? 'opacity-100' : 'opacity-0'}`}
            style={{ filter: 'sepia(0.35) saturate(1.2) contrast(1.1)' }}
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0b0820] via-transparent to-transparent" />
          {!live && (
            <svg viewBox="0 0 200 240" className="absolute inset-0 h-full w-full" aria-hidden="true">
              <circle cx="100" cy="92" r="40" fill="none" stroke="#FFE7A8" strokeWidth="3" />
              <path d="M30 240 C35 180 65 150 100 150 C135 150 165 180 170 240" fill="none" stroke="#FFE7A8" strokeWidth="3" />
            </svg>
          )}
          <motion.div
            aria-hidden="true"
            className="absolute inset-x-0 h-14 bg-gradient-to-b from-transparent via-[#FFE7A8]/40 to-transparent"
            animate={{ top: ['-20%', '110%'] }}
            transition={{ duration: 2.6, repeat: Infinity, ease: 'linear' }}
          />
          <span className="absolute left-2 top-2 rounded bg-black/60 px-1.5 font-mono-nums text-[9px] uppercase tracking-widest text-[#FFE7A8]">
            {live ? '● Live' : 'Your portrait'}
          </span>
        </div>
        <p className="py-2 text-center text-base font-extrabold uppercase" style={{ fontFamily: 'Cinzel, serif', color: '#FFE7A8' }}>
          This could be you
        </p>
      </div>
    </div>
  );
}

/** Cinematic start screen for the booth. */
export function AttractHero({ onStart, sampleArt }: AttractHeroProps) {
  const fan = FAN.map((f) => sampleCard(f.stream, f.name, sampleArt(f.stream)));
  const angles = [-18, -9, 9, 18];
  const offsets = [-330, -175, 175, 330];

  return (
    <div className="relative flex w-full flex-1 flex-col items-center justify-center py-6">
      {/* scene */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute inset-0" style={{ background: 'radial-gradient(120% 80% at 50% 0%, #2a1f4a 0%, #0b0820 45%, #03030a 100%)' }} />
        <motion.div
          className="absolute -inset-x-1/4 top-0 h-1/2 opacity-40"
          style={{ background: 'radial-gradient(40% 60% at 30% 40%, rgba(140,130,190,0.35), transparent 70%), radial-gradient(35% 50% at 70% 30%, rgba(90,80,140,0.35), transparent 70%)' }}
          animate={{ x: ['-4%', '4%', '-4%'] }}
          transition={{ duration: 30, repeat: Infinity, ease: 'easeInOut' }}
        />
        <Skyline />
        <motion.div
          className="absolute inset-x-0 bottom-0 h-1/3"
          style={{ background: 'linear-gradient(transparent, rgba(160,150,210,0.18) 60%, rgba(10,8,30,0.9))' }}
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        {Array.from({ length: 40 }).map((_, i) => (
          <motion.span
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${(i * 37) % 100}%`,
              top: `${(i * 61) % 100}%`,
              width: 2 + (i % 3),
              height: 2 + (i % 3),
              background: i % 3 ? '#FFE7A8' : '#7DD3FC',
              boxShadow: `0 0 8px ${i % 3 ? '#E7B547' : '#38BDF8'}`,
            }}
            animate={{ y: [0, -60 - (i % 5) * 15, 0], opacity: [0, 0.9, 0] }}
            transition={{ duration: 6 + (i % 6), repeat: Infinity, delay: (i % 9) * 0.6, ease: 'easeInOut' }}
          />
        ))}
      </div>

      {/* branding */}
      <motion.div className="relative z-10 text-center" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
        <p className="font-mono-nums text-[11px] uppercase tracking-[0.45em] text-[#E7B547]/80">DYP B-School · Dr. D. Y. Patil B-School, Pune</p>
        <h1
          className="mt-2 whitespace-nowrap text-[clamp(2rem,10vw,4.5rem)] font-black tracking-wide"
          style={{
            fontFamily: 'Cinzel, Georgia, serif',
            backgroundImage: 'linear-gradient(180deg, #FFF6D2 0%, #F1C766 40%, #9B6A16 55%, #F1C766 70%, #FFF1B8 100%)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
            filter: 'drop-shadow(0 4px 18px rgba(231,181,71,0.45))',
          }}
        >
          #DYPBSAICOE
        </h1>
        <p className="mt-1 text-xl font-bold uppercase tracking-[0.3em] text-white/90" style={{ fontFamily: 'Cinzel, serif' }}>
          AI Power Cards
        </p>
      </motion.div>

      {/* fanned cards around the live mirror */}
      <div className="relative z-10 mt-8 flex h-[350px] w-full items-center justify-center">
        {fan.map((card, i) => (
          <motion.div
            key={card.id}
            className="absolute"
            style={{ width: 200 }}
            initial={{ opacity: 0, x: 0, rotate: 0, y: 40 }}
            animate={{ opacity: 1, x: offsets[i], rotate: angles[i], y: [Math.abs(angles[i]) * 1.6, Math.abs(angles[i]) * 1.6 - 10, Math.abs(angles[i]) * 1.6] }}
            transition={{
              opacity: { duration: 0.6, delay: 0.2 + i * 0.1 },
              x: { type: 'spring', stiffness: 60, damping: 14, delay: 0.2 + i * 0.1 },
              rotate: { type: 'spring', stiffness: 60, damping: 14, delay: 0.2 + i * 0.1 },
              y: { duration: 5 + i, repeat: Infinity, ease: 'easeInOut' },
            }}
          >
            <ArcaneCard card={card} />
          </motion.div>
        ))}
        <motion.div
          className="relative z-10"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1, y: [0, -8, 0] }}
          transition={{ opacity: { duration: 0.6 }, scale: { type: 'spring', stiffness: 80, damping: 12 }, y: { duration: 4, repeat: Infinity, ease: 'easeInOut' } }}
        >
          <MirrorCard />
        </motion.div>
      </div>

      {/* call to action */}
      <motion.div className="relative z-10 mt-8 flex flex-col items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
        <p className="text-lg italic text-[#FFE7A8]" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
          Built by Students. Powered by AI.
        </p>
        <motion.button
          type="button"
          onClick={onStart}
          className="mt-5 rounded-full px-12 py-4 text-lg font-black uppercase tracking-[0.25em] text-[#2a1606] cursor-pointer"
          style={{ fontFamily: 'Cinzel, serif', background: 'linear-gradient(180deg, #FFF1B8, #E7B547 55%, #A8741C)' }}
          animate={{ boxShadow: ['0 0 20px rgba(231,181,71,0.45)', '0 0 60px rgba(231,181,71,0.9)', '0 0 20px rgba(231,181,71,0.45)'] }}
          transition={{ duration: 2.2, repeat: Infinity }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.96 }}
        >
          Get your power card
        </motion.button>
        <ol className="mt-5 flex flex-wrap justify-center gap-2 font-mono-nums text-[10px] uppercase tracking-[0.25em] text-[#FFE7A8]/80">
          {['Name', 'Stream', 'Scan', 'Powers', 'Reveal'].map((label, i) => (
            <li key={label} className="rounded-full border border-[#E7B547]/30 bg-black/30 px-3 py-1.5">
              <span className="text-[#E7B547]">{i + 1}</span> {label}
            </li>
          ))}
        </ol>
        <p className="mt-3 font-mono-nums text-[10px] uppercase tracking-[0.35em] text-white/40">Press Enter</p>
      </motion.div>
    </div>
  );
}
