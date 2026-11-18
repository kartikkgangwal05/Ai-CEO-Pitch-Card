import test from 'node:test';
import assert from 'node:assert/strict';
import {
  EXACT_SYSTEM_PROMPT,
  buildCharacterGenerationPrompt,
  buildFallbackPitch,
  estimateReadSeconds,
  extractJsonObject,
  formatQrPlainText,
  generateUniqueMotivationalLine,
  getStickerFontClass,
  normalizePitchResponse,
  pushVisitorToQueue,
  refineStrengthTerm,
  refineWeaknessTerm,
  selectSmartCharacter,
  validatePitchInput,
} from './pitch';
import { boostVibrancy, computeSketchShade, computeSobelEdge, quantizeChannel } from './cartoonize';
import type { PitchInput } from '../types/pitch';

const BASE_STUDENT: PitchInput = {
  visitorType: 'PGDM Student',
  name: 'Aarav Kulkarni',
  currentPosition: '',
  specialisation: 'Business Analytics',
  characterId: 'auto',
  capturedPhotoUrl: '',
  aiCharacterUrl: '',
  characterPrompt: '',
  cartoonStyle: 'anime-hero',
  stickerFont: 'cartoon',
  strength1: 'good at excel and BI dashboards',
  strength2: 'automated SQL reporting',
  weakness: 'overthinking details',
  dreamRole: 'Product Analyst',
  tagline: '',
  motivationalLine: '',
  tone: 'Confident',
};

test('exact system prompt matches specification', () => {
  assert.ok(EXACT_SYSTEM_PROMPT.includes('#DYPAICoE launch, Pune'));
  assert.ok(EXACT_SYSTEM_PROMPT.includes('70-80 words'));
  assert.ok(EXACT_SYSTEM_PROMPT.includes('linkedin_headline (max 200 characters'));
});

test('validatePitchInput allows optional currentPosition and optional dreamRole for Owners/Directors', () => {
  const invalidStudent = validatePitchInput({ ...BASE_STUDENT, name: 'A', dreamRole: '' });
  assert.ok(invalidStudent.name);
  assert.ok(invalidStudent.dreamRole);

  const validOwner = validatePitchInput({
    ...BASE_STUDENT,
    visitorType: 'Company Owner / Founder',
    specialisation: 'Executive Leadership',
    currentPosition: '',
    dreamRole: '',
  });
  assert.deepEqual(validOwner, {});
});

test('refineStrengthTerm and refineWeaknessTerm upgrade casual phrasing into executive terms', () => {
  const upgradedStrength = refineStrengthTerm('good at excel', 'Finance');
  assert.match(upgradedStrength, /Modeling|Spreadsheet|Executive/i);

  const upgradedWeakness = refineWeaknessTerm('stage fear');
  assert.match(upgradedWeakness, /Stage Pacing|Executive/i);
  assert.notEqual(upgradedWeakness.toLowerCase(), 'stage fear');
});

test('selectSmartCharacter matches Shinchan/Doraemon/Shizuka/Captain personas from details', () => {
  assert.equal(
    selectSmartCharacter({
      ...BASE_STUDENT,
      specialisation: 'Marketing',
      strength1: 'viral social campaigns & funny storytelling',
    }),
    'mischief-maverick'
  );
  assert.equal(
    selectSmartCharacter({
      ...BASE_STUDENT,
      specialisation: 'Business Analytics',
      strength1: 'building AI bots and smart automation gadgets',
    }),
    'gadget-cat'
  );
  assert.equal(
    selectSmartCharacter({
      ...BASE_STUDENT,
      specialisation: 'HR',
      strength1: 'empathetic team mentoring and people harmony',
    }),
    'harmony-ace'
  );
  assert.equal(
    selectSmartCharacter({
      ...BASE_STUDENT,
      visitorType: 'Director / CXO',
      specialisation: 'Executive Leadership',
      strength1: 'scaling enterprise partnerships',
    }),
    'visionary-captain'
  );
});

test('buildFallbackPitch generates polished strengths, weakness, tagline, motivational line, and valid pitch', () => {
  const result = buildFallbackPitch(BASE_STUDENT, 1);
  const words = result.pitch.trim().split(/\s+/).length;
  assert.ok(words >= 66 && words <= 85, `Expected ~70-80 words, got ${words}`);
  assert.match(result.pitch, /\[.+\]/);
  assert.match(result.pitch, /[.!?]$/);
  assert.match(result.pitch, /commercial|outcomes|stakeholder|decision/i);
  assert.equal(/hardworking|eager to learn/i.test(result.pitch), false);
  assert.ok(result.linkedin_headline.length <= 200);
  assert.equal(result.keywords.length, 3);
  assert.ok(result.tagline.length > 5);
  assert.ok(result.motivationalLine.length > 10);
  assert.notEqual(result.weakness.toLowerCase(), 'overthinking details');
});

