import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import {
  EXACT_SYSTEM_PROMPT,
  buildCharacterGenerationPrompt,
  extractJsonObject,
  normalizePitchResponse,
  validatePitchInput,
} from './src/utils/pitch.ts';
import type {
  CartoonStyleId,
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

async function callAnthropicJson(params: {
  apiKey: string;
  system: string;
  userPrompt: string;
}): Promise<unknown> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 18000);
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'content-type': 'application/json',
        'x-api-key': params.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-5-5',
        max_tokens: 2400,
        system: params.system,
        messages: [{ role: 'user', content: params.userPrompt }],
      }),
    });

    const data = (await response.json()) as {
      error?: { message?: string };
      content?: Array<{ type?: string; text?: string }>;
    };

    if (!response.ok) {
      throw new Error(data.error?.message || `Anthropic API error (${response.status}).`);
    }

    const combinedText = (data.content ?? [])
      .filter((c) => typeof c.text === 'string' && c.text.trim().length > 0)
      .map((c) => c.text!.trim())
      .join('\n');
    if (!combinedText) {
      throw new Error('Anthropic returned an empty response.');
    }

    return extractJsonObject(combinedText);
  } finally {
    clearTimeout(timeout);
  }
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '15mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({
      ok: true,
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
      stickerFont: (rawBody.stickerFont as StickerFontId) || 'cartoon',
      strength1: String(rawBody.strength1 ?? rawBody.strength ?? ''),
      strength2: String(rawBody.strength2 ?? ''),
      weakness: String(rawBody.weakness ?? ''),
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
      const isVip = input.visitorType !== 'PGDM Student';
      const userPrompt = [
        `Visitor Profile: ${input.visitorType}`,
        `Name: ${input.name.trim()}`,
        input.currentPosition.trim()
          ? `Current Position / Company: ${input.currentPosition.trim()}`
          : 'Current Position: (optional / not specified)',
        `Event Host: #DYPAICoE Launch, Dr. D. Y. Patil B-School, Pune`,
        `Domain / Specialisation: ${input.specialisation}`,
        `Raw Strength 1: ${input.strength1.trim()}`,
        input.strength2.trim()
          ? `Raw Strength 2: ${input.strength2.trim()}`
          : 'Raw Strength 2: (NONE PROVIDED — return empty string "" for refined_strength2 and do NOT invent a second strength)',
        `Raw Weakness: ${input.weakness.trim()}`,
        `Target Role / Strategic Focus: ${input.dreamRole.trim() || (isVip ? 'Industry-Academia AI Collaboration & Growth' : 'Leadership Role')}`,
        input.tagline.trim() ? `Tagline: ${input.tagline.trim()}` : 'Tagline: (craft 1 punchy tagline, max 10 words)',
        input.motivationalLine.trim()
          ? `Motivational line: ${input.motivationalLine.trim()}`
          : 'Motivational line: (write 1 unique, inspiring motivational line tailored to this visitor, max 16 words)',
        `Tone: ${input.tone}`,
        'IMPORTANT TASK: Rephrase and upgrade Raw Strength 1, Raw Strength 2 (only if provided), and Raw Weakness into polished, executive-grade business terminology (never leave casual slang raw). Deliver a crisp, natural-sounding 30-second pitch with strong active verbs, concrete commercial value, and zero filler clichés ("hardworking team player", "passionate learner"). For a Company Owner / Founder or Director / CXO, frame the pitch and headline around executive leadership, market impact, and #DYPAICoE industry collaboration rather than job-seeking.',
        'Return ONLY valid JSON with fields: pitch, linkedin_headline, keywords (array of 3 strings), refined_strength1, refined_strength2, refined_weakness, tagline, motivational_line, recommended_character.',
      ].join('\n');

      if (anthropicKey) {
        try {
          const parsed = await callAnthropicJson({
            apiKey: anthropicKey,
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
                pitch: {
                  type: Type.STRING,
                  description:
                    'A 30-second first-person intro/pitch (70-80 words) using polished executive terminology.',
                },
                linkedin_headline: {
                  type: Type.STRING,
                  description: 'Max 200 characters using | separators.',
                },
                keywords: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: '3 high-signal domain skills or executive pillars.',
                },
                refined_strength1: {
                  type: Type.STRING,
                  description: 'Rephrased executive version of Strength 1 (max 10 words).',
                },
                refined_strength2: {
                  type: Type.STRING,
                  description: 'Rephrased executive version of Strength 2 or empty string if omitted (max 10 words).',
                },
                refined_weakness: {
                  type: Type.STRING,
                  description: 'Constructive, interview-ready growth edge rephrasing of Raw Weakness (max 10 words).',
                },
                tagline: {
                  type: Type.STRING,
                  description: 'Punchy personal positioning tagline (max 10 words).',
                },
                motivational_line: {
                  type: Type.STRING,
                  description: 'Unique mini motivational line (10-16 words) tailored to this visitor.',
                },
                recommended_character: {
                  type: Type.STRING,
                  description:
                    'Pick the best matching cartoon ID from: gadget-cat, mischief-maverick, harmony-ace, strategy-prodigy, visionary-captain, data-wizard.',
                },
              },
              required: [
                'pitch',
                'linkedin_headline',
                'keywords',
                'refined_strength1',
                'refined_strength2',
                'refined_weakness',
                'tagline',
                'motivational_line',
                'recommended_character',
              ],
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

  app.post('/api/character', async (req, res) => {
    const rawBody = (req.body ?? {}) as {
      imageDataUrl?: string;
      specialisation?: Specialisation;
      visitorType?: VisitorType;
      dreamRole?: string;
      cartoonStyle?: CartoonStyleId;
      customPrompt?: string;
      isEdit?: boolean;
    };

    const imageDataUrl = (rawBody.imageDataUrl ?? '').trim();
    const customPrompt = (rawBody.customPrompt ?? '').trim();
    const resolvedStyle: CartoonStyleId = rawBody.cartoonStyle || 'anime-hero';

    const ai = getGeminiClient();
    if (!ai) {
      res.json({
        imageUrl: null,
        fallbackMode: 'comic-cel-shade',
        styleUsed: resolvedStyle,
        notice:
          'Applied Studio Comic & Sketch filter automatically (add GEMINI_API_KEY in Settings > Secrets for full AI character/sketch generation).',
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

      const promptText = buildCharacterGenerationPrompt({
        specialisation: rawBody.specialisation || 'Business Analytics',
        visitorType: rawBody.visitorType || 'PGDM Student',
        dreamRole: rawBody.dreamRole,
        cartoonStyle: resolvedStyle,
        customPrompt,
        isEdit: Boolean(rawBody.isEdit),
        hasReferencePhoto: Boolean(imageDataUrl),
      });

      parts.push({ text: promptText });

      const tryGenerateWithModel = async (modelId: 'gemini-3.1-flash-lite-image' | 'gemini-nano-banana-2.1') => {
        const imageConfig =
          modelId === 'gemini-nano-banana-2.1'
            ? { aspectRatio: '4:3', imageSize: '1K' }
            : { aspectRatio: '4:3' };

        const response = await Promise.race([
          ai.models.generateContent({
            model: modelId,
            contents: { parts },
            config: { imageConfig },
          }),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error(`Image generation timed out on ${modelId}.`)), 25000)
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

      let generatedImageUrl = '';
      let usedModel = 'gemini-3.1-flash-lite-image';
      try {
        generatedImageUrl = await tryGenerateWithModel('gemini-3.1-flash-lite-image');
      } catch (primaryErr) {
        console.warn(
          'gemini-3.1-flash-lite-image unavailable, trying gemini-nano-banana-2.1:',
          primaryErr instanceof Error ? primaryErr.message : primaryErr
        );
        usedModel = 'gemini-nano-banana-2.1';
        generatedImageUrl = await tryGenerateWithModel('gemini-nano-banana-2.1');
      }

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
      const rawMessage = err instanceof Error ? err.message : 'Unable to generate character image.';
      if (
        /400|401|402|403|404|429|RESOURCE_EXHAUSTED|PERMISSION_DENIED|API_KEY_INVALID|NOT_FOUND|BILLING|QUOTA|timed out|unavailable/i.test(
          rawMessage
        )
      ) {
        res.json({
          imageUrl: null,
          fallbackMode: 'comic-cel-shade',
          styleUsed: resolvedStyle,
          notice:
            'Applied Studio Comic & Sketch filter automatically (enable Gemini image access in Settings > Secrets for full AI character/sketch generation).',
        });
        return;
      }
      res.status(502).json({ error: rawMessage });
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
