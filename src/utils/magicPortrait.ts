// "Magic academy" portrait: the visitor's real photo, cut out and dressed in academy robes
// (dark cloak with a coloured hood lining, stream-coloured stole, collar, solid tie with a gold pin,
// round seal), standing in front of a brooding castle under storm clouds with floating rune sigils,
// faint stream symbols and spell ribbons wrapping the figure. Original artwork, drawn procedurally.
import type { Specialisation } from '../types/pitch';
import { personMask, upperBody, type Pt, type UpperBody } from './segment';
import { ICON_PATHS, STREAMS, type StreamTheme } from './streams';

const W = 1000;
const H = 1000;
const GOLD = '#e7b547';

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not read the photo.'));
    img.src = src;
  });
}

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function hexA(hex: string, a: number) {
  const n = parseInt(hex.replace('#', ''), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

function layer(w = W, h = H) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return { c, ctx: c.getContext('2d', { willReadFrequently: true })! };
}

/** Ear-to-ear width of the face (falls back to a multiple of the mouth width for side-on heads). */
function earDistOf(p: UpperBody) {
  return Math.max(Math.abs(p.earL.x - p.earR.x), 2.2 * Math.abs(p.mouthL.x - p.mouthR.x), 1);
}

// ---------------------------------------------------------------- photo framing

interface Frame {
  scale: number;
  dx: number;
  dy: number;
}

/**
 * Frame the photo from the face: with pose the head is scaled to ~13% of the width and the nose
 * sits at 30% height, so the robe gets the lower ~40% of the square. Without pose, fit 62% height.
 */
function frameFor(iw: number, ih: number, pose: UpperBody | null): Frame {
  if (pose) {
    const scale = clamp((0.155 * W) / earDistOf(pose), 0.25, 3);
    return { scale, dx: W / 2 - pose.nose.x * scale, dy: 0.3 * H - pose.nose.y * scale };
  }
  const scale = (H * 0.62) / ih;
  return { scale, dx: (W - iw * scale) / 2, dy: H * 0.06 };
}

function mapPose(p: UpperBody, k: number, f: Frame): UpperBody {
  const m = (q: Pt): Pt => ({ x: q.x * k * f.scale + f.dx, y: q.y * k * f.scale + f.dy });
  return {
    nose: m(p.nose),
    mouthL: m(p.mouthL),
    mouthR: m(p.mouthR),
    earL: m(p.earL),
    earR: m(p.earR),
    shoulderL: m(p.shoulderL),
    shoulderR: m(p.shoulderR),
    visL: p.visL,
    visR: p.visR,
  };
}

/** Mean luminance (0..1) of the face box on a 32x32 downscale, or null when it can't be read. */
function faceLuminance(src: HTMLCanvasElement, p: UpperBody): number | null {
  const e = earDistOf(p);
  const x = clamp(p.nose.x - e, 0, src.width - 1);
  const y = clamp(p.nose.y - e, 0, src.height - 1);
  const w = Math.min(2 * e, src.width - x);
  const h = Math.min(2 * e, src.height - y);
  if (w < 4 || h < 4) return null;
  try {
    const { ctx } = layer(32, 32);
    ctx.drawImage(src, x, y, w, h, 0, 0, 32, 32);
    const d = ctx.getImageData(0, 0, 32, 32).data;
    let sum = 0;
    for (let i = 0; i < d.length; i += 4) sum += 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
    return sum / (32 * 32 * 255);
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------- body

interface Body {
  cx: number;
  s: number;
  sy: number;
  neckY: number;
  chinY: number;
  left: number;
  right: number;
  angle: number;
}

function bodyFromPose(p: UpperBody): Body {
  const e = earDistOf(p);
  const mouthY = (p.mouthL.y + p.mouthR.y) / 2;
  const chinY = mouthY + Math.max(12, mouthY - p.nose.y) * 1.5;
  let sL = p.shoulderL;
  let sR = p.shoulderR;
  let left: number;
  let right: number;
  let sy: number;
  let angle = 0;
  if (p.visL < 0.5 && p.visR < 0.5) {
    sy = chinY + 1.1 * e;
    left = p.nose.x - 1.6 * e;
    right = p.nose.x + 1.6 * e;
  } else {
    // mirror a hidden shoulder around the nose
    if (p.visL < 0.5) sL = { x: 2 * p.nose.x - sR.x, y: sR.y };
    if (p.visR < 0.5) sR = { x: 2 * p.nose.x - sL.x, y: sL.y };
    left = Math.min(sL.x, sR.x);
    right = Math.max(sL.x, sR.x);
    sy = (sL.y + sR.y) / 2;
    let a = Math.atan2(sR.y - sL.y, sR.x - sL.x);
    if (a > Math.PI / 2) a -= Math.PI;
    if (a < -Math.PI / 2) a += Math.PI;
    angle = clamp(a, -0.26, 0.26);
  }
  const s = clamp(right - left, 3.0 * e, 4.2 * e);
  const cx = clamp(0.5 * (left + right) * 0.5 + p.nose.x * 0.5, p.nose.x - 0.12 * s, p.nose.x + 0.12 * s);
  const neckY = Math.min(sy - s * 0.12, chinY + s * 0.06);
  return { cx, s, sy, neckY, chinY, left: cx - s / 2, right: cx + s / 2, angle };
}

/** No pose: estimate the neck from the narrowest row of the mask below the head. */
function bodyFromMask(mask: HTMLCanvasElement, maxY = H): Body | null {
  const n = 125;
  // rows below maxY (the photo's faded bottom edge) narrow artificially, so never pick them as the neck
  const lastRow = clamp(Math.floor((maxY * n) / H) - 1, 0, n - 1);
  const { ctx } = layer(n, n);
  ctx.drawImage(mask, 0, 0, n, n);
  const d = ctx.getImageData(0, 0, n, n).data;
  const count = new Array<number>(n).fill(0);
  const sumX = new Array<number>(n).fill(0);
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      if (d[(y * n + x) * 4 + 3] > 128) {
        count[y]++;
        sumX[y] += x;
      }
    }
  }
  const headTop = count.findIndex((c) => c > n * 0.02);
  if (headTop < 0) return null;
  const y0 = Math.min(lastRow, headTop + Math.round(n * 0.15));
  const y1 = Math.min(lastRow, headTop + Math.round(n * 0.45));
  let neckRow = -1;
  for (let y = y0; y <= y1; y++) {
    if (count[y] > 0 && (neckRow < 0 || count[y] < count[neckRow])) neckRow = y;
  }
  if (neckRow < 0) return null;
  const neckWidth = (count[neckRow] * W) / n;
  const neckY = ((neckRow + 0.5) * H) / n;
  const cx = ((sumX[neckRow] / count[neckRow] + 0.5) * W) / n;
  const s = Math.max(150, 3.4 * neckWidth);
  return {
    cx,
    s,
    sy: neckY + 0.5 * neckWidth,
    neckY,
    chinY: neckY - 0.25 * neckWidth,
    left: cx - s / 2,
    right: cx + s / 2,
    angle: 0,
  };
}

/** Where the held spell emblem sits (also the key light for the person grade). */
function emblemPos(b: Body | null) {
  const s = b?.s ?? W * 0.45;
  const cx = b?.cx ?? W / 2;
  const sy = b?.sy ?? H * 0.62;
  return { x: clamp(cx - s * 0.35, 110, W - 110), y: clamp(sy + s * 0.45, 160, H - 140) };
}

/** True when (x, y) falls in the box around the head that decorations should avoid. */
function inHeadBox(b: Body | null, x: number, y: number) {
  if (!b) return false;
  return Math.abs(x - b.cx) < b.s * 0.5 && y > b.neckY - b.s * 0.9 && y < b.neckY;
}

// ---------------------------------------------------------------- scene

function sky(ctx: CanvasRenderingContext2D, t: StreamTheme, rand: () => number) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#04050c');
  g.addColorStop(0.45, t.deep);
  g.addColorStop(0.7, hexA(t.glow, 0.45));
  g.addColorStop(1, t.deep);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // a few stars in the top of the sky
  for (let i = 0; i < 40; i++) {
    ctx.fillStyle = `rgba(255,255,255,${0.15 + rand() * 0.6})`;
    ctx.fillRect(rand() * W, rand() * H * 0.35, 1.6, 1.6);
  }
}