test('Owner / Director card handles optional currentPosition and optional Strength 2 gracefully', () => {
  const result = buildFallbackPitch({
    visitorType: 'Company Owner / Founder',
    name: 'Vikram Rao',
    currentPosition: '',
    specialisation: 'Executive Leadership',
    characterId: 'auto',
    capturedPhotoUrl: '',
    aiCharacterUrl: '',
    characterPrompt: '',
    cartoonStyle: 'anime-hero',
    stickerFont: 'futurist',
    strength1: 'building ventures',
    strength2: '',
    weakness: 'impatient with slow decisions',
    dreamRole: '',
    tagline: '',
    motivationalLine: '',
    tone: 'Confident',
  });
  assert.equal(result.resolvedCharacterId, 'visionary-captain');
  assert.equal(result.strength2, '');
  assert.match(result.pitch, /Founder|Managing Leader|DYPAICoE/i);
  assert.match(result.weakness, /Milestone|Velocity/i);
});

test('every visitor gets a distinct mini motivational line', () => {
  const m1 = generateUniqueMotivationalLine({ ...BASE_STUDENT, name: 'Aarav' }, 1);
  const m2 = generateUniqueMotivationalLine(
    { ...BASE_STUDENT, name: 'Sneha', specialisation: 'Marketing', dreamRole: 'Brand Lead' },
    2
  );
  assert.notEqual(m1, m2);
});

