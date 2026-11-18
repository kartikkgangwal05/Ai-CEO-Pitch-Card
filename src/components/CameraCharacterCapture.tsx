import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import {
  Camera,
  Loader2,
  RefreshCw,
  Sparkles,
  Trash2,
  Upload,
  Wand2,
} from 'lucide-react';
import type { CartoonStyleId, PersonaId, Specialisation } from '../types/pitch';
import { CARTOON_STYLE_OPTIONS, PERSONA_OPTIONS } from '../utils/pitch';
import { AnimatePresence, motion } from 'motion/react';
import { playTick } from '../utils/sfx';

interface CameraCharacterCaptureProps {
  capturedPhotoUrl: string;
  aiCharacterUrl: string;
  characterPrompt: string;
  cartoonStyle: CartoonStyleId;
  personaId: PersonaId;
  specialisation: Specialisation;
  isGeneratingCharacter: boolean;
  characterError: string | null;
  onPhotoCaptured: (dataUrl: string) => void;
  onCartoonStyleChange: (style: CartoonStyleId) => void;
  onPersonaChange: (persona: PersonaId) => void;
  onPromptChange: (prompt: string) => void;
  onGenerateAiCharacter: (isEdit?: boolean) => void;
  onClearMedia: () => void;
}

function resizeDataUrlFromImageSource(
  source: HTMLVideoElement | HTMLImageElement,
  srcWidth: number,
  srcHeight: number,
  mirror: boolean
): string {
  const maxDim = 768;
  const scale = Math.min(1, maxDim / Math.max(srcWidth, srcHeight, 1));
  const width = Math.max(1, Math.round(srcWidth * scale));
  const height = Math.max(1, Math.round(srcHeight * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  if (mirror) {
    ctx.translate(width, 0);
    ctx.scale(-1, 1);
  }
  ctx.drawImage(source, 0, 0, width, height);
  return canvas.toDataURL('image/jpeg', 0.86);
}

export function CameraCharacterCapture({
  capturedPhotoUrl,
  aiCharacterUrl,
  characterPrompt,
  cartoonStyle,
  personaId,
  specialisation,
  isGeneratingCharacter,
  characterError,
  onPhotoCaptured,
  onCartoonStyleChange,
  onPersonaChange,
  onPromptChange,
  onGenerateAiCharacter,
  onClearMedia,
}: CameraCharacterCaptureProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraStatusError, setCameraStatusError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [flash, setFlash] = useState(false);
  const snapTimers = useRef<number[]>([]);

  const stopCamera = () => {
    snapTimers.current.forEach((t) => window.clearTimeout(t));
    snapTimers.current = [];
    setCountdown(null);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraOpen(false);
  };

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const handleOpenCamera = async () => {
    setCameraStatusError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraStatusError('Camera preview is unavailable in this browser. Use Upload Photo instead.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 720 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      setIsCameraOpen(true);
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          void videoRef.current.play().catch(() => {});
        }
      });
    } catch {
      stopCamera();
      setCameraStatusError('Camera permission denied or no webcam found. You can upload a photo instead.');
    }
  };

  const clearSnapTimers = () => {
    snapTimers.current.forEach((t) => window.clearTimeout(t));
    snapTimers.current = [];
    setCountdown(null);
  };

  /** 3-2-1 countdown with ticks, then a shutter flash and capture. */
  const startSnapCountdown = () => {
    if (countdown !== null) return;
    [3, 2, 1].forEach((n, i) => {
      snapTimers.current.push(
        window.setTimeout(() => {
          setCountdown(n);
          playTick(false);
        }, i * 900)
      );
    });
    snapTimers.current.push(
      window.setTimeout(() => {
        setCountdown(null);
        playTick(true);
        setFlash(true);
        handleSnapPhoto();
        window.setTimeout(() => setFlash(false), 450);
      }, 3 * 900)
    );
  };

  const handleSnapPhoto = () => {
    const video = videoRef.current;
    if (!video) return;
    const vw = video.videoWidth || 640;
    const vh = video.videoHeight || 480;
    const dataUrl = resizeDataUrlFromImageSource(video, vw, vh, true);
    stopCamera();
    if (dataUrl) {
      onPhotoCaptured(dataUrl);
    }
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setCameraStatusError(null);
    stopCamera();

    const reader = new FileReader();
    reader.onload = () => {
      const rawUrl = typeof reader.result === 'string' ? reader.result : '';
      if (!rawUrl) return;
      const img = new Image();
      img.onload = () => {
        const resized = resizeDataUrlFromImageSource(img, img.naturalWidth, img.naturalHeight, false);
        onPhotoCaptured(resized || rawUrl);
      };
      img.onerror = () => {
        setCameraStatusError('Could not read selected image file. Choose a PNG or JPEG photo.');
      };
      img.src = rawUrl;
    };
    reader.readAsDataURL(file);
  };

  const activePortrait = aiCharacterUrl || capturedPhotoUrl;

  return (
    <div
      data-testid="camera-character-studio"
      className="rounded-xl border border-sky-400/30 bg-[#040A17] p-3.5 space-y-3"
    >
      {flash && (
        <div
          aria-hidden="true"
          className="no-print pointer-events-none fixed inset-0 z-[150] bg-white"
          style={{ animation: 'snap-flash 0.45s ease-out forwards' }}
        />
      )}
      <div className="flex items-center justify-between gap-2">
        <div>
          <span className="text-xs font-semibold text-white">Camera → AI Character & Sketch Studio</span>
          <p className="text-[11px] text-sky-300/80">
            Snap/upload a photo or generate a {specialisation} cartoon or ink sketch directly
          </p>
        </div>
        {activePortrait && !isCameraOpen && (
          <button
            type="button"
            onClick={onClearMedia}
            aria-label="Clear captured photo and generated cartoon"
            className="inline-flex items-center gap-1 text-[11px] text-slate-300 hover:text-rose-300 cursor-pointer"
          >
            <Trash2 className="w-3 h-3" aria-hidden="true" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Cartoon & Sketch Style Selector */}
      <div>
        <span className="block text-[11px] font-medium text-sky-200 mb-1.5">Character / Sketch Style</span>
        <div className="flex flex-wrap gap-1.5">
          {CARTOON_STYLE_OPTIONS.filter((style) => !style.hidden).map((style) => {
            const active = cartoonStyle === style.id;
            return (
              <button
                key={style.id}
                type="button"
                onClick={() => onCartoonStyleChange(style.id)}
                aria-pressed={active}
                className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  active
                    ? 'bg-[#00D4FF] text-[#030712] border-[#00D4FF]'
                    : 'bg-[#081226] text-sky-100 border-sky-400/25 hover:border-sky-300'
                }`}
              >
                {style.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Character persona: costume + world the AI dresses the person in */}
      <div>
        <span className="block text-[11px] font-semibold text-white mb-1.5">
          Character persona <span className="text-sky-300/75 font-normal">(AI dresses you up)</span>
        </span>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5" role="group" aria-label="Character persona">
          {PERSONA_OPTIONS.map((persona) => {
            const active = personaId === persona.id;
            return (
              <button
                key={persona.id}
                type="button"
                data-testid={`persona-${persona.id}`}
                onClick={() => onPersonaChange(persona.id)}
                aria-pressed={active}
                className={`flex flex-col items-center justify-center gap-0.5 rounded-xl border px-1.5 py-2 text-center transition-all cursor-pointer ${
                  active
                    ? 'bg-[#00D4FF] text-[#030712] border-[#00D4FF] shadow-[0_0_16px_rgba(0,212,255,0.55)] scale-[1.04]'
                    : 'bg-[#081226] text-sky-100 border-sky-400/25 hover:border-sky-300 hover:-translate-y-0.5'
                }`}
              >
                <span className="text-lg leading-none" aria-hidden="true">
                  {persona.emoji}
                </span>
                <span className="text-[10px] font-bold leading-tight whitespace-nowrap">{persona.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Viewport: Live Webcam OR Captured / Cartoonized Preview */}
      {isCameraOpen ? (
        <div className="space-y-2">
          <div className="relative aspect-[4/3] w-full rounded-xl overflow-hidden border border-[#00D4FF]/60 bg-black">
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              className="w-full h-full object-cover scale-x-[-1]"
            />
            <div className="absolute top-2 left-2 bg-[#030712]/80 border border-sky-400/40 rounded px-2 py-0.5 text-[10px] font-mono-nums text-[#00D4FF]">
              LIVE CAMERA
            </div>
            {/* Face guide */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute left-1/2 top-1/2 h-[78%] w-[52%] -translate-x-1/2 -translate-y-1/2 rounded-[50%] border-2 border-dashed border-[#00D4FF]/60"
            />
            <AnimatePresence>
              {countdown !== null && (
                <motion.div
                  key={countdown}
                  className="absolute inset-0 flex items-center justify-center bg-black/25 font-display text-[9rem] font-extrabold leading-none text-white drop-shadow-[0_0_30px_rgba(0,212,255,0.9)]"
                  initial={{ opacity: 0, scale: 2.2 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.6 }}
                  transition={{ duration: 0.35 }}
                >
                  {countdown}
                </motion.div>
              )}
            </AnimatePresence>

          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={startSnapCountdown}
              disabled={countdown !== null}
              className="flex-1 disabled:opacity-60 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#00D4FF] hover:bg-sky-300 text-[#030712] text-xs font-bold py-2.5 px-3 cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{countdown !== null ? 'Smile…' : 'Snap in 3… (Cartoonify)'}</span>
            </button>
            <button
              type="button"
              onClick={stopCamera}
              className="rounded-xl border border-sky-400/35 bg-[#081226] hover:bg-[#0D1E42] text-white text-xs font-semibold py-2.5 px-3.5 cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          {/* Thumbnail */}
          <div className="sm:col-span-5">
            <div className="relative aspect-[4/3] w-full rounded-xl overflow-hidden border border-sky-400/35 bg-[#061430] flex items-center justify-center">
              {activePortrait ? (
                <>
                  <img
                    src={activePortrait}
                    alt={aiCharacterUrl ? 'Cartoonized AI character preview' : 'Captured visitor photo'}
                    className="w-full h-full object-cover"
                  />
                  {isGeneratingCharacter && (
                    <div className="absolute inset-0 bg-[#030712]/75 backdrop-blur-[2px] flex flex-col items-center justify-center gap-1.5 text-center px-2">
                      <Loader2 className="w-5 h-5 animate-spin text-[#00D4FF]" aria-hidden="true" />
                      <span className="text-[10px] font-bold text-white">Cartoonifying...</span>
                    </div>
                  )}
                  <span className="absolute bottom-1.5 left-1.5 bg-[#030712]/85 border border-sky-400/45 rounded px-1.5 py-0.5 text-[9px] font-mono-nums font-bold text-[#00D4FF]">
                    {aiCharacterUrl
                      ? cartoonStyle === 'pencil-sketch'
                        ? 'SKETCH READY'
                        : 'CARTOON READY'
                      : 'CAMERA PHOTO'}
                  </span>
                </>
              ) : (
                <div className="text-center px-3 py-4">
                  <Camera className="w-7 h-7 text-sky-400/70 mx-auto mb-1" aria-hidden="true" />
                  <p className="text-[10px] text-sky-200/75 leading-snug">
                    Snap, upload, or generate AI art
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Camera & Upload Triggers */}
          <div className="sm:col-span-7 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => void handleOpenCamera()}
                disabled={isGeneratingCharacter}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-sky-400/45 bg-[#081226] hover:bg-[#0E2147] disabled:opacity-60 text-white text-xs font-semibold py-2 px-2.5 transition-colors cursor-pointer whitespace-nowrap"
              >
                <Camera className="w-3.5 h-3.5 text-[#00D4FF]" aria-hidden="true" />
                <span>{capturedPhotoUrl ? 'Retake Cam' : 'Open Camera'}</span>
              </button>

              <label className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-sky-400/35 bg-[#081226] hover:bg-[#0E2147] text-white text-xs font-semibold py-2 px-2.5 transition-colors cursor-pointer whitespace-nowrap">
                <Upload className="w-3.5 h-3.5 text-sky-300" aria-hidden="true" />
                <span>Upload Photo</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="user"
                  onChange={handleFileUpload}
                  className="sr-only"
                />
              </label>
            </div>

            <button
              type="button"
              onClick={() => onGenerateAiCharacter(Boolean(aiCharacterUrl && characterPrompt.trim()))}
              disabled={isGeneratingCharacter}
              className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-sky-500/20 hover:bg-sky-400/30 disabled:opacity-45 border border-[#00D4FF]/60 text-white text-xs font-bold py-2 px-3 transition-colors cursor-pointer whitespace-nowrap"
            >
              {isGeneratingCharacter ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#00D4FF]" aria-hidden="true" />
                  <span>
                    {cartoonStyle === 'pencil-sketch' ? 'Sketching Portrait...' : 'Rendering AI Character...'}
                  </span>
                </>
              ) : aiCharacterUrl ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 text-[#00D4FF]" aria-hidden="true" />
                  <span>
                    {characterPrompt.trim()
                      ? 'Apply Edit Prompt'
                      : cartoonStyle === 'pencil-sketch'
                        ? 'Re-Render Ink Sketch'
                        : 'Re-Render AI Character'}
                  </span>
                </>
              ) : (
                <>
                  <Wand2 className="w-3.5 h-3.5 text-[#00D4FF]" aria-hidden="true" />
                  <span>
                    {cartoonStyle === 'pencil-sketch'
                      ? 'Generate Ink Sketch'
                      : capturedPhotoUrl
                        ? 'Convert to AI Character'
                        : 'Generate AI Character'}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Optional Text Prompt for Creating or Editing AI Character */}
      <div>
        <label htmlFor="character-style-prompt" className="block text-[11px] font-medium text-sky-200 mb-1">
          Character / Sketch Customize Prompt <span className="text-sky-300/70">(optional)</span>
        </label>
        <div className="relative">
          <Sparkles
            className="w-3.5 h-3.5 text-sky-400/75 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />
          <input
            id="character-style-prompt"
            name="characterPrompt"
            type="text"
            value={characterPrompt}
            onChange={(e) => onPromptChange(e.target.value)}
            placeholder="e.g., sleek eyeglasses, navy blazer, clean portrait sketch"
            className="w-full rounded-lg border border-sky-400/25 bg-[#030712] pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400/50 focus:border-sky-400"
          />
        </div>
      </div>

      {(cameraStatusError || characterError) && (
        <p
          role="status"
          className={`text-[11px] rounded-lg px-2.5 py-1.5 border ${
            (characterError ?? '').includes('Comic') || (characterError ?? '').includes('Sketch')
              ? 'text-sky-200 bg-sky-500/10 border-sky-400/35'
              : 'text-rose-300 bg-rose-500/10 border-rose-500/30'
          }`}
        >
          {cameraStatusError || characterError}
        </p>
      )}
    </div>
  );
}