/** Faint stream symbols in the sky (charts for BA/Finance, icons for the rest), kept off the head. */
function motif(ctx: CanvasRenderingContext2D, t: StreamTheme, b: Body | null, rand: () => number) {
  ctx.save();
  if (b) {
    const keep = new Path2D();
    keep.rect(0, 0, W, H);
    keep.rect(b.cx - b.s * 0.5, b.neckY - b.s * 0.9, b.s, b.s * 0.9);
    ctx.clip(keep, 'evenodd');
  }
  ctx.globalCompositeOperation = 'screen';
  ctx.strokeStyle = hexA(t.light, 0.14);
  ctx.fillStyle = hexA(t.light, 0.035);
  ctx.lineWidth = 3;
  if (t.id === 'Business Analytics' || t.id === 'Finance') {
    for (const side of [0, 1]) {
      const x0 = side ? W * 0.74 : W * 0.04;
      let y = H * 0.36;
      for (let i = 0; i < 7; i++) {
        y += (rand() - 0.6) * 40;
        const x = x0 + i * 30;
        const h = 30 + rand() * 60;
        if (t.id === 'Finance') {
          ctx.beginPath();
          ctx.moveTo(x + 8, y - h * 0.5);
          ctx.lineTo(x + 8, y + h * 0.9);
          ctx.stroke();
          ctx.fillRect(x, y - h * 0.2, 16, h * 0.6);
        } else {
          ctx.fillRect(x, H * 0.5 - h * (1 + i * 0.2), 18, h * (1 + i * 0.2));
        }
      }
    }
  } else {
    for (let i = 0; i < 6; i++) {
      const x = i < 3 ? 60 + rand() * 180 : W - 240 + rand() * 180;
      const y = 140 + rand() * 260;
      const s = 2.4 + rand() * 1.8;
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(s, s);
      ctx.lineWidth = 1.4;
      ctx.stroke(new Path2D(ICON_PATHS[t.icons[i % 3]]));
      ctx.restore();
    }
  }
  ctx.restore();
}

/**
 * One brooding castle: a tall centre tower behind the figure, spires falling away to both sides,
 * an original observatory dome on the left, few dim windows. Drawn on its own layer so the sky
 * rim light only touches the stone.
 */
