// The booth's art brief for the stream portraits (premium cinematic wizard-academy collectible art).
// Gemini paints the visitor's photo with it; the card frame and all text are drawn by the app.
import type { Specialisation } from '../src/types/pitch.ts';

/** Per-stream colour, held emblem and background symbols (the client's brief, kept original). */
const STREAM_LOOK: Record<Specialisation, { colour: string; prop: string; symbols: string; spirit: string }> = {
  HR: {
    spirit: 'a majestic glowing golden lion spirit made of light',
    colour: 'warm gold and amber',
    prop: 'holding a glowing golden hologram of three people icons floating above the open palm',
    symbols: 'faint glowing silhouettes of people and teams',
  },
  'Business Analytics': {
    spirit: 'a wise glowing sapphire owl spirit made of light',
    colour: 'electric sapphire blue',
    prop: 'holding a floating holographic dashboard with glowing bar charts and a pie chart above the open palm',
    symbols: 'faint glowing charts, graphs and data streams',
  },
  Finance: {
    spirit: 'a blazing crimson-and-gold phoenix spirit made of fire and light',
    colour: 'deep crimson red',
    prop: 'holding a stack of glowing gold coins with a rising golden arrow above the open palm',
    symbols: 'faint glowing stock-market candlestick charts',
  },
  Marketing: {
    spirit: 'a coiling glowing emerald dragon spirit made of light',
    colour: 'emerald green',
    prop: 'holding a glowing golden megaphone above the open palm',
    symbols: 'faint glowing social media icons such as play buttons, likes, hearts and targets',
  },
  'Executive Leadership': {
    spirit: 'a soaring glowing violet griffin spirit made of light',
    colour: 'royal purple',
    prop: 'holding a glowing golden crown of light above the open palm',
    symbols: 'faint glowing stars and rising arrows',
  },
};

/**
 * The client's art brief, matched to the reference cards: photo-real cinematic portrait, stream-coloured
 * robe, a glowing spirit creature, and the real DYP B-School campus behind them at night. Applied to the
 * portrait only: the card frame and all text are drawn by the app so names are always spelled right.
 */
function artBrief(stream: Specialisation, subject: string, campusImage: string, faithful = false): string {
  const look = STREAM_LOOK[stream] ?? STREAM_LOOK['Business Analytics'];
  return [
    'Premium cinematic fantasy collectible trading-card artwork in a photorealistic style, like a high-end movie still with magical effects.',
    faithful
      ? `A half-body portrait of ${subject} in the centre, with the head, face angle and expression exactly as in the photo.`
      : `A half-body portrait of ${subject} in the exact centre, looking directly at the camera, straight-facing, confident.`,
    `They wear an elegant black wizard robe with ${look.colour} lining and hood, a crisp white shirt and a plain solid ${look.colour} tie with no stripes.`,
    `${look.prop}.`,
    `Behind one shoulder, ${look.spirit}, and around the character swirling ${look.colour} energy ribbons, glowing particles and ${look.symbols}.`,
    `Background: the building from ${campusImage}, the Dr. D. Y. Patil B-School PGDM campus, recreated at night in a dark, mysterious magical mood.`,
    'Keep the building recognisable: the white multi-storey facade with its grid of windows, and the curved silver-and-yellow entrance canopy on round white pillars, now with warmly glowing windows, a stormy magical night sky and drifting magical light. The building stands behind the person, slightly out of focus.',
    faithful
      ? `${look.colour} rim lighting on the edges of the person only; the face keeps natural, even light and its true skin tone. Highly detailed, sharp focus on the face.`
      : `Dramatic ${look.colour} rim lighting on the person, deep shadows, rich colour grading, highly detailed, sharp focus on the face.`,
    'Photorealistic human: real skin texture and natural proportions, not a cartoon, not 3D animation, no big stylised eyes.',
    'Original design only: no house crests, no striped ties, no lightning-bolt scar, nothing copied from any film, book or franchise.',
    'No text, no letters, no logos, no watermark, no card border or frame.',
  ].join(' ');
}

/** For Gemini: image 1 is the visitor's photo, image 2 is the campus photo. */
export function buildGeminiPrompt(stream: Specialisation): string {
  return [
    'Edit the first attached image, a real photo of a person. The second attached image is the campus building for the background.',
    "MOST IMPORTANT: this is a photo edit, not a new drawing. Keep the person's head, face and hair exactly as photographed, as if cut out of the original photo: same face shape, jawline, forehead, eyes (shape, size, spacing, colour), eyebrows, nose, lips, ears, skin tone and texture, moles or marks, age, hairline and hairstyle, facial hair, glasses and expression.",
    'Do not redraw, repaint, beautify, slim, smooth, sharpen into a different face, lighten or darken the skin, de-age, turn the head, change the expression or make the face more symmetrical. Friends and family must recognise the person instantly; if in doubt, change less.',
    'Only the clothing below the neck, one raised hand, the magical effects, the lighting around the person and the background change.',
    artBrief(stream, 'the exact person in the first image', 'the second image', true),
    'Keep the face large and in sharp focus.',
    'Portrait orientation.',
  ].join(' ');
}

/** Same brief with a fictional student, for the start screen's sample cards (only the campus image attached). */
export function buildSamplePrompt(stream: Specialisation, who: string): string {
  return ['Create a new image.', artBrief(stream, who, 'the attached image'), 'Portrait orientation.'].join(' ');
}
