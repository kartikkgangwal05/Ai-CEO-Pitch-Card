import 'dotenv/config';
import Anthropic from '@anthropic-ai/sdk';
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CLAUDE_MODEL, claudePortrait, getAnthropicClient, stylePreviewSvg } from './server/claudeArt.ts';
import type { ArtEngine } from './src/utils/claudeStyles.ts';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import {
  EXACT_SYSTEM_PROMPT,
  buildCharacterGenerationPrompt,
  getPersona,
  extractJsonObject,
  normalizePitchResponse,
  validatePitchInput,
} from './src/utils/pitch.ts';
import type {
  CartoonStyleId,
  PersonaId,
  PitchInput,
  Specialisation,
  StickerFontId,
  VisitorType,
} from './src/types/pitch.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function getAnthropicApiKey(): string | null {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey || apiKey === 'MY_ANTHROPIC_API_KEY') {
    return null;
  }
  return apiKey;
}

const CARD_TEXT_SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string', description: 'Funny 2-4 word epithet, max 28 chars, no name.' },
    intro: { type: 'string', description: 'Exactly two short punchy sentences, 14-24 words total.' },
    strength: { type: 'string', description: 'ONE word.' },
    weakness: { type: 'string', description: 'ONE word.' },
    hobby: { type: 'string', description: 'ONE word.' },
    power: { type: 'integer', description: '60-99' },
    recommended_character: {
      type: 'string',
      enum: ['gadget-cat', 'mischief-maverick', 'harmony-ace', 'strategy-prodigy', 'visionary-captain', 'data-wizard'],
    },
  },
  required: ['title', 'intro', 'strength', 'weakness', 'hobby', 'power', 'recommended_character'],
  additionalProperties: false,
};

/** Card text via the Anthropic SDK with a JSON schema, so the reply always parses. */
async function callAnthropicJson(params: { system: string; userPrompt: string }): Promise<unknown> {
  const anthropic = getAnthropicClient();
  if (!anthropic) throw new Error('ANTHROPIC_API_KEY is not set.');
  const response = await anthropic.beta.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 4000,
    output_config: { effort: 'low', format: { type: 'json_schema', schema: CARD_TEXT_SCHEMA } },
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    system: params.system,
    messages: [{ role: 'user', content: params.userPrompt }],
  });
  if (response.stop_reason === 'refusal') throw new Error('Claude declined to write this card.');
  const text = response.content.find((b) => b.type === 'text');
  if (!text || text.type !== 'text') throw new Error('Claude returned no card text.');
  return JSON.parse(text.text);
}

/**
 * Which service makes the portrait.
 *   filter (default): the browser applies an Instagram-style filter to the real photo.
 *   claude: Claude reads the photo and builds a vector cartoon avatar.
 *   gemini: Gemini repaints the photo (needs billing).
 */
function getImageEngine(): ArtEngine {
  const forced = process.env.IMAGE_ENGINE?.trim().toLowerCase();
  if (forced === 'claude' || forced === 'gemini' || forced === 'filter') return forced;
  return 'filter';
}

/** Optional style reference image for an art style: public/styles/<styleId>.(jpg|jpeg|png|webp). */
function loadStyleReference(styleId: string): { mimeType: string; data: string } | null {
  if (!/^[a-z0-9-]+$/.test(styleId)) return null;
  const types: Record<string, string> = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };
  for (const [ext, mimeType] of Object.entries(types)) {
    const file = path.resolve(__dirname, 'public', 'styles', `${styleId}.${ext}`);
    if (fs.existsSync(file)) {
      return { mimeType, data: fs.readFileSync(file).toString('base64') };
    }
  }
  return null;
}

/** Image models we prefer, best first. Google renames these often, so we also ask the API what exists. */
const PREFERRED_IMAGE_MODELS = [
  'gemini-3.1-flash-image',
  'gemini-3.1-flash-image-preview',
  'gemini-3-pro-image',
  'gemini-3-pro-image-preview',
  'gemini-2.5-flash-image',
  'gemini-2.5-flash-image-preview',
];
let imageModelCandidates: string[] | null = null;
let workingImageModel: string | null = null;

