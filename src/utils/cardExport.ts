import { getFontEmbedCSS, toBlob } from 'html-to-image';
import { memberNo } from './foundingMember';
import type { VisitorCard } from '../types/pitch';

/** 2.5 x 3.5 in at 300 dpi: the downloaded PNG prints at exact playing-card size. */
export const EXPORT_DPI = 300;
export const EXPORT_WIDTH_PX = Math.round(2.5 * EXPORT_DPI); // 750
export const EXPORT_HEIGHT_PX = Math.round(3.5 * EXPORT_DPI); // 1050

const isSafari =
  typeof navigator !== 'undefined' && /^((?!chrome|android|crios|fxios).)*safari/i.test(navigator.userAgent);

// Font CSS (Google Fonts inlined as data URLs) is the slow part, so it is built once and reused.
let fontCssPromise: Promise<string> | null = null;
function fontEmbedCss(node: HTMLElement): Promise<string> {
  if (!fontCssPromise) {
    fontCssPromise = getFontEmbedCSS(node, { preferredFontFormat: 'woff2' }).catch(() => {
      fontCssPromise = null;
      return '';
    });
  }
  return fontCssPromise;
}

async function waitForImages(node: HTMLElement) {
  const imgs = Array.from(node.querySelectorAll('img'));
  await Promise.all(
    imgs.map((img) =>
      img.complete && img.naturalWidth > 0
        ? Promise.resolve()
        : new Promise<void>((resolve) => {
            img.addEventListener('load', () => resolve(), { once: true });
            img.addEventListener('error', () => resolve(), { once: true });
          })
    )
  );
}

/** Renders a mounted print-mode card node (63.5 x 88.9 mm) to a 750 x 1050 PNG tagged as 300 dpi. */
export async function renderCardNodeToPng(node: HTMLElement): Promise<Blob> {
  await document.fonts?.ready;
  await waitForImages(node);
  const fontCss = await fontEmbedCss(node);
  const width = node.offsetWidth || 240;
  const options = {
    pixelRatio: EXPORT_WIDTH_PX / width,
    backgroundColor: '#ffffff',
    fontEmbedCSS: fontCss,
    cacheBust: false,
  };
  // Safari often paints images only on the second pass.
  if (isSafari) await toBlob(node, options).catch(() => null);
  const blob = await toBlob(node, options);
  if (!blob) throw new Error('Could not render the card image.');
  return setPngDpi(blob, EXPORT_DPI);
}

export function cardFileName(card: VisitorCard): string {
  const slug = card.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'card';
  return `power-card-${memberNo(card) || card.cardSerial}-${slug}.png`;
}

export function shareText(card: VisitorCard): string {
  const title = card.title ? ` "${card.title}"` : '';
  return `Here's my Power Card${title} (Founding Member #${memberNo(card)}) from the #DYPAICoE launch at Dr. D. Y. Patil B-School, Pune!`;
}

export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/** True when this browser can hand an image file to the share sheet (phones, Safari, Edge/Chrome on Windows). */
export function canShareFiles(): boolean {
  try {
    const probe = new File([new Blob(['x'], { type: 'image/png' })], 'probe.png', { type: 'image/png' });
    return typeof navigator.canShare === 'function' && navigator.canShare({ files: [probe] });
  } catch {
    return false;
  }
}

// ---- PNG pHYs chunk: tells print apps the image is 300 dpi, so it prints at 2.5 x 3.5 in ----

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

async function setPngDpi(blob: Blob, dpi: number): Promise<Blob> {
  const src = new Uint8Array(await blob.arrayBuffer());
  // PNG signature (8) + IHDR chunk (4 len + 4 type + 13 data + 4 crc) = 33 bytes
  if (src.length < 33 || src[12] !== 0x49 || src[13] !== 0x48) return blob;
  const ppm = Math.round(dpi / 0.0254);
  const chunk = new Uint8Array(21);
  const view = new DataView(chunk.buffer);
  view.setUint32(0, 9);
  chunk.set([0x70, 0x48, 0x59, 0x73], 4); // "pHYs"
  view.setUint32(8, ppm);
  view.setUint32(12, ppm);
  chunk[16] = 1; // unit: metre
  view.setUint32(17, crc32(chunk.subarray(4, 17)));
  const out = new Uint8Array(src.length + chunk.length);
  out.set(src.subarray(0, 33), 0);
  out.set(chunk, 33);
  out.set(src.subarray(33), 33 + chunk.length);
  return new Blob([out], { type: 'image/png' });
}
