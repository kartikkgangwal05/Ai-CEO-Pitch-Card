// One-off: paints the start screen's sample cards with Cloudflare Workers AI (fictional students).
// Run: npx tsx scripts/generate-samples.ts
import 'dotenv/config';
import { writeFileSync } from 'node:fs';
import { buildSamplePrompt, generate } from '../server/cloudflareArt.ts';
import type { Specialisation } from '../src/types/pitch.ts';

const SAMPLES: [Specialisation, string, string][] = [
  ['HR', 'hr', 'a young Indian business-school student with long dark wavy hair'],
  ['Business Analytics', 'ba', 'a young Indian business-school student with short dark hair, rectangular glasses and a trimmed beard'],
  ['Finance', 'finance', 'a young Indian business-school student with dark hair tied in a neat bun'],
  ['Marketing', 'marketing', 'a young Indian business-school student with curly dark hair and a warm smile'],
  ['Executive Leadership', 'leadership', 'a confident Indian business leader in their forties with short greying hair'],
];

for (const [stream, file, who] of SAMPLES) {
  const t = Date.now();
  try {
    const url = await generate(null, buildSamplePrompt(stream, who));
    writeFileSync(`public/samples/${file}.jpg`, Buffer.from(url.split(',')[1], 'base64'));
    console.log(`${file}: ok in ${Date.now() - t} ms`);
  } catch (err) {
    console.log(`${file}: FAILED ${(err as Error).message}`);
  }
}
