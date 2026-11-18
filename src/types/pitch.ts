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
  | 'bold-toon'
  | 'retro-2d'
  | 'cozy-painted'
  | '3d-animated'
  | 'cute-flat'
  | 'line-art'
  | 'anime-hero'
  | 'vinyl-toy'
  | 'comic-pop'
  | 'cyber-chibi'
  | 'pencil-sketch';

export type PersonaId =
  | 'none'
  | 'warrior'
  | 'samurai'
  | 'ninja'
  | 'viking'
  | 'wizard'
  | 'superhero'
  | 'astronaut'
  | 'pirate'
  | 'cyber-hacker'
  | 'rockstar'
  | 'cowboy';

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
  /** Costume / world the AI dresses the person in (warrior, wizard...). */
  personaId: PersonaId;
  stickerFont: StickerFontId;
  strength1: string;
  strength2: string;
  weakness: string;
  /** One-word hobby shown on the power card. */
  hobby: string;
  dreamRole: string;
  tagline: string;
  motivationalLine: string;
  tone: Tone;
}

export interface PitchResult {
  /** Funny 2-4 word card title, e.g. "Captain Snooze Button". */
  title: string;
  /** Two-sentence funny introduction shown under the portrait. */
  intro: string;
  hobby: string;
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
      'characterId' | 'strength1' | 'strength2' | 'weakness' | 'hobby' | 'tagline' | 'motivationalLine'
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

export type AppTab = 'booth' | 'create' | 'say-it' | 'print' | 'test-plan';