function castle(ctx: CanvasRenderingContext2D, t: StreamTheme, b: Body | null, rand: () => number) {
  const base = H * 0.62;
  const cx = b?.cx ?? W / 2;
  const s = b?.s ?? W * 0.45;
  const minX = W * 0.05;
  const maxX = W * 0.95;
  const domeX = W * 0.18;

  interface Tower {
    x: number;
    w: number;
    top: number;
    spire: number;
  }
  const towers: Tower[] = [{ x: clamp(cx, minX + 45, maxX - 45), w: 90, top: H * 0.3, spire: H * 0.08 }];
  const flank = 6 + Math.floor(rand() * 4);
  const perSide = [Math.ceil(flank / 2), Math.floor(flank / 2)];
  for (const [i, side] of [-1, 1].entries()) {
    const m = perSide[i];
    const span = side < 0 ? cx - minX : maxX - cx;
    for (let k = 1; k <= m; k++) {
      const w = 40 + rand() * 30;
      const x = cx + side * (span * (k / (m + 0.4)) + (rand() - 0.5) * 20);
      if (x - w / 2 < minX || x + w / 2 > maxX) continue;
      if (Math.abs(x - domeX) < 80) continue;
      const fall = k / m;
      const spire = H * (0.12 + fall * 0.3 + rand() * 0.04);
      towers.push({ x, w, top: spire + w * (1.4 + rand() * 0.6), spire });
    }
  }

  const { c, ctx: k } = layer();
  const fill = k.createLinearGradient(0, H * 0.08, 0, H);
  fill.addColorStop(0, '#1d1a30');
  fill.addColorStop(1, '#07060c');
  k.fillStyle = fill;
  // curtain wall with battlements, then solid ground to the bottom
  k.fillRect(minX, base - 70, maxX - minX, H);
  for (let x = minX; x < maxX - 10; x += 26) k.fillRect(x, base - 82, 13, 12);
  k.fillRect(0, base, W, H - base);
  for (const tw of towers) {
    k.fillRect(tw.x - tw.w / 2, tw.top, tw.w, base - tw.top + 2);
    k.beginPath();
    k.moveTo(tw.x - tw.w / 2 - 6, tw.top);
    k.lineTo(tw.x, tw.spire);
    k.lineTo(tw.x + tw.w / 2 + 6, tw.top);
    k.closePath();
    k.fill();
  }
  // observatory dome on a drum
  k.fillRect(domeX - 60, base - 90, 120, 92);
  k.beginPath();
  k.arc(domeX, base - 90, 60, Math.PI, 0);
  k.closePath();
  k.fill();
  // rim light from the sky, only on the stone
  k.globalCompositeOperation = 'source-atop';
  const rim = k.createLinearGradient(0, H * 0.08, 0, base);
  rim.addColorStop(0, hexA(t.glow, 0.2));
  rim.addColorStop(1, hexA(t.glow, 0));
  k.fillStyle = rim;
  k.fillRect(0, 0, W, H);
  k.globalCompositeOperation = 'source-over';
  // dome slit
  k.save();
  k.translate(domeX, base - 90);
  k.rotate(-0.35);
  k.fillStyle = hexA(t.glow, 0.85);
  k.fillRect(-2, -58, 4, 50);
  k.restore();
  ctx.drawImage(c, 0, 0);

  // a handful of dim windows in the lower third of the towers, never behind the head
  ctx.save();
  ctx.fillStyle = 'rgba(255,214,140,0.55)';
  let windows = 0;
  for (const tw of towers) {
    if (windows >= 14) break;
    if (Math.abs(tw.x - cx) < s * 0.6) continue;
    const h = base - tw.top;
    const rows = Math.max(1, Math.floor(h / 3 / 26));
    for (let r = 0; r < rows && windows < 14; r++) {
      if (rand() > 0.6) continue;
      const wy = base - h / 3 + 8 + r * 26;
      ctx.fillRect(tw.x - 3, wy, 6, 10);
      windows++;
    }
  }
  ctx.restore();
}

/** Mist and storm clouds: one layer, one blur pass, drawn after the castle so mist crosses its base. */
function clouds(ctx: CanvasRenderingContext2D, t: StreamTheme, rand: () => number) {
  const { c, ctx: k } = layer();
  for (let i = 0; i < 30; i++) {
    const x = rand() * W;
    const y = rand() < 0.7 ? rand() * H * 0.45 : H * (0.55 + rand() * 0.15);
    const rx = 120 + rand() * 140;
    const ry = 40 + rand() * 50;
    k.fillStyle = i % 3 === 2 ? 'rgba(0,0,0,0.35)' : hexA(t.light, 0.06 + rand() * 0.06);
    k.beginPath();
    k.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    k.fill();
  }
  ctx.save();
  ctx.filter = 'blur(30px)';
  ctx.drawImage(c, 0, 0);
  ctx.restore();
}

/** Floating rune sigils in the stream's icons (replaces candles), kept clear of the head. */
function sigils(ctx: CanvasRenderingContext2D, t: StreamTheme, b: Body | null, rand: () => number) {
  const cx = b?.cx ?? W / 2;
  const s = b?.s ?? W * 0.45;
  let placed = 0;
  for (let tries = 0; tries < 60 && placed < 7; tries++) {
    const x = 40 + rand() * (W - 80);
    const y = 40 + rand() * (H * 0.3 - 40);
    const r = 14 + rand() * 8;
    const rot = (rand() - 0.5) * ((30 * Math.PI) / 180);
    if (Math.abs(x - cx) < s * 0.6) continue;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(x, y, 0, x, y, 40);
    g.addColorStop(0, hexA(t.glow, 0.45));
    g.addColorStop(1, hexA(t.glow, 0));
    ctx.fillStyle = g;
    ctx.fillRect(x - 40, y - 40, 80, 80);
    ctx.restore();
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 0.85;
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.scale(1.1 * (r / 22), 1.1 * (r / 22));
    ctx.translate(-12, -12);
    ctx.strokeStyle = t.light;
    ctx.lineWidth = 1.6;
    ctx.stroke(new Path2D(ICON_PATHS[t.icons[placed % 3]]));
    ctx.restore();
    placed++;
  }
}

