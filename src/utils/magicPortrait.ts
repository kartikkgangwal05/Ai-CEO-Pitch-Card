// "Magic academy" portrait: the visitor's real photo, cut out and placed in a glowing scene
// in their stream's colours, with rune circles, sparks, light ribbons and floating stream icons.
import type { Specialisation } from '../types/pitch';
import { personMask } from './segment';
import { ICON_PATHS, STREAMS } from './streams';

const W = 1000;
const H = 800;

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

function layer(w = W, h = H) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return { c, ctx: c.getContext('2d', { willReadFrequently: true })! };
}

/** Photo cover-cropped into the frame, slightly zoomed so head and shoulders fill it. */
function drawPhoto(ctx: CanvasRenderingContext2D, img: HTMLImageElement, w: number, h: number) {
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;
  const scale = Math.max(w / iw, h / ih) * 1.04;
  const sw = w / scale;
  const sh = h / scale;
  const sx = (iw - sw) / 2;
  const sy = Math.max(0, (ih - sh) * 0.22);
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, w, h);
}

function backdrop(ctx: CanvasRenderingContext2D, stream: Specialisation, rand: () => number) {
  const t = STREAMS[stream];
  const bg = ctx.createRadialGradient(W / 2, H * 0.42, 40, W / 2, H * 0.5, W * 0.75);
  bg.addColorStop(0, hexA(t.glow, 0.95));
  bg.addColorStop(0.35, hexA(t.glow, 0.35));
  bg.addColorStop(1, t.deep);
  ctx.fillStyle = t.deep;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // drifting mist
  for (let i = 0; i < 9; i++) {
    const x = rand() * W;
    const y = rand() * H * 0.8;
    const r = 120 + rand() * 220;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, hexA(i % 3 === 0 ? t.light : t.deep, 0.18));
    g.addColorStop(1, hexA(t.deep, 0));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  // light rays from behind the head
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2 + rand() * 0.2;
    const len = W;
    ctx.beginPath();
    ctx.moveTo(W / 2, H * 0.36);
    ctx.lineTo(W / 2 + Math.cos(a - 0.045) * len, H * 0.36 + Math.sin(a - 0.045) * len);
    ctx.lineTo(W / 2 + Math.cos(a + 0.045) * len, H * 0.36 + Math.sin(a + 0.045) * len);
    ctx.closePath();
    ctx.fillStyle = hexA(t.light, 0.07);
    ctx.fill();
  }
  ctx.restore();

  // rune circle behind the head
  ctx.save();
  ctx.translate(W / 2, H * 0.36);
  ctx.strokeStyle = hexA(t.light, 0.55);
  ctx.shadowColor = t.glow;
  ctx.shadowBlur = 18;
  for (const [r, lw] of [
    [300, 2.5],
    [262, 1.5],
    [190, 1],
  ] as const) {
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.lineWidth = 2;
  for (let i = 0; i < 36; i++) {
    const a = (i / 36) * Math.PI * 2;
    const r1 = 266;
    const r2 = i % 3 === 0 ? 296 : 284;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * r1, Math.sin(a) * r1);
    ctx.lineTo(Math.cos(a) * r2, Math.sin(a) * r2);
    ctx.stroke();
  }
  ctx.restore();
}

