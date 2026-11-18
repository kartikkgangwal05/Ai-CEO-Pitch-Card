import type { CartoonStyleId } from '../types/pitch';

/** Which service draws the portrait. Claude can't output pixels, so the Claude engine = vision + avatar kit. */
export type ArtEngine = 'filter' | 'claude' | 'gemini';

export interface ClaudeStyle {
  /** DiceBear collection export name. */
  dicebear: 'avataaars' | 'openPeeps' | 'personas' | 'toonHead' | 'bigSmile' | 'micah';
  label: string;
  blurb: string;
  /** Background gradient behind the avatar on the card. */
  bg: [string, string];
  /** Required attribution (shown in README / studio). */
  credit: string;
}

/** The six booth tiles when the Claude engine is active. Keys reuse the existing style ids. */
export const CLAUDE_STYLES: Partial<Record<CartoonStyleId, ClaudeStyle>> = {
  'bold-toon': {
    dicebear: 'avataaars',
    label: 'Bold Toon',
    blurb: 'Classic cartoon avatar',
    bg: ['#7DD3FC', '#1D4ED8'],
    credit: 'Avataaars by Pablo Stanley (free for personal and commercial use)',
  },
  'retro-2d': {
    dicebear: 'openPeeps',
    label: 'Hand-Drawn',
    blurb: 'Ink sketch with attitude',
    bg: ['#FDE68A', '#F97316'],
    credit: 'Open Peeps by Pablo Stanley (CC0)',
  },
  'cozy-painted': {
    dicebear: 'personas',
    label: 'Personas',
    blurb: 'Soft, round & friendly',
    bg: ['#FBCFE8', '#9333EA'],
    credit: 'Personas by Draftbit (CC BY 4.0)',
  },
  '3d-animated': {
    dicebear: 'toonHead',
    label: 'Toon Head',
    blurb: 'Big-head toon hero',
    bg: ['#A7F3D0', '#0F766E'],
    credit: 'Toon Head by Johan Melin (CC BY 4.0)',
  },
  'cute-flat': {
    dicebear: 'bigSmile',
    label: 'Big Smile',
    blurb: 'Cute & cheerful',
    bg: ['#FFE4E6', '#FB7185'],
    credit: 'Big Smile by Ashley Seo (CC BY 4.0)',
  },
  'line-art': {
    dicebear: 'micah',
    label: 'Flat Line Art',
    blurb: 'Stylish flat portrait',
    bg: ['#E0E7FF', '#4338CA'],
    credit: 'Micah by Micah Lanier (CC BY 4.0)',
  },
};