// ---------------------------------------------------------------- robes

/** Rotate the drawing around the neck so the robe follows tilted shoulders. */
function tilt(ctx: CanvasRenderingContext2D, b: Body) {
  ctx.translate(b.cx, b.neckY);
  ctx.rotate(b.angle);
  ctx.translate(-b.cx, -b.neckY);
}

/** Hood behind the neck with a coloured lining (drawn before the person so the head covers it). */
function hood(ctx: CanvasRenderingContext2D, t: StreamTheme, b: Body) {
  const { cx, s, neckY, sy } = b;
  ctx.save();
  tilt(ctx, b);
  ctx.fillStyle = '#120e18';
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.52, sy);
  ctx.quadraticCurveTo(cx - s * 0.48, neckY - s * 0.18, cx, neckY - s * 0.2);
  ctx.quadraticCurveTo(cx + s * 0.48, neckY - s * 0.18, cx + s * 0.52, sy);
  ctx.closePath();
  ctx.fill();
  // lining crescent, inset from the outer edge
  const g = ctx.createLinearGradient(0, neckY - s * 0.26, 0, sy);
  g.addColorStop(0, hexA(t.glow, 0.5));
  g.addColorStop(1, '#120e18');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.47, sy);
  ctx.quadraticCurveTo(cx - s * 0.43, neckY - s * 0.13, cx, neckY - s * 0.15);
  ctx.quadraticCurveTo(cx + s * 0.43, neckY - s * 0.13, cx + s * 0.47, sy);
  ctx.quadraticCurveTo(cx, neckY + s * 0.05, cx - s * 0.47, sy);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/** Dark fill over the visitor's own clothes below the neck, clipped to the person mask. */
function clothesCover(ctx: CanvasRenderingContext2D, mask: HTMLCanvasElement, b: Body) {
  const { c, ctx: k } = layer();
  k.fillStyle = '#120e18';
  const y0 = b.neckY + 0.06 * b.s;
  k.fillRect(0, y0, W, H - y0);
  k.globalCompositeOperation = 'destination-in';
  k.drawImage(mask, 0, 0);
  ctx.drawImage(c, 0, 0);
}

