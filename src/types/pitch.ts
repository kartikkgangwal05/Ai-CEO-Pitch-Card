export type Specialisation = 'Marketing' | 'Finance' | 'Business Analytics' | 'HR';

export type Tone = 'Confident' | 'Friendly' | 'Formal';

export interface PitchInput {
  name: string;
  specialisation: Specialisation;
  strength: string;
  dreamRole: string;
  tone: Tone;
}

export interface PitchResult {
  pitch: string;
  linkedin_headline: string;
  keywords: string[];
  motivationalLine: string;
  source: 'ai' | 'template';
}

export interface VisitorCard extends PitchInput, PitchResult {
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
