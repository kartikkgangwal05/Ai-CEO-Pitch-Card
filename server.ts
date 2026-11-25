import dotenv from 'dotenv';
// .env.local holds the Blob token pulled by `vercel link`; .env holds the AI keys.
dotenv.config({ path: ['.env.local', '.env'], quiet: true });
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { stylePreviewSvg } from './server/claudeArt.ts';
import { offloadLargeImage, registerHistoryRoutes } from './server/historyStore.ts';
import type { ArtEngine } from './src/utils/claudeStyles.ts';
import { STREAMS } from './src/utils/streams.ts';
import { buildGeminiPrompt } from './server/portraitArt.ts';
import { CAMPUS_JPEG_BASE64 } from './server/campusImage.ts';
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

/**
 * Which service makes the portrait.
 *   filter (default): the browser applies an Instagram-style filter to the real photo.
 *   gemini: Gemini repaints the photo (needs billing).
 */
function getImageEngine(): ArtEngine {
  const forced = process.env.IMAGE_ENGINE?.trim().toLowerCase();
  // Gemini only: the old 'claude' engine is no longer used.
  if (forced === 'gemini' || forced === 'filter') return forced;
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
  if (/spending cap/i.test(msg)) return 'Gemini monthly spending cap reached: raise it at ai.studio/spend. (quota)';
  if (/quota|RESOURCE_EXHAUSTED|429|billing/i.test(msg)) return 'Gemini image quota used up or billing not enabled for this key.';
  if (/timed out/i.test(msg)) return 'Gemini took too long to draw the portrait.';
  if (/not found|404|not supported/i.test(msg)) return 'No Gemini image model available for this key.';
  return msg.slice(0, 160);
}

const isModelMissing = (err: unknown) =>
  /not found|404|not supported|unsupported|does not support|INVALID_ARGUMENT.*model/i.test(err instanceof Error ? err.message : String(err));

/** Set when every Gemini image model refused on quota; the booth header shows it, cleared after 15 min or on success. */
let geminiQuotaUntil = 0;
function geminiStatus(): 'off' | 'quota' | 'ok' {
  if (!getGeminiClient()) return 'off';
  return Date.now() < geminiQuotaUntil ? 'quota' : 'ok';
}

