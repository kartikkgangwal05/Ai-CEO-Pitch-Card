// Cloudflare Workers AI portrait: the visitor's photo is a reference image for FLUX.2 [klein],
// which repaints them as a magic-academy student in their stream's colours.
// REST: POST https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/ai/run/{MODEL} (multipart).
import type { Specialisation } from '../src/types/pitch.ts';

// klein 4B costs ~26 neurons per 512x512 tile (~0.001 USD/portrait); 9B is ~13x more. Override via env.
const DEFAULT_MODEL = '@cf/black-forest-labs/flux-2-klein-4b';

/** Set when Cloudflare says the daily free allocation is used up; cleared at the next UTC midnight. */
let quotaBlockedUntil = 0;

function nextUtcMidnight() {
  const d = new Date();
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1);
}

/** 'off' = no keys, 'quota' = daily allowance used up (until reset), 'ok' = ready. */
export function cloudflareStatus(): 'off' | 'quota' | 'ok' {
  if (!cloudflareConfig()) return 'off';
  return Date.now() < quotaBlockedUntil ? 'quota' : 'ok';
}

export const QUOTA_MESSAGE = "Cloudflare's daily free AI allowance is used up (resets 00:00 UTC / 5:30 AM IST, or upgrade to Workers Paid)";

export function cloudflareConfig() {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID?.trim();
  const token = process.env.CLOUDFLARE_API_TOKEN?.trim();
  if (!accountId || !token || accountId.startsWith('MY_') || token.startsWith('MY_')) return null;
  return { accountId, token, model: process.env.CLOUDFLARE_IMAGE_MODEL?.trim() || DEFAULT_MODEL };
}

/** Per-stream wardrobe colour and the glowing object the student holds (original, generic fantasy). */
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
    `They wear an elegant black wizard robe with ${look.colour} lining and hood, a crisp white shirt and an academic tie in ${look.colour} and gold.`,
    `${look.prop}.`,
    `Dramatic ${look.colour} magical lighting, glowing particles, swirling energy ribbons and ${look.symbols} surrounding the character.`,
    'Background: a dark, mysterious wizard academy castle with lit windows under a stormy sky.',
    'Premium realistic 3D digital artwork, cinematic lighting, highly detailed, sharp focus on the face.',
    'No text, no letters, no numbers, no logos, no watermark, no card border or frame.',
  ].join(' ');
}

export function buildPortraitPrompt(stream: Specialisation): string {
  return [
    artBrief(stream, 'the exact person in image 0'),
    "Preserve the person's actual facial identity, facial structure, hairstyle, skin tone, glasses, beard and natural appearance exactly.",
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

/** Shorter fallback prompt, used once if Cloudflare's safety filter flags the first attempt. */
export function buildSimplePrompt(stream: Specialisation): string {
  const look = STREAM_LOOK[stream] ?? STREAM_LOOK['Business Analytics'];
  return `The person in image 0, half-body, looking at the camera, wearing a black wizard robe with ${look.colour} lining, white shirt and tie, magical ${look.colour} light around them, castle at night behind, realistic 3D digital art.`;
}

export async function cloudflarePortrait(photo: { mimeType: string; data: Buffer }, stream: Specialisation): Promise<string> {
  try {
    return await generate(photo, buildPortraitPrompt(stream));
  } catch (err) {
    // The model's safety filter sometimes flags harmless combinations; one retry with a plainer prompt.
    if (err instanceof Error && /flagged/i.test(err.message)) {
      console.warn('[cloudflare] first prompt flagged, retrying with the simpler prompt');
      return generate(photo, buildSimplePrompt(stream));
    }
    throw err;
  }
}

export async function generate(photo: { mimeType: string; data: Buffer } | null, prompt: string): Promise<string> {
  const cfg = cloudflareConfig();
  if (!cfg) throw new Error('Cloudflare is not configured (CLOUDFLARE_ACCOUNT_ID / CLOUDFLARE_API_TOKEN).');

  const form = new FormData();
  form.append('prompt', prompt);
  if (photo) form.append('input_image_0', new Blob([new Uint8Array(photo.data)], { type: photo.mimeType }), 'photo.jpg');
  form.append('width', '768');
  form.append('height', '960');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 60_000);
  try {
    const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${cfg.accountId}/ai/run/${cfg.model}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${cfg.token}` },
      body: form,
      signal: controller.signal,
    });
    const type = res.headers.get('content-type') ?? '';
    if (type.startsWith('image/')) {
      // Some models stream the image bytes directly.
      return `data:${type};base64,${Buffer.from(await res.arrayBuffer()).toString('base64')}`;
    }
    const body = (await res.json().catch(() => ({}))) as {
      success?: boolean;
      result?: { image?: string };
      image?: string;
      errors?: { message?: string; code?: number }[];
    };
    if (!res.ok || body.success === false) {
      const msg = body.errors?.map((e) => e.message).filter(Boolean).join('; ') || `HTTP ${res.status}`;
      if (res.status === 401 || res.status === 403) throw new Error(`Cloudflare rejected the API token (${msg}).`);
      if (/daily free allocation|neurons/i.test(msg)) {
        quotaBlockedUntil = nextUtcMidnight();
        throw new Error(QUOTA_MESSAGE);
      }
      if (res.status === 429) throw new Error(`Cloudflare rate limit reached, try again in a moment (${msg}).`);
      if (/flagged/i.test(msg)) throw new Error('Cloudflare safety filter flagged this photo; try a clearer, front-facing photo.');
      throw new Error(`Cloudflare image generation failed (${msg}).`);
    }
    const b64 = body.result?.image ?? body.image;
    if (!b64) throw new Error('Cloudflare returned no image.');
    return b64.startsWith('data:') ? b64 : `data:image/jpeg;base64,${b64}`;
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') throw new Error('Cloudflare took longer than 60 s.');
    throw err;
  } finally {
    clearTimeout(timer);
  }
}