function robe(ctx: CanvasRenderingContext2D, t: StreamTheme, b: Body) {
  const { cx, s, sy, neckY, chinY, left, right } = b;
  const bottom = H + 0.4 * s;
  const vBottom = Math.min(H - 10, sy + s * 0.62);

  ctx.save();
  tilt(ctx, b);

  // sweater column with a rounded top
  ctx.fillStyle = '#2a2a33';
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.33, neckY + s * 0.08);
  ctx.quadraticCurveTo(cx, neckY - s * 0.02, cx + s * 0.33, neckY + s * 0.08);
  ctx.lineTo(cx + s * 0.34, bottom);
  ctx.lineTo(cx - s * 0.34, bottom);
  ctx.closePath();
  ctx.fill();

  // shirt V
  const shirt = new Path2D();
  shirt.moveTo(cx - s * 0.16, neckY);
  shirt.lineTo(cx + s * 0.16, neckY);
  shirt.lineTo(cx, vBottom);
  shirt.closePath();
  const sg = ctx.createLinearGradient(cx - s * 0.16, 0, cx + s * 0.16, 0);
  sg.addColorStop(0, '#d9dce4');
  sg.addColorStop(0.5, '#ffffff');
  sg.addColorStop(1, '#c9ccd6');
  ctx.fillStyle = sg;
  ctx.fill(shirt);

  // solid tie with a trapezoid knot and a gold pin, clipped to the shirt V
  ctx.save();
  ctx.clip(shirt);
  const tie = new Path2D();
  tie.moveTo(cx - s * 0.032, neckY + s * 0.085);
  tie.lineTo(cx + s * 0.032, neckY + s * 0.085);
  tie.lineTo(cx + s * 0.075, vBottom + 40);
  tie.lineTo(cx - s * 0.075, vBottom + 40);
  tie.closePath();
  const knot = new Path2D();
  knot.moveTo(cx - s * 0.045, neckY + s * 0.015);
  knot.lineTo(cx + s * 0.045, neckY + s * 0.015);
  knot.lineTo(cx + s * 0.032, neckY + s * 0.085);
  knot.lineTo(cx - s * 0.032, neckY + s * 0.085);
  knot.closePath();
  const shade = ctx.createLinearGradient(cx - s * 0.075, 0, cx + s * 0.075, 0);
  shade.addColorStop(0, 'rgba(255,255,255,0.15)');
  shade.addColorStop(1, 'rgba(0,0,0,0.25)');
  for (const part of [tie, knot]) {
    ctx.fillStyle = t.ink;
    ctx.fill(part);
    ctx.fillStyle = shade;
    ctx.fill(part);
  }
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.lineWidth = 1.5;
  ctx.stroke(knot);
  ctx.fillStyle = GOLD;
  ctx.beginPath();
  ctx.arc(cx, neckY + s * 0.16, s * 0.018, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // contact shadow under the jaw
  const cs = ctx.createRadialGradient(cx, chinY + s * 0.04, 0, cx, chinY + s * 0.04, s * 0.22);
  cs.addColorStop(0, 'rgba(0,0,0,0.5)');
  cs.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = cs;
  ctx.fillRect(cx - s * 0.22, chinY - s * 0.18, s * 0.44, s * 0.44);

  // collar wings (one soft shadow pass for both)
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.35)';
  ctx.shadowBlur = s * 0.02;
  ctx.shadowOffsetY = s * 0.01;
  const cg = ctx.createLinearGradient(0, neckY - s * 0.01, 0, neckY + s * 0.1);
  cg.addColorStop(0, '#ffffff');
  cg.addColorStop(1, '#c9ccd6');
  ctx.fillStyle = cg;
  const wings = new Path2D();
  for (const dir of [-1, 1]) {
    wings.moveTo(cx + dir * s * 0.16, neckY - s * 0.01);
    wings.lineTo(cx + dir * s * 0.02, neckY + s * 0.1);
    wings.lineTo(cx + dir * s * 0.2, neckY + s * 0.09);
    wings.closePath();
  }
  ctx.fill(wings);
  ctx.restore();
  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  ctx.lineWidth = 2;
  ctx.stroke(wings);

  // sweater V-neck trim in stream colours, both ending at the V point
  for (const [off, col, lw] of [
    [0.03, t.glow, 0.022],
    [0.055, GOLD, 0.01],
  ] as const) {
    ctx.strokeStyle = col;
    ctx.lineWidth = s * lw;
    ctx.beginPath();
    ctx.moveTo(cx - s * (0.16 + off), neckY);
    ctx.lineTo(cx, vBottom);
    ctx.lineTo(cx + s * (0.16 + off), neckY);
    ctx.stroke();
  }

  // broad cloak panels
  for (const dir of [-1, 1]) {
    const edge = dir < 0 ? left : right;
    const panel = new Path2D();
    panel.moveTo(cx + dir * s * 0.27, neckY - s * 0.02);
    panel.quadraticCurveTo(edge + dir * s * 0.02, sy - s * 0.2, edge + dir * s * 0.2, sy);
    panel.lineTo(cx + dir * s * 1.2, bottom);
    panel.lineTo(cx + dir * s * 0.24, bottom);
    panel.quadraticCurveTo(cx + dir * s * 0.2, sy + s * 0.3, cx + dir * s * 0.27, neckY - s * 0.02);
    panel.closePath();
    const pg = ctx.createLinearGradient(edge, sy - s * 0.2, cx, bottom);
    pg.addColorStop(0, '#241e2c');
    pg.addColorStop(0.35, '#120e18');
    pg.addColorStop(1, '#070609');
    ctx.fillStyle = pg;
    ctx.fill(panel);
    ctx.save();
    ctx.clip(panel);
    // shoulder highlight
    const hl = ctx.createRadialGradient(edge, sy - s * 0.05, 0, edge, sy - s * 0.05, s * 0.4);
    hl.addColorStop(0, 'rgba(255,255,255,0.12)');
    hl.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = hl;
    ctx.fillRect(edge - s * 0.4, sy - s * 0.45, s * 0.8, s * 0.8);
    // fold highlights fanning from the shoulder
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = s * 0.035;
    for (let k = 0; k < 6; k++) {
      const x0 = cx + dir * s * (0.3 + k * 0.05);
      const x1 = cx + dir * s * (0.32 + k * 0.16);
      ctx.beginPath();
      ctx.moveTo(x0, sy - s * 0.05);
      ctx.quadraticCurveTo(x0 + dir * s * 0.1, sy + s * 0.5, x1, bottom);
      ctx.stroke();
    }
    // dark folds
    ctx.strokeStyle = 'rgba(0,0,0,0.45)';
    ctx.lineWidth = 3;
    for (let k = 1; k <= 3; k++) {
      ctx.beginPath();
      ctx.moveTo(edge + dir * s * 0.05 * k, sy + s * 0.1);
      ctx.quadraticCurveTo(edge + dir * s * 0.1 * k, sy + s * 0.5, edge + dir * s * 0.12 * k, bottom);
      ctx.stroke();
    }
    ctx.restore();

    // stole band along the lapel in the stream colour, gold-edged, with one stamped icon
    const inner = { a: [cx + dir * s * 0.27, neckY - s * 0.02], c: [cx + dir * s * 0.2, sy + s * 0.3], b: [cx + dir * s * 0.24, bottom] };
    const o = dir * s * 0.11;
    const band = new Path2D();
    band.moveTo(inner.a[0], inner.a[1]);
    band.quadraticCurveTo(inner.c[0], inner.c[1], inner.b[0], inner.b[1]);
    band.lineTo(inner.b[0] + o, inner.b[1]);
    band.quadraticCurveTo(inner.c[0] + o, inner.c[1], inner.a[0] + o, inner.a[1]);
    band.closePath();
    const bg = ctx.createLinearGradient(0, neckY, 0, Math.min(bottom, H));
    bg.addColorStop(0, hexA(t.glow, 0.95));
    bg.addColorStop(1, t.deep);
    ctx.fillStyle = bg;
    ctx.fill(band);
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = s * 0.01;
    for (const off of [0, o]) {
      ctx.beginPath();
      ctx.moveTo(inner.a[0] + off, inner.a[1]);
      ctx.quadraticCurveTo(inner.c[0] + off, inner.c[1], inner.b[0] + off, inner.b[1]);
      ctx.stroke();
    }
    // icon at sy + 0.35s: solve the lapel curve's y for its parameter, then centre in the band
    const iy = sy + s * 0.35;
    if (iy < H - s * 0.05) {
      const [ay, cyy, by] = [inner.a[1], inner.c[1], inner.b[1]];
      const A = ay - 2 * cyy + by;
      const B = 2 * (cyy - ay);
      const C = ay - iy;
      const disc = Math.max(0, B * B - 4 * A * C);
      const u = Math.abs(A) < 1e-6 ? -C / B : (-B + Math.sqrt(disc)) / (2 * A);
      const uu = Number.isFinite(u) ? clamp(u, 0, 1) : 0.5;
      const ix = (1 - uu) * (1 - uu) * inner.a[0] + 2 * (1 - uu) * uu * inner.c[0] + uu * uu * inner.b[0] + o / 2;
      const sc = (s * 0.09) / 24;
      ctx.save();
      ctx.translate(ix, iy);
      ctx.scale(sc, sc);
      ctx.translate(-12, -12);
      ctx.strokeStyle = t.light;
      ctx.lineWidth = 2;
      ctx.stroke(new Path2D(ICON_PATHS[t.icons[1]]));
      ctx.restore();
    }
  }

  ctx.restore();
}

