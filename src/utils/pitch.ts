import type { PitchInput, PitchResult, Specialisation, Tone, VisitorCard } from '../types/pitch';

export const SPECIALISATIONS: readonly Specialisation[] = [
  'Marketing',
  'Finance',
  'Business Analytics',
  'HR',
];

export const TONES: readonly Tone[] = ['Confident', 'Friendly', 'Formal'];

export const EXACT_SYSTEM_PROMPT = `You are a placement coach for PGDM students at the #DYPAICoE launch, Pune. Input: name, specialisation, one strength, dream role, tone. Return ONLY valid JSON: pitch (a 30-second "Tell me about yourself" answer, 70-80 words, first person; structure: present who I am, proof of one strength with a concrete example placeholder in [brackets], future and why the dream role), linkedin_headline (max 200 characters, using | separators), keywords (3 skills recruiters search for in that role). Confident, honest, no fake achievements, simple English.`;

export interface CardThemePalette {
  name: string;
  headerBg: string;
  accent: string;
  accentSoft: string;
  accentText: string;
  badgeText: string;
  patternStroke: string;
}

export const SPECIALISATION_THEMES: Record<Specialisation, CardThemePalette> = {
  Marketing: {
    name: 'Coral Studio',
    headerBg: '#0F1A33',
    accent: '#F06429',
    accentSoft: '#FFF3ED',
    accentText: '#B93E0E',
    badgeText: '#F06429',
    patternStroke: 'rgba(240, 100, 41, 0.22)',
  },
  Finance: {
    name: 'Emerald Ledger',
    headerBg: '#0D2129',
    accent: '#0E9F8B',
    accentSoft: '#ECFDF9',
    accentText: '#0A6E60',
    badgeText: '#2DD4BF',
    patternStroke: 'rgba(45, 212, 191, 0.2)',
  },
  'Business Analytics': {
    name: 'Cobalt Matrix',
    headerBg: '#101935',
    accent: '#3B82F6',
    accentSoft: '#EFF6FF',
    accentText: '#1D4ED8',
    badgeText: '#60A5FA',
    patternStroke: 'rgba(96, 165, 250, 0.22)',
  },
  HR: {
    name: 'Plum Atelier',
    headerBg: '#22132E',
    accent: '#D9468F',
    accentSoft: '#FDF2F8',
    accentText: '#9D174D',
    badgeText: '#F472B6',
    patternStroke: 'rgba(244, 114, 182, 0.22)',
  },
};

const SPECIALISATION_KEYWORDS: Record<Specialisation, [string, string, string]> = {
  Marketing: ['Brand Positioning', 'Go-to-Market Strategy', 'Campaign Analytics'],
  Finance: ['Financial Modeling', 'Valuation Analysis', 'Capital Allocation'],
  'Business Analytics': ['SQL & BI Dashboards', 'Data Storytelling', 'Predictive Modeling'],
  HR: ['Talent Acquisition', 'People Analytics', 'Organizational Alignment'],
};

const SPECIALISATION_PLACEHOLDERS: Record<Specialisation, string> = {
  Marketing: '[cite a live campaign conversion or GTM metric]',
  Finance: '[cite a valuation model or equity memo outcome]',
  'Business Analytics': '[cite a BI dashboard or SQL insight outcome]',
  HR: '[cite a talent drive or engagement metric]',
};

const MOTIVATIONAL_TEMPLATES: readonly ((role: string, firstName: string) => string)[] = [
  (role, firstName) => `${firstName}, clarity in 30 seconds opens doors — own your ${role} journey.`,
  (role) => `Lead with measurable impact today, and every ${role} room will remember your name.`,
  (role, firstName) => `Preparation turns ambition into offer letters — step boldly into ${role}, ${firstName}.`,
  (role) => `Your insight is your edge; bring structured conviction to every ${role} conversation.`,
  (role, firstName) => `${firstName}, great ${role} leaders start by communicating complex value with calm clarity.`,
  (role) => `Speak with proof, listen with intent, and build your signature as a future ${role}.`,
  (role, firstName) => `Every conversation at #DYPAICoE is a launchpad — stride toward ${role}, ${firstName}.`,
  (role) => `Discipline beats noise: let your clarity and integrity set you apart for ${role}.`,
  (role, firstName) => `${firstName}, pair curiosity with commercial rigor and the ${role} path is yours.`,
  (role) => `Real outcomes speak loudest — walk into your next ${role} interview ready to build.`,
  (role, firstName) => `Confidence is simply proof organized well; go make your mark in ${role}, ${firstName}.`,
  (role) => `Stay grounded in evidence, bold in vision, and relentless in your ${role} craft.`,
];

function hashVisitorSeed(input: PitchInput, salt = 0): number {
  const raw = `${input.name.trim().toLowerCase()}|${input.specialisation}|${input.dreamRole.trim().toLowerCase()}|${input.strength.trim().toLowerCase()}|${salt}`;
  let hash = 2166136261;
  for (let i = 0; i < raw.length; i++) {
    hash ^= raw.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash);
}