/** Ordered list of Gemini image models this key can actually call (cached after the first lookup). */
async function getImageModelCandidates(ai: GoogleGenAI): Promise<string[]> {
  const envModel = process.env.GEMINI_IMAGE_MODEL?.trim();
  if (imageModelCandidates) return imageModelCandidates;
  let available: string[] = [];
  try {
    const pager = await ai.models.list({ config: { pageSize: 200 } });
    for await (const m of pager) {
      const id = (m.name ?? '').replace(/^models\//, '');
      const actions = (m as { supportedActions?: string[] }).supportedActions ?? [];
      if (/gemini/i.test(id) && /image/i.test(id) && (actions.length === 0 || actions.includes('generateContent'))) {
        available.push(id);
      }
    }
  } catch (err) {
    console.warn('[image] could not list models, using defaults:', err instanceof Error ? err.message : err);
    available = [];
  }
  const ordered = available.length
    ? [
        ...PREFERRED_IMAGE_MODELS.filter((m) => available.includes(m)),
        ...available.filter((m) => !PREFERRED_IMAGE_MODELS.includes(m)).sort((a, b) => Number(/flash/.test(b)) - Number(/flash/.test(a))),
      ]
    : PREFERRED_IMAGE_MODELS;
  imageModelCandidates = [envModel, ...ordered].filter((m, i, all): m is string => Boolean(m) && all.indexOf(m) === i);
  console.log('[image] model candidates:', imageModelCandidates.join(', '));
  return imageModelCandidates;
}

/** Turn a Gemini error into something a booth operator can act on. */
function explainGeminiError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (/API key not valid|API_KEY_INVALID|PERMISSION_DENIED|401|403/i.test(msg)) return 'Gemini rejected the API key.';
  if (/quota|RESOURCE_EXHAUSTED|429|billing/i.test(msg)) return 'Gemini image quota used up or billing not enabled for this key.';
  if (/timed out/i.test(msg)) return 'Gemini took too long to draw the portrait.';
  if (/not found|404|not supported/i.test(msg)) return 'No Gemini image model available for this key.';
  return msg.slice(0, 160);
}

