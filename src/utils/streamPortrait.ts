import type { Specialisation } from '../types/pitch';

export interface PortraitResult {
  /** AI-painted portrait (data URL), or null to keep the in-browser portrait. */
  image: string | null;
  /** Reason shown on the reveal when Cloudflare was configured but failed. */
  error: string | null;
}

/** Centre-crop a photo to a square JPEG of `size` px (FLUX.2 klein inputs must be under 512x512). */
export function squareJpeg(src: string, size: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const side = Math.min(img.naturalWidth, img.naturalHeight);
      const c = document.createElement('canvas');
      c.width = size;
      c.height = size;
      c.getContext('2d')!.drawImage(img, (img.naturalWidth - side) / 2, (img.naturalHeight - side) / 2, side, side, 0, 0, size, size);
      resolve(c.toDataURL('image/jpeg', 0.9));
    };
    img.onerror = () => reject(new Error('Could not read the photo.'));
    img.src = src;
  });
}

/** Ask the server for the Cloudflare Workers AI stream portrait. Never throws. */
export async function requestStreamPortrait(photo: string, stream: Specialisation): Promise<PortraitResult> {
  try {
    const small = await squareJpeg(photo, 504);
    const res = await fetch('/api/magic-portrait', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageDataUrl: small, stream }),
    });
    if (res.status === 503) return { image: null, error: null };
    const payload = (await res.json().catch(() => ({}))) as { image?: string; error?: string };
    if (!res.ok || !payload.image) return { image: null, error: payload.error ?? `HTTP ${res.status}` };
    return { image: payload.image, error: null };
  } catch (err) {
    return { image: null, error: err instanceof Error ? err.message : 'network error' };
  }
}