// ---------------------------------------------------------------- spell

/**
 * Four ribbon strands wrapping the body as tilted ellipses. 'back' draws the upper halves (behind
 * the figure), 'front' the lower halves. Strands go to one offscreen layer, composited with a single
 * blurred glow pass plus a sharp pass, so the cost stays bounded.
 */
function ribbons(ctx: CanvasRenderingContext2D, t: StreamTheme, b: Body | null, part: 'back' | 'front', rand: () => number) {
  const s = b?.s ?? W * 0.45;
  const cx = b?.cx ?? W / 2;
  const sy = b?.sy ?? H * 0.62;
  const a0 = part === 'back' ? Math.PI : 0;
  const SEG = 16;
  const { c: L, ctx: lctx } = layer();
  lctx.lineCap = 'round';
  lctx.strokeStyle = t.light;
  const core: { x0: number; y0: number; x1: number; y1: number; a: number }[] = [];
  const pts: Pt[] = [];
  for (let k = 0; k < 4; k++) {
    const ex = cx;
    const ey = sy + s * 0.1 + k * s * 0.12;
    const rx = s * (1.05 + 0.1 * k);
    const ry = s * (0.28 + 0.04 * k);
    const rot = -0.25 + 0.13 * k;
    const cosR = Math.cos(rot);
    const sinR = Math.sin(rot);
    const at = (th: number): Pt => {
      const x = rx * Math.cos(th);
      const y = ry * Math.sin(th);
      return { x: ex + x * cosR - y * sinR, y: ey + x * sinR + y * cosR };
    };
    for (let i = 0; i < SEG; i++) {
      const u = (i + 0.5) / SEG;
      const bump = Math.sin(Math.PI * u);
      const p0 = at(a0 + (Math.PI * i) / SEG);
      const p1 = at(a0 + (Math.PI * (i + 1)) / SEG);
      lctx.globalAlpha = 0.2 + 0.8 * bump;
      lctx.lineWidth = 1 + 6 * bump;
      lctx.beginPath();
      lctx.moveTo(p0.x, p0.y);
      lctx.lineTo(p1.x, p1.y);
      lctx.stroke();
      core.push({ x0: p0.x, y0: p0.y, x1: p1.x, y1: p1.y, a: 0.2 + 0.8 * bump });
    }
    for (let i = 0; i < 5; i++) pts.push(at(a0 + Math.PI * (0.1 + rand() * 0.8)));
  }
  // glow: tinted copy, one blur pass
  const { c: G, ctx: gctx } = layer();
  gctx.drawImage(L, 0, 0);
  gctx.globalCompositeOperation = 'source-in';
  gctx.fillStyle = t.glow;
  gctx.fillRect(0, 0, W, H);

  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = 0.6;
  ctx.filter = 'blur(10px)';
  ctx.drawImage(G, 0, 0);
  ctx.filter = 'none';
  ctx.globalAlpha = 1;
  ctx.drawImage(L, 0, 0);
  // white core
  ctx.lineCap = 'round';
  ctx.lineWidth = 1.2;
  ctx.strokeStyle = '#ffffff';
  for (const seg of core) {
    ctx.globalAlpha = seg.a * 0.8;
    ctx.beginPath();
    ctx.moveTo(seg.x0, seg.y0);
    ctx.lineTo(seg.x1, seg.y1);
    ctx.stroke();
  }
  // particles along the strands (20 per half, 40 in all)
  ctx.globalAlpha = 1;
  for (const p of pts) {
    const r = 1 + rand() * 2;
    const x = p.x + (rand() - 0.5) * 16;
    const y = p.y + (rand() - 0.5) * 16;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r * 3);
    g.addColorStop(0, hexA('#ffffff', 0.95));
    g.addColorStop(0.4, hexA(t.light, 0.7));
    g.addColorStop(1, hexA(t.glow, 0));
    ctx.fillStyle = g;
    ctx.fillRect(x - r * 3, y - r * 3, r * 6, r * 6);
  }
  ctx.restore();
}

