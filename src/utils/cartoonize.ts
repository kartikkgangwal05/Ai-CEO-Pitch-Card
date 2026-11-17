import type { CartoonStyleId } from '../types/pitch';

/**
 * Quantizes an 8-bit color channel into discrete cel-shading bands with soft transitions.
 */
export function quantizeChannel(value: number, levels = 6): number {
  const clamped = Math.max(0, Math.min(255, value));
  const safeLevels = Math.max(2, Math.round(levels));
  const step = 255 / (safeLevels - 1);
  return Math.round(Math.round(clamped / step) * step);
}

/**
 * Boosts RGB saturation slightly for clean illustrated color vibrancy.
 */
export function boostVibrancy(r: number, g: number, b: number, boost = 1.24): [number, number, number] {
  const avg = (r + g + b) / 3;
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return [
    clamp(avg + (r - avg) * boost),
    clamp(avg + (g - avg) * boost),
    clamp(avg + (b - avg) * boost),
  ];
}

/**
 * Computes Sobel edge magnitude from a 3x3 luminance neighborhood (0..255).
 */
export function computeSobelEdge(
  tl: number,
  tc: number,
  tr: number,
  ml: number,
  mr: number,
  bl: number,
  bc: number,
  br: number
): number {
  const gx = -tl + tr - 2 * ml + 2 * mr - bl + br;
  const gy = -tl - 2 * tc - tr + bl + 2 * bc + br;
  return Math.min(255, Math.round(Math.hypot(gx, gy)));
}

/**
 * Computes clean anti-aliased ink strength (0..1) and graphite paper sketch tone.
 */
export function computeSketchShade(luminance: number, edgeStrength: number): {
  r: number;
  g: number;
  b: number;
} {
  // Paper base tone (clean cool-ivory paper with crisp contrast)
  const paper = Math.min(252, Math.max(40, Math.round(luminance * 0.62 + 102)));
  const inkAlpha = Math.max(0, Math.min(1, (edgeStrength - 36) / 115));
  // Ink stroke color is deep navy-charcoal (#081A3A) so sketch looks sharp on neon-blue cards
  const r = Math.round(paper * (1 - inkAlpha) + 8 * inkAlpha);
  const g = Math.round(paper * (1 - inkAlpha) + 28 * inkAlpha);
  const b = Math.round(Math.min(255, paper + 6) * (1 - inkAlpha) + 64 * inkAlpha);
  return { r, g, b };
}

/**
 * Applies a clean 5x5 edge-preserving luminance box blur to suppress sensor noise
 * before contour extraction or cel-shading.
 */
function smoothLuminanceGrid(src: Uint8ClampedArray, w: number, h: number, radius = 2): Float32Array {
  const lum = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) {
    const p = i * 4;
    lum[i] = 0.299 * src[p] + 0.587 * src[p + 1] + 0.114 * src[p + 2];
  }
  const out = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let sum = 0;
      let count = 0;
      for (let dy = -radius; dy <= radius; dy++) {
        const yy = y + dy;
        if (yy < 0 || yy >= h) continue;
        for (let dx = -radius; dx <= radius; dx++) {
          const xx = x + dx;
          if (xx < 0 || xx >= w) continue;
          sum += lum[yy * w + xx];
          count++;
        }
      }
      out[y * w + x] = sum / count;
    }
  }
  return out;
}

/**
 * Clean client-side Cartoon & Sketch Portrait Stylizer.
 * Uses multi-pass color smoothing, smooth cel-tone quantization, and anti-aliased ink contours
 * so portraits look clean and artistic rather than noisy when cloud image generation isn't active.
 */
