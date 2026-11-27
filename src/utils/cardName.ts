/** Titles typed before a name ("Dr. Somnath"): kept together with the first name on the card. */
const HONORIFICS = new Set([
  'dr', 'prof', 'professor', 'mr', 'mrs', 'ms', 'miss', 'shri', 'shree', 'smt', 'sri', 'er', 'ca', 'cs', 'adv',
  'col', 'capt', 'maj', 'gen', 'lt', 'hon', 'justice', 'sir', 'dame', 'mx',
]);

/**
 * The short name shown on the card: the first name, keeping a leading title with it
 * ("Dr. Somnath Kumar" -> "Dr. Somnath", "Asha Kiran" -> "Asha").
 */
export function cardName(full: string): string {
  const words = full.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '';
  const out: string[] = [];
  let i = 0;
  // a title, or a run of them ("Prof. Dr. ..."), stays in front of the first name
  while (i < words.length - 1 && HONORIFICS.has(words[i].replace(/\./g, '').toLowerCase())) out.push(words[i++]);
  out.push(words[i]);
  return out.join(' ');
}
