import type { VisitorCard } from '../types/pitch';

/** Keeps what the team typed, minus a leading "#" or "No.", spaces and odd characters (max 12). */
export function cleanMemberNo(raw: string): string {
  return raw
    .replace(/^\s*(no\.?|#)\s*/i, '')
    .replace(/[^0-9A-Za-z -]/g, '')
    .replace(/\s{2,}/g, ' ')
    .slice(0, 12);
}

/** The card's founding member number, falling back to its serial for cards made before the field existed. */
export function memberNo(card: Pick<VisitorCard, 'foundingMemberNo' | 'cardSerial'>): string {
  const typed = cleanMemberNo(card.foundingMemberNo ?? '').trim();
  if (typed) return typed;
  return card.cardSerial > 0 ? String(card.cardSerial).padStart(3, '0') : '';
}

/** Next free number: one above the highest numeric member number used so far, as 3 digits. */
export function nextMemberNo(cards: Pick<VisitorCard, 'foundingMemberNo' | 'cardSerial'>[]): string {
  const max = cards.reduce((m, c) => {
    const n = parseInt(memberNo(c), 10);
    return Number.isFinite(n) ? Math.max(m, n) : m;
  }, 0);
  return String(max + 1).padStart(3, '0');
}