export async function applyComicCartoonFilter(
  sourceDataUrl: string,
  cartoonStyle: CartoonStyleId = 'anime-hero'
): Promise<string> {
  if (!sourceDataUrl || typeof document === 'undefined') {
    return sourceDataUrl;
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const targetW = 480;
      const targetH = 360;
      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(sourceDataUrl);
        return;
      }

      // Cover-crop onto clean 4:3 frame
      const srcRatio = (img.naturalWidth || targetW) / (img.naturalHeight || targetH);
      const dstRatio = targetW / targetH;
      let sx = 0;
      let sy = 0;
      let sw = img.naturalWidth || targetW;
      let sh = img.naturalHeight || targetH;
      if (srcRatio > dstRatio) {
        sw = Math.round(sh * dstRatio);
        sx = Math.round(((img.naturalWidth || targetW) - sw) / 2);
      } else {
        sh = Math.round(sw / dstRatio);
        sy = Math.round(((img.naturalHeight || targetH) - sh) / 2);
      }

      // Clean downsample -> upsample smooth base suppresses raw webcam grain before line art
      const smoothCanvas = document.createElement('canvas');
      smoothCanvas.width = 180;
      smoothCanvas.height = 135;
      const sCtx = smoothCanvas.getContext('2d');
      if (sCtx) {
        sCtx.imageSmoothingEnabled = true;
        sCtx.imageSmoothingQuality = 'high';
        sCtx.drawImage(img, sx, sy, sw, sh, 0, 0, 180, 135);
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.filter = 'blur(1.2px) contrast(1.06) brightness(1.04)';
      ctx.drawImage(sCtx ? smoothCanvas : img, 0, 0, sCtx ? 180 : sw, sCtx ? 135 : sh, 0, 0, targetW, targetH);
      ctx.filter = 'none';

      // Read crisp full-res edges from original for delicate line extraction
      const edgeCanvas = document.createElement('canvas');
      edgeCanvas.width = targetW;
      edgeCanvas.height = targetH;
      const eCtx = edgeCanvas.getContext('2d');
      let edgeLum: Float32Array;
      if (eCtx) {
        eCtx.drawImage(img, sx, sy, sw, sh, 0, 0, targetW, targetH);
        edgeLum = smoothLuminanceGrid(eCtx.getImageData(0, 0, targetW, targetH).data, targetW, targetH, 1);
      } else {
        edgeLum = smoothLuminanceGrid(ctx.getImageData(0, 0, targetW, targetH).data, targetW, targetH, 1);
      }

      const baseData = ctx.getImageData(0, 0, targetW, targetH);
      const src = baseData.data;
      const out = new Uint8ClampedArray(src.length);

      const isSketch = cartoonStyle === 'pencil-sketch';
      const levels = cartoonStyle === 'comic-pop' ? 5 : cartoonStyle === 'vinyl-toy' ? 8 : 6;
      const vibrancy = cartoonStyle === 'comic-pop' ? 1.32 : cartoonStyle === 'vinyl-toy' ? 1.18 : 1.24;
      const edgeSensitivity = cartoonStyle === 'comic-pop' ? 74 : 96;

      for (let y = 0; y < targetH; y++) {
        for (let x = 0; x < targetW; x++) {
          const idx = y * targetW + x;
          const p = idx * 4;

          let edgeMag = 0;
          if (x > 0 && x < targetW - 1 && y > 0 && y < targetH - 1) {
            edgeMag = computeSobelEdge(
              edgeLum[(y - 1) * targetW + (x - 1)],
              edgeLum[(y - 1) * targetW + x],
              edgeLum[(y - 1) * targetW + (x + 1)],
              edgeLum[y * targetW + (x - 1)],
              edgeLum[y * targetW + (x + 1)],
              edgeLum[(y + 1) * targetW + (x - 1)],
              edgeLum[(y + 1) * targetW + x],
              edgeLum[(y + 1) * targetW + (x + 1)]
            );
          }

          if (isSketch) {
            const shade = computeSketchShade(edgeLum[idx], edgeMag);
            out[p] = shade.r;
            out[p + 1] = shade.g;
            out[p + 2] = shade.b;
            out[p + 3] = 255;
          } else {
            const [vr, vg, vb] = boostVibrancy(src[p], src[p + 1], src[p + 2], vibrancy);
            const celR = Math.round(quantizeChannel(vr, levels) * 0.65 + vr * 0.35);
            const celG = Math.round(quantizeChannel(vg, levels) * 0.65 + vg * 0.35);
            const celB = Math.round(quantizeChannel(vb, levels) * 0.65 + vb * 0.35);

            // Soft anti-aliased comic ink blending instead of harsh pixelated threshold
            const inkAlpha = Math.max(0, Math.min(0.88, (edgeMag - edgeSensitivity) / 110));
            out[p] = Math.round(celR * (1 - inkAlpha) + 8 * inkAlpha);
            out[p + 1] = Math.round(celG * (1 - inkAlpha) + 18 * inkAlpha);
            out[p + 2] = Math.round(celB * (1 - inkAlpha) + 42 * inkAlpha);
            out[p + 3] = 255;
          }
        }
      }

      baseData.data.set(out);
      ctx.putImageData(baseData, 0, 0);

      // Subtle rim glow / cyan blueprint border accent
      const grad = ctx.createRadialGradient(
        targetW * 0.5,
        targetH * 0.45,
        targetW * 0.24,
        targetW * 0.5,
        targetH * 0.5,
        targetW * 0.66
      );
      grad.addColorStop(0, 'rgba(0, 212, 255, 0)');
      grad.addColorStop(1, isSketch ? 'rgba(0, 180, 255, 0.24)' : 'rgba(0, 212, 255, 0.22)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, targetW, targetH);

      try {
        resolve(canvas.toDataURL('image/png'));
      } catch {
        resolve(sourceDataUrl);
      }
    };
    img.onerror = () => resolve(sourceDataUrl);
    img.src = sourceDataUrl;
  });
}
