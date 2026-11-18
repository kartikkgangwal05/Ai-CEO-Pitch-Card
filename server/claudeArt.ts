// Claude-only portrait engine: Claude looks at the photo and picks avatar-kit parts
// (hair, glasses, beard, colours...), then DiceBear draws a crisp vector cartoon.
import Anthropic from '@anthropic-ai/sdk';
import { createAvatar, type Style } from '@dicebear/core';
import * as collection from '@dicebear/collection';
import { CLAUDE_STYLES, type ClaudeStyle } from '../src/utils/claudeStyles.ts';
import type { CartoonStyleId } from '../src/types/pitch.ts';

export const CLAUDE_MODEL = 'claude-opus-5-5';

// Colour slots worth sampling from the photo (skin, hair, beard, clothes). micah uses baseColor for skin.
const COLOR_KEYS = new Set([
  'skinColor',
  'baseColor',
  'hairColor',
  'facialHairColor',
  'beardColor',
  'clothesColor',
  'clothingColor',
  'shirtColor',
]);

type SchemaProp = { type?: string; enum?: string[]; items?: { enum?: string[] } };

interface KitField {
  key: string;
  kind: 'part' | 'toggle' | 'color';
  options?: string[];
}

function styleFor(styleId: CartoonStyleId): { meta: ClaudeStyle; style: Style<object> } {
  const meta = CLAUDE_STYLES[styleId] ?? CLAUDE_STYLES['bold-toon']!;
  const style = (collection as unknown as Record<string, Style<object>>)[meta.dicebear];
  return { meta, style };
}

/** Read the avatar kit's parts straight from the DiceBear style schema. */
function kitFields(style: Style<object>): KitField[] {
  const props = ((style as { schema?: { properties?: Record<string, SchemaProp> } }).schema?.properties ?? {}) as Record<
    string,
    SchemaProp
  >;
  const fields: KitField[] = [];
  for (const [key, prop] of Object.entries(props)) {
    const options = prop.items?.enum ?? prop.enum;
    if (options && options.length > 1) {
      fields.push({ key, kind: 'part', options: [...options] });
      if (props[`${key}Probability`]) fields.push({ key, kind: 'toggle' });
    } else if (COLOR_KEYS.has(key)) {
      fields.push({ key, kind: 'color' });
    }
  }
  return fields;
}

function outputSchema(fields: KitField[]) {
  const properties: Record<string, unknown> = {};
  for (const f of fields) {
    if (f.kind === 'part') properties[f.key] = { type: 'string', enum: f.options };
    if (f.kind === 'toggle') properties[`${f.key}_visible`] = { type: 'boolean' };
    if (f.kind === 'color') properties[f.key] = { type: 'string', description: '6-digit hex colour without #' };
  }
  return { type: 'object', properties, required: Object.keys(properties), additionalProperties: false };
}

const SYSTEM_PROMPT = `You are a caricature artist building a cartoon avatar of a real person from an avatar kit.
You get a photo and must pick one value for every kit slot so the avatar is instantly recognisable as that person.
Priorities, in order: hair (length, shape, parting, texture, colour), skin tone, glasses (only if they wear them),
facial hair (only if they have it), headwear (only if worn: hijab, turban, cap), earrings (only if visible).
Expression: always friendly and confident, a smile.
Slots ending in "_visible": true only when that item is clearly present in the photo.
Colour slots: a 6-digit hex sampled from the photo (skin from the cheek, hair from the hair), no "#".
Clothing colour: match their top. If no person is visible, build a cheerful generic avatar.`;

const hex = (v: unknown, fallback: string) => {
  const s = String(v ?? '').replace('#', '').trim().toLowerCase();
  return /^[0-9a-f]{6}$/.test(s) ? s : fallback;
};

