// The booth's art brief for the stream portraits (premium cinematic wizard-academy collectible art).
// Gemini paints the visitor's photo with it; the card frame and all text are drawn by the app.
import type { Specialisation } from '../src/types/pitch.ts';

/** Per-stream colour, held emblem and background symbols (the client's brief, kept original). */
const STREAM_LOOK: Record<Specialisation, { colour: string; prop: string; symbols: string }> = {
  HR: {
    colour: 'warm gold and amber',
    prop: 'holding a glowing golden hologram of three people icons floating above the open palm',
    symbols: 'faint glowing silhouettes of people and teams',
  },
  'Business Analytics': {
    colour: 'electric sapphire blue',
    prop: 'holding a floating holographic dashboard with glowing bar charts and a pie chart above the open palm',
    symbols: 'faint glowing charts, graphs and data streams',
  },
  Finance: {
    colour: 'deep crimson red',
    prop: 'holding a stack of glowing gold coins with a rising golden arrow above the open palm',
    symbols: 'faint glowing stock-market candlestick charts',
  },
  Marketing: {
    colour: 'emerald green',
    prop: 'holding a glowing golden megaphone above the open palm',
    symbols: 'faint glowing social media icons such as play buttons, likes, hearts and targets',
  },
  'Executive Leadership': {
    colour: 'royal purple',
    prop: 'holding a glowing golden crown of light above the open palm',
    symbols: 'faint glowing stars and rising arrows',
  },
};

/**
 * The client's art brief (premium cinematic wizard-school collectible card art), applied to the
 * portrait only: the card frame and all text are drawn by the app so names are always spelled right.
 */
function artBrief(stream: Specialisation, subject: string): string {
  const look = STREAM_LOOK[stream] ?? STREAM_LOOK['Business Analytics'];
  return [
    `Premium cinematic fantasy collectible trading-card artwork, inspired by magical wizard-school fantasy and enchanted academies, magical realism.`,
    `A half-body portrait of ${subject} in the exact centre, looking directly at the camera, straight-facing pose, confident and friendly.`,
    `They wear an elegant black wizard robe with ${look.colour} lining and hood, a crisp white shirt and a plain solid ${look.colour} academic tie with no stripes.`,
    `${look.prop}.`,
    `Dramatic ${look.colour} magical lighting, glowing particles, swirling energy ribbons and ${look.symbols} surrounding the character.`,
    'Background: a grand dark-stone Indian-gothic university palace with a tall central clock tower, wide stone arches and glowing windows under a stormy sky, clearly different from any famous wizard-school castle.',
    'Original design only: no striped house ties, no house crests, no lightning-bolt scar, and nothing that copies any existing film, book or franchise.',
    'Premium realistic 3D digital artwork, cinematic lighting, highly detailed, sharp focus on the face.',
    'No text, no letters, no numbers, no logos, no watermark, no card border or frame.',
  ].join(' ');
}

/** The same client brief for Gemini, which receives the visitor's photo as an attached image. */
export function buildGeminiPrompt(stream: Specialisation): string {
  return [
    'Using the attached photo as the identity reference, create a new image.',
    artBrief(stream, 'the exact person in the attached photo'),
    "Preserve the person's actual facial identity, facial structure, hairstyle, skin tone, glasses, beard and natural appearance exactly; they must be instantly recognisable.",
    'Portrait orientation.',
  ].join(' ');
}

/** Same brief with a fictional student, for the start screen's sample cards (no reference photo). */
export function buildSamplePrompt(stream: Specialisation, who: string): string {
  return artBrief(stream, who);
}
