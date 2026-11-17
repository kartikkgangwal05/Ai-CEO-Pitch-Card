import test from 'node:test';
import assert from 'node:assert/strict';
import {
  EXACT_SYSTEM_PROMPT,
  SPECIALISATIONS,
  TONES,
  buildFallbackPitch,
  buildSampleVisitors,
  countWords,
  estimateReadSeconds,
  formatQrPlainText,
  generateUniqueMotivationalLine,
  normalizePitchResponse,
  pushVisitorToQueue,
  validatePitchInput,
} from './pitch';
import type { PitchInput } from '../types/pitch';

test('exact system prompt matches specification', () => {
  assert.ok(EXACT_SYSTEM_PROMPT.includes('You are a placement coach for PGDM students at the #DYPAICoE launch, Pune.'));
  assert.ok(EXACT_SYSTEM_PROMPT.includes('linkedin_headline (max 200 characters, using | separators)'));
});

test('validatePitchInput rejects blank required fields and accepts valid input', () => {
  const bad = validatePitchInput({
    name: ' ',
    specialisation: 'Marketing',
    strength: '',
    dreamRole: 'A',
    tone: 'Confident',
  });
  assert.ok(bad.name);
  assert.ok(bad.strength);
  assert.ok(bad.dreamRole);

  const ok = validatePitchInput({
    name: 'Aarav Kulkarni',
    specialisation: 'Business Analytics',
    strength: 'SQL data storytelling',
    dreamRole: 'Product Analyst',
    tone: 'Confident',
  });
  assert.deepEqual(ok, {});
});

test('buildFallbackPitch generates executive phrasing, 66-80 words, [bracket] placeholder, <=200 headline, 3 keywords, and motivationalLine', () => {
  for (const specialisation of SPECIALISATIONS) {
    for (const tone of TONES) {
      const input: PitchInput = {
        name: 'Ananya Patil',
        specialisation,
        strength: 'cross-functional financial modeling',
        dreamRole: 'Management Trainee',
        tone,
      };
      const result = buildFallbackPitch(input);
      const words = countWords(result.pitch);
      assert.ok(words >= 66 && words <= 80, `Expected ~66-80 words for ${specialisation}/${tone}, got ${words}`);
      assert.ok(
        /team\.|day one\.|creation\.|value\.|outcomes\.$/i.test(result.pitch),
        `Expected complete sentence ending, got: ${result.pitch}`
      );
      assert.ok(result.pitch.includes('[') && result.pitch.includes(']'), 'Must include [bracket] example placeholder');
      assert.ok(result.linkedin_headline.length <= 200, 'Headline must be <= 200 chars');
      assert.ok(result.linkedin_headline.includes('|'), 'Headline must use | separators');
      assert.equal(result.keywords.length, 3, 'Must return exactly 3 keywords');
      assert.ok(result.motivationalLine.length > 12, 'Must include mini motivational line');
      assert.equal(result.source, 'template');
    }
  }
});

test('every visitor gets a distinct mini motivational line', () => {
  const samples = buildSampleVisitors();
  const lines = new Set(samples.map((s) => s.motivationalLine));
  assert.equal(lines.size, samples.length, 'Expected each sample visitor to have a distinct motivational line');

  const lineA = generateUniqueMotivationalLine(
    { name: 'Vikram Rao', specialisation: 'Finance', strength: 'risk modeling', dreamRole: 'Credit Analyst', tone: 'Formal' },
    1
  );
  const lineB = generateUniqueMotivationalLine(
    { name: 'Neha Iyer', specialisation: 'HR', strength: 'talent strategy', dreamRole: 'People Partner', tone: 'Friendly' },
    2
  );
  assert.notEqual(lineA, lineB);
});

test('formatQrPlainText includes pitch and headline as plain text with zero URLs', () => {
  const sample = buildSampleVisitors()[0];
  const qrText = formatQrPlainText(sample);
  assert.ok(qrText.includes(sample.pitch));
  assert.ok(qrText.includes(sample.linkedin_headline));
  assert.ok(!qrText.includes('http://') && !qrText.includes('https://'));
});

test('estimateReadSeconds approximates 30s for a 75-word pitch', () => {
  const words75 = Array.from({ length: 75 }, () => 'word').join(' ');
  assert.equal(estimateReadSeconds(words75), 30);
});

test('pushVisitorToQueue keeps at most the last 4 visitors', () => {
  const samples = buildSampleVisitors();
  let queue = pushVisitorToQueue([], samples[0]);
  queue = pushVisitorToQueue(queue, samples[1]);
  queue = pushVisitorToQueue(queue, samples[2]);
  queue = pushVisitorToQueue(queue, samples[3]);
  const extra = { ...samples[0], id: 'visitor-5', name: 'Fifth Student' };
  queue = pushVisitorToQueue(queue, extra);

  assert.equal(queue.length, 4);
  assert.equal(queue[0].id, 'visitor-5');
  assert.equal(queue.some((c) => c.id === samples[0].id), false);
});

test('normalizePitchResponse clamps long headlines, preserves motivational_line, and recovers on invalid payload', () => {
  const input: PitchInput = {
    name: 'Riya Sharma',
    specialisation: 'Marketing',
    strength: 'brand positioning',
    dreamRole: 'Brand Manager',
    tone: 'Friendly',
  };
  const longHeadline = 'A'.repeat(250);
  const normalized = normalizePitchResponse(
    {
      pitch: 'Hello world pitch',
      linkedin_headline: longHeadline,
      keywords: ['SEO', 'GTM'],
      motivational_line: 'Own the room with clarity, Riya.',
    },
    input
  );
  assert.equal(normalized.linkedin_headline.length, 200);
  assert.equal(normalized.keywords.length, 3);
  assert.equal(normalized.motivationalLine, 'Own the room with clarity, Riya.');
  assert.equal(normalized.source, 'ai');

  const fallback = normalizePitchResponse(null, input);
  assert.equal(fallback.source, 'template');
  assert.ok(fallback.motivationalLine.length > 10);
});