/** Wrap an avatar in a 4:3 sci-fi backdrop so it fills the card's portrait window. */
function composeCardArt(avatarSvg: string, bg: [string, string]): string {
  const inner = avatarSvg.replace(/<svg\b([^>]*)>/, (_m, attrs: string) => {
    const cleaned = attrs.replace(/\s(width|height|x|y)="[^"]*"/g, '');
    return `<svg x="60" y="12" width="280" height="288"${cleaned}>`;
  });
  const rays = Array.from({ length: 12 }, (_, i) => {
    const a = (i * Math.PI) / 6;
    const x1 = 200 + Math.cos(a - 0.08) * 420;
    const y1 = 150 + Math.sin(a - 0.08) * 420;
    const x2 = 200 + Math.cos(a + 0.08) * 420;
    const y2 = 150 + Math.sin(a + 0.08) * 420;
    return `<polygon points="200,150 ${x1.toFixed(1)},${y1.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)}" fill="#ffffff" fill-opacity="0.09"/>`;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="800" height="600">
<defs><radialGradient id="bg" cx="50%" cy="42%" r="75%"><stop offset="0" stop-color="${bg[0]}"/><stop offset="1" stop-color="${bg[1]}"/></radialGradient></defs>
<rect width="400" height="300" fill="url(#bg)"/>${rays}
<circle cx="200" cy="150" r="118" fill="#ffffff" fill-opacity="0.16"/>
${inner}</svg>`;
}

function toDataUrl(svg: string) {
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

function renderAvatar(
  styleId: CartoonStyleId,
  seed: string,
  picks: Record<string, unknown> | null,
  /** Preview mode: only override the parts given; let the seed pick the rest. */
  partial = false
): string {
  const { meta, style } = styleFor(styleId);
  const options: Record<string, unknown> = { seed, backgroundColor: ['transparent'] };
  if (picks) {
    for (const f of kitFields(style)) {
      if (f.kind === 'part' && typeof picks[f.key] === 'string' && f.options!.includes(picks[f.key] as string)) {
        options[f.key] = [picks[f.key]];
      }
      if (f.kind === 'toggle' && (!partial || `${f.key}_visible` in picks)) {
        options[`${f.key}Probability`] = picks[`${f.key}_visible`] ? 100 : 0;
      } else if (f.kind === 'toggle' && partial && !/^(hair|top)$/.test(f.key)) {
        options[`${f.key}Probability`] = 0; // previews: no masks, sunglasses or props
      }
      if (f.kind === 'color' && picks[f.key]) options[f.key] = [hex(picks[f.key], '000000')];
    }
  }
  const avatar = createAvatar(style, options as never).toString();
  return composeCardArt(avatar, meta.bg);
}

// Friendly, accessory-free sample faces for the booth tiles; the seed varies everything else.
const PREVIEW_PICKS: Record<ClaudeStyle['dicebear'], Record<string, unknown>> = {
  avataaars: { eyes: 'happy', mouth: 'smile', eyebrows: 'defaultNatural', top_visible: true },
  openPeeps: { face: 'smileBig' },
  personas: { eyes: 'happy', mouth: 'bigSmile', hair: 'shortCombover' },
  toonHead: { eyes: 'happy', mouth: 'laugh', eyebrows: 'happy' },
  bigSmile: { eyes: 'cheery', mouth: 'openedSmile' },
  micah: { eyes: 'smiling', mouth: 'smile', hair_visible: true },
};

/** Sample avatar for the booth's style tiles (no Claude call). */
export function stylePreviewSvg(styleId: CartoonStyleId, seed = 'Power Card'): string {
  const { meta } = styleFor(styleId);
  return renderAvatar(styleId, seed, PREVIEW_PICKS[meta.dicebear], true);
}

let client: Anthropic | null = null;
export function getAnthropicClient(): Anthropic | null {
  const key = process.env.ANTHROPIC_API_KEY?.trim();
  if (!key || key === 'MY_ANTHROPIC_API_KEY') return null;
  client ??= new Anthropic({ apiKey: key, timeout: 45_000, maxRetries: 1 });
  return client;
}

/** Photo in -> Claude picks kit parts -> DiceBear portrait (data URL). Throws on API failure. */
export async function claudePortrait(params: {
  imageBase64: string;
  mimeType: string;
  styleId: CartoonStyleId;
  seed: string;
}): Promise<{ imageUrl: string; picks: Record<string, unknown> }> {
  const anthropic = getAnthropicClient();
  if (!anthropic) throw new Error('ANTHROPIC_API_KEY is not set.');
  const { style } = styleFor(params.styleId);
  const fields = kitFields(style);

  const response = await anthropic.beta.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 4000,
    output_config: { effort: 'low', format: { type: 'json_schema', schema: outputSchema(fields) } },
    // Server-side fallback: if the request is declined, it re-runs on a fallback model automatically.
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: params.mimeType as 'image/jpeg', data: params.imageBase64 },
          },
          { type: 'text', text: 'Build this person\'s avatar from the kit.' },
        ],
      },
    ],
  });

  if (response.stop_reason === 'refusal') throw new Error('Claude declined to describe this photo.');
  const text = response.content.find((b) => b.type === 'text');
  if (!text || text.type !== 'text') throw new Error('Claude returned no avatar description.');
  const picks = JSON.parse(text.text) as Record<string, unknown>;
  return { imageUrl: toDataUrl(renderAvatar(params.styleId, params.seed, picks)), picks };
}

export { toDataUrl };
