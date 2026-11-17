import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import { EXACT_SYSTEM_PROMPT, normalizePitchResponse, validatePitchInput } from './src/utils/pitch.ts';
import type { PitchInput } from './src/types/pitch.ts';

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

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '15mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, aiConfigured: Boolean(getGeminiClient()) });
  });

  app.post('/api/pitch', async (req, res) => {
    const input = req.body as PitchInput;
    const validationErrors = validatePitchInput({
      name: String(input?.name ?? ''),
      specialisation: input?.specialisation,
      strength: String(input?.strength ?? ''),
      dreamRole: String(input?.dreamRole ?? ''),
      tone: input?.tone,
    });

    if (Object.keys(validationErrors).length > 0) {
      res.status(400).json({ error: 'Please complete all required fields.', fields: validationErrors });
      return;
    }

    const ai = getGeminiClient();
    if (!ai) {
      res.status(503).json({ error: 'Gemini API key is not configured on this server.' });
      return;
    }

    try {
      const userPrompt = [
        `Name: ${input.name.trim()}`,
        `Specialisation: ${input.specialisation}`,
        `One strength: ${input.strength.trim()}`,
        `Dream role: ${input.dreamRole.trim()}`,
        `Tone: ${input.tone}`,
        'Use polished, executive PGDM and corporate terminology (such as stakeholder alignment, commercial impact, analytical rigor, value creation, cross-functional execution) while keeping sentences crisp, natural, and strictly 70-80 words.',
        'Also include motivational_line: one short, original motivational line (10-16 words) tailored uniquely to this visitor.',
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
                pitch: {
                  type: Type.STRING,
                  description:
                    'A 30-second first-person "Tell me about yourself" answer (70-80 words) using polished executive terminology: present who I am, proof of one strength with a concrete example placeholder in [brackets], and future + why the dream role.',
                },
                linkedin_headline: {
                  type: Type.STRING,
                  description: 'Max 200 characters using | separators.',
                },
                keywords: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: '3 skills recruiters search for in that role.',
                },
                motivational_line: {
                  type: Type.STRING,
                  description: 'One short, unique mini motivational line (10-16 words) personalized for this visitor.',
                },
              },
              required: ['pitch', 'linkedin_headline', 'keywords', 'motivational_line'],
            },
          },
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Gemini API timed out after 10s.')), 10000)
        ),
      ]);

      const rawText = (response.text ?? '').trim();
      const parsed = JSON.parse(rawText);
      const normalized = normalizePitchResponse(parsed, input);
      res.json(normalized);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate pitch via Gemini.';
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
              text: 'Transcribe this spoken 30-second student elevator pitch verbatim in English.',
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
          `Student: ${name || 'PGDM Candidate'}`,
          `Dream Role: ${dreamRole || 'Target Placement Role'}`,
          `Target Script: ${targetPitch || '(none provided)'}`,
          `Spoken Transcript: ${transcript}`,
          'Give ONE specific, encouraging, practical improvement tip (max 28 words) on delivery, clarity, or example impact.',
        ].join('\n'),
        config: {
          systemInstruction:
            'You are a concise, supportive placement pitch coach at Dr. D. Y. Patil B-School, Pune. Return ONLY valid JSON with one string field named tip.',
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
          'Pause briefly before sharing your example metric so recruiters catch the impact clearly.',
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to transcribe or coach the audio.';
      res.status(502).json({ error: message });
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
