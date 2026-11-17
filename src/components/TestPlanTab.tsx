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
      criterion: '1. Card ready in under 90 seconds',
      target: '< 90s visitor intake + generation',
      steps:
        'Start from a clean visitor form, enter 5 fields, click "Make my pitch" (or "Use instant template" backup), and verify the themed card, key strength, motivational line, and QR render.',
      autoStatus: latestSeconds
        ? `Latest generation: ${latestSeconds}s`
        : 'No card generated in this session yet',
    },
    {
      id: 'qr',
      criterion: '2. QR shows full text on Android and iPhone',
      target: 'Plain text only (Pitch + Headline), zero URLs',
      steps:
        'Point an iPhone Camera and Android Google Lens at the QR code on screen or on the printed A6 card. Verify full pitch + LinkedIn headline appear directly as plain text.',
      autoStatus: currentCard
        ? `QR payload: ${qrPayload.length} chars · ${qrHasUrl ? 'Contains URL (fix!)' : 'Verified plain text (no URL)'}`
        : 'Generate a card to inspect live QR payload',
    },
    {
      id: 'readTime',
      criterion: '3. Pitch reads aloud in ~30 seconds',
      target: '68–80 executive words (~28–32s at 150 wpm)',
      steps:
        'Open the "Say It" tab, read the teleprompter aloud using the 30-second timer, and verify Gemini transcribes the recording and returns one coaching tip.',
      autoStatus: currentCard
        ? `Active pitch: ${wordCount} words (~${spokenSeconds}s spoken)`
        : 'Generate a card to check word count',
    },
    {
      id: 'printCut',
      criterion: '4. Single A6 card prints cleanly (105 × 148 mm)',
      target: '1 × A6 (105 × 148 mm) unique themed card per visitor',
      steps:
        'Open "Print Card (A6)", choose any visitor pass (each has a unique motivational line & specialisation theme), and print at 100% scale on A6 paper or cut cleanly.',
      autoStatus: `Session passes available: ${historyCount}`,
    },
  ];

  const passedCount = Object.values(statuses).filter((s) => s === 'passed').length;

  return (
    <section className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#F06429] mb-1">
            <ClipboardCheck className="w-4 h-4" aria-hidden="true" />
            <span>#DYPAICoE Launch Verification</span>
          </div>
          <h2 className="text-xl font-bold text-[#0F1A33]">Booth Acceptance Test Plan</h2>
          <p className="text-sm text-slate-600 mt-1">
            Run these 4 checks before opening the Dr. D. Y. Patil B-School booth to students.
          </p>
        </div>

        <div className="bg-[#0F1A33] text-white rounded-xl px-4 py-3 text-right font-mono-nums">
          <p className="text-[11px] text-slate-300">Launch Readiness</p>
          <p className="text-lg font-bold text-[#F06429]">{passedCount} / 4 Passed</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((item) => {
          const status = statuses[item.id] ?? 'pending';
          return (
            <article
              key={item.id}
              className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between gap-4"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-base font-bold text-[#0F1A33]">{item.criterion}</h3>
                  {status === 'passed' && (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" aria-label="Passed" />
                  )}
                  {status === 'failed' && (
                    <XCircle className="w-5 h-5 text-red-600 shrink-0" aria-label="Needs fix" />
                  )}
                  {status === 'pending' && (
                    <Circle className="w-5 h-5 text-slate-300 shrink-0" aria-label="Pending" />
                  )}
                </div>

                <p className="text-xs font-semibold text-slate-500">Target: {item.target}</p>
                <p className="text-sm text-slate-700 leading-relaxed">{item.steps}</p>
                <p className="text-xs font-mono-nums text-[#0F1A33] bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                  {item.autoStatus}
                </p>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStatuses((prev) => ({ ...prev, [item.id]: 'passed' }))}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                    status === 'passed'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700'
                  }`}
                >
                  Mark Pass
                </button>
                <button
                  type="button"
                  onClick={() => setStatuses((prev) => ({ ...prev, [item.id]: 'failed' }))}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                    status === 'failed'
                      ? 'bg-red-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-red-50 hover:text-red-700'
                  }`}
                >
                  Mark Fail
                </button>
                <button
                  type="button"
                  onClick={() => setStatuses((prev) => ({ ...prev, [item.id]: 'pending' }))}
                  className="ml-auto text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
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