/** The held emblem: the brightest point, lighting the cloak around it. */
function emblem(ctx: CanvasRenderingContext2D, t: StreamTheme, b: Body | null) {
  const { x: ox, y: oy } = emblemPos(b);
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  // pool of light on the robe area
  ctx.save();
  if (b) {
    ctx.beginPath();
    ctx.rect(0, b.neckY, W, H - b.neckY);
    ctx.clip();
  }
  const pool = ctx.createRadialGradient(ox, oy, 0, ox, oy, 260);
  pool.addColorStop(0, hexA(t.glow, 0.3));
  pool.addColorStop(1, hexA(t.glow, 0));
  ctx.fillStyle = pool;
  ctx.fillRect(ox - 260, oy - 260, 520, 520);
  ctx.restore();

  const glow = ctx.createRadialGradient(ox, oy, 0, ox, oy, 230);
  glow.addColorStop(0, 'rgba(255,255,255,1)');
  glow.addColorStop(0.12, hexA(t.light, 0.8));
  glow.addColorStop(0.35, hexA(t.glow, 0.5));
  glow.addColorStop(1, hexA(t.glow, 0));
  ctx.fillStyle = glow;
  ctx.fillRect(ox - 230, oy - 230, 460, 460);

  const icon = new Path2D(ICON_PATHS[t.icons[1]]);
  ctx.translate(ox, oy);
  ctx.scale(4.2, 4.2);
  ctx.translate(-12, -12);
  ctx.lineWidth = 2.4;
  ctx.shadowColor = t.glow;
  ctx.shadowBlur = 30;
  ctx.strokeStyle = t.light;
  ctx.stroke(icon);
  ctx.shadowBlur = 0;
  ctx.strokeStyle = '#ffffff';
  ctx.stroke(icon);
  ctx.restore();
}

function sparks(ctx: CanvasRenderingContext2D, t: StreamTheme, b: Body | null, rand: () => number, count: number) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  let drawn = 0;
  for (let tries = 0; tries < count * 3 && drawn < count; tries++) {
    const x = rand() * W;
    const y = rand() * H;
    const r = 0.8 + rand() * 2.4;
    if (inHeadBox(b, x, y)) continue;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r * 5);
    g.addColorStop(0, hexA(drawn % 4 === 0 ? '#ffe7a8' : t.light, 0.9));
    g.addColorStop(1, hexA(t.glow, 0));
    ctx.fillStyle = g;
    ctx.fillRect(x - r * 5, y - r * 5, r * 10, r * 10);
    drawn++;
  }
  ctx.restore();
}

// ---------------------------------------------------------------- main

/**
 * Render the stream portrait as a JPEG data URL. The canvas is square, so with `width` (for
 * smaller previews) the height follows 1:1. Uses pose to frame from the face and a person cutout
 * when available; otherwise blends the whole photo into the scene.
 */
