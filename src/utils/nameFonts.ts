import type { CSSProperties } from 'react';
import type { NameFontId } from '../types/pitch';

/** Fonts for the card holder's name. All are already loaded in index.html. */
export const NAME_FONT_OPTIONS: ReadonlyArray<{ id: NameFontId; label: string; style: CSSProperties }> = [
  { id: 'theme', label: 'Card theme', style: { fontFamily: '"Cinzel", Georgia, serif', fontWeight: 900, textTransform: 'uppercase' } },
  { id: 'decorative', label: 'Royal Crest', style: { fontFamily: '"Cinzel Decorative", "Cinzel", serif', fontWeight: 900 } },
  { id: 'elegant', label: 'Elegant Script', style: { fontFamily: '"Cormorant Garamond", Georgia, serif', fontStyle: 'italic', fontWeight: 700, textTransform: 'none' } },
  { id: 'cartoon', label: 'Cartoon Pop', style: { fontFamily: '"Luckiest Guy", "Titan One", sans-serif', fontWeight: 400, textTransform: 'uppercase', letterSpacing: '0.04em' } },
  { id: 'vinyl', label: '3D Vinyl', style: { fontFamily: '"Titan One", sans-serif', fontWeight: 400, textTransform: 'none' } },
  { id: 'arcade', label: 'Cyber Arcade', style: { fontFamily: '"Bungee", "Righteous", sans-serif', fontWeight: 400, textTransform: 'uppercase' } },
  { id: 'futurist', label: 'Neo Futurist', style: { fontFamily: '"Syne", sans-serif', fontWeight: 800, textTransform: 'uppercase' } },
];

/** Inline style for the holder's name; undefined for the card theme's own lettering. */
export function nameFontStyle(id?: NameFontId): CSSProperties | undefined {
  if (!id || id === 'theme') return undefined;
  return NAME_FONT_OPTIONS.find((f) => f.id === id)?.style;
}
