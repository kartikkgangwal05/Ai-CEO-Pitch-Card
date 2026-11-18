// Instagram-style photo filters that keep the person's real face. Pure canvas, runs in the browser:
// instant, free, works offline. Output is a 4:3 image framed for the card's portrait window.
import type { CartoonStyleId } from '../types/pitch';

export interface PhotoFilter {
  id: CartoonStyleId;
  label: string;
  blurb: string;
}

/** The six booth looks (reusing the existing style ids so cards, edits and print keep working). */
export const PHOTO_FILTERS: PhotoFilter[] = [
  { id: 'bold-toon', label: 'Neon Cyber', blurb: 'Cyan & magenta glow' },
  { id: 'retro-2d', label: 'Comic Pop', blurb: 'Halftone hero print' },
  { id: 'cozy-painted', label: 'Golden Hour', blurb: 'Warm cinematic glow' },
  { id: '3d-animated', label: 'Holo Foil', blurb: 'Iridescent collector shine' },
  { id: 'cute-flat', label: 'Retro Film', blurb: 'Faded film & grain' },
  { id: 'line-art', label: 'Noir Hero', blurb: 'Dramatic black & white' },
];

export const photoFilterLabel = (id: CartoonStyleId) => PHOTO_FILTERS.find((f) => f.id === id)?.label ?? 'Photo';

const clamp = (v: number) => (v < 0 ? 0 : v > 255 ? 255 : v);
const lum = (r: number, g: number, b: number) => 0.299 * r + 0.587 * g + 0.114 * b;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not read the photo.'));
    img.src = src;
  });
}

/** Cover-crop to 4:3, biased upward so the face sits in the upper-middle of the frame. */
function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, w: number, h: number) {
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;
  const scale = Math.max(w / iw, h / ih);
  const sw = w / scale;
  const sh = h / scale;
  const sx = (iw - sw) / 2;
  const sy = Math.max(0, (ih - sh) * 0.3);
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, w, h);
}

/** Map luminance onto a colour gradient (duotone / tritone). */
function gradientMap(data: Uint8ClampedArray, stops: [number, [number, number, number]][], contrast = 1.15) {
  for (let i = 0; i < data.length; i += 4) {
    let t = lum(data[i], data[i + 1], data[i + 2]) / 255;
    t = Math.min(1, Math.max(0, (t - 0.5) * contrast + 0.5));
    let a = stops[0];
    let b = stops[stops.length - 1];
    for (let s = 0; s < stops.length - 1; s++) {
      if (t >= stops[s][0] && t <= stops[s + 1][0]) {
        a = stops[s];
        b = stops[s + 1];
        break;
      }
    }
    const k = b[0] === a[0] ? 0 : (t - a[0]) / (b[0] - a[0]);
    data[i] = a[1][0] + (b[1][0] - a[1][0]) * k;
    data[i + 1] = a[1][1] + (b[1][1] - a[1][1]) * k;
    data[i + 2] = a[1][2] + (b[1][2] - a[1][2]) * k;
  }
}

