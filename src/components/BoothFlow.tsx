import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowLeft, ArrowRight, Camera, ImageUp, Settings2, Sparkles } from 'lucide-react';
import type { CartoonStyleId, PersonaId, Specialisation } from '../types/pitch';
import { ICON_PATHS, STREAMS, STREAM_ORDER } from '../utils/streams';
import { renderMagicPortrait } from '../utils/magicPortrait';
import { requestStreamPortrait, type PortraitResult } from '../utils/streamPortrait';
import { ConjuringLoader } from './ConjuringLoader';
import { AttractHero } from './AttractHero';
import { preloadSegmenter } from '../utils/segment';
import { playTick } from '../utils/sfx';
import { PowersStep, type Powers } from './PowersStep';

/** What the booth hands back when the person taps "Create my card". */
export interface BoothResult {
  name: string;
  photoDataUrl: string;
  /** Best portrait available right now (AI if finished, else the in-browser stream portrait). */
  portraitUrl: string;
  /** The Cloudflare AI portrait job (already settled if it finished during the Powers step). */
  aiPortrait: Promise<PortraitResult>;
  cartoonStyle: CartoonStyleId;
  personaId: PersonaId;
  /** PGDM stream: sets the card colours, icons and title theme. */
  stream: Specialisation;
  /** One-word stats picked in the booth; empty string means the AI decides. */
  strength: string;
  weakness: string;
  hobby: string;
}

interface BoothFlowProps {
  onComplete: (result: BoothResult) => void;
  onOpenStudio: () => void;
  /** True while the summoning/reveal overlays are on top: the booth ignores keys. */
  paused?: boolean;
}

type Step = 'attract' | 'name' | 'scan' | 'style' | 'powers';
const STEPS: { id: Exclude<Step, 'attract'>; label: string }[] = [
  { id: 'name', label: 'Identify' },
  { id: 'style', label: 'Stream' },
  { id: 'scan', label: 'Scan' },
  { id: 'powers', label: 'Powers' },
];

const SAMPLE_FILE: Record<Specialisation, string> = {
  HR: 'hr',
  'Business Analytics': 'ba',
  Finance: 'finance',
  Marketing: 'marketing',
  'Executive Leadership': 'leadership',
};
/** AI-painted sample art per stream (generated once with scripts/generate-samples.ts). */
export const sampleArt = (id: Specialisation) => `/samples/${SAMPLE_FILE[id]}.jpg`;

/** Square, mirrored (selfie) JPEG from the live video or an uploaded image. */
function squareJpeg(source: CanvasImageSource, w: number, h: number, mirror: boolean): string {
  const side = Math.min(w, h);
  const size = Math.min(1080, side);
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  if (mirror) {
    ctx.translate(size, 0);
    ctx.scale(-1, 1);
  }
  ctx.drawImage(source, (w - side) / 2, (h - side) / 2, side, side, 0, 0, size, size);
  return canvas.toDataURL('image/jpeg', 0.92);
}

function HudFrame({ children, className = '' }: { children: ReactNode; className?: string }) {
  const corner = 'absolute h-6 w-6 border-[#00D4FF]';
  return (
    <div className={`relative ${className}`}>
      <span className={`${corner} -left-1 -top-1 border-l-2 border-t-2`} />
      <span className={`${corner} -right-1 -top-1 border-r-2 border-t-2`} />
      <span className={`${corner} -bottom-1 -left-1 border-b-2 border-l-2`} />
      <span className={`${corner} -bottom-1 -right-1 border-b-2 border-r-2`} />
      {children}
    </div>
  );
}

// Opacity + transform only (GPU-composited): no blur filters, so steps glide even on a projector laptop.
const stepMotion = {
  initial: { opacity: 0, y: 28, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -20, scale: 0.98, transition: { duration: 0.16, ease: 'easeIn' as const } },
  transition: { type: 'spring' as const, stiffness: 170, damping: 22 },
};

/**
 * Full-screen sci-fi kiosk: attract → name → face scan → pick a filter on your own photo → powers.
 * The AI writes the title, intro and any stats left on "AI decides".
 */
