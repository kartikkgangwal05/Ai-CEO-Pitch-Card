// Cloudflare Workers AI portrait: the visitor's photo is a reference image for FLUX.2 [klein],
// which repaints them as a magic-academy student in their stream's colours.
// REST: POST https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/ai/run/{MODEL} (multipart).
import type { Specialisation } from '../src/types/pitch.ts';

const DEFAULT_MODEL = '@cf/black-forest-labs/flux-2-klein-9b';

export function cloudflareConfig() {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID?.trim();
  const token = process.env.CLOUDFLARE_API_TOKEN?.trim();
  if (!accountId || !token || accountId.startsWith('MY_') || token.startsWith('MY_')) return null;
  return { accountId, token, model: process.env.CLOUDFLARE_IMAGE_MODEL?.trim() || DEFAULT_MODEL };
}

/** Per-stream wardrobe colour and the glowing object the student holds (original, generic fantasy). */
const STREAM_LOOK: Record<Specialisation, { colour: string; prop: string }> = {
  HR: { colour: 'warm gold and amber', prop: 'a glowing golden orb with small people icons floating above the open palm' },
  'Business Analytics': {
    colour: 'electric sapphire blue',
    prop: 'a floating holographic dashboard with glowing bar charts and a pie chart above the open palm',
  },
  Finance: { colour: 'deep crimson red', prop: 'a stack of glowing gold coins with a rising arrow of light above the open palm' },
  Marketing: { colour: 'emerald green', prop: 'a glowing megaphone with floating like, play and heart icons above the open palm' },
  'Executive Leadership': { colour: 'royal purple', prop: 'a glowing crown of light and a rising star above the open palm' },
};

export function buildPortraitPrompt(stream: Specialisation): string {
  const look = STREAM_LOOK[stream] ?? STREAM_LOOK['Business Analytics'];
  return [
    'Epic fantasy trading-card portrait of the exact person in image 0, waist-up, facing the viewer, confident friendly expression.',
    "Keep the person's face, hairstyle, hair colour, skin tone, eyes, glasses, beard or moustache exactly the same and clearly recognisable.",
    `They wear an elegant black scholar's robe with ${look.colour} lining and a ${look.colour} stole, a crisp white collared shirt and a plain dark tie with a small gold pin.`,
    `One hand is raised holding ${look.prop}.`,
    `Swirling ribbons of ${look.colour} magical light and sparks wrap around them.`,
    'Background: a dark gothic castle with lit windows under a dramatic stormy night sky, drifting mist, cinematic rim lighting, rich colour grading.',
    'Highly detailed digital painting, sharp focus on the face, no text, no letters, no logos, no watermark, no frame or border.',
  ].join(' ');
}

/**
 * Generate the portrait. `photo` must already be smaller than 512x512 (the model's input limit).
 * Returns a data URL. Throws with a readable message on failure.
 */
/** Shorter fallback prompt, used once if Cloudflare's safety filter flags the first attempt. */
export function buildSimplePrompt(stream: Specialisation): string {
  const look = STREAM_LOOK[stream] ?? STREAM_LOOK['Business Analytics'];
  return `The person in image 0 wearing a black scholar's robe with a ${look.colour} stole, magical ${look.colour} light around them, gothic castle at night behind, digital painting.`;
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

async function generate(photo: { mimeType: string; data: Buffer }, prompt: string): Promise<string> {
  const cfg = cloudflareConfig();
  if (!cfg) throw new Error('Cloudflare is not configured (CLOUDFLARE_ACCOUNT_ID / CLOUDFLARE_API_TOKEN).');

  const form = new FormData();
  form.append('prompt', prompt);
  form.append('input_image_0', new Blob([new Uint8Array(photo.data)], { type: photo.mimeType }), 'photo.jpg');
  form.append('width', '768');
  form.append('height', '768');

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
      if (res.status === 429) throw new Error(`Cloudflare rate limit or daily Workers AI allowance reached (${msg}).`);
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
