// One-off: paints the start screen's sample cards with Gemini (fictional students).
// Run: npx tsx scripts/generate-samples.ts
import 'dotenv/config';
import { writeFileSync } from 'node:fs';
import { GoogleGenAI } from '@google/genai';
import { buildSamplePrompt } from '../server/portraitArt.ts';
import { CAMPUS_JPEG_BASE64 } from '../server/campusImage.ts';
import type { Specialisation } from '../src/types/pitch.ts';

const SAMPLES: [Specialisation, string, string][] = [
  ['HR', 'hr', 'a young Indian business-school student with long dark wavy hair'],
  ['Business Analytics', 'ba', 'a young Indian business-school student with short dark hair, rectangular glasses and a trimmed beard'],
  ['Finance', 'finance', 'a young Indian business-school student with dark hair tied in a neat bun'],
  ['Marketing', 'marketing', 'a young Indian business-school student with curly dark hair and a warm smile'],
  ['Executive Leadership', 'leadership', 'a confident Indian business leader in their forties with short greying hair'],
];

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
const MODEL = process.env.GEMINI_IMAGE_MODEL?.trim() || 'gemini-3.1-flash-image';
const only = process.argv.slice(2); // optional: file ids to (re)generate, e.g. `finance hr`

async function generate(prompt: string): Promise<string> {
  const res = await ai.models.generateContent({
    model: MODEL,
    contents: { parts: [{ inlineData: { mimeType: 'image/jpeg', data: CAMPUS_JPEG_BASE64 } }, { text: prompt }] },
    config: { responseModalities: ['IMAGE'], imageConfig: { aspectRatio: '4:5' } },
  });
  const part = res.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data);
  if (!part?.inlineData?.data) throw new Error('Gemini returned no image');
  return `data:${part.inlineData.mimeType ?? 'image/png'};base64,${part.inlineData.data}`;
}

for (const [stream, file, who] of SAMPLES) {
  if (only.length && !only.includes(file)) continue;
  const t = Date.now();
  try {
    const url = await generate(buildSamplePrompt(stream, who));
    writeFileSync(`public/samples/${file}.jpg`, Buffer.from(url.split(',')[1], 'base64'));
    console.log(`${file}: ok in ${Date.now() - t} ms`);
  } catch (err) {
    console.log(`${file}: FAILED ${(err as Error).message}`);
  }
}
