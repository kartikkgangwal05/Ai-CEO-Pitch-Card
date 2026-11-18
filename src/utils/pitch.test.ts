import test from 'node:test';
import assert from 'node:assert/strict';
import {
  EXACT_SYSTEM_PROMPT,
  buildCharacterGenerationPrompt,
  buildFallbackPitch,
  buildFunText,
  oneWord,
  PERSONA_OPTIONS,
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
  personaId: 'none',
  stickerFont: 'cartoon',
  strength1: 'good at excel and BI dashboards',
  strength2: '',
  weakness: 'overthinking details',
  hobby: 'cricket',
  dreamRole: 'Product Analyst',
  tagline: '',
  motivationalLine: '',
  tone: 'Confident',
};

test('system prompt demands a funny title, two-line intro and one-word stats', () => {
  assert.ok(EXACT_SYSTEM_PROMPT.includes('title'));
  assert.ok(EXACT_SYSTEM_PROMPT.includes('exactly two short sentences'));
  assert.ok(EXACT_SYSTEM_PROMPT.includes('EXACTLY ONE WORD'));
});

test('validatePitchInput only requires a name now', () => {
  const invalid = validatePitchInput({ ...BASE_STUDENT, name: 'A' });
  assert.ok(invalid.name);

  const valid = validatePitchInput({
    ...BASE_STUDENT,
    strength1: '',
    weakness: '',
    hobby: '',
    dreamRole: '',
    currentPosition: '',
  });
  assert.deepEqual(valid, {});
});