function vignette(ctx: CanvasRenderingContext2D, w: number, h: number, strength: number, color = '0,0,0') {
  const g = ctx.createRadialGradient(w / 2, h * 0.45, h * 0.25, w / 2, h / 2, Math.max(w, h) * 0.75);
  g.addColorStop(0, `rgba(${color},0)`);
  g.addColorStop(1, `rgba(${color},${strength})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

/** Soft bloom: blurred copy composited with screen. */
function bloom(ctx: CanvasRenderingContext2D, w: number, h: number, amount: number, blurPx: number) {
  const copy = document.createElement('canvas');
  copy.width = w;
  copy.height = h;
  const c = copy.getContext('2d')!;
  c.filter = `blur(${blurPx}px)`;
  c.drawImage(ctx.canvas, 0, 0);
  ctx.save();
  ctx.globalAlpha = amount;
  ctx.globalCompositeOperation = 'screen';
  ctx.drawImage(copy, 0, 0);
  ctx.restore();
}

function grain(ctx: CanvasRenderingContext2D, w: number, h: number, amount: number) {
  const frame = ctx.getImageData(0, 0, w, h);
  const d = frame.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (Math.random() - 0.5) * amount;
    d[i] = clamp(d[i] + n);
    d[i + 1] = clamp(d[i + 1] + n);
    d[i + 2] = clamp(d[i + 2] + n);
  }
  ctx.putImageData(frame, 0, 0);
}

function scanlines(ctx: CanvasRenderingContext2D, w: number, h: number, alpha: number) {
  ctx.save();
  ctx.fillStyle = `rgba(0,0,0,${alpha})`;
  const step = Math.max(2, Math.round(h / 240));
  for (let y = 0; y < h; y += step * 2) ctx.fillRect(0, y, w, step);
  ctx.restore();
}

// ---------- The six looks ----------

function neonCyber(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const frame = ctx.getImageData(0, 0, w, h);
  gradientMap(
    frame.data,
    [
      [0, [10, 4, 40]],
      [0.35, [124, 58, 237]],
      [0.62, [236, 72, 153]],
      [0.85, [0, 229, 255]],
      [1, [235, 255, 255]],
    ],
    1.25
  );
  ctx.putImageData(frame, 0, 0);
  bloom(ctx, w, h, 0.45, Math.round(w / 60));
  scanlines(ctx, w, h, 0.12);
  vignette(ctx, w, h, 0.55, '10,4,40');
}

function comicPop(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const frame = ctx.getImageData(0, 0, w, h);
  const d = frame.data;
  const gray = new Float32Array(w * h);
  for (let i = 0, p = 0; i < d.length; i += 4, p++) gray[p] = lum(d[i], d[i + 1], d[i + 2]);
  const levels = 5;
  const step = 255 / (levels - 1);
  for (let i = 0; i < d.length; i += 4) {
    // saturate then posterise
    const l = lum(d[i], d[i + 1], d[i + 2]);
    for (let c = 0; c < 3; c++) {
      const v = l + (d[i + c] - l) * 1.6;
      d[i + c] = Math.round(clamp(v) / step) * step;
    }
  }
  // ink edges
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const g = (dx: number, dy: number) => gray[(y + dy) * w + (x + dx)];
      const gx = -g(-1, -1) - 2 * g(-1, 0) - g(-1, 1) + g(1, -1) + 2 * g(1, 0) + g(1, 1);
      const gy = -g(-1, -1) - 2 * g(0, -1) - g(1, -1) + g(-1, 1) + 2 * g(0, 1) + g(1, 1);
      if (gx * gx + gy * gy > 140 * 140) {
        const i = (y * w + x) * 4;
        d[i] = d[i + 1] = d[i + 2] = 20;
      }
    }
  }
  ctx.putImageData(frame, 0, 0);
  // halftone dots in the darker areas
  const cell = Math.max(6, Math.round(w / 110));
  ctx.save();
  ctx.fillStyle = 'rgba(15,10,40,0.55)';
  for (let y = cell / 2; y < h; y += cell) {
    for (let x = cell / 2; x < w; x += cell) {
      const t = 1 - gray[Math.floor(y) * w + Math.floor(x)] / 255;
      if (t < 0.45) continue;
      ctx.beginPath();
      ctx.arc(x, y, (cell / 2) * (t - 0.35), 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
  vignette(ctx, w, h, 0.25);
}

function goldenHour(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const frame = ctx.getImageData(0, 0, w, h);
  const d = frame.data;
  for (let i = 0; i < d.length; i += 4) {
    d[i] = clamp(d[i] * 1.08 + 14);
    d[i + 1] = clamp(d[i + 1] * 1.0 + 4);
    d[i + 2] = clamp(d[i + 2] * 0.82);
  }
  ctx.putImageData(frame, 0, 0);
  bloom(ctx, w, h, 0.35, Math.round(w / 45));
  const leak = ctx.createRadialGradient(w * 0.92, h * 0.05, 0, w * 0.92, h * 0.05, w * 0.6);
  leak.addColorStop(0, 'rgba(255,170,60,0.55)');
  leak.addColorStop(1, 'rgba(255,120,40,0)');
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.fillStyle = leak;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
  vignette(ctx, w, h, 0.45, '60,20,0');
}

function holoFoil(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const frame = ctx.getImageData(0, 0, w, h);
  const d = frame.data;
  for (let i = 0; i < d.length; i += 4) {
    const l = lum(d[i], d[i + 1], d[i + 2]);
    for (let c = 0; c < 3; c++) d[i + c] = clamp(((l + (d[i + c] - l) * 0.55) - 128) * 1.2 + 140);
  }
  ctx.putImageData(frame, 0, 0);
  const g = ctx.createLinearGradient(0, 0, w, h);
  ['#ff5ecf', '#ffd36e', '#7cffb2', '#5ec8ff', '#b07cff', '#ff5ecf'].forEach((c, i, all) => g.addColorStop(i / (all.length - 1), c));
  ctx.save();
  ctx.globalCompositeOperation = 'soft-light';
  ctx.globalAlpha = 0.85;
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.globalCompositeOperation = 'screen';
  ctx.globalAlpha = 0.18;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
  // sparkles
  ctx.save();
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  for (let s = 0; s < 26; s++) {
    const x = ((s * 97) % 100) / 100 * w;
    const y = ((s * 61) % 100) / 100 * h;
    const r = (w / 260) * (1 + (s % 3));
    ctx.beginPath();
    ctx.moveTo(x, y - r * 2);
    ctx.lineTo(x + r * 0.5, y);
    ctx.lineTo(x, y + r * 2);
    ctx.lineTo(x - r * 0.5, y);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
  vignette(ctx, w, h, 0.3, '40,0,80');
}

function retroFilm(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const frame = ctx.getImageData(0, 0, w, h);
  const d = frame.data;
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i];
    const g = d[i + 1];
    const b = d[i + 2];
    // faded blacks, warm highlights, teal shadows
    d[i] = clamp(r * 0.85 + 34 + (r > 128 ? 10 : 0));
    d[i + 1] = clamp(g * 0.82 + 30);
    d[i + 2] = clamp(b * 0.75 + 42 - (r > 128 ? 12 : 0));
  }
  ctx.putImageData(frame, 0, 0);
  grain(ctx, w, h, 34);
  const leak = ctx.createLinearGradient(0, 0, w * 0.4, 0);
  leak.addColorStop(0, 'rgba(255,90,60,0.35)');
  leak.addColorStop(1, 'rgba(255,90,60,0)');
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.fillStyle = leak;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
  vignette(ctx, w, h, 0.5, '30,15,5');
}

function noirHero(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const frame = ctx.getImageData(0, 0, w, h);
  const d = frame.data;
  for (let i = 0; i < d.length; i += 4) {
    let t = lum(d[i], d[i + 1], d[i + 2]) / 255;
    t = t * t * (3 - 2 * t); // S-curve
    t = Math.min(1, Math.max(0, (t - 0.5) * 1.35 + 0.52));
    const v = t * 255;
    d[i] = clamp(v * 0.96);
    d[i + 1] = clamp(v * 0.99);
    d[i + 2] = clamp(v * 1.06 + 6);
  }
  ctx.putImageData(frame, 0, 0);
  grain(ctx, w, h, 18);
  const rim = ctx.createLinearGradient(w, 0, w * 0.55, 0);
  rim.addColorStop(0, 'rgba(0,212,255,0.28)');
  rim.addColorStop(1, 'rgba(0,212,255,0)');
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.fillStyle = rim;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
  vignette(ctx, w, h, 0.7);
}

const LOOKS: Partial<Record<CartoonStyleId, (ctx: CanvasRenderingContext2D, w: number, h: number) => void>> = {
  'bold-toon': neonCyber,
  'retro-2d': comicPop,
  'cozy-painted': goldenHour,
  '3d-animated': holoFoil,
  'cute-flat': retroFilm,
  'line-art': noirHero,
};

/** Apply a look to a photo. `width` controls output size (960 for the card, ~320 for previews). */
export async function applyPhotoFilter(photoDataUrl: string, styleId: CartoonStyleId, width = 960): Promise<string> {
  const img = await loadImage(photoDataUrl);
  const w = width;
  const h = Math.round((width * 3) / 4);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  drawCover(ctx, img, w, h);
  (LOOKS[styleId] ?? neonCyber)(ctx, w, h);
  return canvas.toDataURL('image/jpeg', 0.9);
}
