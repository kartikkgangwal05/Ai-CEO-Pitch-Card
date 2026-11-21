import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { BackgroundArtwork } from './components/BackgroundArtwork';
import { BoothFlow, type BoothResult } from './components/BoothFlow';
import { HistoryTab } from './components/HistoryTab';
import { RevealStage } from './components/RevealStage';
import { SummoningOverlay } from './components/SummoningOverlay';
import { PitchCardPreview } from './components/PitchCardPreview';
import { PitchForm } from './components/PitchForm';
import { PrintSheetTab } from './components/PrintSheetTab';
import { SayItTab } from './components/SayItTab';
import { TcgPitchCard } from './components/TcgPitchCard';
import { TestPlanTab } from './components/TestPlanTab';
import type {
  AppTab,
  CartoonStyleId,
  PersonaId,
  PitchInput,
  PitchResult,
  Specialisation,
  StickerFontId,
  VisitorCard,
  VisitorType,
} from './types/pitch';
import {
  SAMPLE_INPUTS,
  buildFallbackPitch,
  buildSampleVisitors,
  pushVisitorToQueue,
  validatePitchInput,
} from './utils/pitch';
import { applyComicCartoonFilter } from './utils/cartoonize';
import { applyPhotoFilter } from './utils/photoFilters';
import { deleteCardFromHistory, listHistory, saveCardToHistory } from './utils/cardHistory';

