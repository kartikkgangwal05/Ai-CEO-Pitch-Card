export type VisitorType = 'PGDM Student' | 'Company Owner / Founder' | 'Director / CXO';

export type Specialisation =
  | 'Marketing'
  | 'Finance'
  | 'Business Analytics'
  | 'HR'
  | 'Executive Leadership';

export type Tone = 'Confident' | 'Friendly' | 'Formal';

export type CharacterId =
  | 'auto'
  | 'gadget-cat'
  | 'mischief-maverick'
  | 'harmony-ace'
  | 'strategy-prodigy'
  | 'visionary-captain'
  | 'data-wizard';

export type CartoonStyleId =
  | 'anime-hero'
  | 'vinyl-toy'
  | 'comic-pop'
  | 'cyber-chibi'
  | 'pencil-sketch';

export type StickerFontId = 'cartoon' | 'vinyl' | 'arcade' | 'futurist';

export type ResolvedCharacterId = Exclude<CharacterId, 'auto'>;

export interface PitchInput {
  visitorType: VisitorType;
  name: string;
  currentPosition: string;
  specialisation: Specialisation;
  characterId: CharacterId;
  capturedPhotoUrl: string;
  aiCharacterUrl: string;
  characterPrompt: string;
  cartoonStyle: CartoonStyleId;
  stickerFont: StickerFontId;
  strength1: string;
  strength2: string;
  weakness: string;
  dreamRole: string;
  tagline: string;
  motivationalLine: string;
  tone: Tone;
}

export interface PitchResult {
  pitch: string;
  linkedin_headline: string;
  keywords: string[];
  strength1: string;
  strength2: string;
  weakness: string;
  tagline: string;
  motivationalLine: string;
  resolvedCharacterId: ResolvedCharacterId;
  source: 'ai' | 'template';
}

export interface VisitorCard
  extends Omit<
      PitchInput,
      'characterId' | 'strength1' | 'strength2' | 'weakness' | 'tagline' | 'motivationalLine'
    >,
    PitchResult {
  id: string;
  createdAt: number;
  generationMs?: number;
  cardSerial: number;
}

export interface SayItFeedback {
  transcript: string;
  tip: string;
  estimatedSeconds: number;
  wordCount: number;
}

export type AppTab = 'create' | 'say-it' | 'print' | 'test-plan';