test('formatQrPlainText includes pitch and headline as plain text with zero URLs', () => {
  const pitch = buildFallbackPitch(BASE_STUDENT);
  const qr = formatQrPlainText({
    ...BASE_STUDENT,
    ...pitch,
  });
  assert.ok(qr.includes(BASE_STUDENT.name));
  assert.ok(qr.includes(pitch.linkedin_headline));
  assert.ok(qr.includes(pitch.pitch));
  assert.equal(/https?:\/\//i.test(qr), false);
});

test('estimateReadSeconds approximates 30s for a 75-word pitch', () => {
  const words = Array.from({ length: 75 }, () => 'word').join(' ');
  assert.equal(estimateReadSeconds(words), 30);
});

test('pushVisitorToQueue keeps at most the last 4 visitors', () => {
  const basePitch = buildFallbackPitch(BASE_STUDENT);
  let queue: ReturnType<typeof pushVisitorToQueue> = [];
  for (let i = 1; i <= 5; i++) {
    queue = pushVisitorToQueue(
      queue,
      {
        ...BASE_STUDENT,
        ...basePitch,
        id: `v-${i}`,
        name: `Visitor ${i}`,
        createdAt: i,
        cardSerial: i,
      },
      4
    );
  }
  assert.equal(queue.length, 4);
  assert.equal(queue[0].id, 'v-5');
  assert.equal(queue[3].id, 'v-2');
});

test('normalizePitchResponse uses AI-rephrased strengths/weakness and keeps strength2 empty when omitted', () => {
  const aiPayload = {
    pitch:
      'I am Aarav Kulkarni, a PGDM scholar at Dr. D. Y. Patil B-School, Pune. My strength is analytical modeling proved in [cite BI outcome]. I aim to serve as Product Analyst.',
    linkedin_headline: 'PGDM Analytics | BI Strategy | Product Analyst',
    keywords: ['SQL', 'Product Analytics', 'KPI Design'],
    refined_strength1: 'Executive BI Telemetry & SQL Modeling',
    refined_strength2: 'Cross-Functional Pricing Analytics',
    refined_weakness: 'Balancing Visual Craft with Rapid Delivery',
    tagline: 'Turning complex telemetry into decisive action.',
    motivational_line: 'Aarav, let crisp evidence speak in every Product Analyst room.',
    recommended_character: 'data-wizard',
  };

  const withStrength2 = normalizePitchResponse(aiPayload, BASE_STUDENT);
  assert.equal(withStrength2.source, 'ai');
  assert.equal(withStrength2.strength1, 'Executive BI Telemetry & SQL Modeling');
  assert.equal(withStrength2.strength2, 'Cross-Functional Pricing Analytics');
  assert.equal(withStrength2.weakness, 'Balancing Visual Craft with Rapid Delivery');
  assert.equal(withStrength2.resolvedCharacterId, 'data-wizard');

  const withoutStrength2 = normalizePitchResponse(aiPayload, { ...BASE_STUDENT, strength2: '' });
  assert.equal(withoutStrength2.strength2, '');
  const qrWithoutS2 = formatQrPlainText({ ...BASE_STUDENT, ...withoutStrength2 });
  assert.equal(qrWithoutS2.includes('Strength 2:'), false);
  assert.ok(qrWithoutS2.includes('Motivational:'));
});

test('buildCharacterGenerationPrompt enforces stylized cartoon art, high-fidelity 3D mascot descriptors, and edit workflows', () => {
  const createPrompt = buildCharacterGenerationPrompt({
    specialisation: 'Marketing',
    visitorType: 'PGDM Student',
    dreamRole: 'Brand Strategist',
    cartoonStyle: 'comic-pop',
    customPrompt: 'neon cyberpunk sunglasses',
  });
  assert.match(createPrompt, /CARTOON \/ ILLUSTRATED CHARACTER/i);
  assert.match(createPrompt, /Do NOT produce a raw photorealistic/i);
  assert.match(createPrompt, /graphic novel protagonist illustration/i);
  assert.match(createPrompt, /detailed textures/i);
  assert.match(createPrompt, /vibrant professional lighting/i);
  assert.match(createPrompt, /neon cyberpunk sunglasses/);

  const vinylPrompt = buildCharacterGenerationPrompt({
    specialisation: 'Executive Leadership',
    visitorType: 'Director / CXO',
    cartoonStyle: 'vinyl-toy',
    hasReferencePhoto: false,
  });
  assert.match(vinylPrompt, /3D corporate mascot/i);
  assert.match(vinylPrompt, /detailed textures/i);
  assert.match(vinylPrompt, /vibrant professional lighting/i);
  assert.match(vinylPrompt, /soft 3D render/i);
  assert.match(vinylPrompt, /vibrant 3D rendered avatar/i);
  assert.match(vinylPrompt, /C-suite enterprise leader/i);

  const editPrompt = buildCharacterGenerationPrompt({
    specialisation: 'Marketing',
    visitorType: 'PGDM Student',
    cartoonStyle: 'cyber-chibi',
    customPrompt: 'add holographic headset',
    isEdit: true,
  });
  assert.match(editPrompt, /Edit this high-craft 3D corporate mascot/i);
  assert.match(editPrompt, /soft 3D render/i);
  assert.match(editPrompt, /add holographic headset/);
});

test('getStickerFontClass resolves all back sticker display fonts cleanly', () => {
  assert.equal(getStickerFontClass('cartoon'), 'font-sticker-cartoon');
  assert.equal(getStickerFontClass('vinyl'), 'font-sticker-vinyl');
  assert.equal(getStickerFontClass('arcade'), 'font-sticker-arcade');
  assert.equal(getStickerFontClass('futurist'), 'font-sticker-futurist');
  assert.equal(getStickerFontClass(undefined), 'font-sticker-cartoon');
});

test('extractJsonObject parses plain and fenced JSON responses', () => {
  const plain = extractJsonObject('{"pitch":"hello","keywords":["A","B","C"]}') as { pitch: string };
  assert.equal(plain.pitch, 'hello');

  const fenced = extractJsonObject('```json\n{"pitch":"fenced"}\n```') as { pitch: string };
  assert.equal(fenced.pitch, 'fenced');
});

test('buildCharacterGenerationPrompt generates clean Ink Sketch direction for pencil-sketch style', () => {
  const sketchPrompt = buildCharacterGenerationPrompt({
    specialisation: 'Finance',
    visitorType: 'PGDM Student',
    dreamRole: 'Investment Analyst',
    cartoonStyle: 'pencil-sketch',
    customPrompt: 'silver-rimmed glasses',
  });
  assert.match(sketchPrompt, /SKETCH portrait/i);
  assert.match(sketchPrompt, /charcoal & fine-liner architectural ink/i);
  assert.match(sketchPrompt, /silver-rimmed glasses/i);
});

test('cartoonize pixel helpers quantize colors, detect edges, and shade sketches cleanly', () => {
  assert.equal(quantizeChannel(0, 5), 0);
  assert.equal(quantizeChannel(255, 5), 255);
  assert.equal(quantizeChannel(130, 5), 128);

  const [r, g, b] = boostVibrancy(200, 100, 100, 1.3);
  assert.ok(r > 200 && g < 100 && b < 100);

  // Flat region -> zero edge; sharp vertical step -> strong edge
  assert.equal(computeSobelEdge(100, 100, 100, 100, 100, 100, 100, 100), 0);
  assert.ok(computeSobelEdge(0, 0, 255, 0, 255, 0, 0, 255) >= 250);

  // Bright paper with low edge vs dark ink on strong edge
  const paper = computeSketchShade(220, 10);
  const ink = computeSketchShade(220, 200);
  assert.ok(paper.r > 200 && paper.b > paper.r);
  assert.ok(ink.r < 60 && ink.b > ink.r);
});