const isModelMissing = (err: unknown) =>
  /not found|404|not supported|unsupported|does not support|INVALID_ARGUMENT.*model/i.test(err instanceof Error ? err.message : String(err));

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '15mb' }));

  app.get('/api/health', async (_req, res) => {
    const ai = getGeminiClient();
    const imageModels = ai ? await getImageModelCandidates(ai).catch(() => []) : [];
    res.json({
      ok: true,
      imageEngine: getImageEngine(),
      imageModel: getImageEngine() === 'filter' ? 'browser photo filter' : getImageEngine() === 'claude' ? CLAUDE_MODEL : (workingImageModel ?? imageModels[0] ?? null),
      aiConfigured: Boolean(getGeminiClient() || getAnthropicApiKey()),
      geminiConfigured: Boolean(getGeminiClient()),
      anthropicConfigured: Boolean(getAnthropicApiKey()),
    });
  });

  app.post('/api/pitch', async (req, res) => {
    const rawBody = (req.body ?? {}) as Record<string, unknown>;
      const input: PitchInput = {
      visitorType: (rawBody.visitorType as PitchInput['visitorType']) || 'PGDM Student',
      name: String(rawBody.name ?? ''),
      currentPosition: String(rawBody.currentPosition ?? ''),
      specialisation: rawBody.specialisation as PitchInput['specialisation'],
      characterId: (rawBody.characterId as PitchInput['characterId']) || 'auto',
      capturedPhotoUrl: String(rawBody.capturedPhotoUrl ?? ''),
      aiCharacterUrl: String(rawBody.aiCharacterUrl ?? ''),
      characterPrompt: String(rawBody.characterPrompt ?? ''),
      cartoonStyle: (rawBody.cartoonStyle as CartoonStyleId) || 'anime-hero',
      personaId: (rawBody.personaId as PitchInput['personaId']) || 'none',
      stickerFont: (rawBody.stickerFont as StickerFontId) || 'cartoon',
      strength1: String(rawBody.strength1 ?? rawBody.strength ?? ''),
      strength2: String(rawBody.strength2 ?? ''),
      weakness: String(rawBody.weakness ?? ''),
      hobby: String(rawBody.hobby ?? ''),
      dreamRole: String(rawBody.dreamRole ?? ''),
      tagline: String(rawBody.tagline ?? ''),
      motivationalLine: String(rawBody.motivationalLine ?? ''),
      tone: rawBody.tone as PitchInput['tone'],
    };

    const validationErrors = validatePitchInput(input);

    if (Object.keys(validationErrors).length > 0) {
      res.status(400).json({ error: 'Please complete all required fields.', fields: validationErrors });
      return;
    }

    const ai = getGeminiClient();
    const anthropicKey = getAnthropicApiKey();

    if (!ai && !anthropicKey) {
      res.status(503).json({
        error: 'Configure GEMINI_API_KEY or ANTHROPIC_API_KEY in Settings > Secrets.',
      });
      return;
    }

    try {
      const typed = (label: string, value: string) =>
        value.trim() ? `${label}: ${value.trim()} (use exactly this word)` : `${label}: (not given, invent a funny one-word answer)`;
      const userPrompt = [
        `Name: ${input.name.trim()}`,
        input.currentPosition.trim()
          ? `Fun facts / what they do: ${input.currentPosition.trim()}`
          : 'Fun facts: (none given, invent something light and relatable such as coffee, meetings, phone battery or snacks)',
        getPersona(input.personaId).flavor
          ? `Card persona: the person is drawn as ${getPersona(input.personaId).flavor}. Make the title and intro playfully match this theme.`
          : 'Card persona: none (everyday portrait).',
        typed('Strength', input.strength1),
        typed('Weakness', input.weakness),
        typed('Hobby', input.hobby),
        'Return ONLY valid JSON with fields: title, intro, strength, weakness, hobby, power, recommended_character.',
      ].join('\n');

      if (anthropicKey) {
        try {
          const parsed = await callAnthropicJson({
            system: EXACT_SYSTEM_PROMPT,
            userPrompt,
          });
          const normalized = normalizePitchResponse(parsed, input);
          res.json(normalized);
          return;
        } catch (anthropicErr) {
          if (!ai) {
            throw anthropicErr;
          }
          console.warn(
            'Anthropic pitch call failed, falling back to Gemini:',
            anthropicErr instanceof Error ? anthropicErr.message : anthropicErr
          );
        }
      }

      const response = await Promise.race([
        ai!.models.generateContent({
          model: 'gemini-4-hydrogen',
          contents: userPrompt,
          config: {
            systemInstruction: EXACT_SYSTEM_PROMPT,
            responseMimeType: 'application/json',
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING, description: 'Funny 2-4 word epithet, max 28 chars, no name.' },
                intro: { type: Type.STRING, description: 'Exactly two short punchy sentences, 14-24 words total.' },
                strength: { type: Type.STRING, description: 'ONE word.' },
                weakness: { type: Type.STRING, description: 'ONE word.' },
                hobby: { type: Type.STRING, description: 'ONE word.' },
                power: { type: Type.INTEGER, description: '60-99' },
                recommended_character: {
                  type: Type.STRING,
                  description:
                    'Pick the best matching cartoon ID from: gadget-cat, mischief-maverick, harmony-ace, strategy-prodigy, visionary-captain, data-wizard.',
                },
              },
              required: ['title', 'intro', 'strength', 'weakness', 'hobby', 'power', 'recommended_character'],
            },
          },
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Gemini API timed out after 10s.')), 10000)
        ),
      ]);

      const rawText = (response.text ?? '').trim();
      const parsed = extractJsonObject(rawText);
      const normalized = normalizePitchResponse(parsed, input);
      res.json(normalized);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate pitch via AI.';
      res.status(502).json({ error: message });
    }
  });

  app.post('/api/say-it', async (req, res) => {
    const { audioBase64, mimeType, targetPitch, dreamRole, name } = (req.body ?? {}) as {
      audioBase64?: string;
      mimeType?: string;
      targetPitch?: string;
      dreamRole?: string;
      name?: string;
    };

    if (!audioBase64 || !mimeType) {
      res.status(400).json({ error: 'Audio recording payload is required.' });
      return;
    }

    const ai = getGeminiClient();
    if (!ai) {
      res.status(503).json({ error: 'Gemini API key is not configured on this server.' });
      return;
    }

    try {
      const transcribeResponse = await ai.models.generateContent({
        model: 'gemini-3.5-transcribe',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType,
                data: audioBase64,
              },
            },
            {
              text: 'Transcribe this spoken 30-second elevator pitch verbatim in English.',
            },
          ],
        },
      });

      const transcript = (transcribeResponse.text ?? '').trim();
      if (!transcript) {
        res.status(422).json({ error: 'No clear speech was detected in the recording. Please try speaking closer to the mic.' });
        return;
      }

      const coachResponse = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: [
          `Speaker: ${name || 'Booth Visitor'}`,
          `Focus / Role: ${dreamRole || 'Leadership Pitch'}`,
          `Target Script: ${targetPitch || '(none provided)'}`,
          `Spoken Transcript: ${transcript}`,
          'Give ONE specific, encouraging, practical improvement tip (max 28 words) on delivery, clarity, or example impact.',
        ].join('\n'),
        config: {
          systemInstruction:
            'You are a concise, supportive placement & leadership pitch coach at Dr. D. Y. Patil B-School, Pune. Return ONLY valid JSON with one string field named tip.',
          responseMimeType: 'application/json',
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              tip: {
                type: Type.STRING,
                description: 'One concise improvement tip (max 28 words).',
              },
            },
            required: ['tip'],
          },
        },
      });

      const parsedTip = JSON.parse((coachResponse.text ?? '{}').trim()) as { tip?: string };
      res.json({
        transcript,
        tip:
          parsedTip.tip?.trim() ||
          'Pause briefly before sharing your example metric so listeners catch the impact clearly.',
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to transcribe or coach the audio.';
      res.status(502).json({ error: message });
    }
  });

  // Sample avatar per style for the booth tiles (Claude engine). No API call.
  app.get('/api/style-preview/:styleId.svg', (req, res) => {
    try {
      res.type('image/svg+xml').set('Cache-Control', 'public, max-age=3600');
      res.send(stylePreviewSvg(req.params.styleId as CartoonStyleId, String(req.query.seed ?? 'Power Card')));
    } catch {
      res.status(404).end();
    }
  });

  app.post('/api/character', async (req, res) => {
    const rawBody = (req.body ?? {}) as {
      imageDataUrl?: string;
      specialisation?: Specialisation;
      visitorType?: VisitorType;
      dreamRole?: string;
      cartoonStyle?: CartoonStyleId;
      personaId?: PersonaId;
      customPrompt?: string;
      isEdit?: boolean;
    };

    const imageDataUrl = (rawBody.imageDataUrl ?? '').trim();
    const customPrompt = (rawBody.customPrompt ?? '').trim();
    const resolvedStyle: CartoonStyleId = rawBody.cartoonStyle || 'bold-toon';

    // Filter engine: the browser applies the photo filter itself; nothing to call.
    if (getImageEngine() === 'filter' && !rawBody.isEdit) {
      res.json({ imageUrl: null, fallbackMode: 'photo-filter', styleUsed: resolvedStyle });
      return;
    }

    // Claude engine: vision picks avatar-kit parts, DiceBear draws the portrait.
    if (getImageEngine() === 'claude' && imageDataUrl && !rawBody.isEdit) {
      const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/.exec(imageDataUrl);
      if (!match) {
        res.status(400).json({ error: 'Invalid captured image format. Please capture or upload PNG/JPEG/WebP.' });
        return;
      }
      try {
        const { imageUrl } = await claudePortrait({
          imageBase64: match[2],
          mimeType: match[1],
          styleId: resolvedStyle,
          seed: String(imageDataUrl.length),
        });
        res.json({ imageUrl, fallbackMode: 'claude-avatar', model: CLAUDE_MODEL, styleUsed: resolvedStyle });
      } catch (err) {
        const reason = err instanceof Anthropic.AuthenticationError
          ? 'Claude rejected the API key.'
          : err instanceof Anthropic.RateLimitError
            ? 'Claude rate limit reached, try again in a moment.'
            : err instanceof Error
              ? err.message.slice(0, 160)
              : 'Claude portrait failed.';
        console.warn('[claude-art] falling back to offline filter:', reason);
        res.json({
          imageUrl: null,
          fallbackMode: 'comic-cel-shade',
          styleUsed: resolvedStyle,
          notice: `AI portrait unavailable (${reason}) Used the offline cartoon filter instead.`,
        });
      }
      return;
    }

    const ai = getGeminiClient();
    if (!ai) {
      res.json({
        imageUrl: null,
        fallbackMode: 'comic-cel-shade',
        styleUsed: resolvedStyle,
        notice: 'AI portrait unavailable (no GEMINI_API_KEY in .env). Used the offline cartoon filter instead.',
      });
      return;
    }

    try {
      const parts: Array<
        { inlineData: { data: string; mimeType: string } } | { text: string }
      > = [];

      if (imageDataUrl) {
        const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/.exec(imageDataUrl);
        if (!match) {
          res.status(400).json({ error: 'Invalid captured image format. Please capture or upload PNG/JPEG/WebP.' });
          return;
        }
        parts.push({
          inlineData: {
            mimeType: match[1],
            data: match[2],
          },
        });
      }

      // Attach the style reference after the photo (only when transforming a photo, not when editing).
      const styleRef = imageDataUrl && !rawBody.isEdit ? loadStyleReference(resolvedStyle) : null;
      if (styleRef) {
        parts.push({ inlineData: styleRef });
      }

      const promptText = buildCharacterGenerationPrompt({
        hasStyleReference: Boolean(styleRef),
        specialisation: rawBody.specialisation || 'Business Analytics',
        visitorType: rawBody.visitorType || 'PGDM Student',
        dreamRole: rawBody.dreamRole,
        cartoonStyle: resolvedStyle,
        personaId: rawBody.personaId,
        customPrompt,
        isEdit: Boolean(rawBody.isEdit),
        hasReferencePhoto: Boolean(imageDataUrl),
      });

      parts.push({ text: promptText });

      const tryGenerateWithModel = async (modelId: string) => {
        const imageConfig = { aspectRatio: '4:3' };

        const response = await Promise.race([
          ai.models.generateContent({
            model: modelId,
            contents: { parts },
            config: { responseModalities: ['IMAGE'], imageConfig },
          }),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error(`Image generation timed out on ${modelId}.`)), 40000)
          ),
        ]);

        for (const part of response.candidates?.[0]?.content?.parts ?? []) {
          if (part.inlineData?.data) {
            const mime = part.inlineData.mimeType ?? 'image/png';
            return `data:${mime};base64,${part.inlineData.data}`;
          }
        }
        return '';
      };

      // Use the model that worked last time first; only fall through to the next one if a model is missing.
      const listed = await getImageModelCandidates(ai);
      const candidates = workingImageModel ? [workingImageModel, ...listed.filter((m) => m !== workingImageModel)] : listed;

      let generatedImageUrl = '';
      let usedModel = candidates[0];
      let lastErr: unknown = null;
      const started = Date.now();
      for (const modelId of candidates) {
        if (Date.now() - started > 55000) break;
        try {
          generatedImageUrl = await tryGenerateWithModel(modelId);
          usedModel = modelId;
          if (generatedImageUrl) {
            workingImageModel = modelId;
            break;
          }
        } catch (err) {
          lastErr = err;
          console.warn(`[image] ${modelId} failed:`, err instanceof Error ? err.message : err);
          if (!isModelMissing(err)) break; // quota, key or timeout problems will not be fixed by another model
        }
      }
      if (!generatedImageUrl && lastErr) throw lastErr;

      if (!generatedImageUrl) {
        res.json({
          imageUrl: null,
          fallbackMode: 'comic-cel-shade',
          styleUsed: resolvedStyle,
          notice:
            'Applied Studio Comic & Sketch filter automatically (no image part returned by Gemini).',
        });
        return;
      }

      res.json({
        imageUrl: generatedImageUrl,
        fallbackMode: 'gemini-ai',
        model: usedModel,
        styleUsed: resolvedStyle,
      });
    } catch (err) {
      const reason = explainGeminiError(err);
      console.warn('[image] falling back to offline filter:', reason);
      res.json({
        imageUrl: null,
        fallbackMode: 'comic-cel-shade',
        styleUsed: resolvedStyle,
        notice: `AI portrait unavailable (${reason}) Used the offline cartoon filter instead.`,
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`My Pitch Card booth server listening on http://localhost:${PORT}`);
  });
}

startServer();