export async function renderMagicPortrait(photoDataUrl: string, stream: Specialisation, width = W): Promise<string> {
  const t = STREAMS[stream];
  const img = await loadImage(photoDataUrl);
  const rand = rng(stream.length * 7919 + 17);
  const iw = img.naturalWidth || 1;
  const ih = img.naturalHeight || 1;

  // 1. Pose on a 640px copy, before compositing, so framing can follow the face.
  const ps = 640 / Math.max(iw, ih);
  const { c: temp, ctx: tctx } = layer(Math.max(1, Math.round(iw * ps)), Math.max(1, Math.round(ih * ps)));
  tctx.drawImage(img, 0, 0, temp.width, temp.height);
  const rawPose = await upperBody(temp);
  const k = iw / temp.width; // temp px -> source px
  const srcPose = rawPose ? mapPose(rawPose, k, { scale: 1, dx: 0, dy: 0 }) : null;
  const f = frameFor(iw, ih, srcPose);
  const pose = rawPose ? mapPose(rawPose, k, f) : null;

  // exposure normalisation from the face box
  let brightness = 1;
  if (rawPose) {
    const mean = faceLuminance(temp, rawPose);
    if (mean !== null && (mean < 0.4 || mean > 0.7)) brightness = clamp(0.55 / Math.max(mean, 0.01), 0.75, 1.5);
  }

  // 2. Person layer: framed photo with a soft bottom edge, then the cutout mask.
  const { c: person, ctx: pctx } = layer();
  pctx.filter = `contrast(1.1) saturate(1.08)${brightness !== 1 ? ` brightness(${brightness.toFixed(3)})` : ''}`;
  pctx.drawImage(img, f.dx, f.dy, Math.max(iw * f.scale, 1), Math.max(ih * f.scale, 1));
  pctx.filter = 'none';
  const photoBottom = f.dy + ih * f.scale;
  const photoRight = f.dx + iw * f.scale;
  // Feather every photo edge that lands inside the canvas (40px at the bottom, 24px elsewhere),
  // so neither the cutout nor the no-mask fallback shows a hard line where the selfie ends.
  pctx.save();
  pctx.globalCompositeOperation = 'destination-out';
  const feather = (x0: number, y0: number, x1: number, y1: number) => {
    const g = pctx.createLinearGradient(x0, y0, x1, y1);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, 'rgba(0,0,0,1)');
    pctx.fillStyle = g;
    pctx.fillRect(Math.min(x0, x1) - (x0 === x1 ? W : 1), Math.min(y0, y1) - (y0 === y1 ? H : 1), x0 === x1 ? 3 * W : Math.abs(x1 - x0) + 2, y0 === y1 ? 3 * H : Math.abs(y1 - y0) + 2);
  };
  if (photoBottom < H + 40) feather(0, photoBottom - 40, 0, photoBottom);
  if (f.dy > -24) feather(0, f.dy + 24, 0, f.dy);
  if (f.dx > -24) feather(f.dx + 24, 0, f.dx, 0);
  if (photoRight < W + 24) feather(photoRight - 24, 0, photoRight, 0);
  pctx.restore();
  const mask = await personMask(person);
  const body = pose ? bodyFromPose(pose) : mask ? bodyFromMask(mask, photoBottom - 40) : null;
  const em = emblemPos(body);

  // Keep the person layer's alpha: soft-light fills would otherwise tint its transparent areas.
  const { c: alpha, ctx: alphaCtx } = layer();
  alphaCtx.drawImage(person, 0, 0);

  // per-stream grade on the person: coloured key light from the emblem, a little warmth for skin
  pctx.save();
  pctx.globalCompositeOperation = 'soft-light';
  const key = pctx.createRadialGradient(em.x, em.y, 0, em.x, em.y, W * 0.6);
  key.addColorStop(0, hexA(t.glow, 0.35));
  key.addColorStop(1, hexA(t.glow, 0));
  pctx.fillStyle = key;
  pctx.fillRect(0, 0, W, H);
  pctx.fillStyle = 'rgba(255,190,120,0.15)';
  pctx.fillRect(0, 0, W, H);
  pctx.globalCompositeOperation = 'destination-in';
  pctx.drawImage(alpha, 0, 0);
  pctx.restore();

  // 3. Scene.
  const { c: out, ctx } = layer();
  sky(ctx, t, rand);
  motif(ctx, t, body, rand);
  sigils(ctx, t, body, rand);
  castle(ctx, t, body, rand);
  clouds(ctx, t, rand);

  // glow behind the head
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const hx = body?.cx ?? W / 2;
  const hy = body ? body.neckY - body.s * 0.9 : H * 0.35;
  const hr = body ? body.s * 1.3 : W * 0.6;
  const halo = ctx.createRadialGradient(hx, hy, 0, hx, hy, hr);
  halo.addColorStop(0, hexA(t.glow, 0.35));
  halo.addColorStop(1, hexA(t.glow, 0));
  ctx.fillStyle = halo;
  ctx.fillRect(hx - hr, hy - hr, hr * 2, hr * 2);
  ctx.restore();

  // 4. Figure.
  if (mask) {
    // coloured aura hugging the silhouette
    const { c: aura, ctx: actx } = layer();
    actx.filter = 'blur(26px)';
    actx.drawImage(mask, 0, 0);
    actx.filter = 'none';
    actx.globalCompositeOperation = 'source-in';
    actx.fillStyle = t.glow;
    actx.fillRect(0, 0, W, H);
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.drawImage(aura, 0, 0);
    ctx.restore();

    ribbons(ctx, t, body, 'back', rand);
    // Leadership cards are for guests and faculty: they keep their own clothes (no hood, robe or tie).
    const ownClothes = stream === 'Executive Leadership';
    if (body && !ownClothes) hood(ctx, t, body);

    pctx.globalCompositeOperation = 'destination-in';
    pctx.drawImage(mask, 0, 0);
    ctx.drawImage(person, 0, 0);

    if (body && !ownClothes) {
      clothesCover(ctx, mask, body);
      robe(ctx, t, body);
    }
    ribbons(ctx, t, body, 'front', rand);

    // thin bright rim light on the silhouette edge, kept above the robe
    const { c: rim, ctx: rctx } = layer();
    rctx.drawImage(mask, 0, 0);
    rctx.globalCompositeOperation = 'destination-out';
    rctx.filter = 'blur(5px)';
    rctx.drawImage(mask, -7, 5);
    rctx.filter = 'none';
    rctx.globalCompositeOperation = 'source-in';
    rctx.fillStyle = t.light;
    rctx.fillRect(0, 0, W, H);
    ctx.save();
    if (body) {
      ctx.beginPath();
      ctx.rect(0, 0, W, body.neckY + 0.05 * body.s);
      ctx.clip();
    }
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = 0.9;
    ctx.drawImage(rim, 0, 0);
    ctx.restore();
  } else {
    ribbons(ctx, t, body, 'back', rand);
    const { c: fade, ctx: fctx } = layer();
    const g = fctx.createRadialGradient(W / 2, H * 0.42, H * 0.22, W / 2, H * 0.46, H * 0.55);
    g.addColorStop(0, 'rgba(0,0,0,1)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    fctx.fillStyle = g;
    fctx.fillRect(0, 0, W, H);
    pctx.globalCompositeOperation = 'destination-in';
    pctx.drawImage(fade, 0, 0);
    ctx.drawImage(person, 0, 0);
    ribbons(ctx, t, body, 'front', rand);
  }

  emblem(ctx, t, body);
  sparks(ctx, t, body, rand, 35);

  // 5. Stream-coloured grade, vignette and a fade into the card at the bottom.
  ctx.save();
  ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = hexA(t.glow, 0.2);
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
  const vig = ctx.createRadialGradient(W / 2, H * 0.42, H * 0.25, W / 2, H / 2, W * 0.72);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(0,0,0,0.8)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, W, H);
  const bottom = ctx.createLinearGradient(0, H * 0.8, 0, H);
  bottom.addColorStop(0, hexA(t.deep, 0));
  bottom.addColorStop(1, hexA(t.deep, 0.9));
  ctx.fillStyle = bottom;
  ctx.fillRect(0, 0, W, H);

  if (width === W) return out.toDataURL('image/jpeg', 0.92);
  const { c: small, ctx: sctx } = layer(width, Math.round((width * H) / W));
  sctx.drawImage(out, 0, 0, small.width, small.height);
  return small.toDataURL('image/jpeg', 0.88);
}