function sparks(ctx: CanvasRenderingContext2D, stream: Specialisation, rand: () => number, count: number) {
  const t = STREAMS[stream];
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < count; i++) {
    const x = rand() * W;
    const y = rand() * H;
    const r = 0.8 + rand() * 2.6;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r * 5);
    g.addColorStop(0, hexA(i % 4 === 0 ? '#ffffff' : t.light, 0.9));
    g.addColorStop(1, hexA(t.glow, 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r * 5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function ribbons(ctx: CanvasRenderingContext2D, stream: Specialisation, rand: () => number) {
  const t = STREAMS[stream];
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.lineCap = 'round';
  const paths = [
    [60, 640, 300, 470, 720, 760, 960, 560],
    [40, 720, 380, 600, 640, 820, 980, 660],
    [120, 420, 260, 300, 700, 540, 920, 360],
  ];
  paths.forEach((p, i) => {
    for (const [lw, a, blur] of [
      [10, 0.25, 30],
      [3.5, 0.85, 14],
      [1.2, 1, 0],
    ] as const) {
      ctx.beginPath();
      ctx.moveTo(p[0], p[1] + rand() * 20);
      ctx.bezierCurveTo(p[2], p[3], p[4], p[5], p[6], p[7]);
      ctx.strokeStyle = hexA(lw < 2 ? '#ffffff' : t.light, i === 2 ? a * 0.6 : a);
      ctx.lineWidth = lw;
      ctx.shadowColor = t.glow;
      ctx.shadowBlur = blur;
      ctx.stroke();
    }
  });
  ctx.restore();
}

function icons(ctx: CanvasRenderingContext2D, stream: Specialisation) {
  const t = STREAMS[stream];
  const spots = [
    { x: 120, y: 200, s: 3.4, r: -0.12 },
    { x: 860, y: 170, s: 3.0, r: 0.1 },
    { x: 840, y: 470, s: 2.6, r: 0.06 },
  ];
  t.icons.forEach((icon, i) => {
    const spot = spots[i];
    ctx.save();
    ctx.translate(spot.x, spot.y);
    ctx.rotate(spot.r);
    ctx.scale(spot.s, spot.s);
    ctx.translate(-12, -12);
    const path = new Path2D(ICON_PATHS[icon]);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.shadowColor = t.glow;
    ctx.shadowBlur = 12;
    ctx.strokeStyle = hexA(t.light, 0.95);
    ctx.lineWidth = 1.6;
    ctx.stroke(path);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 0.6;
    ctx.shadowBlur = 0;
    ctx.stroke(path);
    ctx.restore();
  });
}

/**
 * Render the stream portrait. `width` lets previews render smaller (height follows 5:4).
 * Uses a person cutout when available; otherwise blends the whole photo into the scene.
 */
export async function renderMagicPortrait(photoDataUrl: string, stream: Specialisation, width = W): Promise<string> {
  const t = STREAMS[stream];
  const img = await loadImage(photoDataUrl);
  const rand = rng(stream.length * 7919 + 17);

  const { c: out, ctx } = layer();
  backdrop(ctx, stream, rand);
  sparks(ctx, stream, rand, 70);

  // Person layer
  const { c: person, ctx: pctx } = layer();
  drawPhoto(pctx, img, W, H);
  // gentle grade towards the stream colour
  pctx.save();
  pctx.globalCompositeOperation = 'soft-light';
  pctx.fillStyle = hexA(t.glow, 0.45);
  pctx.fillRect(0, 0, W, H);
  pctx.restore();

  const mask = await personMask(person);
  if (mask) {
    // coloured aura hugging the silhouette
    const { c: aura, ctx: actx } = layer();
    actx.filter = 'blur(22px)';
    actx.drawImage(mask, 0, 0);
    actx.filter = 'none';
    actx.globalCompositeOperation = 'source-in';
    actx.fillStyle = t.glow;
    actx.fillRect(0, 0, W, H);
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.drawImage(aura, 0, 0);
    ctx.drawImage(aura, 0, 0);
    ctx.restore();

    pctx.globalCompositeOperation = 'destination-in';
    pctx.drawImage(mask, 0, 0);
    ctx.drawImage(person, 0, 0);

    // thin bright rim light on the edges
    const { c: rim, ctx: rctx } = layer();
    rctx.drawImage(mask, 0, 0);
    rctx.globalCompositeOperation = 'destination-out';
    rctx.filter = 'blur(3px)';
    rctx.drawImage(mask, -4, 4);
    rctx.filter = 'none';
    rctx.globalCompositeOperation = 'source-in';
    rctx.fillStyle = t.light;
    rctx.fillRect(0, 0, W, H);
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = 0.8;
    ctx.drawImage(rim, 0, 0);
    ctx.restore();
  } else {
    // No cutout: blend the whole photo in with a soft oval fade
    const { c: fade, ctx: fctx } = layer();
    const g = fctx.createRadialGradient(W / 2, H * 0.45, H * 0.25, W / 2, H * 0.5, H * 0.62);
    g.addColorStop(0, 'rgba(0,0,0,1)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    fctx.fillStyle = g;
    fctx.fillRect(0, 0, W, H);
    pctx.globalCompositeOperation = 'destination-in';
    pctx.drawImage(fade, 0, 0);
    ctx.drawImage(person, 0, 0);
  }

  ribbons(ctx, stream, rand);
  icons(ctx, stream);
  sparks(ctx, stream, rand, 40);

  // fade the bottom into the card and add a soft vignette
  const bottom = ctx.createLinearGradient(0, H * 0.72, 0, H);
  bottom.addColorStop(0, hexA(t.deep, 0));
  bottom.addColorStop(1, hexA(t.deep, 0.92));
  ctx.fillStyle = bottom;
  ctx.fillRect(0, 0, W, H);
  const vig = ctx.createRadialGradient(W / 2, H * 0.45, H * 0.35, W / 2, H / 2, W * 0.7);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(0,0,0,0.55)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, W, H);

  if (width === W) return out.toDataURL('image/jpeg', 0.92);
  const { c: small, ctx: sctx } = layer(width, Math.round((width * H) / W));
  sctx.drawImage(out, 0, 0, small.width, small.height);
  return small.toDataURL('image/jpeg', 0.88);
}
