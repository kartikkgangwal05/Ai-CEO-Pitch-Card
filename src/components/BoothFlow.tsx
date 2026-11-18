import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowLeft, ArrowRight, Camera, ImageUp, Settings2 } from 'lucide-react';
import type { CartoonStyleId, PersonaId } from '../types/pitch';
import { CARTOON_STYLE_OPTIONS, PERSONA_OPTIONS } from '../utils/pitch';
import { playTick } from '../utils/sfx';
import { PowersStep, type Powers } from './PowersStep';

/** What the booth hands back once the person is scanned. */
export interface BoothResult {
  name: string;
  photoDataUrl: string;
  cartoonStyle: CartoonStyleId;
  personaId: PersonaId;
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

type Step = 'attract' | 'name' | 'style' | 'powers' | 'scan';
const STEPS: { id: Exclude<Step, 'attract'>; label: string }[] = [
  { id: 'name', label: 'Identify' },
  { id: 'style', label: 'Form' },
  { id: 'powers', label: 'Powers' },
  { id: 'scan', label: 'Scan' },
];

const STYLES = CARTOON_STYLE_OPTIONS.filter((s) => s.modern);
const styleThumb = (id: string) => `/styles/${id}.jpg`;

/** Square, mirrored (selfie) JPEG from the live video or an uploaded image. */
function squareJpeg(source: CanvasImageSource, w: number, h: number, mirror: boolean): string {
  const side = Math.min(w, h);
  const size = Math.min(900, side);
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  if (mirror) {
    ctx.translate(size, 0);
    ctx.scale(-1, 1);
  }
  ctx.drawImage(source, (w - side) / 2, (h - side) / 2, side, side, 0, 0, size, size);
  return canvas.toDataURL('image/jpeg', 0.9);
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
 * Full-screen sci-fi kiosk: attract screen → codename → art style (+ optional class) → face scan.
 * Three inputs total; the AI invents the title, intro and one-word stats.
 */
export function BoothFlow({ onComplete, onOpenStudio, paused = false }: BoothFlowProps) {
  const [step, setStep] = useState<Step>('attract');
  const [name, setName] = useState('');
  const [styleId, setStyleId] = useState<CartoonStyleId>('bold-toon');
  const [personaId, setPersonaId] = useState<PersonaId>('none');
  const [powers, setPowers] = useState<Powers>({ strength: '', weakness: '', hobby: '' });
  const [aiStatus, setAiStatus] = useState<{ online: boolean; model: string | null } | null>(null);

  useEffect(() => {
    fetch('/api/health')
      .then((r) => r.json())
      .then((h) => setAiStatus({ online: Boolean(h.geminiConfigured), model: h.imageModel ?? null }))
      .catch(() => setAiStatus({ online: false, model: null }));
  }, []);
  const [missingThumbs, setMissingThumbs] = useState<Set<string>>(new Set());
  const rootRef = useRef<HTMLDivElement>(null);
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

  const reset = useCallback(() => {
    setStep('attract');
    setName('');
    setPersonaId('none');
    setPowers({ strength: '', weakness: '', hobby: '' });
  }, []);

  const go = (next: Step) => {
    playTick(false);
    setStep(next);
  };

  const markMissing = (id: string) => setMissingThumbs((prev) => new Set(prev).add(id));
  const availableThumbs = STYLES.filter((s) => !missingThumbs.has(s.id));

  // Global keys: Enter advances from the attract screen and the style step.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (paused || Date.now() < ignoreKeysUntil.current) return;
      if (step === 'attract' && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        go('name');
      } else if (step === 'style') {
        const n = Number(e.key);
        if (n >= 1 && n <= STYLES.length) setStyleId(STYLES[n - 1].id);
        if (e.key === 'Enter') go('powers');
        if (e.key === 'Escape') go('name');
      } else if (step === 'powers') {
        if (e.key === 'Enter') go('scan');
        if (e.key === 'Escape') go('style');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [step, paused]);

  const stepIndex = STEPS.findIndex((s) => s.id === step);

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
      <header className="relative z-10 flex items-center justify-between px-6 pt-5 font-mono-nums text-[11px] uppercase tracking-[0.3em] text-sky-300/80">
        <span>
          <span className="text-[#00D4FF]">◆</span> Power//Card <span className="text-sky-500/60">· #DYPAICoE</span>
        </span>
        {step !== 'attract' ? (
          <ol className="hidden items-center gap-3 sm:flex">
            {STEPS.map((s, i) => (
              <li key={s.id} className={`flex items-center gap-2 ${i <= stepIndex ? 'text-[#00D4FF]' : 'text-sky-700'}`}>
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full border text-[10px] ${
                    i < stepIndex ? 'border-[#00D4FF] bg-[#00D4FF] text-[#02040b]' : i === stepIndex ? 'border-[#00D4FF] shadow-[0_0_12px_rgba(0,212,255,0.8)]' : 'border-sky-800'
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
        {aiStatus && (
          <span
            title={aiStatus.model ? `Image model: ${aiStatus.model}` : undefined}
            className={`hidden rounded-full border px-3 py-1.5 sm:inline ${
              aiStatus.online ? 'border-emerald-400/40 text-emerald-300' : 'border-amber-400/50 text-amber-300'
            }`}
          >
            {aiStatus.online ? '● AI online' : '○ AI offline · add GEMINI_API_KEY'}
          </span>
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
            <motion.section key="attract" {...stepMotion} className="flex flex-col items-center text-center">
              <AttractHologram thumbs={availableThumbs.map((s) => styleThumb(s.id))} onMissing={markMissing} styleIds={STYLES.map((s) => s.id)} />
              <h1 className="booth-glitch mt-10 font-display text-5xl font-extrabold tracking-tight sm:text-7xl" data-text="GET YOUR POWER CARD">
                GET YOUR POWER CARD
              </h1>
              <p className="mt-4 max-w-xl text-base text-sky-200/80 sm:text-lg">
                One scan. AI turns you into a collectible hero card in about 30 seconds.
              </p>
              <motion.button
                type="button"
                onClick={() => go('name')}
                className="mt-10 rounded-full bg-[#00D4FF] px-10 py-4 font-display text-lg font-extrabold uppercase tracking-[0.2em] text-[#02040b] cursor-pointer"
                animate={{ boxShadow: ['0 0 20px rgba(0,212,255,0.4)', '0 0 60px rgba(0,212,255,0.9)', '0 0 20px rgba(0,212,255,0.4)'] }}
                transition={{ duration: 2, repeat: Infinity }}
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.96 }}
              >
                ▶ Initiate
              </motion.button>
              <p className="mt-4 font-mono-nums text-[11px] uppercase tracking-[0.3em] text-sky-500/70">Press Enter</p>
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

          {step === 'style' && (
            <motion.section key="style" {...stepMotion} className="flex w-full max-w-5xl flex-col items-center text-center">
              <p className="font-mono-nums text-xs uppercase tracking-[0.4em] text-[#00D4FF]">02 // Select your form</p>
              <h2 className="mt-3 font-display text-3xl font-extrabold sm:text-4xl">
                Pick your look, <span className="text-[#00D4FF]">{name.trim().split(/\s+/)[0]}</span>
              </h2>
              <div className="mt-8 grid w-full grid-cols-3 gap-3 sm:gap-4 lg:grid-cols-6">
                {STYLES.map((s, i) => {
                  const active = s.id === styleId;
                  const [bg, fg] = s.swatch ?? ['#0B1C3D', '#00D4FF'];
                  return (
                    <motion.button
                      key={s.id}
                      type="button"
                      data-testid={`booth-style-${s.id}`}
                      onClick={() => {
                        playTick(false);
                        setStyleId(s.id);
                      }}
                      aria-pressed={active}
                      className={`group relative overflow-hidden rounded-2xl border-2 text-left cursor-pointer ${
                        active ? 'border-[#00D4FF] shadow-[0_0_28px_rgba(0,212,255,0.65)]' : 'border-sky-900 hover:border-sky-400'
                      }`}
                      initial={{ opacity: 0, y: 24 }}
                      animate={{ opacity: 1, y: 0, scale: active ? 1.04 : 1 }}
                      transition={{ delay: i * 0.05, type: 'spring', stiffness: 160, damping: 18 }}
                      whileHover={{ y: -6 }}
                    >
                      <div className="aspect-[3/4] w-full" style={{ background: `linear-gradient(160deg, ${bg}, ${fg})` }}>
                        {!missingThumbs.has(s.id) && (
                          <img
                            src={styleThumb(s.id)}
                            alt=""
                            onError={() => markMissing(s.id)}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                        )}
                      </div>
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent px-2.5 pb-2 pt-8">
                        <p className="font-display text-sm font-extrabold leading-tight">{s.label}</p>
                        <p className="text-[10px] text-sky-200/80">{s.blurb}</p>
                      </div>
                      <span className="absolute left-2 top-2 rounded bg-black/60 px-1.5 font-mono-nums text-[10px] text-sky-200">{i + 1}</span>
                      {active && (
                        <motion.span
                          layoutId="style-check"
                          className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-[#00D4FF] text-xs font-bold text-[#02040b]"
                        >
                          ✓
                        </motion.span>
                      )}
                    </motion.button>
                  );
                })}
              </div>

              <p className="mt-8 font-mono-nums text-[11px] uppercase tracking-[0.35em] text-sky-400/80">Choose a class (optional)</p>
              <div className="mt-3 flex max-w-4xl flex-wrap justify-center gap-2">
                {PERSONA_OPTIONS.map((p) => {
                  const active = p.id === personaId;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      data-testid={`booth-persona-${p.id}`}
                      onClick={() => {
                        playTick(false);
                        setPersonaId(p.id);
                      }}
                      aria-pressed={active}
                      className={`rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-all cursor-pointer ${
                        active
                          ? 'border-[#00D4FF] bg-[#00D4FF] text-[#02040b] shadow-[0_0_18px_rgba(0,212,255,0.7)]'
                          : 'border-sky-800 bg-[#061026]/70 text-sky-100 hover:border-sky-400'
                      }`}
                    >
                      <span aria-hidden="true">{p.emoji}</span> {p.label}
                    </button>
                  );
                })}
              </div>

              <div className="mt-8 flex items-center gap-4">
                <button type="button" onClick={() => go('name')} className="booth-ghost-btn">
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back
                </button>
                <button type="button" onClick={() => go('powers')} className="booth-primary-btn">
                  Lock in <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </motion.section>
          )}

          {step === 'powers' && (
            <motion.section key="powers" {...stepMotion} className="flex w-full max-w-6xl flex-col items-center">
              <p className="font-mono-nums text-xs uppercase tracking-[0.4em] text-[#00D4FF]">03 // Choose your powers</p>
              <h2 className="mt-3 mb-8 text-center font-display text-3xl font-extrabold sm:text-4xl">What goes on your card?</h2>
              <PowersStep name={name.trim()} styleId={styleId} personaId={personaId} powers={powers} onChange={setPowers} />
              <div className="mt-8 flex items-center gap-4">
                <button type="button" onClick={() => go('style')} className="booth-ghost-btn">
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back
                </button>
                <button type="button" data-testid="booth-powers-next" onClick={() => go('scan')} className="booth-primary-btn">
                  Scan my face <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </motion.section>
          )}

          {step === 'scan' && (
            <motion.section key="scan" {...stepMotion} className="flex w-full max-w-5xl flex-col items-center">
              <ScanStep
                name={name.trim()}
                styleLabel={STYLES.find((s) => s.id === styleId)?.label ?? ''}
                personaLabel={PERSONA_OPTIONS.find((p) => p.id === personaId)?.label ?? ''}
                onBack={() => go('powers')}
                onCaptured={(photoDataUrl) => {
                  onComplete({ name: name.trim(), photoDataUrl, cartoonStyle: styleId, personaId, ...powers });
                  reset();
                }}
              />
            </motion.section>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

/** Rotating hologram card cycling through the style thumbnails. */
function AttractHologram({ thumbs, onMissing, styleIds }: { thumbs: string[]; onMissing: (id: string) => void; styleIds: string[] }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = window.setInterval(() => setI((n) => n + 1), 1600);
    return () => window.clearInterval(t);
  }, []);
  const src = thumbs.length ? thumbs[i % thumbs.length] : null;

  return (
    <div className="relative" style={{ perspective: 900 }}>
      <motion.div
        aria-hidden="true"
        className="absolute left-1/2 top-1/2 h-[340px] w-[340px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-[#00D4FF]/40"
        animate={{ rotate: 360 }}
        transition={{ duration: 24, repeat: Infinity, ease: 'linear' }}
      />
      <motion.div
        className="relative h-[252px] w-[180px] overflow-hidden rounded-2xl border-2 border-[#00D4FF]/80 bg-[#061430] shadow-[0_0_60px_rgba(0,212,255,0.55)]"
        animate={{ rotateY: [-18, 18, -18], y: [0, -10, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      >
        <AnimatePresence mode="popLayout">
          {src ? (
            <motion.img
              key={src}
              src={src}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
              initial={{ opacity: 0, scale: 1.15 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-6xl">🦸</div>
          )}
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/25 to-transparent mix-blend-overlay" />
        <motion.div
          className="absolute inset-x-0 h-10 bg-gradient-to-b from-transparent via-[#00D4FF]/50 to-transparent"
          animate={{ top: ['-15%', '110%'] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'linear' }}
        />
      </motion.div>
      {/* Preload thumbs so missing ones are detected even before the style step */}
      <div className="hidden">
        {styleIds.map((id) => (
          <img key={id} src={styleThumb(id)} alt="" onError={() => onMissing(id)} />
        ))}
      </div>
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
      <p className="font-mono-nums text-xs uppercase tracking-[0.4em] text-[#00D4FF]">04 // Biometric scan</p>
      <h2 className="mt-3 text-center font-display text-3xl font-extrabold sm:text-4xl">Look into the lens & smile</h2>

      <div className="mt-6 flex w-full items-center justify-center gap-8">
        <div className={`hidden w-44 space-y-3 text-right lg:block ${readout} text-sky-400/80`}>
          <p>Subject<br /><span className="text-white">{name}</span></p>
          <p>Form<br /><span className="text-white">{styleLabel}</span></p>
          <p>Class<br /><span className="text-white">{personaLabel}</span></p>
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