export function BoothFlow({ onComplete, onOpenStudio, paused = false }: BoothFlowProps) {
  const [step, setStep] = useState<Step>('attract');
  const [name, setName] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [localPortrait, setLocalPortrait] = useState<string | null>(null);
  const [ai, setAi] = useState<{ status: 'idle' | 'working' | 'done'; image: string | null; error?: string | null; provider?: 'cloudflare' | 'gemini' }>({ status: 'idle', image: null });
  const aiJob = useRef<Promise<PortraitResult> | null>(null);
  const [missingSamples, setMissingSamples] = useState<Set<Specialisation>>(new Set());
  const [stream, setStream] = useState<Specialisation>('Business Analytics');
  const styleId: CartoonStyleId = 'bold-toon';
  const personaId: PersonaId = 'none';
  const [powers, setPowers] = useState<Powers>({ strength: '', weakness: '', hobby: '' });
  const [creating, setCreating] = useState(false);
  const [aiOnline, setAiOnline] = useState<boolean | null>(null);
  const [cfStatus, setCfStatus] = useState<'off' | 'quota' | 'ok' | null>(null);
  const [geminiReady, setGeminiReady] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // Load the person-cutout model while people read the start screen.
  useEffect(() => {
    preloadSegmenter();
  }, []);

  useEffect(() => {
    fetch('/api/health')
      .then((r) => r.json())
      .then((h) => {
        setAiOnline(Boolean(h.anthropicConfigured || h.geminiConfigured));
        setCfStatus(h.cloudflareStatus ?? (h.cloudflareConfigured ? 'ok' : 'off'));
        setGeminiReady((h.geminiStatus ?? (h.geminiConfigured ? 'ok' : 'off')) === 'ok');
      })
      .catch(() => setAiOnline(false));
  }, []);

  // Ignore keys briefly after an overlay closes so one press never does two things.
  const ignoreKeysUntil = useRef(0);
  useEffect(() => {
    if (!paused) ignoreKeysUntil.current = Date.now() + 600;
  }, [paused]);

  // Fixed full-screen stage: never let focus or transitions scroll it.
  useEffect(() => {
    if (rootRef.current) {
      rootRef.current.scrollTop = 0;
      rootRef.current.scrollLeft = 0;
    }
  }, [step]);

  // As soon as the photo is taken: start the Cloudflare AI portrait for the chosen stream, and render
  // the in-browser stream portrait as an instant fallback. People pick powers while the AI paints.
  useEffect(() => {
    if (!photo) return;
    let cancelled = false;
    setLocalPortrait(null);
    setAi({ status: 'working', image: null });
    const job = requestStreamPortrait(photo, stream);
    aiJob.current = job;
    void job.then((r) => {
      if (!cancelled) setAi({ status: 'done', image: r.image, error: r.error, provider: r.provider });
      if (r.error || r.provider === 'gemini') {
        // Gemini only paints when Cloudflare was skipped or failed; refresh the real status.
        fetch('/api/health').then((x) => x.json()).then((h) => {
          if (h.cloudflareStatus) setCfStatus(h.cloudflareStatus);
          setGeminiReady(h.geminiStatus === 'ok');
        }).catch(() => {});
      }
    });
    void renderMagicPortrait(photo, stream, 1000)
      .then((url) => !cancelled && setLocalPortrait(url))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [photo, stream]);

  const reset = useCallback(() => {
    setStep('attract');
    setName('');
    setPhoto(null);
    setLocalPortrait(null);
    setAi({ status: 'idle', image: null });
    aiJob.current = null;
    setPowers({ strength: '', weakness: '', hobby: '' });
    setCreating(false);
  }, []);

  const go = (next: Step) => {
    playTick(false);
    setStep(next);
  };

  const create = async () => {
    if (!photo || creating) return;
    setCreating(true);
    const local = localPortrait ?? (await renderMagicPortrait(photo, stream, 1000).catch(() => photo));
    const aiPortrait = aiJob.current ?? Promise.resolve({ image: null, error: null });
    onComplete({ name: name.trim(), photoDataUrl: photo, portraitUrl: ai.image ?? local, aiPortrait, cartoonStyle: styleId, personaId, stream, ...powers });
    reset();
  };

  // Global keys: Enter advances, 1-6 pick a filter, Esc goes back.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (paused || Date.now() < ignoreKeysUntil.current) return;
      if (step === 'attract' && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        go('name');
      } else if (step === 'style') {
        const n = Number(e.key);
        if (n >= 1 && n <= STREAM_ORDER.length) setStream(STREAM_ORDER[n - 1]);
        if (e.key === 'Enter') go('scan');
        if (e.key === 'Escape') go('name');
      } else if (step === 'powers') {
        if (e.key === 'Enter') void create();
        if (e.key === 'Escape') go('scan');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const stepIndex = STEPS.findIndex((s) => s.id === step);
  const theme = STREAMS[stream];
  const firstName = name.trim().split(/\s+/)[0];

  return (
    <div
      ref={rootRef}
      onScroll={(e) => {
        e.currentTarget.scrollTop = 0;
        e.currentTarget.scrollLeft = 0;
      }}
      className="no-print fixed inset-0 z-40 overflow-hidden bg-[#02040b] text-white"
      data-testid="booth"
    >
      {/* Sci-fi backdrop: clipped in its own layer so the wide grid floor can't make the stage scroll */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="booth-aura absolute inset-0" />
        <div className="booth-floor absolute inset-x-[-50%] bottom-[-10%] h-[60%]" />
        <div className="booth-scanlines absolute inset-0" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(0,0,0,0.85)_100%)]" />
      </div>

      {/* Top HUD bar */}
      <header className="relative z-30 flex items-center justify-between px-6 pt-5 font-mono-nums text-[11px] uppercase tracking-[0.3em] text-sky-300/80">
        <span>
          <span className="text-[#00D4FF]">◆</span> Power//Card <span className="text-sky-500/60">· #DYPAICoE</span>
        </span>
        {step !== 'attract' ? (
          <ol className="hidden items-center gap-3 sm:flex">
            {STEPS.map((s, i) => (
              <li key={s.id} className={`flex items-center gap-2 ${i <= stepIndex ? 'text-[#00D4FF]' : 'text-sky-700'}`}>
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full border text-[10px] ${
                    i < stepIndex
                      ? 'border-[#00D4FF] bg-[#00D4FF] text-[#02040b]'
                      : i === stepIndex
                        ? 'border-[#00D4FF] shadow-[0_0_12px_rgba(0,212,255,0.8)]'
                        : 'border-sky-800'
                  }`}
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                {s.label}
                {i < STEPS.length - 1 && <span className="ml-1 h-px w-8 bg-sky-800" />}
              </li>
            ))}
          </ol>
        ) : (
          <span className="hidden sm:inline">System online</span>
        )}
        <div className="flex items-center gap-3">
          {aiOnline !== null && (
            <span
              className={`hidden rounded-full border px-3 py-1.5 sm:inline ${
                aiOnline ? 'border-emerald-400/40 text-emerald-300' : 'border-amber-400/50 text-amber-300'
              }`}
            >
              {aiOnline ? '● AI online' : '○ AI offline'}
            </span>
          )}
          {cfStatus && cfStatus !== 'ok' && (
            geminiReady ? (
              <span
                title={cfStatus === 'quota' ? 'Cloudflare daily free allowance used up, so Gemini paints the portraits until it resets (00:00 UTC / 5:30 AM IST).' : 'Cloudflare is not configured, so Gemini paints the portraits.'}
                className="hidden rounded-full border border-sky-400/50 px-3 py-1.5 text-sky-300 sm:inline"
              >
                ● AI portraits · Gemini backup
              </span>
            ) : (
              <span
                title={cfStatus === 'quota' ? 'Cloudflare daily free allowance used up. Resets 00:00 UTC (5:30 AM IST), or upgrade to Workers Paid. A GEMINI_API_KEY with billing enabled works as a backup.' : 'Add CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN (or GEMINI_API_KEY) to .env'}
                className="hidden rounded-full border border-amber-400/50 px-3 py-1.5 text-amber-300 sm:inline"
              >
                {cfStatus === 'quota' ? '⚠ AI portraits paused · daily limit' : '○ AI portraits off'}
              </span>
            )
          )}
          <button
            type="button"
            onClick={onOpenStudio}
            className="inline-flex items-center gap-1.5 rounded-full border border-sky-500/30 px-3 py-1.5 text-sky-300/80 hover:border-sky-300 hover:text-white cursor-pointer"
          >
            <Settings2 className="h-3.5 w-3.5" aria-hidden="true" /> Studio
          </button>
        </div>
      </header>

      <main className="relative z-10 flex h-[calc(100%-56px)] items-center justify-center px-6">
        <AnimatePresence mode="wait">
          {step === 'attract' && (
            <motion.section key="attract" {...stepMotion} className="h-full w-full">
              <AttractHero onStart={() => go('name')} sampleArt={sampleArt} />
            </motion.section>
          )}

          {step === 'name' && (
            <motion.form
              key="name"
              {...stepMotion}
              className="flex w-full max-w-3xl flex-col items-center text-center"
              onSubmit={(e) => {
                e.preventDefault();
                if (name.trim().length >= 2) go('style');
              }}
            >
              <p className="font-mono-nums text-xs uppercase tracking-[0.4em] text-[#00D4FF]">01 // Identify</p>
              <h2 className="mt-3 font-display text-4xl font-extrabold sm:text-5xl">What do we call you, legend?</h2>
              <HudFrame className="mt-10 w-full">
                <input
                  ref={(el) => el?.focus({ preventScroll: true })}
                  value={name}
                  onChange={(e) => setName(e.target.value.slice(0, 32))}
                  placeholder="Type your name"
                  aria-label="Your name"
                  autoComplete="off"
                  className="w-full bg-[#00D4FF]/[0.04] px-6 py-6 text-center font-display text-4xl font-extrabold text-white caret-[#00D4FF] placeholder:text-sky-800 focus:outline-none sm:text-6xl"
                />
              </HudFrame>
              <div className="mt-10 flex items-center gap-4">
                <button type="button" onClick={() => go('attract')} className="booth-ghost-btn">
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back
                </button>
                <button type="submit" disabled={name.trim().length < 2} className="booth-primary-btn">
                  Confirm <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </motion.form>
          )}

          {step === 'scan' && (
            <motion.section key="scan" {...stepMotion} className="flex w-full max-w-5xl flex-col items-center">
              <ScanStep
                name={name.trim()}
                styleLabel={STREAMS[stream].short}
                personaLabel="AI portrait"
                onBack={() => go('style')}
                onCaptured={(dataUrl) => {
                  setPhoto(dataUrl);
                  go('powers');
                }}
              />
            </motion.section>
          )}

          {step === 'style' && (
            <motion.section key="style" {...stepMotion} className="flex w-full max-w-6xl flex-col items-center text-center">
              <p className="font-mono-nums text-xs uppercase tracking-[0.4em] text-[#00D4FF]">02 // Choose your stream</p>
              <h2 className="mt-3 font-display text-3xl font-extrabold sm:text-4xl">
                Which order do you belong to, <span style={{ color: theme.light }}>{firstName}</span>?
              </h2>
              <div className="mt-8 grid w-full grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
                {STREAM_ORDER.map((id, i) => {
                  const t = STREAMS[id];
                  const active = id === stream;
                  const src = sampleArt(id);
                  return (
                    <motion.button
                      key={id}
                      type="button"
                      data-testid={`booth-stream-${t.short.split(' ')[0]}`}
                      onClick={() => {
                        playTick(false);
                        setStream(id);
                      }}
                      aria-pressed={active}
                      className="group relative overflow-hidden rounded-2xl text-left cursor-pointer"
                      style={{
                        border: `2px solid ${active ? t.light : t.glow + '55'}`,
                        boxShadow: active ? `0 0 30px ${t.glow}` : undefined,
                      }}
                      initial={{ opacity: 0, y: 24 }}
                      animate={{ opacity: 1, y: 0, scale: active ? 1.04 : 1 }}
                      transition={{ delay: i * 0.05, type: 'spring', stiffness: 160, damping: 18 }}
                      whileHover={{ y: -5 }}
                    >
                      <div className="relative aspect-[4/5] w-full" style={{ background: `radial-gradient(circle at 50% 35%, ${t.glow}, ${t.deep})` }}>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <svg viewBox="0 0 24 24" className="h-16 w-16" style={{ filter: `drop-shadow(0 0 12px ${t.glow})` }} aria-hidden="true">
                            <path d={ICON_PATHS[t.icons[0]]} fill="none" stroke={t.light} strokeWidth="1.4" />
                          </svg>
                        </div>
                        {!missingSamples.has(id) && (
                          <img
                            src={src}
                            alt=""
                            onError={() => setMissingSamples((prev) => new Set(prev).add(id))}
                            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        )}
                      </div>
                      <div className="absolute inset-x-0 bottom-0 px-3 pb-3 pt-10" style={{ background: `linear-gradient(transparent, ${t.ink})` }}>
                        <p className="text-[10px] uppercase tracking-[0.25em]" style={{ color: t.light, fontFamily: 'Cinzel, serif' }}>
                          {t.short}
                        </p>
                        <p className="font-extrabold leading-tight" style={{ color: '#fff', fontFamily: 'Cinzel, serif', fontSize: '0.95rem' }}>
                          {t.archetype}
                        </p>
                      </div>
                      <span className="absolute left-2 top-2 rounded bg-black/60 px-1.5 font-mono-nums text-[10px] text-sky-200">{i + 1}</span>
                      {active && (
                        <motion.span
                          layoutId="style-check"
                          className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold"
                          style={{ background: t.light, color: t.ink }}
                        >
                          ✓
                        </motion.span>
                      )}
                    </motion.button>
                  );
                })}
              </div>

              <div className="mt-8 flex items-center gap-4">
                <button type="button" onClick={() => go('name')} className="booth-ghost-btn">
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back
                </button>
                <button type="button" onClick={() => go('scan')} className="booth-primary-btn">
                  <Camera className="h-4 w-4" aria-hidden="true" /> I am {theme.archetype.replace(/^The /, 'the ')}
                </button>
              </div>
            </motion.section>
          )}

          {step === 'powers' && (
            <motion.section key="powers" {...stepMotion} className="flex w-full max-w-6xl flex-col items-center">
              <p className="font-mono-nums text-xs uppercase tracking-[0.4em] text-[#00D4FF]">04 // Choose your powers</p>
              <h2 className="mt-3 mb-8 text-center font-display text-3xl font-extrabold sm:text-4xl">What goes on your card?</h2>
              <PowersStep
                name={name.trim()}
                styleId={styleId}
                personaId={personaId}
                powers={powers}
                onChange={setPowers}
                stream={stream}
                previewUrl={ai.image ?? localPortrait ?? photo ?? ''}
                previewSlot={
                  ai.status === 'working' && photo ? (
                    <ConjuringLoader photo={photo} stream={stream} />
                  ) : undefined
                }
              />
              {ai.status === 'done' && ai.image && ai.provider && (
                <p className="mt-4 font-mono-nums text-[10px] uppercase tracking-[0.3em] text-amber-200/70">
                  ✦ Portrait painted by {ai.provider === 'gemini' ? 'Google Gemini' : 'Cloudflare Workers AI'}
                </p>
              )}
              {ai.status === 'done' && !ai.image && ai.error && (
                <p className="mt-6 max-w-2xl rounded-xl border border-amber-400/40 bg-amber-500/10 px-4 py-2 text-center text-xs text-amber-200">
                  AI portrait unavailable: {ai.error}. Your card uses the in-browser magic portrait instead.
                </p>
              )}
              <div className="mt-8 flex items-center gap-4">
                <button type="button" onClick={() => go('scan')} className="booth-ghost-btn">
                  <Camera className="h-4 w-4" aria-hidden="true" /> Retake
                </button>
                <button type="button" data-testid="booth-powers-next" onClick={() => void create()} disabled={creating} className="booth-primary-btn">
                  <Sparkles className="h-4 w-4" aria-hidden="true" /> Create my card
                </button>
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function ScanStep({
  name,
  styleLabel,
  personaLabel,
  onBack,
  onCaptured,
}: {
  name: string;
  styleLabel: string;
  personaLabel: string;
  onBack: () => void;
  onCaptured: (dataUrl: string) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const timers = useRef<number[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 960 } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
        setReady(true);
      } catch {
        setError('Camera unavailable. Allow camera access, or upload a photo.');
      }
    })();
    return () => {
      cancelled = true;
      timers.current.forEach((t) => window.clearTimeout(t));
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const capture = () => {
    const v = videoRef.current;
    if (!v || !v.videoWidth) return;
    const dataUrl = squareJpeg(v, v.videoWidth, v.videoHeight, true);
    setFlash(true);
    playTick(true);
    timers.current.push(window.setTimeout(() => onCaptured(dataUrl), 380));
  };

  const startScan = () => {
    if (countdown !== null || !ready) return;
    [3, 2, 1].forEach((n, i) =>
      timers.current.push(
        window.setTimeout(() => {
          setCountdown(n);
          playTick(false);
        }, i * 850)
      )
    );
    timers.current.push(
      window.setTimeout(() => {
        setCountdown(null);
        capture();
      }, 3 * 850)
    );
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        startScan();
      } else if (e.key === 'Escape') onBack();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const handleFile = (file?: File) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const dataUrl = squareJpeg(img, img.naturalWidth, img.naturalHeight, false);
      URL.revokeObjectURL(url);
      onCaptured(dataUrl);
    };
    img.src = url;
  };

  const readout = 'font-mono-nums text-[11px] uppercase tracking-[0.25em]';

  return (
    <>
      <p className="font-mono-nums text-xs uppercase tracking-[0.4em] text-[#00D4FF]">02 // Biometric scan</p>
      <h2 className="mt-3 text-center font-display text-3xl font-extrabold sm:text-4xl">Look into the lens & smile</h2>

      <div className="mt-6 flex w-full items-center justify-center gap-8">
        <div className={`hidden w-44 space-y-3 text-right lg:block ${readout} text-sky-400/80`}>
          <p>Subject<br /><span className="text-white">{name}</span></p>
          <p>Next<br /><span className="text-white">{styleLabel}</span></p>
          <p>Then<br /><span className="text-white">{personaLabel}</span></p>
        </div>

        <HudFrame className="w-[min(78vw,62vh)]">
          <div className="relative aspect-square w-full overflow-hidden rounded-xl border border-[#00D4FF]/40 bg-black">
            <video ref={videoRef} playsInline muted className="h-full w-full -scale-x-100 object-cover" />
            {/* face guide + rotating rings */}
            <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-1/2 h-[72%] w-[52%] -translate-x-1/2 -translate-y-1/2 rounded-[50%] border-2 border-dashed border-[#00D4FF]/70" />
            <motion.div
              aria-hidden="true"
              className="pointer-events-none absolute left-1/2 top-1/2 h-[86%] w-[86%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#00D4FF]/30 border-t-[#00D4FF]"
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            />
            <motion.div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 h-24 bg-gradient-to-b from-transparent via-[#00D4FF]/35 to-transparent"
              animate={{ top: ['-20%', '100%'] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'linear' }}
            />
            <div aria-hidden="true" className="booth-scan-grid pointer-events-none absolute inset-0 opacity-30" />
            <span className={`absolute left-3 top-3 ${readout} text-[#00D4FF]`}>● {ready ? 'Live' : error ? 'No camera' : 'Booting'}</span>
            <span className={`absolute bottom-3 right-3 ${readout} text-[#00D4FF]`}>Face lock</span>

            <AnimatePresence>
              {countdown !== null && (
                <motion.div
                  key={countdown}
                  className="absolute inset-0 flex items-center justify-center font-display text-[11rem] font-extrabold text-white drop-shadow-[0_0_40px_rgba(0,212,255,1)]"
                  initial={{ opacity: 0, scale: 2.4 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  transition={{ duration: 0.35 }}
                >
                  {countdown}
                </motion.div>
              )}
            </AnimatePresence>
            {!ready && !error && (
              <div className={`absolute inset-0 flex items-center justify-center ${readout} text-sky-300`}>Initialising optics…</div>
            )}
            {error && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center">
                <p className="text-sm text-sky-100">{error}</p>
                <button type="button" onClick={() => fileRef.current?.click()} className="booth-primary-btn">
                  <ImageUp className="h-4 w-4" aria-hidden="true" /> Upload photo
                </button>
              </div>
            )}
          </div>
        </HudFrame>

        <div className={`hidden w-44 space-y-3 lg:block ${readout} text-sky-400/80`}>
          <p>Lighting<br /><span className="text-emerald-300">Optimal</span></p>
          <p>Alignment<br /><span className="text-emerald-300">Centre face</span></p>
          <p>Power level<br /><span className="text-white">Calculating…</span></p>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
        <button type="button" onClick={onBack} className="booth-ghost-btn">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back
        </button>
        <motion.button
          type="button"
          data-testid="booth-scan-btn"
          onClick={startScan}
          disabled={!ready || countdown !== null}
          className="booth-primary-btn !px-10 !py-4 !text-lg"
          whileTap={{ scale: 0.95 }}
        >
          <Camera className="h-5 w-5" aria-hidden="true" /> {countdown !== null ? 'Hold still…' : 'Scan me'}
        </motion.button>
        <button type="button" onClick={() => fileRef.current?.click()} className="booth-ghost-btn">
          <ImageUp className="h-4 w-4" aria-hidden="true" /> Upload
        </button>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        data-testid="booth-upload"
        onChange={(e) => {
          handleFile(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
      {flash && <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[150] bg-white" style={{ animation: 'snap-flash 0.45s ease-out forwards' }} />}
    </>
  );
}