const EMPTY_INPUT: PitchInput = {
  visitorType: 'PGDM Student',
  name: '',
  currentPosition: '',
  specialisation: 'Business Analytics',
  characterId: 'auto',
  capturedPhotoUrl: '',
  aiCharacterUrl: '',
  characterPrompt: '',
  cartoonStyle: 'bold-toon',
  personaId: 'none',
  stickerFont: 'cartoon',
  strength1: '',
  strength2: '',
  weakness: '',
  hobby: '',
  dreamRole: '',
  tagline: '',
  motivationalLine: '',
  tone: 'Confident',
};

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('booth');
  const [input, setInput] = useState<PitchInput>(EMPTY_INPUT);
  const [errors, setErrors] = useState<Partial<Record<keyof PitchInput, string>>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingCharacter, setIsGeneratingCharacter] = useState(false);
  const [characterError, setCharacterError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [currentCard, setCurrentCard] = useState<VisitorCard | null>(null);
  const [revealCard, setRevealCard] = useState<VisitorCard | null>(null);
  const [visitorQueue, setVisitorQueue] = useState<VisitorCard[]>([]);
  const [serialCounter, setSerialCounter] = useState(1);
  const [historyCards, setHistoryCards] = useState<VisitorCard[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [printCard, setPrintCard] = useState<VisitorCard | null>(null);

  const reloadHistory = useCallback(async () => {
    try {
      const cards = await listHistory();
      setHistoryCards(cards);
      // keep card numbers unique across reloads
      const maxSerial = cards.reduce((m, c) => Math.max(m, c.cardSerial || 0), 0);
      setSerialCounter((c) => Math.max(c, maxSerial + 1));
      setHistoryError(null);
    } catch (err) {
      setHistoryError(err instanceof Error ? err.message : 'Could not load card history.');
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    void reloadHistory();
  }, [reloadHistory]);

  const persistCard = useCallback((card: VisitorCard) => {
    setHistoryCards((prev) => {
      const rest = prev.filter((c) => c.id !== card.id);
      return [card, ...rest].sort((a, b) => b.createdAt - a.createdAt);
    });
    saveCardToHistory(card).catch((err) =>
      setHistoryError(err instanceof Error ? `Card not saved to history: ${err.message}` : 'Card not saved to history.')
    );
  }, []);

  // Keep saved cards in sync when the current card changes after it was made (new portrait, edits, font).
  useEffect(() => {
    if (!currentCard) return;
    const saved = historyCards.find((c) => c.id === currentCard.id);
    if (saved && saved !== currentCard) persistCard(currentCard);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCard]);

  // Print one specific card (e.g. from History): render it into the print sheet, then print.
  useEffect(() => {
    if (!printCard) return;
    const t = window.setTimeout(() => {
      window.print();
      setPrintCard(null);
    }, 150);
    return () => window.clearTimeout(t);
  }, [printCard]);

  const handleDeleteHistoryCard = (card: VisitorCard) => {
    if (!window.confirm(`Delete ${card.name}'s card and photo from history? This cannot be undone.`)) return;
    setHistoryCards((prev) => prev.filter((c) => c.id !== card.id));
    setVisitorQueue((prev) => prev.filter((c) => c.id !== card.id));
    if (currentCard?.id === card.id) setCurrentCard(null);
    deleteCardFromHistory(card.id).catch(() => void reloadHistory());
  };

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
    setInput((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'visitorType') {
        const nextType = value as VisitorType;
        if (nextType !== 'PGDM Student' && prev.specialisation !== 'Executive Leadership') {
          next.specialisation = 'Executive Leadership';
        } else if (nextType === 'PGDM Student' && prev.specialisation === 'Executive Leadership') {
          next.specialisation = 'Business Analytics' as Specialisation;
        }
      }
      return next;
    });
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
    if (field === 'capturedPhotoUrl' || field === 'characterPrompt' || field === 'cartoonStyle' || field === 'personaId') {
      setCharacterError(null);
    }
    if (field === 'cartoonStyle') {
      const nextStyle = value as CartoonStyleId;
      setCurrentCard((prev) => (prev ? { ...prev, cartoonStyle: nextStyle } : prev));
      if (input.capturedPhotoUrl) {
        void requestCartoonCharacter({
          imageDataUrl: input.capturedPhotoUrl,
          cartoonStyle: nextStyle,
          customPrompt: input.characterPrompt,
          isEdit: false,
        });
      }
    }
    if (field === 'personaId') {
      const nextPersona = value as PersonaId;
      setCurrentCard((prev) => (prev ? { ...prev, personaId: nextPersona } : prev));
      if (input.capturedPhotoUrl) {
        void requestCartoonCharacter({
          imageDataUrl: input.capturedPhotoUrl,
          cartoonStyle: input.cartoonStyle,
          personaId: nextPersona,
          customPrompt: input.characterPrompt,
          isEdit: false,
        });
      }
    }
    if (field === 'stickerFont') {
      const nextFont = value as StickerFontId;
      setCurrentCard((prev) => (prev ? { ...prev, stickerFont: nextFont } : prev));
      setVisitorQueue((prev) =>
        prev.map((item) =>
          currentCard && item.id === currentCard.id ? { ...item, stickerFont: nextFont } : item
        )
      );
    }
  };

  const requestCartoonCharacter = async (params: {
    imageDataUrl: string;
    cartoonStyle: CartoonStyleId;
    personaId?: PersonaId;
    customPrompt: string;
    isEdit?: boolean;
  }): Promise<string | null> => {
    setIsGeneratingCharacter(true);
    setCharacterError(null);

    try {
      const response = await fetch('/api/character', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageDataUrl: params.imageDataUrl,
          specialisation: input.specialisation,
          visitorType: input.visitorType,
          dreamRole: input.dreamRole,
          cartoonStyle: params.cartoonStyle,
          personaId: params.personaId ?? input.personaId,
          customPrompt: params.customPrompt,
          isEdit: Boolean(params.isEdit),
        }),
      });
      const payload = (await response.json()) as {
        imageUrl?: string | null;
        notice?: string;
        error?: string;
        fallbackMode?: string;
      };
      if (!response.ok) {
        throw new Error(payload.error || 'Could not convert photo into cartoon character.');
      }

      if (!payload.imageUrl) {
        if (params.imageDataUrl) {
          const photoFilterMode = payload.fallbackMode === 'photo-filter';
          const celCartoonUrl = photoFilterMode
            ? await applyPhotoFilter(params.imageDataUrl, params.cartoonStyle)
            : await applyComicCartoonFilter(params.imageDataUrl, params.cartoonStyle);
          setInput((prev) => ({ ...prev, aiCharacterUrl: celCartoonUrl }));
          setCurrentCard((prev) => (prev ? { ...prev, aiCharacterUrl: celCartoonUrl } : prev));
          setVisitorQueue((prev) =>
            prev.map((item) =>
              currentCard && item.id === currentCard.id
                ? { ...item, aiCharacterUrl: celCartoonUrl }
                : item
            )
          );
          setCharacterError(
            photoFilterMode ? null : payload.notice ||
              'Applied Studio Comic Cel-Shade cartoon filter automatically (add Gemini billing in Settings > Secrets for full AI character redraws).'
          );
          return celCartoonUrl;
        }
        throw new Error(
          'Cloud Gemini image generation requires billing in Settings > Secrets — or snap/upload a photo to instantly convert it into Cartoon or Ink Sketch!'
        );
      }

      const generatedUrl = payload.imageUrl;
      setInput((prev) => ({ ...prev, aiCharacterUrl: generatedUrl }));
      setCurrentCard((prev) => (prev ? { ...prev, aiCharacterUrl: generatedUrl } : prev));
      setVisitorQueue((prev) =>
        prev.map((item) =>
          currentCard && item.id === currentCard.id ? { ...item, aiCharacterUrl: generatedUrl } : item
        )
      );
      return generatedUrl;
    } catch (err) {
      if (params.imageDataUrl) {
        const celCartoonUrl = await applyComicCartoonFilter(
          params.imageDataUrl,
          params.cartoonStyle
        );
        setInput((prev) => ({ ...prev, aiCharacterUrl: celCartoonUrl }));
        setCurrentCard((prev) => (prev ? { ...prev, aiCharacterUrl: celCartoonUrl } : prev));
        setVisitorQueue((prev) =>
          prev.map((item) =>
            currentCard && item.id === currentCard.id
              ? { ...item, aiCharacterUrl: celCartoonUrl }
              : item
          )
        );
        setCharacterError(
          'Applied Studio Comic Cel-Shade cartoon filter automatically (add Gemini billing in Settings > Secrets for full AI character redraws).'
        );
        return celCartoonUrl;
      }
      setCharacterError(
        err instanceof Error
          ? err.message
          : 'Unable to cartoonify right now. Your captured photo remains ready to use.'
      );
      return null;
    } finally {
      setIsGeneratingCharacter(false);
    }
  };

  const handlePhotoCapturedAndCartoonify = (dataUrl: string) => {
    if (sessionStartMs === null) {
      setSessionStartMs(Date.now());
    }
    setInput((prev) => ({
      ...prev,
      capturedPhotoUrl: dataUrl,
      aiCharacterUrl: '',
    }));
    void requestCartoonCharacter({
      imageDataUrl: dataUrl,
      cartoonStyle: input.cartoonStyle,
      customPrompt: input.characterPrompt,
      isEdit: false,
    });
  };

  const handleGenerateAiCharacter = async (isEdit = false) => {
    const sourceImage =
      isEdit && input.aiCharacterUrl ? input.aiCharacterUrl : input.capturedPhotoUrl;
    if (sessionStartMs === null) {
      setSessionStartMs(Date.now());
    }
    await requestCartoonCharacter({
      imageDataUrl: sourceImage,
      cartoonStyle: input.cartoonStyle,
      customPrompt: input.characterPrompt,
      isEdit,
    });
  };

  const handleClearCharacterMedia = () => {
    setCharacterError(null);
    setInput((prev) => ({
      ...prev,
      capturedPhotoUrl: '',
      aiCharacterUrl: '',
      characterPrompt: '',
    }));
  };

  const commitCard = (
    result: PitchResult,
    generationMs: number,
    sourceInput: PitchInput,
    { save = true }: { save?: boolean } = {}
  ) => {
    const nextSerial = serialCounter;
    setSerialCounter((c) => c + 1);
    const newCard: VisitorCard = {
      visitorType: sourceInput.visitorType,
      name: sourceInput.name,
      currentPosition: sourceInput.currentPosition,
      specialisation: sourceInput.specialisation,
      capturedPhotoUrl: sourceInput.capturedPhotoUrl,
      aiCharacterUrl: sourceInput.aiCharacterUrl,
      characterPrompt: sourceInput.characterPrompt,
      cartoonStyle: sourceInput.cartoonStyle,
      personaId: sourceInput.personaId,
      design: sourceInput.design,
      stickerFont: sourceInput.stickerFont,
      dreamRole: sourceInput.dreamRole,
      tone: sourceInput.tone,
      ...result,
      id: `visitor-${Date.now()}-${nextSerial}`,
      createdAt: Date.now(),
      generationMs,
      cardSerial: nextSerial,
    };
    setCurrentCard(newCard);
    setVisitorQueue((prev) => pushVisitorToQueue(prev, newCard, 4));
    setRevealCard(newCard);
    if (save) persistCard(newCard);
  };

  /** `portraitPromise` (optional) replaces the cartoon request, e.g. the Gemini stream portrait. */
  const generateWithAi = async (sourceInput: PitchInput, portraitPromise?: Promise<string | null>) => {
    const startMs = sessionStartMs ?? Date.now();
    const requestStart = Date.now();
    const salt = serialCounter;
    setIsGenerating(true);
    setNotice(null);

    let effectiveInput = sourceInput;

    const cartoonPromise = portraitPromise ?? (
      sourceInput.capturedPhotoUrl && !sourceInput.aiCharacterUrl
        ? requestCartoonCharacter({
            imageDataUrl: sourceInput.capturedPhotoUrl,
            cartoonStyle: sourceInput.cartoonStyle,
            personaId: sourceInput.personaId,
            customPrompt: sourceInput.characterPrompt,
            isEdit: false,
          })
        : Promise.resolve(sourceInput.aiCharacterUrl || null));

    try {
      const { capturedPhotoUrl: _img, aiCharacterUrl: _aiImg, ...pitchPayload } = sourceInput;
      const [pitchRes, generatedCartoon] = await Promise.all([
        fetch('/api/pitch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(pitchPayload),
        }),
        cartoonPromise,
      ]);

      if (generatedCartoon) {
        effectiveInput = { ...effectiveInput, aiCharacterUrl: generatedCartoon };
      }

      const payload = await pitchRes.json();

      if (!pitchRes.ok) {
        throw new Error(payload.error || 'AI API returned an error.');
      }

      const totalMs = Date.now() - startMs;
      setElapsedSeconds(Math.round((Date.now() - startMs) / 1000));
      commitCard(payload as PitchResult, Date.now() - requestStart || totalMs, effectiveInput);
    } catch {
      const generatedCartoon = await cartoonPromise.catch(() => null);
      if (generatedCartoon) {
        effectiveInput = { ...effectiveInput, aiCharacterUrl: generatedCartoon };
      }
      const fallback = buildFallbackPitch(effectiveInput, salt);
      setNotice(
        'AI text is unavailable right now, so this card uses built-in jokes. Check your API key, then tap Retry AI.'
      );
      setElapsedSeconds(Math.round((Date.now() - startMs) / 1000));
      commitCard(fallback, Date.now() - requestStart, effectiveInput);
    } finally {
      setIsGenerating(false);
    }
  };

  /** Booth: name + photo + style (+ optional class) in, everything else invented by the AI. */
  const handleBoothComplete = (result: BoothResult) => {
    const boothInput: PitchInput = {
      ...EMPTY_INPUT,
      name: result.name,
      capturedPhotoUrl: result.photoDataUrl,
      // Filtered photo is already made in the booth, so no image API call is needed.
      aiCharacterUrl: result.portraitUrl,
      cartoonStyle: result.cartoonStyle,
      personaId: result.personaId,
      specialisation: result.stream,
      design: 'arcane',
      strength1: result.strength,
      weakness: result.weakness,
      hobby: result.hobby,
    };
    setInput(boothInput);
    setCharacterError(null);
    setSessionStartMs(Date.now());
    void generateWithAi(
      boothInput,
      result.aiPortrait.then((r) => {
        if (r.error) setCharacterError(`AI portrait unavailable (${r.error}). Used the in-browser portrait instead.`);
        return r.image;
      })
    );
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
    setNotice('Strengths & weakness upgraded into executive terms using the instant template.');
    commitCard(fallback, Math.max(100, Date.now() - startMs), input);
  };

  const handleFillSample = () => {
    const nextIdx = visitorQueue.length % SAMPLE_INPUTS.length;
    const sample = SAMPLE_INPUTS[nextIdx];
    setInput((prev) => ({
      ...sample,
      capturedPhotoUrl: prev.capturedPhotoUrl || sample.capturedPhotoUrl,
      aiCharacterUrl: prev.aiCharacterUrl || sample.aiCharacterUrl,
      characterPrompt: prev.characterPrompt || sample.characterPrompt,
      cartoonStyle: prev.capturedPhotoUrl ? prev.cartoonStyle : sample.cartoonStyle,
      stickerFont: prev.stickerFont !== 'cartoon' ? prev.stickerFont : sample.stickerFont,
    }));
    setErrors({});
    if (sessionStartMs === null) {
      setSessionStartMs(Date.now());
    }
  };

  const handleLoadSampleCard = () => {
    const sample = SAMPLE_INPUTS[0];
    setInput(sample);
    setErrors({});
    setCharacterError(null);
    const fallback = buildFallbackPitch(sample, serialCounter);
    setNotice('Sample 2.5 × 3.5 in (63.5 × 88.9 mm) collector card loaded. Click "Make my pitch" for live AI.');
    commitCard(fallback, 400, sample, { save: false });
  };

  const handleNewVisitor = () => {
    setInput(EMPTY_INPUT);
    setErrors({});
    setCharacterError(null);
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

  const handleUpdateCard = (updated: VisitorCard) => {
    setCurrentCard(updated);
    setVisitorQueue((prev) => {
      const exists = prev.some((item) => item.id === updated.id);
      if (!exists) return pushVisitorToQueue(prev, updated, 4);
      return prev.map((item) => (item.id === updated.id ? updated : item));
    });
    setInput((prev) => ({
      ...prev,
      visitorType: updated.visitorType,
      name: updated.name,
      currentPosition: updated.currentPosition,
      specialisation: updated.specialisation,
      dreamRole: updated.dreamRole,
      stickerFont: updated.stickerFont,
      cartoonStyle: updated.cartoonStyle,
      strength1: updated.strength1,
      strength2: updated.strength2,
      weakness: updated.weakness,
      hobby: updated.hobby,
      tagline: updated.tagline,
      motivationalLine: updated.motivationalLine,
    }));
  };

  return (
    <div className="relative min-h-screen flex flex-col bg-[#030712] text-white overflow-x-hidden">
      {/* Subtle Neon-Blue Cartoon & Geometric Background Texture */}
      <BackgroundArtwork />

      {/* Strict 3-Zone Neon-Blue Top Bar */}
      <header className="no-print bg-[#050B18]/90 backdrop-blur-md border-b border-sky-400/25 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Single-line Brand Wordmark */}
          <button
            type="button"
            onClick={() => setActiveTab('create')}
            className="font-display text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0 cursor-pointer"
          >
            Power Card Studio
          </button>

          {/* Zone 2: Single-line Nav Links (Desktop) */}
          <nav aria-label="Primary sections" className="hidden md:flex items-center gap-5">
            {(
              [
                { id: 'booth', label: 'Booth Mode' },
                { id: 'create', label: 'Create Card' },
                { id: 'say-it', label: 'Say It' },
                { id: 'print', label: 'Print Card (2.5×3.5")' },
                { id: 'history', label: `History (${historyCards.length})` },
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
                      ? 'border-[#00D4FF] text-white font-semibold'
                      : 'border-transparent text-sky-200/75 hover:text-white'
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
              className="rounded-xl bg-[#00D4FF] hover:bg-sky-300 text-[#030712] text-xs sm:text-sm font-bold px-4 py-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              New Visitor
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-5 sm:py-8">
        {/* Mobile Navigation Strip */}
        <nav
          aria-label="Mobile sections"
          className="no-print md:hidden grid grid-cols-6 gap-1 bg-[#081226] border border-sky-400/30 rounded-xl p-1 mb-5"
        >
          {(
            [
              { id: 'booth', label: 'Booth' },
              { id: 'create', label: 'Create' },
              { id: 'say-it', label: 'Say It' },
              { id: 'print', label: 'Print' },
              { id: 'history', label: 'History' },
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
                    ? 'bg-[#00D4FF] text-[#030712]'
                    : 'text-sky-100 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Institutional Hero / Context Bar */}
        <div className="no-print mb-6 flex flex-wrap items-baseline justify-between gap-3 border-b border-sky-400/20 pb-4">
          <div>
            <p className="text-xs font-mono-nums font-semibold text-[#00D4FF] tracking-wide">
              #DYPAICoE Launch · Dr. D. Y. Patil B-School, Pune · PGDM 2026–28 & VIP Leaders
            </p>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-0.5 text-shimmer">
              Funny Power Card Studio
            </h1>
          </div>

          {visitorQueue.length > 0 && activeTab === 'create' && (
            <div className="flex flex-wrap items-center gap-2 text-xs text-sky-200">
              <span>Recent cards:</span>
              {visitorQueue.map((item) => {
                const isSelected = currentCard?.id === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setCurrentCard(item)}
                    className={`px-2.5 py-1 rounded-lg border text-xs font-semibold cursor-pointer whitespace-nowrap ${
                      isSelected
                        ? 'bg-[#00D4FF] text-[#030712] border-[#00D4FF]'
                        : 'border-sky-400/30 bg-[#081226] text-white hover:border-sky-300'
                    }`}
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
            <motion.div
              className="lg:col-span-5"
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 90, damping: 18 }}
            >
              <PitchForm
                input={input}
                errors={errors}
                isGenerating={isGenerating}
                isGeneratingCharacter={isGeneratingCharacter}
                characterError={characterError}
                elapsedSeconds={elapsedSeconds}
                onChange={handleFieldChange}
                onPhotoCapturedAndCartoonify={handlePhotoCapturedAndCartoonify}
                onGenerateAiCharacter={(isEdit) => void handleGenerateAiCharacter(isEdit)}
                onClearCharacterMedia={handleClearCharacterMedia}
                onSubmit={handleSubmit}
                onFillSample={handleFillSample}
                onUseTemplate={handleUseInstantTemplate}
                onReset={handleNewVisitor}
              />
            </motion.div>

            <motion.div
              className="lg:col-span-7"
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 90, damping: 18, delay: 0.12 }}
            >
              <PitchCardPreview
                card={currentCard}
                selectedSpecialisation={input.specialisation}
                selectedCharacterId={input.characterId}
                capturedPhotoUrl={input.capturedPhotoUrl}
                aiCharacterUrl={input.aiCharacterUrl}
                isGeneratingCharacter={isGeneratingCharacter}
                notice={notice}
                queueCount={visitorQueue.length}
                onRetryAi={currentCard ? () => void generateWithAi(input) : undefined}
                onQuickPrint={() => window.print()}
                onShowcase={() => currentCard && setRevealCard(currentCard)}
                onOpenSayIt={() => setActiveTab('say-it')}
                onOpenPrint={() => setActiveTab('print')}
                onLoadSampleCard={handleLoadSampleCard}
              />
            </motion.div>
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
            onUpdateCard={handleUpdateCard}
            onLoadSampleCohort={handleLoadSampleCohort}
            onGoToCreate={() => setActiveTab('create')}
          />
        )}

        {activeTab === 'history' && (
          <HistoryTab
            cards={historyCards}
            loading={historyLoading}
            error={historyError}
            onShow={(card) => {
              setCurrentCard(card);
              setRevealCard(card);
            }}
            onPrint={(card) => {
              setCurrentCard(card);
              setPrintCard(card);
            }}
            onDelete={handleDeleteHistoryCard}
            onImported={() => void reloadHistory()}
          />
        )}

        {activeTab === 'test-plan' && (
          <div className="no-print">
            <TestPlanTab currentCard={currentCard} historyCount={visitorQueue.length} />
          </div>
        )}

        {/* Global print sheet: one front card per page at exact 2.5 x 3.5 in (63.5 x 88.9 mm) */}
        {(printCard ?? currentCard ?? visitorQueue[0]) && (
          <div className="hidden print-only-pokemon-pair">
            <TcgPitchCard card={(printCard ?? currentCard ?? visitorQueue[0])!} mode="print" />
          </div>
        )}
      </main>

      {activeTab === 'booth' && (
        <BoothFlow
          onComplete={handleBoothComplete}
          onOpenStudio={() => setActiveTab('create')}
          paused={isGenerating || revealCard !== null}
        />
      )}

      <AnimatePresence>{isGenerating && <SummoningOverlay key="summon" photoUrl={input.capturedPhotoUrl} stream={input.design === 'arcane' ? input.specialisation : undefined} />}</AnimatePresence>
      <AnimatePresence>
        {revealCard && (
          <RevealStage
            key={revealCard.id}
            card={revealCard}
            warning={revealCard.aiCharacterUrl && characterError ? characterError : null}
            onClose={() => setRevealCard(null)}
            onPrint={() => window.print()}
            onNext={() => {
              if (activeTab === 'history') {
                setRevealCard(null);
                return;
              }
              const wasBooth = activeTab === 'booth';
              setRevealCard(null);
              handleNewVisitor();
              if (wasBooth) setActiveTab('booth');
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