test('oneWord keeps only the first clean word, capitalised', () => {
  assert.equal(oneWord('coffee addiction', 'X'), 'Coffee');
  assert.equal(oneWord('  over-thinking!!', 'X'), 'Over');
  assert.equal(oneWord('', 'Fallback'), 'Fallback');
  assert.equal(oneWord(undefined, 'Fallback'), 'Fallback');
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

test('buildFallbackPitch makes a funny title, two-line intro and one-word stats', () => {
  const result = buildFallbackPitch(BASE_STUDENT, 1);
  assert.ok(result.title.length > 3 && result.title.length <= 30);
  assert.equal(result.intro.split(/[.!?]\s/).filter(Boolean).length, 2);
  assert.equal(result.strength1, 'Good');
  assert.equal(result.weakness, 'Overthinking');
  assert.equal(result.hobby, 'Cricket');
  assert.equal(result.strength2, '');
  assert.equal(result.pitch, result.intro);
  assert.equal(result.keywords.length, 3);
});

test('blank stats are invented as single words', () => {
  for (let salt = 0; salt < 20; salt++) {
    const t = buildFunText({ name: 'Test Person', currentPosition: '', strength1: '', weakness: '', hobby: '' }, salt);
    for (const v of [t.strength1, t.weakness, t.hobby]) assert.match(v, /^\S+$/);
  }
});

test('Owner / Director card still resolves a character and empty strength 2', () => {
  const result = buildFallbackPitch({
    ...BASE_STUDENT,
    visitorType: 'Company Owner / Founder',
    name: 'Vikram Rao',
    specialisation: 'Executive Leadership',
    stickerFont: 'futurist',
    strength1: 'building ventures',
    weakness: 'impatient with slow decisions',
    hobby: '',
    dreamRole: '',
  });
  assert.equal(result.resolvedCharacterId, 'visionary-captain');
  assert.equal(result.strength2, '');
  assert.equal(result.strength1, 'Building');
  assert.match(result.hobby, /^\S+$/);
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

test('normalizePitchResponse keeps typed words and fills blanks from the AI, one word each', () => {
  const aiPayload = {
    title: 'The Spreadsheet Sorcerer',
    intro: 'Aarav bends pivot tables to his will. Entire departments fear his VLOOKUP.',
    strength: 'Excel wizardry',
    weakness: 'Chai breaks',
    hobby: 'cricket nets',
    power: 140,
    recommended_character: 'data-wizard',
  };

  const typed = normalizePitchResponse(aiPayload, BASE_STUDENT);
  assert.equal(typed.source, 'ai');
  assert.equal(typed.title, 'The Spreadsheet Sorcerer');
  assert.equal(typed.pitch, typed.intro);
  assert.equal(typed.strength1, 'Good'); // typed by the person, wins over the AI
  assert.equal(typed.resolvedCharacterId, 'data-wizard');

  const blank = normalizePitchResponse(aiPayload, { ...BASE_STUDENT, strength1: '', weakness: '', hobby: '' });
  assert.equal(blank.strength1, 'Excel');
  assert.equal(blank.weakness, 'Chai');
  assert.equal(blank.hobby, 'Cricket');
});

test('normalizePitchResponse falls back when the AI omits title or intro', () => {
  const result = normalizePitchResponse({ title: '', intro: 'x' }, BASE_STUDENT);
  assert.equal(result.source, 'template');
  assert.ok(result.title.length > 0);
});

test('normalizePitchResponse replaces a franchise title with the safe stream archetype', () => {
  const result = normalizePitchResponse(
    {
      title: 'The Gryffindor of Data',
      intro: 'Aarav turns dashboards into magic. Meetings end early when they arrive.',
      strength: 'Excel',
      weakness: 'Chai',
      hobby: 'Cricket',
    },
    BASE_STUDENT
  );
  assert.equal(result.source, 'template');
  assert.equal(result.title, 'The Analytics Wizard');
  assert.doesNotMatch(result.title, /gryffindor/i);
  assert.doesNotMatch(result.intro, /gryffindor/i);

  const spell = normalizePitchResponse(
    { title: 'Budget Boss', intro: 'Aarav casts Accio on every invoice. The ledger always balances.' },
    { ...BASE_STUDENT, specialisation: 'Finance' }
  );
  assert.equal(spell.title, 'The Financial Strategist');
  assert.doesNotMatch(spell.intro, /accio/i);

  // Word boundaries: "Spotter" must not be mistaken for "Potter".
  const spotter = normalizePitchResponse(
    { title: 'The Trend Spotter', intro: 'Aarav sees the chart before it moves. Analysts take notes.' },
    BASE_STUDENT
  );
  assert.equal(spotter.source, 'ai');
  assert.equal(spotter.title, 'The Trend Spotter');

  // AI stats are checked too: a franchise hobby falls back to the template word.
  const hobby = normalizePitchResponse(
    { title: 'The Trend Spotter', intro: 'Aarav sees the chart before it moves. Analysts take notes.', hobby: 'Quidditch' },
    { ...BASE_STUDENT, hobby: '' }
  );
  assert.equal(hobby.source, 'ai');
  assert.doesNotMatch(hobby.hobby, /quidditch/i);
});

test('EXACT_SYSTEM_PROMPT forbids franchise references', () => {
  assert.ok(EXACT_SYSTEM_PROMPT.includes('Never reference Harry Potter'));
  assert.ok(EXACT_SYSTEM_PROMPT.includes('Hogwarts'));
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

test('persona swaps wardrobe and background for the costume, and none leaves prompts unchanged', () => {
  const warrior = buildCharacterGenerationPrompt({
    specialisation: 'Marketing',
    visitorType: 'PGDM Student',
    cartoonStyle: 'comic-pop',
    personaId: 'warrior',
  });
  assert.match(warrior, /battle warrior/i);
  assert.match(warrior, /face, hairstyle, glasses/i);
  assert.equal(/midnight-navy/i.test(warrior), false);
  assert.equal(/tailored|blazer/i.test(warrior), false);

  const plain = buildCharacterGenerationPrompt({
    specialisation: 'Marketing',
    visitorType: 'PGDM Student',
    cartoonStyle: 'comic-pop',
    personaId: 'none',
  });
  assert.equal(/battle warrior/i.test(plain), false);
  assert.match(plain, /midnight-navy/i);
});

test('persona picks themed fallback titles and every persona has a prompt', () => {
  const t = buildFunText({ name: 'Test', currentPosition: '', strength1: '', weakness: '', hobby: '', personaId: 'wizard' }, 0);
  assert.match(t.title, /Wi-Fi Wizard|Archmage of Excel|Sorcerer of Slack/);
  for (const p of PERSONA_OPTIONS.filter((x) => x.id !== 'none')) {
    assert.ok(p.prompt.length > 40 && p.flavor.length > 5, p.id);
  }
});

test('modern styles use the clean portrait prompt with likeness and optional style reference', () => {
  const plain = buildCharacterGenerationPrompt({
    specialisation: 'Marketing',
    visitorType: 'PGDM Student',
    cartoonStyle: 'line-art',
  });
  assert.match(plain, /ligne-claire/);
  assert.match(plain, /Likeness is the top priority/);
  assert.equal(/corporate mascot|STYLE REFERENCE/.test(plain), false);

  const withRef = buildCharacterGenerationPrompt({
    specialisation: 'Marketing',
    visitorType: 'PGDM Student',
    cartoonStyle: '3d-animated',
    personaId: 'astronaut',
    hasStyleReference: true,
  });
  assert.match(withRef, /STYLE REFERENCE only/);
  assert.match(withRef, /astronaut suit/);
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