export function generateUniqueMotivationalLine(input: PitchInput, salt = 0): string {
  const firstName = (input.name.trim().split(/\s+/)[0] || 'Scholar').replace(/[^a-zA-Z'-]/g, '') || 'Scholar';
  const role = summarizePhrase(input.dreamRole, 4) || 'leadership';
  const idx = hashVisitorSeed(input, salt) % MOTIVATIONAL_TEMPLATES.length;
  return MOTIVATIONAL_TEMPLATES[idx](role, firstName);
}

export function countWords(text: string): number {
  const cleaned = text.trim();
  if (!cleaned) return 0;
  return cleaned.split(/\s+/).length;
}

export function estimateReadSeconds(text: string): number {
  const words = countWords(text);
  if (words === 0) return 0;
  return Math.max(1, Math.round((words / 150) * 60));
}

export function validatePitchInput(input: PitchInput): Partial<Record<keyof PitchInput, string>> {
  const errors: Partial<Record<keyof PitchInput, string>> = {};
  if (!input.name.trim() || input.name.trim().length < 2) {
    errors.name = 'Enter your full name (at least 2 characters).';
  }
  if (!SPECIALISATIONS.includes(input.specialisation)) {
    errors.specialisation = 'Select your PGDM specialisation.';
  }
  if (!input.strength.trim() || input.strength.trim().length < 3) {
    errors.strength = 'Share one genuine strength (e.g., structured problem solving).';
  }
  if (!input.dreamRole.trim() || input.dreamRole.trim().length < 3) {
    errors.dreamRole = 'Enter your target role (e.g., Product Analyst).';
  }
  if (!TONES.includes(input.tone)) {
    errors.tone = 'Select a pitch tone.';
  }
  return errors;
}

function clampHeadline(headline: string): string {
  const normalized = headline.replace(/\s+/g, ' ').trim();
  if (normalized.length <= 200) return normalized;
  return normalized.slice(0, 197).trimEnd() + '...';
}

function summarizePhrase(phrase: string, maxWords = 8): string {
  const words = phrase.trim().replace(/\.$/, '').split(/\s+/);
  if (words.length <= maxWords) return words.join(' ');
  return words.slice(0, maxWords).join(' ');
}

export function buildFallbackPitch(input: PitchInput, salt = 0): PitchResult {
  const name = input.name.trim() || 'Aarav Kulkarni';
  const spec = input.specialisation;
  const strength = summarizePhrase(input.strength, 8);
  const dreamRole = summarizePhrase(input.dreamRole, 5);
  const placeholder = SPECIALISATION_PLACEHOLDERS[spec];
  const baseKeywords = SPECIALISATION_KEYWORDS[spec];

  const makeCandidates = (): string[] => {
    if (input.tone === 'Friendly') {
      return [
        `Hello, I am ${name}, a PGDM ${spec} candidate at Dr. D. Y. Patil B-School, Pune. Colleagues value my ${strength} across cross-functional initiatives. Recently, I applied this in ${placeholder}, aligning stakeholders around clear commercial priorities. I am excited to step into a ${dreamRole} role where I can translate sharp analysis into practical business execution alongside a collaborative team.`,
        `Hello, I am ${name}, pursuing a PGDM in ${spec} at Dr. D. Y. Patil B-School, Pune. Stakeholders rely on my ${strength} during fast-paced business sprints. Recently, in ${placeholder}, I aligned cross-functional peers around measurable commercial deliverables. I am eager to join your organization as a ${dreamRole} to drive structured execution, customer clarity, and sustainable value creation.`,
      ];
    }
    if (input.tone === 'Formal') {
      return [
        `Good day. I am ${name}, a PGDM candidate specializing in ${spec} at Dr. D. Y. Patil B-School, Pune. My core competency lies in ${strength}, which I demonstrated through ${placeholder}, upholding analytical rigor and stakeholder alignment. Looking ahead, I am targeting a ${dreamRole} appointment where I can contribute disciplined execution, commercial acumen, and measurable value creation from day one.`,
        `Good day. I am ${name}, a PGDM ${spec} candidate at Dr. D. Y. Patil B-School, Pune. My primary competency is ${strength}, evidenced through ${placeholder} with strict analytical rigor. Looking ahead, I am pursuing a ${dreamRole} role where I can apply structured problem-solving, stakeholder alignment, and operational discipline toward measurable organizational value creation from day one.`,
      ];
    }
    return [
      `I am ${name}, a PGDM ${spec} candidate at Dr. D. Y. Patil B-School, Pune, focused on commercial impact. My core differentiator is ${strength}, which I proved in ${placeholder}, driving cross-functional clarity under tight timelines. I am targeting a ${dreamRole} role to scale data-backed decision-making, strengthen stakeholder execution, and deliver measurable business outcomes from day one.`,
      `I am ${name}, a PGDM ${spec} candidate at Dr. D. Y. Patil B-School, Pune, focused on commercial execution. My core differentiator is ${strength}, proven through ${placeholder} with strict operational rigor. Now I am targeting a ${dreamRole} role so I can champion data-backed decision-making, accelerate cross-functional alignment, and deliver sustained commercial value creation from day one.`,
    ];
  };

  const candidates = makeCandidates();
  let pitchBody =
    candidates.find((c) => {
      const w = countWords(c);
      return w >= 68 && w <= 80;
    }) ?? candidates[1];

  const wc = countWords(pitchBody);
  if (wc < 68) {
    pitchBody = `${pitchBody} I am prepared to drive measurable impact from day one.`;
  }

  const fullStrengthForHeadline = input.strength.trim().replace(/\.$/, '');
  const headline = clampHeadline(
    `PGDM ${spec}, DYP B-School Pune | ${fullStrengthForHeadline} | Target: ${input.dreamRole.trim()}`
  );

  return {
    pitch: pitchBody,
    linkedin_headline: headline,
    keywords: [...baseKeywords],
    motivationalLine: generateUniqueMotivationalLine(input, salt),
    source: 'template',
  };
}

export function normalizePitchResponse(raw: unknown, input: PitchInput, salt = 0): PitchResult {
  if (!raw || typeof raw !== 'object') {
    return buildFallbackPitch(input, salt);
  }
  const obj = raw as Record<string, unknown>;
  const pitch = typeof obj.pitch === 'string' ? obj.pitch.trim() : '';
  const headlineRaw = typeof obj.linkedin_headline === 'string' ? obj.linkedin_headline.trim() : '';
  const keywordsRaw = Array.isArray(obj.keywords)
    ? obj.keywords.filter((k): k is string => typeof k === 'string' && k.trim().length > 0).map((k) => k.trim())
    : [];
  const motivationalRaw =
    typeof obj.motivational_line === 'string' && obj.motivational_line.trim().length > 0
      ? obj.motivational_line.trim()
      : generateUniqueMotivationalLine(input, salt);

  if (!pitch || !headlineRaw || keywordsRaw.length < 1) {
    return buildFallbackPitch(input, salt);
  }

  const fallbackKeywords = SPECIALISATION_KEYWORDS[input.specialisation];
  const mergedKeywords = [...keywordsRaw, ...fallbackKeywords].slice(0, 3);

  return {
    pitch,
    linkedin_headline: clampHeadline(headlineRaw),
    keywords: mergedKeywords,
    motivationalLine: motivationalRaw,
    source: 'ai',
  };
}

export function formatQrPlainText(
  card: Pick<VisitorCard, 'name' | 'specialisation' | 'pitch' | 'linkedin_headline'>
): string {
  return [
    `${card.name.trim()} | PGDM ${card.specialisation}`,
    `LinkedIn Headline: ${card.linkedin_headline.trim()}`,
    '',
    '30s Pitch:',
    card.pitch.trim(),
    '',
    '#DYPAICoE | Dr. D. Y. Patil B-School, Pune',
  ].join('\n');
}

export function pushVisitorToQueue(
  queue: VisitorCard[],
  card: VisitorCard,
  maxSlots = 4
): VisitorCard[] {
  const withoutDuplicate = queue.filter((item) => item.id !== card.id);
  return [card, ...withoutDuplicate].slice(0, maxSlots);
}

export const SAMPLE_INPUTS: PitchInput[] = [
  {
    name: 'Aarav Kulkarni',
    specialisation: 'Business Analytics',
    strength: 'synthesizing granular retail telemetry into executive pricing dashboards',
    dreamRole: 'Product Analyst',
    tone: 'Confident',
  },
  {
    name: 'Sneha Deshmukh',
    specialisation: 'Marketing',
    strength: 'architecting data-led go-to-market positioning for growth brands',
    dreamRole: 'Brand Strategist',
    tone: 'Friendly',
  },
  {
    name: 'Rohan Joshi',
    specialisation: 'Finance',
    strength: 'rigorous DCF valuation modeling and capital efficiency analysis',
    dreamRole: 'Corporate Finance Analyst',
    tone: 'Formal',
  },
  {
    name: 'Meera Nair',
    specialisation: 'HR',
    strength: 'scaling structured talent acquisition pipelines and onboarding analytics',
    dreamRole: 'HR Business Partner',
    tone: 'Confident',
  },
];

export function buildSampleVisitors(): VisitorCard[] {
  const now = Date.now();
  return SAMPLE_INPUTS.map((input, idx) => ({
    ...input,
    ...buildFallbackPitch(input, idx + 1),
    id: `sample-${idx + 1}`,
    createdAt: now - idx * 60_000,
    generationMs: 1400 + idx * 120,
    cardSerial: idx + 1,
  }));
}