/** Gemini repaints the visitor's photo with the stream card brief; tries the image models this key can use. */
async function geminiPortrait(ai: GoogleGenAI, photo: { mimeType: string; data: Buffer }, stream: Specialisation) {
  const listed = await getImageModelCandidates(ai);
  const candidates = workingImageModel ? [workingImageModel, ...listed.filter((m) => m !== workingImageModel)] : listed;
  const parts = [
    { inlineData: { mimeType: photo.mimeType, data: photo.data.toString('base64') } },
    { inlineData: { mimeType: 'image/jpeg', data: CAMPUS_JPEG_BASE64 } },
    { text: buildGeminiPrompt(stream) },
  ];
  let lastErr: unknown = new Error('No Gemini image model available for this key.');
  const started = Date.now();
  for (const model of candidates) {
    if (Date.now() - started > 55_000) break;
    try {
      // 2K output keeps the face sharp on the printed card; older models reject the size, so retry without it.
      const call = (imageConfig: { aspectRatio: string; imageSize?: string }) =>
        Promise.race([
          ai.models.generateContent({ model, contents: { parts }, config: { responseModalities: ['IMAGE'], imageConfig } }),
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Gemini timed out')), 60_000)),
        ]);
      const response = await call({ aspectRatio: '4:5', imageSize: '2K' }).catch((err) => {
        if (/imageSize|image_size|INVALID_ARGUMENT/i.test(err instanceof Error ? err.message : String(err))) {
          return call({ aspectRatio: '4:5' });
        }
        throw err;
      });
      for (const part of response.candidates?.[0]?.content?.parts ?? []) {
        if (part.inlineData?.data) {
          workingImageModel = model;
          geminiQuotaUntil = 0;
          return { image: `data:${part.inlineData.mimeType ?? 'image/png'};base64,${part.inlineData.data}`, model };
        }
      }
      lastErr = new Error('Gemini returned no image (it may have declined this photo).');
    } catch (err) {
      lastErr = err;
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[gemini] ${model} failed:`, msg.slice(0, 200));
      // Quota is per model, so a quota error moves on to the next model; a bad key or timeout does not.
      if (!isModelMissing(err) && !/quota|RESOURCE_EXHAUSTED|429/i.test(msg)) break;
    }
  }
  if (/quota|RESOURCE_EXHAUSTED|429/i.test(lastErr instanceof Error ? lastErr.message : String(lastErr))) {
    geminiQuotaUntil = Date.now() + 15 * 60_000;
  }
  throw lastErr;
}

/** All API routes, no static serving or listening, so it runs locally and as a Vercel function. */
export async function createApp() {
  const app = express();
  app.use(express.json({ limit: '15mb' }));
  registerHistoryRoutes(app);

  app.get('/api/health', async (_req, res) => {
    const ai = getGeminiClient();
    const imageModels = ai ? await getImageModelCandidates(ai).catch(() => []) : [];
    res.json({
      ok: true,
      imageEngine: getImageEngine(),
      imageModel: getImageEngine() === 'filter' ? 'browser photo filter' : (workingImageModel ?? imageModels[0] ?? null),
      aiConfigured: Boolean(getGeminiClient()),
      geminiConfigured: Boolean(getGeminiClient()),
      geminiStatus: geminiStatus(),
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
      cardTitle: String(rawBody.cardTitle ?? '').trim().slice(0, 30),
    };

    const validationErrors = validatePitchInput(input);

    if (Object.keys(validationErrors).length > 0) {
      res.status(400).json({ error: 'Please complete all required fields.', fields: validationErrors });
      return;
    }

    const ai = getGeminiClient();
    if (!ai) {
      res.status(503).json({
        error: 'Configure GEMINI_API_KEY in Settings > Secrets.',
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
        rawBody.design === 'arcane'
          ? `Stream: ${input.specialisation}. This is a magic-academy card: the person is ${STREAMS[input.specialisation]?.flavor ?? 'a business wizard'}. Make the title a funny wizard-style epithet tied to this stream (e.g. "The Spreadsheet Sorcerer", "Archmage of Appraisals"), and keep any invented stats relevant to the stream.`
          : `Stream: ${input.specialisation}.`,
        typed('Strength', input.strength1),
        typed('Weakness', input.weakness),
        typed('Hobby', input.hobby),
        input.cardTitle?.trim()
          ? `Card title: "${input.cardTitle.trim().slice(0, 30)}" (chosen by the person: return exactly this title, and build the intro around it)`
          : 'Card title: (not given, invent one)',
      ].join('\n');

      const response = await Promise.race([
        ai.models.generateContent({
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
                intro: {
                  type: Type.STRING,
                  description: 'Exactly two short sentences, 14-22 words total: the strength in action, then a witty twist on the weakness or hobby.',
                },
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
          setTimeout(() => reject(new Error('Gemini API timed out after 20s.')), 20000)
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

  // Rewrites the card's two-line quote (intro) in a chosen style, Gemini only.
  const RESTYLE_BRIEFS: Record<string, string> = {
    funnier: 'Make it funnier: a sharper, more surprising roast, still warm.',
    inspiring: 'Make it uplifting and inspiring, like a hero introduction, with a light touch of humour.',
    poetic: 'Make it poetic and vivid, like a line from an epic, with one fresh image.',
    rhyme: 'Make the two sentences rhyme, like a fun couplet.',
    shorter: 'Make it much shorter and punchier: two very short sentences, 10-14 words total.',
    bollywood: 'Make it sound like a dramatic Bollywood movie trailer voice-over, playful and over the top.',
  };

  app.post('/api/restyle', async (req, res) => {
    const { text, name, title, stream, style } = (req.body ?? {}) as Record<string, string | undefined>;
    const ai = getGeminiClient();
    if (!ai) {
      res.status(503).json({ error: 'Configure GEMINI_API_KEY in Settings > Secrets.' });
      return;
    }
    const brief = RESTYLE_BRIEFS[style ?? ''];
    if (!brief || !text?.trim()) {
      res.status(400).json({ error: 'Send the current text and a known style.' });
      return;
    }
    const prompt = [
      `Rewrite this power-card quote for ${String(name ?? '').slice(0, 40) || 'the card holder'}${title ? ` ("${String(title).slice(0, 40)}")` : ''}${stream ? `, ${String(stream).slice(0, 40)} stream` : ''}.`,
      `Current quote: "${text.trim().slice(0, 300)}"`,
      brief,
      'Keep the same facts. Two sentences, 12-24 words total unless told shorter.',
    ].join('\n');
    try {
      const response = await Promise.race([
        ai.models.generateContent({
          model: 'gemini-4-hydrogen',
          contents: prompt,
          config: {
            systemInstruction: EXACT_SYSTEM_PROMPT,
            responseMimeType: 'application/json',
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
            responseSchema: {
              type: Type.OBJECT,
              properties: { intro: { type: Type.STRING, description: 'The rewritten quote.' } },
              required: ['intro'],
            },
          },
        }),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Gemini timed out after 20s.')), 20000)),
      ]);
      const intro = String((JSON.parse((response.text ?? '{}').trim()) as { intro?: string }).intro ?? '').trim();
      if (!intro) throw new Error('Gemini returned no text.');
      res.json({ intro: intro.slice(0, 170) });
    } catch (err) {
      res.status(502).json({ error: err instanceof Error ? err.message : 'Restyle failed.' });
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

  // Stream portrait painted by Gemini from the visitor's photo. The browser sends a photo already
  // resized under 512x512; on any failure the booth keeps its in-browser portrait.
  app.post('/api/magic-portrait', async (req, res) => {
    const { imageDataUrl, stream } = (req.body ?? {}) as { imageDataUrl?: string; stream?: Specialisation };
    const gemini = getGeminiClient();
    if (!gemini) {
      res.status(503).json({ error: 'GEMINI_API_KEY is not set, so AI portraits are off.' });
      return;
    }
    const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/.exec(imageDataUrl ?? '');
    if (!match || !stream || !(stream in STREAMS)) {
      res.status(400).json({ error: 'A photo and a valid stream are required.' });
      return;
    }
    const photo = { mimeType: match[1], data: Buffer.from(match[2], 'base64') };
    // Gemini paints the portrait from the visitor's photo with the stream art brief.
    {
      const started = Date.now();
      try {
        const { image, model } = await geminiPortrait(gemini, photo, stream);
        console.log(`[gemini] portrait for ${stream} with ${model} in ${Date.now() - started} ms`);
        res.json({ image: await offloadLargeImage(image).catch(() => image), provider: 'gemini' });
        return;
      } catch (err) {
        const reason = explainGeminiError(err);
        console.warn('[gemini]', reason);
        res.status(reason.includes('quota') ? 429 : 502).json({ error: reason });
      }
    }
  });

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

  return app;
}

async function startServer() {
  const app = await createApp();

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

// On Vercel the app is served by api/index.ts instead.
if (!process.env.VERCEL) void startServer();
