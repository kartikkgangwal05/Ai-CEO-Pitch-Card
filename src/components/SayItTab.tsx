import { useEffect, useRef, useState } from 'react';
import { Loader2, Mic, RotateCcw, Square, Upload, Volume2 } from 'lucide-react';
import type { SayItFeedback, VisitorCard } from '../types/pitch';
import { countWords, estimateReadSeconds } from '../utils/pitch';
import { PitchTextHighlight } from './PitchTextHighlight';

interface SayItTabProps {
  card: VisitorCard | null;
  onGoToCreate: () => void;
}

function pickSupportedAudioMimeType(): string {
  if (typeof MediaRecorder === 'undefined') return '';
  const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'];
  for (const type of candidates) {
    if (MediaRecorder.isTypeSupported(type)) return type;
  }
  return '';
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      const commaIdx = result.indexOf(',');
      resolve(commaIdx >= 0 ? result.slice(commaIdx + 1) : result);
    };
    reader.onerror = () => reject(new Error('Could not read recorded audio.'));
    reader.readAsDataURL(blob);
  });
}

export function SayItTab({ card, onGoToCreate }: SayItTabProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string>('');
  const [audioLevel, setAudioLevel] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [feedback, setFeedback] = useState<SayItFeedback | null>(null);
  const [error, setError] = useState<string>('');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number | null>(null);
  const recordedSecondsRef = useRef(0);

  useEffect(() => {
    return () => {
      stopStreams();
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const stopStreams = () => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    setAudioLevel(0);
  };

  const analyzeAudioBlob = async (blob: Blob, durationSec: number) => {
    if (!card) return;
    setIsAnalyzing(true);
    setError('');
    setFeedback(null);

    try {
      const base64 = await blobToBase64(blob);
      const mimeType = (blob.type || 'audio/webm').split(';')[0];

      const res = await fetch('/api/say-it', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioBase64: base64,
          mimeType,
          targetPitch: card.pitch,
          dreamRole: card.dreamRole,
          name: card.name,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Could not analyze recording.');
      }

      const transcript = String(data.transcript || '');
      setFeedback({
        transcript,
        tip: String(data.tip || ''),
        wordCount: countWords(transcript),
        estimatedSeconds: durationSec > 0 ? durationSec : estimateReadSeconds(transcript),
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to reach Gemini transcription service. Check your microphone and try again.'
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const startRecording = async () => {
    setError('');
    setFeedback(null);

    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Microphone recording is not supported in this browser. You can upload an audio clip below.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = pickSupportedAudioMimeType();
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];
      recordedSecondsRef.current = 0;
      setRecordSeconds(0);

      // Visual volume meter
      try {
        const AudioContextCtor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = new AudioContextCtor();
        audioCtxRef.current = ctx;
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const updateLevel = () => {
          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
          const avg = sum / dataArray.length;
          setAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));
          rafRef.current = requestAnimationFrame(updateLevel);
        };
        rafRef.current = requestAnimationFrame(updateLevel);
      } catch {
        // Ignore meter if AudioContext fails
      }

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const finalDuration = recordedSecondsRef.current;
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        stopStreams();
        setIsRecording(false);

        if (audioUrl) URL.revokeObjectURL(audioUrl);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);

        if (blob.size > 0) {
          void analyzeAudioBlob(blob, finalDuration);
        }
      };

      recorder.start(250);
      setIsRecording(true);
      timerRef.current = window.setInterval(() => {
        recordedSecondsRef.current += 1;
        setRecordSeconds(recordedSecondsRef.current);
      }, 1000);
    } catch {
      stopStreams();
      setError('Microphone permission was denied or no microphone was found. Allow mic access or upload an audio clip.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(URL.createObjectURL(file));
    void analyzeAudioBlob(file, 0);
  };

  if (!card) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center max-w-xl mx-auto">
        <h2 className="text-xl font-bold text-[#0F1A33] mb-2">Generate a Pitch Card First</h2>
        <p className="text-sm text-slate-600 mb-6">
          Create a student’s pitch card in the Create tab, then switch here to rehearse it aloud
          with the laptop microphone and get one targeted coaching tip.
        </p>
        <button
          type="button"
          onClick={onGoToCreate}
          className="inline-flex items-center justify-center rounded-xl bg-[#0F1A33] hover:bg-[#1B2C52] text-white text-sm font-semibold px-5 py-2.5 cursor-pointer"
        >
          Go to Create Card
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Teleprompter */}
      <section className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="bg-[#0F1A33] px-6 py-4 border-b-[3px] border-[#F06429] flex items-center justify-between gap-4">
          <div>
            <p className="text-xs text-slate-300">Teleprompter · {card.name}</p>
            <h2 className="text-base font-semibold text-white">Read aloud in ~30 seconds</h2>
          </div>
          <div className="text-right font-mono-nums">
            <span
              className={`text-lg font-bold ${
                recordSeconds > 35 ? 'text-[#F06429]' : 'text-white'
              }`}
            >
              {String(recordSeconds).padStart(2, '0')}s
            </span>
            <span className="text-xs text-slate-300"> / 30s target</span>
          </div>
        </div>

        <div className="p-6 space-y-5">
          <div className="bg-[#F8FAFC] border border-slate-200 rounded-xl p-6">
            <p className="text-lg leading-[1.75] text-slate-900">
              <PitchTextHighlight text={card.pitch} />
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
            <span>
              Speak your real project inside the highlighted <span className="text-[#9A3412] font-medium">[brackets]</span>.
            </span>
            <span className="font-mono-nums">
              {countWords(card.pitch)} words · ~{estimateReadSeconds(card.pitch)}s target
            </span>
          </div>
        </div>
      </section>

      {/* Recorder & Gemini Coaching */}
      <section className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 space-y-5">
        <div>
          <h3 className="text-base font-semibold text-[#0F1A33]">Voice Check & Coaching</h3>
          <p className="text-xs text-slate-500 mt-1">
            Record with the booth laptop mic. Gemini transcribes your delivery and gives one sharp tip.
          </p>
        </div>

        <div className="space-y-3">
          {!isRecording ? (
            <button
              type="button"
              onClick={startRecording}
              disabled={isAnalyzing}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#0F1A33] hover:bg-[#1B2C52] disabled:opacity-60 text-white font-semibold text-sm px-5 py-3.5 transition-colors cursor-pointer"
            >
              <Mic className="w-4 h-4 text-[#F06429]" aria-hidden="true" />
              <span>Start Recording Pitch</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={stopRecording}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm px-5 py-3.5 transition-colors cursor-pointer"
            >
              <Square className="w-4 h-4 fill-current" aria-hidden="true" />
              <span>Stop & Coach ({recordSeconds}s)</span>
            </button>
          )}

          {/* Audio level meter */}
          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden" aria-hidden="true">
            <div
              className="h-full bg-[#F06429] transition-[width] duration-75"
              style={{ width: `${isRecording ? Math.max(8, audioLevel) : 0}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
            <label className="inline-flex items-center gap-1.5 text-slate-600 hover:text-[#15233F] cursor-pointer underline underline-offset-4">
              <Upload className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Or upload audio file</span>
              <input
                type="file"
                accept="audio/*"
                onChange={handleFileUpload}
                className="sr-only"
              />
            </label>

            {feedback && (
              <button
                type="button"
                onClick={() => {
                  setFeedback(null);
                  setRecordSeconds(0);
                  setError('');
                }}
                className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" aria-hidden="true" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {audioUrl && (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-600 mb-2">
              <Volume2 className="w-3.5 h-3.5 text-[#15233F]" aria-hidden="true" />
              <span>Your Recording</span>
            </div>
            <audio src={audioUrl} controls className="w-full h-9" />
          </div>
        )}

        {isAnalyzing && (
          <div className="flex items-center gap-2.5 text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-lg p-4">
            <Loader2 className="w-4 h-4 animate-spin text-[#F28C38]" aria-hidden="true" />
            <span>Transcribing pitch & preparing one coaching tip...</span>
          </div>
        )}

        {error && (
          <div role="alert" className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-3.5">
            {error}
          </div>
        )}

        {feedback && (
          <div className="space-y-4 border-t border-slate-200 pt-4">
            <div>
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                <span className="font-semibold text-slate-700">Gemini Transcript</span>
                <span className="font-mono-nums">
                  {feedback.wordCount} words · {feedback.estimatedSeconds}s
                </span>
              </div>
              <p className="text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-lg p-3.5 leading-relaxed">
                “{feedback.transcript}”
              </p>
            </div>

            <div className="bg-[#15233F] text-white rounded-lg p-4 border-b-2 border-[#F28C38]">
              <p className="text-xs font-semibold text-[#F28C38] mb-1">
                One Improvement Tip
              </p>
              <p className="text-sm leading-relaxed text-slate-100">{feedback.tip}</p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
