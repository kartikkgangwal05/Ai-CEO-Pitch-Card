import { useEffect, useState, type FormEvent } from 'react';
import { PitchCardPreview } from './components/PitchCardPreview';
import { PitchForm } from './components/PitchForm';
import { PrintSheetTab } from './components/PrintSheetTab';
import { SayItTab } from './components/SayItTab';
import { TestPlanTab } from './components/TestPlanTab';
import type { AppTab, PitchInput, PitchResult, VisitorCard } from './types/pitch';
import {
  SAMPLE_INPUTS,
  SPECIALISATION_THEMES,
  buildFallbackPitch,
  buildSampleVisitors,
  pushVisitorToQueue,
  validatePitchInput,
} from './utils/pitch';

const EMPTY_INPUT: PitchInput = {
  name: '',
  specialisation: 'Marketing',
  strength: '',
  dreamRole: '',
  tone: 'Confident',
};

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('create');
  const [input, setInput] = useState<PitchInput>(EMPTY_INPUT);
  const [errors, setErrors] = useState<Partial<Record<keyof PitchInput, string>>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [currentCard, setCurrentCard] = useState<VisitorCard | null>(null);
  const [visitorQueue, setVisitorQueue] = useState<VisitorCard[]>([]);
  const [serialCounter, setSerialCounter] = useState(1);

  // 90-second booth intake stopwatch
  const [sessionStartMs, setSessionStartMs] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (sessionStartMs === null || currentCard) return;
    const interval = window.setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - sessionStartMs) / 1000));
    }, 500);
    return () => window.clearInterval(interval);
  }, [sessionStartMs, currentCard]);

  const handleFieldChange = <K extends keyof PitchInput>(field: K, value: PitchInput[K]) => {
    if (sessionStartMs === null) {
      setSessionStartMs(Date.now());
    }
    setInput((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const commitCard = (result: PitchResult, generationMs: number, sourceInput: PitchInput) => {
    const nextSerial = serialCounter;
    setSerialCounter((c) => c + 1);
    const newCard: VisitorCard = {
      ...sourceInput,
      ...result,
      id: `visitor-${Date.now()}-${nextSerial}`,
      createdAt: Date.now(),
      generationMs,
      cardSerial: nextSerial,
    };
    setCurrentCard(newCard);
    setVisitorQueue((prev) => pushVisitorToQueue(prev, newCard, 4));
  };

  const generateWithAi = async (sourceInput: PitchInput) => {
    const startMs = sessionStartMs ?? Date.now();
    const requestStart = Date.now();
    const salt = serialCounter;
    setIsGenerating(true);
    setNotice(null);

    try {
      const response = await fetch('/api/pitch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sourceInput),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || 'Gemini API returned an error.');
      }

      const totalMs = Date.now() - startMs;
      setElapsedSeconds(Math.round((Date.now() - startMs) / 1000));
      commitCard(payload as PitchResult, Date.now() - requestStart || totalMs, sourceInput);
    } catch {
      const fallback = buildFallbackPitch(sourceInput, salt);
      setNotice(
        'Live Gemini API unavailable right now — generated using the built-in executive backup template.'
      );
      setElapsedSeconds(Math.round((Date.now() - startMs) / 1000));
      commitCard(fallback, Date.now() - requestStart, sourceInput);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const validation = validatePitchInput(input);
    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      return;
    }
    setErrors({});
    void generateWithAi(input);
  };

  const handleUseInstantTemplate = () => {
    const validation = validatePitchInput(input);
    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      return;
    }
    setErrors({});
    const startMs = Date.now();
    const fallback = buildFallbackPitch(input, serialCounter);
    setNotice('Generated immediately with the built-in executive backup template.');
    commitCard(fallback, Math.max(100, Date.now() - startMs), input);
  };

  const handleFillSample = () => {
    const nextIdx = visitorQueue.length % SAMPLE_INPUTS.length;
    setInput(SAMPLE_INPUTS[nextIdx]);
    setErrors({});
    if (sessionStartMs === null) {
      setSessionStartMs(Date.now());
    }
  };

  const handleLoadSampleCard = () => {
    const sample = SAMPLE_INPUTS[0];
    setInput(sample);
    setErrors({});
    const fallback = buildFallbackPitch(sample, serialCounter);
    setNotice('Sample pass loaded (built-in executive template). Click "Make my pitch" for live AI.');
    commitCard(fallback, 400, sample);
  };

  const handleNewVisitor = () => {
    setInput(EMPTY_INPUT);
    setErrors({});
    setCurrentCard(null);
    setNotice(null);
    setSessionStartMs(null);
    setElapsedSeconds(0);
    setActiveTab('create');
  };

  const handleLoadSampleCohort = () => {
    const samples = buildSampleVisitors();
    setVisitorQueue(samples);
    setCurrentCard(samples[0]);
  };

  return (
    <div className="min-h-screen flex flex-col text-[#0F172A]">
      {/* Strict 3-Zone Top Bar */}
      <header className="no-print bg-[#0F1A33] border-b border-slate-800 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Single-line Brand Wordmark */}
          <button
            type="button"
            onClick={() => setActiveTab('create')}
            className="font-display text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0 cursor-pointer"
          >
            My Pitch Card
          </button>

          {/* Zone 2: Single-line Nav Links (Desktop) */}
          <nav aria-label="Primary sections" className="hidden md:flex items-center gap-5">
            {(
              [
                { id: 'create', label: 'Create Card' },
                { id: 'say-it', label: 'Say It' },
                { id: 'print', label: 'Print Card (A6)' },
                { id: 'test-plan', label: 'Test Plan' },
              ] as const
            ).map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  aria-current={active ? 'page' : undefined}
                  className={`px-2.5 py-1.5 text-sm font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer border-b-2 ${
                    active
                      ? 'border-[#F06429] text-white font-semibold'
                      : 'border-transparent text-slate-300 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: 1 Primary Action */}
          <div className="shrink-0">
            <button
              type="button"
              onClick={handleNewVisitor}
              className="rounded-xl bg-[#F06429] hover:bg-[#DC551C] text-white text-xs sm:text-sm font-semibold px-4 py-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              New Visitor
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-5 sm:py-8">
        {/* Mobile Navigation Strip */}
        <nav
          aria-label="Mobile sections"
          className="no-print md:hidden grid grid-cols-4 gap-1 bg-white border border-slate-200 rounded-xl p-1 mb-5"
        >
          {(
            [
              { id: 'create', label: 'Create' },
              { id: 'say-it', label: 'Say It' },
              { id: 'print', label: 'Print A6' },
              { id: 'test-plan', label: 'Tests' },
            ] as const
          ).map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                aria-current={active ? 'page' : undefined}
                className={`py-2 px-1 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#0F1A33] text-white'
                    : 'text-slate-600 hover:text-[#0F1A33]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Institutional Hero / Context Bar */}
        <div className="no-print mb-6 flex flex-wrap items-baseline justify-between gap-3 border-b border-slate-300/70 pb-4">
          <div>
            <p className="text-xs font-mono-nums font-semibold text-[#F06429] tracking-wide">
              #DYPAICoE Launch Studio · Dr. D. Y. Patil B-School, Pune
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#0F1A33] tracking-tight mt-0.5">
              90-Second PGDM Executive Pitch Studio
            </h1>
          </div>

          {visitorQueue.length > 0 && activeTab === 'create' && (
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <span>Recent passes:</span>
              {visitorQueue.map((item) => {
                const t = SPECIALISATION_THEMES[item.specialisation];
                const isSelected = currentCard?.id === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setCurrentCard(item)}
                    className={`px-2.5 py-1 rounded-lg border text-xs font-semibold cursor-pointer whitespace-nowrap ${
                      isSelected
                        ? 'text-white'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                    style={
                      isSelected
                        ? { backgroundColor: t.headerBg, borderColor: t.accent }
                        : undefined
                    }
                  >
                    {item.name.split(' ')[0]}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {activeTab === 'create' && (
          <div className="no-print grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-5">
              <PitchForm
                input={input}
                errors={errors}
                isGenerating={isGenerating}
                elapsedSeconds={elapsedSeconds}
                onChange={handleFieldChange}
                onSubmit={handleSubmit}
                onFillSample={handleFillSample}
                onUseTemplate={handleUseInstantTemplate}
                onReset={handleNewVisitor}
              />
            </div>

            <div className="lg:col-span-7">
              <PitchCardPreview
                card={currentCard}
                notice={notice}
                queueCount={visitorQueue.length}
                onRetryAi={currentCard ? () => void generateWithAi(input) : undefined}
                onOpenSayIt={() => setActiveTab('say-it')}
                onOpenPrint={() => setActiveTab('print')}
                onLoadSampleCard={handleLoadSampleCard}
              />
            </div>
          </div>
        )}

        {activeTab === 'say-it' && (
          <div className="no-print">
            <SayItTab card={currentCard} onGoToCreate={() => setActiveTab('create')} />
          </div>
        )}

        {activeTab === 'print' && (
          <PrintSheetTab
            currentCard={currentCard}
            history={visitorQueue}
            onSelectCard={(card) => setCurrentCard(card)}
            onLoadSampleCohort={handleLoadSampleCohort}
            onGoToCreate={() => setActiveTab('create')}
          />
        )}

        {activeTab === 'test-plan' && (
          <div className="no-print">
            <TestPlanTab currentCard={currentCard} historyCount={visitorQueue.length} />
          </div>
        )}
      </main>
    </div>
  );
}
