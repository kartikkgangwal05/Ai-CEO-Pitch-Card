import { useState } from 'react';
import { CheckCircle2, Circle, ClipboardCheck, XCircle } from 'lucide-react';
import type { VisitorCard } from '../types/pitch';
import { countWords, estimateReadSeconds, formatQrPlainText } from '../utils/pitch';

interface TestPlanTabProps {
  currentCard: VisitorCard | null;
  historyCount: number;
}

type CheckStatus = 'pending' | 'passed' | 'failed';

interface LaunchTestItem {
  id: string;
  criterion: string;
  target: string;
  steps: string;
  autoStatus: string;
}

export function TestPlanTab({ currentCard, historyCount }: TestPlanTabProps) {
  const [statuses, setStatuses] = useState<Record<string, CheckStatus>>({
    speed: 'pending',
    qr: 'pending',
    readTime: 'pending',
    printCut: 'pending',
  });

  const latestSeconds =
    currentCard?.generationMs !== undefined ? (currentCard.generationMs / 1000).toFixed(1) : null;
  const wordCount = currentCard ? countWords(currentCard.pitch) : 0;
  const spokenSeconds = currentCard ? estimateReadSeconds(currentCard.pitch) : 0;
  const qrPayload = currentCard ? formatQrPlainText(currentCard) : '';
  const qrHasUrl = /https?:\/\//i.test(qrPayload);

  const items: LaunchTestItem[] = [
    {
      id: 'speed',
      criterion: '1. Card ready in under 90s (Camera AI + Optional Strength 2)',
      target: '< 90s intake + camera-to-AI character generation + background AI phrasing',
      steps:
        'Test capturing/uploading a photo, generating an AI character, leaving Strength 2 blank (verify Strength 02 is omitted on the card), and testing both PGDM Students and Owners/Directors.',
      autoStatus: latestSeconds
        ? `Latest generation: ${latestSeconds}s`
        : 'No card generated in this session yet',
    },
    {
      id: 'qr',
      criterion: '2. QR shows full text on Android and iPhone',
      target: 'Plain text only (Pitch + Headline + Refined Strength(s) + Motivational), zero URLs',
      steps:
        'Point an iPhone Camera and Android Google Lens at the QR code on screen or on the printed 2.5 × 3.5 in collector card. Verify the full plain text appears directly on-device.',
      autoStatus: currentCard
        ? `QR payload: ${qrPayload.length} chars · ${qrHasUrl ? 'Contains URL (fix!)' : 'Verified plain text (no URL)'}`
        : 'Generate a card to inspect live QR payload',
    },
    {
      id: 'readTime',
      criterion: '3. Pitch reads aloud in ~30 seconds',
      target: '66–82 executive words (~28–32s at 150 wpm)',
      steps:
        'Open the "Say It" tab, read the teleprompter aloud using the 30-second timer, and verify Gemini transcribes the recording and returns one coaching tip.',
      autoStatus: currentCard
        ? `Active pitch: ${wordCount} words (~${spokenSeconds}s spoken)`
        : 'Generate a card to check word count',
    },
    {
      id: 'printCut',
      criterion: '4. Collector card prints cleanly at 2.5 × 3.5 in (63.5 × 88.9 mm)',
      target: 'Exact 63.5 × 88.9 mm Front (Pitch + AI Character + Motivational) + Back (Name Sticker)',
      steps:
        'Open "Print Card (2.5×3.5")", confirm Front and Name Sticker Back sit side-by-side inside dashed trim guides, print at 100% scale, and cut or fold back-to-back.',
      autoStatus: `Session cards available: ${historyCount}`,
    },
  ];

  const passedCount = Object.values(statuses).filter((s) => s === 'passed').length;

  return (
    <section className="space-y-6">
      <div className="bg-[#081226]/95 border border-sky-400/30 rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#00D4FF] mb-1">
            <ClipboardCheck className="w-4 h-4" aria-hidden="true" />
            <span>#DYPBSAICoE Launch Verification · Students, Owners & Directors</span>
          </div>
          <h2 className="text-xl font-bold text-white">Booth Acceptance Test Plan</h2>
          <p className="text-sm text-sky-100/85 mt-1">
            Run these 4 checks before opening the Dr. D. Y. Patil B-School booth to visitors.
          </p>
        </div>

        <div className="bg-[#040A17] border border-sky-400/30 text-white rounded-xl px-4 py-3 text-right font-mono-nums">
          <p className="text-[11px] text-sky-200/80">Launch Readiness</p>
          <p className="text-lg font-bold text-[#00D4FF]">{passedCount} / 4 Passed</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((item) => {
          const status = statuses[item.id] ?? 'pending';
          return (
            <article
              key={item.id}
              className="bg-[#081226]/95 border border-sky-400/30 rounded-2xl p-5 flex flex-col justify-between gap-4"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-base font-bold text-white">{item.criterion}</h3>
                  {status === 'passed' && (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" aria-label="Passed" />
                  )}
                  {status === 'failed' && (
                    <XCircle className="w-5 h-5 text-rose-400 shrink-0" aria-label="Needs fix" />
                  )}
                  {status === 'pending' && (
                    <Circle className="w-5 h-5 text-sky-400/40 shrink-0" aria-label="Pending" />
                  )}
                </div>

                <p className="text-xs font-semibold text-sky-300">Target: {item.target}</p>
                <p className="text-sm text-white/90 leading-relaxed">{item.steps}</p>
                <p className="text-xs font-mono-nums text-sky-100 bg-[#040A17] border border-sky-400/25 rounded-lg px-3 py-2">
                  {item.autoStatus}
                </p>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-sky-400/20">
                <button
                  type="button"
                  onClick={() => setStatuses((prev) => ({ ...prev, [item.id]: 'passed' }))}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                    status === 'passed'
                      ? 'bg-[#00D4FF] text-[#030712]'
                      : 'bg-[#040A17] border border-sky-400/30 text-white hover:border-sky-300'
                  }`}
                >
                  Mark Pass
                </button>
                <button
                  type="button"
                  onClick={() => setStatuses((prev) => ({ ...prev, [item.id]: 'failed' }))}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                    status === 'failed'
                      ? 'bg-rose-500 text-white'
                      : 'bg-[#040A17] border border-sky-400/30 text-white hover:border-rose-400'
                  }`}
                >
                  Mark Fail
                </button>
                <button
                  type="button"
                  onClick={() => setStatuses((prev) => ({ ...prev, [item.id]: 'pending' }))}
                  className="ml-auto text-xs text-sky-200 hover:text-white cursor-pointer"
                >
                  Reset
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
