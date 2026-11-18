import type {
  CartoonStyleId,
  PitchInput,
  PitchResult,
  ResolvedCharacterId,
  Specialisation,
  StickerFontId,
  Tone,
  VisitorCard,
  VisitorType,
} from '../types/pitch';

export const VISITOR_TYPES: readonly VisitorType[] = [
  'PGDM Student',
  'Company Owner / Founder',
  'Director / CXO',
];

export const SPECIALISATIONS: readonly Specialisation[] = [
  'Business Analytics',
  'Marketing',
  'Finance',
  'HR',
  'Executive Leadership',
];

export const TONES: readonly Tone[] = ['Confident', 'Friendly', 'Formal'];

export const EXACT_SYSTEM_PROMPT = `You are an executive placement & leadership communication coach for PGDM scholars and industry guests at the #DYPAICoE launch, Pune. Input: name, specialisation, one strength, dream role, tone. Return ONLY valid JSON: pitch (a crisp 30-second "Tell me about yourself" executive answer, 70-80 words, first person; structure: sharp professional positioning, high-impact proof of one strength with a concrete metric placeholder in [brackets], future-focused commercial value in the target role; avoid generic clichés like "hardworking" or "eager to learn"), linkedin_headline (max 200 characters, using | separators), keywords (3 high-signal skills recruiters or executives search for). Confident, honest, boardroom-ready English.`;

export interface TcgCardTheme {
  typeLabel: string;
  outerBorder: string;
  faceGradient: string;
  patternStroke: string;
  artGradient: string;
  accentHex: string;
  badgeBg: string;
  badgeText: string;
  moveBoxBg: string;
  moveBorder: string;
  loreBorder: string;
}

export const TCG_THEMES: Record<Specialisation, TcgCardTheme> = {
  'Business Analytics': {
    typeLabel: 'CYBER DATA',
    outerBorder: 'linear-gradient(135deg, #00D4FF 0%, #FFFFFF 48%, #2563EB 100%)',
    faceGradient: 'linear-gradient(160deg, #040B1C 0%, #091B3A 55%, #0D2954 100%)',
    patternStroke: 'rgba(0, 212, 255, 0.22)',
    artGradient: 'radial-gradient(circle at 50% 35%, #0E3A6E 0%, #050F26 78%)',
    accentHex: '#00D4FF',
    badgeBg: '#0284C7',
    badgeText: '#FFFFFF',
    moveBoxBg: 'rgba(8, 22, 48, 0.86)',
    moveBorder: 'rgba(56, 189, 248, 0.4)',
    loreBorder: '#38BDF8',
  },
  Marketing: {
    typeLabel: 'BRAND SPARK',
    outerBorder: 'linear-gradient(135deg, #38BDF8 0%, #FFFFFF 50%, #0EA5E9 100%)',
    faceGradient: 'linear-gradient(160deg, #060D20 0%, #0D2047 55%, #132C63 100%)',
    patternStroke: 'rgba(56, 189, 248, 0.24)',
    artGradient: 'radial-gradient(circle at 50% 35%, #173F7A 0%, #061028 78%)',
    accentHex: '#38BDF8',
    badgeBg: '#0369A1',
    badgeText: '#FFFFFF',
    moveBoxBg: 'rgba(9, 24, 54, 0.88)',
    moveBorder: 'rgba(125, 211, 252, 0.42)',
    loreBorder: '#7DD3FC',
  },
  Finance: {
    typeLabel: 'CAPITAL ALPHA',
    outerBorder: 'linear-gradient(135deg, #22D3EE 0%, #FFFFFF 50%, #1D4ED8 100%)',
    faceGradient: 'linear-gradient(160deg, #030B1A 0%, #081F3D 55%, #0A2E52 100%)',
    patternStroke: 'rgba(34, 211, 238, 0.22)',
    artGradient: 'radial-gradient(circle at 50% 35%, #0C4A6E 0%, #041022 78%)',
    accentHex: '#22D3EE',
    badgeBg: '#0E7490',
    badgeText: '#FFFFFF',
    moveBoxBg: 'rgba(6, 23, 46, 0.88)',
    moveBorder: 'rgba(34, 211, 238, 0.4)',
    loreBorder: '#22D3EE',
  },
  HR: {
    typeLabel: 'PEOPLE PULSE',
    outerBorder: 'linear-gradient(135deg, #60A5FA 0%, #FFFFFF 50%, #00D4FF 100%)',
    faceGradient: 'linear-gradient(160deg, #050B1E 0%, #0F214A 55%, #1A2F63 100%)',
    patternStroke: 'rgba(96, 165, 250, 0.24)',
    artGradient: 'radial-gradient(circle at 50% 35%, #1E3A8A 0%, #07112B 78%)',
    accentHex: '#60A5FA',
    badgeBg: '#1D4ED8',
    badgeText: '#FFFFFF',
    moveBoxBg: 'rgba(10, 24, 58, 0.88)',
    moveBorder: 'rgba(96, 165, 250, 0.42)',
    loreBorder: '#93C5FD',
  },
  'Executive Leadership': {
    typeLabel: 'CXO VANGUARD',
    outerBorder: 'linear-gradient(135deg, #00D4FF 0%, #FFFFFF 45%, #38BDF8 100%)',
    faceGradient: 'linear-gradient(160deg, #020817 0%, #091B3F 50%, #0F2B61 100%)',
    patternStroke: 'rgba(0, 212, 255, 0.28)',
    artGradient: 'radial-gradient(circle at 50% 35%, #164E87 0%, #030A1C 80%)',
    accentHex: '#00D4FF',
    badgeBg: '#00D4FF',
    badgeText: '#030712',
    moveBoxBg: 'rgba(7, 20, 48, 0.9)',
    moveBorder: 'rgba(0, 212, 255, 0.48)',
    loreBorder: '#00D4FF',
  },
};

const SPECIALISATION_KEYWORDS: Record<Specialisation, [string, string, string]> = {
  Marketing: ['Brand Positioning', 'Go-to-Market Strategy', 'Campaign Analytics'],
  Finance: ['Financial Modeling', 'Valuation Analysis', 'Capital Allocation'],
  'Business Analytics': ['SQL & BI Dashboards', 'Data Storytelling', 'Predictive Modeling'],
  HR: ['Talent Acquisition', 'People Analytics', 'Organizational Alignment'],
  'Executive Leadership': ['Strategic Growth', 'AI Transformation', 'Enterprise Partnerships'],
};

export const CARTOON_STYLE_OPTIONS: ReadonlyArray<{
  id: CartoonStyleId;
  label: string;
  artDirection: string;
}> = [
  {
    id: 'anime-hero',
    label: 'Anime Hero',
    artDirection:
      'studio-quality modern Makoto Shinkai & Arcane-inspired cel-shaded hero portrait, 3D corporate mascot charisma, detailed fabric and hair textures, vibrant professional lighting, luminous expressive eyes, crisp refined ink linework, and volumetric cyan rim light',
  },
  {
    id: 'vinyl-toy',
    label: '3D Vinyl Mascot',
    artDirection:
      '3D corporate mascot, vibrant 3D rendered avatar styled like a Pixar & designer vinyl collectible bust, detailed textures on tailored lapels and hair strands, vibrant professional lighting, soft 3D render with silky subsurface porcelain-matte shader and cinema three-point cyan rim light',
  },
  {
    id: 'comic-pop',
    label: 'Comic Pop-Art',
    artDirection:
      'vibrant modern graphic novel protagonist illustration (Spider-Verse inspired), crisp bold ink contours, detailed painterly micro-textures, vibrant professional lighting, balanced bold cel color blocking, and dynamic collector-card hero presence',
  },
  {
    id: 'cyber-chibi',
    label: 'Cyber Chibi',
    artDirection:
      'adorable high-craft stylized chibi 3D corporate mascot, detailed textures, vibrant professional lighting, soft 3D render finish with expressive oversized eyes, warm charismatic smile, and sleek minimalist holographic cyan tech accents',
  },
  {
    id: 'pencil-sketch',
    label: 'Ink Sketch',
    artDirection:
      'masterclass hand-drawn charcoal & fine-liner architectural ink portrait sketch on crisp cool-ivory textured sketchbook paper, detailed graphite grain and tailored cloth textures, confident clean contour linework, subtle diagonal cross-hatching shadows, and delicate electric cyan (#00D4FF) highlight accents',
  },
];

export const STICKER_FONT_OPTIONS: ReadonlyArray<{
  id: StickerFontId;
  label: string;
  className: string;
}> = [
  { id: 'cartoon', label: 'Cartoon Pop', className: 'font-sticker-cartoon' },
  { id: 'vinyl', label: '3D Vinyl', className: 'font-sticker-vinyl' },
  { id: 'arcade', label: 'Cyber Arcade', className: 'font-sticker-arcade' },
  { id: 'futurist', label: 'Neo Futurist', className: 'font-sticker-futurist' },
];

export function getStickerFontClass(fontId?: StickerFontId): string {
  return STICKER_FONT_OPTIONS.find((f) => f.id === fontId)?.className ?? 'font-sticker-cartoon';
}

export function buildCharacterGenerationPrompt(params: {
  specialisation: Specialisation;
  visitorType: VisitorType;
  dreamRole?: string;
  cartoonStyle?: CartoonStyleId;
  customPrompt?: string;
  isEdit?: boolean;
  hasReferencePhoto?: boolean;
}): string {
  const custom = (params.customPrompt ?? '').trim();
  const stylePreset =
    CARTOON_STYLE_OPTIONS.find((s) => s.id === params.cartoonStyle) ?? CARTOON_STYLE_OPTIONS[0];
  const isSketch = stylePreset.id === 'pencil-sketch';
  const hasPhoto = params.hasReferencePhoto ?? true;

  if (params.isEdit && custom) {
    return `Edit this ${
      isSketch
        ? 'hand-drawn ink & graphite portrait sketch with detailed paper and cloth textures'
        : 'high-craft 3D corporate mascot / vibrant 3D rendered avatar portrait (detailed textures, vibrant professional lighting, soft 3D render)'
    }: ${custom}. Keep silhouette separation crisp and studio-grade (${stylePreset.artDirection}) with strictly zero text, letters, logos, or watermarks.`;
  }

  const domainProps: Record<Specialisation, string> = {
    'Business Analytics':
      'finely tailored midnight-navy wool blazer over a crisp cotton crew tee with detailed weave textures, subtle glowing brushed-cyan data prism beside shoulder, sleek eyeglasses optional',
    Marketing:
      'sharp contemporary smart-casual textured jacket in navy & white, confident charismatic smile, minimalist luminous spark lapel accent',
    Finance:
      'tailored midnight-navy suit jacket with crisp collar and matte satin lapel texture, calm executive poise, subtle geometric diamond pin',
    HR:
      'approachable textured smart blazer, warm genuine smile, subtle glowing constellation star lapel pin',
    'Executive Leadership':
      'distinguished dark-navy structured tailored coat with rich fabric grain, poised visionary expression, subtle luminous apex geometric halo behind head',
  };

  const visitorArchetypes: Record<VisitorType, string> = {
    'PGDM Student': 'ambitious next-generation PGDM management scholar with crisp high-growth executive energy',
    'Company Owner / Founder': 'visionary founder & entrepreneur aura with charismatic trailblazer poise',
    'Director / CXO': 'distinguished C-suite enterprise leader presence with calm strategic authority',
  };

  const roleContext = params.dreamRole?.trim()
    ? `styled as an inspiring ${params.dreamRole.trim()} (${visitorArchetypes[params.visitorType]})`
    : `representing ${params.specialisation} (${visitorArchetypes[params.visitorType]})`;

  const extraStyle = custom ? ` Additional creative direction: ${custom}.` : '';

  if (isSketch) {
    const subjectLine = hasPhoto
      ? `Create a clean, expressive hand-drawn ink & graphite SKETCH portrait of the person in the reference photo (preserving exact facial likeness, hairstyle, glasses, and expression), ${roleContext}.`
      : `Create an original, expressive hand-drawn ink & graphite SKETCH portrait of an iconic ${params.specialisation} specialist (${visitorArchetypes[params.visitorType]}), ${roleContext}.`;

    return [
      subjectLine,
      `Art style: ${stylePreset.artDirection}.`,
      `Attire & textures: ${domainProps[params.specialisation]}.`,
      'Composition & lighting: centered head-and-shoulders studio portrait with generous headroom, crisp smooth light-tinted paper grain, vibrant studio key-to-shadow contrast, and clean electric-cyan edge accents so the portrait pops cleanly on a dark collector card.',
      'Quality rules: clean confident strokes, balanced proportions, NO distorted hands/faces, NO messy smudges, and strictly NO text, signatures, labels, or card frames.',
      extraStyle,
    ]
      .filter(Boolean)
      .join(' ');
  }

  const heroSubject = hasPhoto
    ? `Transform the person in the attached reference photo (preserving recognizable hairstyle, glasses, facial structure, and friendly expression) into a high-craft CARTOON / ILLUSTRATED CHARACTER portrait styled as a 3D corporate mascot with detailed textures, vibrant professional lighting, and soft 3D render polish (${stylePreset.artDirection}), ${roleContext}.`
    : `Design an original, iconic professional corporate mascot & vibrant 3D rendered avatar character portrait (3D corporate mascot, detailed textures, vibrant professional lighting, soft 3D render; ${stylePreset.artDirection}), ${roleContext}.`;

  return [
    heroSubject,
    'CRITICAL: Do NOT produce a raw photorealistic camera photo, uncanny skin pores, or noisy compression artifacts — craft stylized studio surfaces with detailed textures, silky subsurface softness, and cohesive volumetric illumination.',
    `Wardrobe & material details: ${domainProps[params.specialisation]}.`,
    'Composition & lighting: centered bust-up 4:3 hero portrait with generous headroom, global illumination, vibrant professional lighting, soft 3D render depth-of-field separation against a clean deep midnight-navy (#061533) studio backdrop lit by electric neon-blue (#00D4FF) and crisp white rim lights.',
    'Quality rules: balanced anatomy, symmetrical expressive eyes, uncluttered background, strictly NO text, words, letters, signatures, logos, or borders inside the image.',
    extraStyle,
  ]
    .filter(Boolean)
    .join(' ');
}

const SPECIALISATION_PLACEHOLDERS: Record<Specialisation, string> = {
  Marketing: '[cite a live campaign conversion or GTM metric]',
  Finance: '[cite a valuation model or equity memo outcome]',
  'Business Analytics': '[cite a BI dashboard or SQL insight outcome]',
  HR: '[cite a talent drive or engagement metric]',
  'Executive Leadership': '[cite a growth milestone or strategic partnership outcome]',
};

const TAGLINE_TEMPLATES: Record<Specialisation, readonly ((role: string) => string)[]> = {
  Marketing: [
    (role) => `Turning brand stories into measurable ${role} velocity.`,
    (role) => `Where customer insight meets sharp ${role} execution.`,
  ],
  Finance: [
    (role) => `Bringing analytical precision to every ${role} decision.`,
    (role) => `Capital rigor engineered for high-stakes ${role} impact.`,
  ],
  'Business Analytics': [
    (role) => `Converting raw telemetry into decisive ${role} action.`,
    (role) => `Data clarity powered by AI speed for ${role}.`,
  ],
  HR: [
    (role) => `Aligning human potential with strategic ${role} outcomes.`,
    (role) => `Building high-trust cultures ready for ${role} scale.`,
  ],
  'Executive Leadership': [
    (role) => `Architecting AI-era ventures and ${role} excellence.`,
    (role) => `Where boardroom vision meets decisive ${role} execution.`,
  ],
};

const MOTIVATIONAL_TEMPLATES: readonly ((role: string, firstName: string) => string)[] = [
  (role, firstName) => `${firstName}, clarity in 30 seconds opens doors — own your ${role} journey.`,
  (role) => `Lead with measurable impact today, and every ${role} room will remember your name.`,
  (role, firstName) => `Preparation turns vision into reality — step boldly into ${role}, ${firstName}.`,
  (role) => `Your insight is your edge; bring structured conviction to every ${role} conversation.`,
  (role, firstName) => `${firstName}, great ${role} leaders turn complex challenges into calm clarity.`,
  (role) => `Speak with proof, listen with intent, and build your signature in ${role}.`,
  (role, firstName) => `Every conversation at #DYPAICoE sparks a bold chapter — lead forward, ${firstName}.`,
  (role) => `Discipline beats noise: let clarity and integrity power your ${role} impact.`,
  (role, firstName) => `${firstName}, pair curiosity with commercial rigor and the ${role} frontier is yours.`,
  (role) => `Real outcomes speak loudest — walk into every room ready to build.`,
  (role, firstName) => `Confidence is proof organized well; go make your mark in ${role}, ${firstName}.`,
  (role) => `Stay grounded in evidence, bold in vision, and relentless in your ${role} craft.`,
];

function hashVisitorSeed(
  input: Pick<PitchInput, 'name' | 'specialisation' | 'dreamRole' | 'strength1'>,
  salt = 0
): number {
  const raw = `${input.name.trim().toLowerCase()}|${input.specialisation}|${input.dreamRole
    .trim()
    .toLowerCase()}|${input.strength1.trim().toLowerCase()}|${salt}`;
  let hash = 2166136261;
  for (let i = 0; i < raw.length; i++) {
    hash ^= raw.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash);
}

/**
 * Picks the best cartoon character persona depending on what the visitor shares.
 */
export function selectSmartCharacter(
  input: Pick<PitchInput, 'characterId' | 'visitorType' | 'specialisation' | 'strength1' | 'strength2' | 'weakness' | 'dreamRole' | 'currentPosition'>
): ResolvedCharacterId {
  if (input.characterId && input.characterId !== 'auto') {
    return input.characterId;
  }

  const combined = [
    input.currentPosition,
    input.dreamRole,
    input.strength1,
    input.strength2,
    input.weakness,
  ]
    .join(' ')
    .toLowerCase();

  if (
    input.visitorType !== 'PGDM Student' ||
    /\b(founder|owner|director|ceo|cxo|md|managing|entrepreneur|venture|board)\b/.test(combined)
  ) {
    if (/\b(ai|gadget|robot|automation|tech|bot|product)\b/.test(combined) && input.visitorType === 'PGDM Student') {
      return 'gadget-cat';
    }
    return 'visionary-captain';
  }

  if (/\b(creative|viral|reel|social|meme|funny|humor|brand|campaign|story|pitch|gtm|stage|sales)\b/.test(combined)) {
    return 'mischief-maverick';
  }
  if (/\b(ai|bot|gadget|automation|python|code|build|prototype|app|tool|smart|robot)\b/.test(combined)) {
    return 'gadget-cat';
  }
  if (/\b(hr|people|empathy|culture|team|hiring|music|listen|mentor|trust|harmony|conflict|coach)\b/.test(combined)) {
    return 'harmony-ace';
  }
  if (/\b(finance|valuation|dcf|equity|risk|audit|excel|capital|money|credit|invest|margin)\b/.test(combined)) {
    return 'strategy-prodigy';
  }
  if (/\b(data|sql|bi|tableau|power\s?bi|analytics|telemetry|forecast|metric|dashboard)\b/.test(combined)) {
    return 'data-wizard';
  }

  switch (input.specialisation) {
    case 'Marketing':
      return 'mischief-maverick';
    case 'Finance':
      return 'strategy-prodigy';
    case 'HR':
      return 'harmony-ace';
    case 'Executive Leadership':
      return 'visionary-captain';
    case 'Business Analytics':
    default:
      return 'data-wizard';
  }
}

const STRENGTH_UPGRADES: ReadonlyArray<[RegExp, string]> = [
  [/\b(good|great|strong|love|like)?\s*(at|with)?\s*excel\b/i, 'Executive Spreadsheet & KPI Modeling'],
  [/\b(coding|python|sql|automating|automation)\b/i, 'Automated Analytical Workflow Engineering'],
  [/\b(talking|speaking|communication|convincing|public speaking)\b/i, 'High-Impact Stakeholder Communication'],
  [/\b(reels|social media|instagram|content|marketing|ads)\b/i, 'Digital Brand Storytelling & Growth Campaigns'],
  [/\b(team|leading|leadership|managing people|organizing)\b/i, 'Cross-Functional Team Mobilization'],
  [/\b(numbers|maths|math|finance|accounts|accounting)\b/i, 'Quantitative Financial & Margin Rigor'],
  [/\b(design|ppt|slides|presentations|decks)\b/i, 'Boardroom Narrative & Deck Architecture'],
  [/\b(problem solving|solving problems|debugging|fixing)\b/i, 'Structured Root-Cause Problem Solving'],
];

const WEAKNESS_UPGRADES: ReadonlyArray<[RegExp, string]> = [
  [/\b(stage fear|nervous|shy|scared of speaking|fumble)\b/i, 'Refining High-Stakes Executive Stage Pacing'],
  [/\b(impatient|rush|hurry)\b/i, 'Channeling High Velocity into Milestone Discipline'],
  [/\b(overthink|overthinking|too much detail|perfectionist)\b/i, 'Balancing Deep Polish with Rapid Execution'],
  [/\b(say no|saying no|too much work|overcommit)\b/i, 'Prioritizing High-Leverage Strategic Commitments'],
  [/\b(talk too much|ramble|blunt|direct)\b/i, 'Distilling Rich Ideas into Crisp Takeaways'],
  [/\b(delegate|delegating|doing everything myself)\b/i, 'Scaling Trust Through Structured Delegation'],
];

function toSentenceStart(text: string): string {
  const cleaned = text.trim().replace(/\.+$/, '');
  if (!cleaned) return '';
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

/**
 * Rephrases raw strength text into crisp executive card phrasing when running offline/template mode.
 */
export function refineStrengthTerm(raw: string, _spec: Specialisation): string {
  const trimmed = raw.trim().replace(/\.+$/, '');
  if (!trimmed) return '';
  // If user already wrote a rich >=4 word executive phrase without casual "good at", polish punctuation cleanly
  const isCasual = /^(good at|i am good|love|like|knowing|can do|fast at|making)\b/i.test(trimmed) || trimmed.split(/\s+/).length <= 3;
  if (isCasual) {
    for (const [pattern, replacement] of STRENGTH_UPGRADES) {
      if (pattern.test(trimmed)) {
        return replacement;
      }
    }
  }
  return toSentenceStart(trimmed);
}

/**
 * Reframes raw weakness input into constructive, interview-ready growth edge terminology.
 */
export function refineWeaknessTerm(raw: string): string {
  const trimmed = raw.trim().replace(/\.+$/, '');
  if (!trimmed) return 'Balancing Deep Polish with Rapid Execution';
  for (const [pattern, replacement] of WEAKNESS_UPGRADES) {
    if (pattern.test(trimmed)) {
      return replacement;
    }
  }
  const lowered = trimmed.toLowerCase();
  if (lowered.startsWith('bad at ') || lowered.startsWith('weak in ')) {
    const topic = trimmed.replace(/^(bad at|weak in)\s+/i, '');
    return `Accelerating Mastery in ${toSentenceStart(topic)}`;
  }
  return toSentenceStart(trimmed);
}

export function generateUniqueMotivationalLine(
  input: Pick<PitchInput, 'name' | 'specialisation' | 'dreamRole' | 'strength1'>,
  salt = 0
): string {
  const firstName =
    (input.name.trim().split(/\s+/)[0] || 'Scholar').replace(/[^a-zA-Z'-]/g, '') || 'Scholar';
  const role = summarizePhrase(input.dreamRole || input.specialisation, 4) || 'leadership';
  const idx = hashVisitorSeed(input, salt) % MOTIVATIONAL_TEMPLATES.length;
  return MOTIVATIONAL_TEMPLATES[idx](role, firstName);
}

export function generateDefaultTagline(
  input: Pick<PitchInput, 'specialisation' | 'dreamRole' | 'name' | 'strength1'>,
  salt = 0
): string {
  const role = summarizePhrase(input.dreamRole || input.specialisation, 3) || 'executive';
  const list = TAGLINE_TEMPLATES[input.specialisation];
  const idx = hashVisitorSeed(input, salt) % list.length;
  return list[idx](role);
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
    errors.name = 'Enter full name (at least 2 characters).';
  }
  if (!SPECIALISATIONS.includes(input.specialisation)) {
    errors.specialisation = 'Select a domain or specialisation.';
  }
  if (!input.strength1.trim() || input.strength1.trim().length < 3) {
    errors.strength1 = 'Enter primary strength (at least 3 characters).';
  }
  if (!input.weakness.trim() || input.weakness.trim().length < 3) {
    errors.weakness = 'Enter a growth edge / weakness (at least 3 characters).';
  }
  if (input.visitorType === 'PGDM Student' && (!input.dreamRole.trim() || input.dreamRole.trim().length < 3)) {
    errors.dreamRole = 'Enter your dream role (e.g., Product Analyst).';
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
  const words = phrase.trim().replace(/\.$/, '').split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return words.join(' ');
  return words.slice(0, maxWords).join(' ');
}

export function buildFallbackPitch(input: PitchInput, salt = 0): PitchResult {
  const name = input.name.trim() || 'Aarav Kulkarni';
  const spec = input.specialisation;
  const isVip = input.visitorType !== 'PGDM Student';
  const currentPos = input.currentPosition.trim();
  const s1Refined = refineStrengthTerm(input.strength1, spec);
  const s2Refined = input.strength2.trim()
    ? refineStrengthTerm(input.strength2, spec)
    : '';
  const weaknessRefined = refineWeaknessTerm(input.weakness);
  const effectiveDreamRole =
    summarizePhrase(input.dreamRole, 5) ||
    (isVip ? 'AI-Driven Industry Partnerships' : 'Business Leader');
  const placeholder = SPECIALISATION_PLACEHOLDERS[spec];
  const baseKeywords = SPECIALISATION_KEYWORDS[spec];
  const resolvedCharacterId = selectSmartCharacter(input);
  const tagline =
    input.tagline.trim() ||
    generateDefaultTagline({ ...input, dreamRole: effectiveDreamRole }, salt);
  const motivationalLine =
    input.motivationalLine.trim() ||
    generateUniqueMotivationalLine({ ...input, dreamRole: effectiveDreamRole }, salt);

  const s1Summary = summarizePhrase(s1Refined, 7);

  const makeCandidates = (): string[] => {
    if (isVip) {
      const roleDescriptor = currentPos
        ? `${currentPos}`
        : input.visitorType === 'Company Owner / Founder'
          ? 'Founder & Managing Leader'
          : 'Senior Director & Industry Strategist';
      return [
        `I am ${name}, ${roleDescriptor}, joining the #DYPAICoE launch at Dr. D. Y. Patil B-School, Pune. Across my leadership work in ${spec}, I drive ${s1Summary}, most recently demonstrated through ${placeholder}. Focused on ${effectiveDreamRole}, I am partnering with emerging PGDM talent and industry leaders to translate applied AI into resilient revenue growth and disciplined operational execution.`,
        `Good to meet you — I am ${name}, ${roleDescriptor}, visiting the #DYPAICoE launch in Pune. Within ${spec}, my core strength is ${s1Summary}, validated in ${placeholder}. Around ${effectiveDreamRole}, my priority is bridging industry execution with next-generation management leaders so teams turn emerging AI capabilities into measurable enterprise value and sustained commercial advantage.`,
      ];
    }

    if (input.tone === 'Friendly') {
      return [
        `Hello, I am ${name}, a PGDM ${spec} scholar (Batch 2026–28) at Dr. D. Y. Patil B-School, Pune. Teams rely on my ${s1Summary} to turn ambiguity into structured action, most recently in ${placeholder}. I am excited to step into a ${effectiveDreamRole} role where I can combine analytical ownership with cross-functional collaboration to deliver measurable commercial growth.`,
        `Hi, I am ${name}, pursuing my PGDM in ${spec} (Batch 2026–28) at DYP B-School, Pune. Colleagues count on my ${s1Summary}, which I recently applied in ${placeholder} to align stakeholders around clear deliverables. Stepping into a ${effectiveDreamRole} opportunity, I aim to pair sharp business judgment with collaborative execution that creates value from week one.`,
      ];
    }
    if (input.tone === 'Formal') {
      return [
        `Good day. I am ${name}, a PGDM candidate (Batch 2026–28) specializing in ${spec} at Dr. D. Y. Patil B-School, Pune. My core capability lies in ${s1Summary}, substantiated through ${placeholder} with analytical rigor. I am targeting a ${effectiveDreamRole} position where I can contribute structured governance, stakeholder alignment, and measurable commercial value creation from day one.`,
        `Good day. I am ${name}, a PGDM ${spec} candidate (Batch 2026–28) at DYP B-School, Pune. My primary strength is ${s1Summary}, evidenced through ${placeholder} under demanding delivery timelines. I am pursuing a ${effectiveDreamRole} appointment to apply disciplined problem-solving, executive communication, and sound operational judgment toward sustained organizational performance from day one.`,
      ];
    }
    return [
      `I am ${name}, a PGDM ${spec} candidate (Batch 2026–28) at Dr. D. Y. Patil B-School, Pune, focused on measurable business outcomes. My differentiator is ${s1Summary}, proved through ${placeholder} under tight executive timelines. Targeting a ${effectiveDreamRole} role, I am ready to turn sharp insight into cross-functional alignment, faster decision velocity, and tangible commercial impact from day one.`,
      `I am ${name}, specializing in PGDM ${spec} (Batch 2026–28) at DYP B-School, Pune, with a focus on commercial execution. My competitive edge is ${s1Summary}, demonstrated in ${placeholder} to accelerate stakeholder clarity. Stepping into a ${effectiveDreamRole} role, I am equipped to champion data-backed decisions, elevate team execution, and compound measurable business value.`,
    ];
  };

  const candidates = makeCandidates();
  let pitchBody =
    candidates.find((c) => {
      const w = countWords(c);
      return w >= 66 && w <= 82;
    }) ?? candidates[0];

  if (countWords(pitchBody) < 66) {
    pitchBody = `${pitchBody} Ready to deliver measurable impact from day one.`;
  }

  const headlinePrefix = isVip
    ? currentPos || input.visitorType
    : `PGDM ${spec} (2026–28), DYP B-School Pune`;
  const headline = clampHeadline(
    `${headlinePrefix} | ${s1Refined} | ${isVip ? 'Focus' : 'Target'}: ${effectiveDreamRole}`
  );

  return {
    pitch: pitchBody,
    linkedin_headline: headline,
    keywords: [...baseKeywords],
    strength1: s1Refined,
    strength2: s2Refined,
    weakness: weaknessRefined,
    tagline,
    motivationalLine,
    resolvedCharacterId,
    source: 'template',
  };
}

const VALID_CHARACTERS: ReadonlySet<ResolvedCharacterId> = new Set([
  'gadget-cat',
  'mischief-maverick',
  'harmony-ace',
  'strategy-prodigy',
  'visionary-captain',
  'data-wizard',
]);

export function extractJsonObject(rawText: string): unknown {
  const trimmed = rawText.trim();
  const fenced = /^```(?:json)?\s*([\s\S]*?)\s*```$/i.exec(trimmed);
  const candidate = fenced ? fenced[1].trim() : trimmed;
  try {
    return JSON.parse(candidate);
  } catch {
    const start = candidate.indexOf('{');
    const end = candidate.lastIndexOf('}');
    if (start >= 0 && end > start) {
      return JSON.parse(candidate.slice(start, end + 1));
    }
    throw new Error('Response did not contain valid JSON.');
  }
}

export function normalizePitchResponse(raw: unknown, input: PitchInput, salt = 0): PitchResult {
  const fallback = buildFallbackPitch(input, salt);
  if (!raw || typeof raw !== 'object') {
    return fallback;
  }
  const obj = raw as Record<string, unknown>;
  const pitch = typeof obj.pitch === 'string' ? obj.pitch.trim() : '';
  const headlineRaw = typeof obj.linkedin_headline === 'string' ? obj.linkedin_headline.trim() : '';
  const keywordsRaw = Array.isArray(obj.keywords)
    ? obj.keywords.filter((k): k is string => typeof k === 'string' && k.trim().length > 0).map((k) => k.trim())
    : [];

  if (!pitch || !headlineRaw || keywordsRaw.length < 1) {
    return fallback;
  }

  const strength1 =
    (typeof obj.refined_strength1 === 'string' && obj.refined_strength1.trim()) || fallback.strength1;
  const strength2 = input.strength2.trim()
    ? (typeof obj.refined_strength2 === 'string' && obj.refined_strength2.trim()) || fallback.strength2
    : '';
  const weakness =
    (typeof obj.refined_weakness === 'string' && obj.refined_weakness.trim()) || fallback.weakness;
  const tagline =
    input.tagline.trim() ||
    (typeof obj.tagline === 'string' && obj.tagline.trim()) ||
    fallback.tagline;
  const motivationalLine =
    input.motivationalLine.trim() ||
    (typeof obj.motivational_line === 'string' && obj.motivational_line.trim()) ||
    fallback.motivationalLine;

  let resolvedCharacterId = fallback.resolvedCharacterId;
  if (
    input.characterId === 'auto' &&
    typeof obj.recommended_character === 'string' &&
    VALID_CHARACTERS.has(obj.recommended_character as ResolvedCharacterId)
  ) {
    resolvedCharacterId = obj.recommended_character as ResolvedCharacterId;
  }

  const fallbackKeywords = SPECIALISATION_KEYWORDS[input.specialisation];
  const mergedKeywords = [...keywordsRaw, ...fallbackKeywords].slice(0, 3);

  return {
    pitch,
    linkedin_headline: clampHeadline(headlineRaw),
    keywords: mergedKeywords,
    strength1,
    strength2,
    weakness,
    tagline,
    motivationalLine,
    resolvedCharacterId,
    source: 'ai',
  };
}

export function formatQrPlainText(
  card: Pick<
    VisitorCard,
    | 'visitorType'
    | 'currentPosition'
    | 'name'
    | 'specialisation'
    | 'pitch'
    | 'linkedin_headline'
    | 'tagline'
    | 'strength1'
    | 'strength2'
    | 'weakness'
    | 'motivationalLine'
  >
): string {
  const roleLine =
    card.visitorType === 'PGDM Student'
      ? `PGDM ${card.specialisation} (Batch 2026–28)`
      : `${card.currentPosition?.trim() || card.visitorType} | ${card.specialisation}`;

  const lines = [
    `${card.name.trim()} | ${roleLine}`,
    `Tagline: ${card.tagline.trim()}`,
    `LinkedIn Headline: ${card.linkedin_headline.trim()}`,
    '',
    `Strength 1: ${card.strength1.trim()}`,
  ];

  if (card.strength2.trim()) {
    lines.push(`Strength 2: ${card.strength2.trim()}`);
  }

  lines.push(
    `Growth Edge: ${card.weakness.trim()}`,
    '',
    '30s Pitch:',
    card.pitch.trim(),
    '',
    `Motivational: "${card.motivationalLine.trim()}"`,
    '#DYPAICoE | Dr. D. Y. Patil B-School, Pune'
  );

  return lines.join('\n');
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
    visitorType: 'PGDM Student',
    name: 'Aarav Kulkarni',
    currentPosition: 'PGDM Scholar',
    specialisation: 'Business Analytics',
    characterId: 'auto',
    capturedPhotoUrl: '',
    aiCharacterUrl: '',
    characterPrompt: '',
    cartoonStyle: 'anime-hero',
    stickerFont: 'cartoon',
    strength1: 'good at excel and automating SQL insight dashboards',
    strength2: 'translating product telemetry into executive pricing briefs',
    weakness: 'overthinking chart layouts',
    dreamRole: 'Product Analyst',
    tagline: 'Turning raw telemetry into decisive product velocity.',
    motivationalLine: '',
    tone: 'Confident',
  },
  {
    visitorType: 'PGDM Student',
    name: 'Sneha Deshmukh',
    currentPosition: '',
    specialisation: 'Marketing',
    characterId: 'mischief-maverick',
    capturedPhotoUrl: '',
    aiCharacterUrl: '',
    characterPrompt: '',
    cartoonStyle: 'comic-pop',
    stickerFont: 'vinyl',
    strength1: 'creative viral campaigns and GTM positioning for youth brands',
    strength2: '',
    weakness: 'talk too much when pitching bold creative concepts',
    dreamRole: 'Brand Strategist',
    tagline: 'Where playful insight meets unforgettable brand momentum.',
    motivationalLine: '',
    tone: 'Friendly',
  },
  {
    visitorType: 'Company Owner / Founder',
    name: 'Vikramaditya Rao',
    currentPosition: 'Founder & MD, FinEdge AI Labs',
    specialisation: 'Executive Leadership',
    characterId: 'visionary-captain',
    capturedPhotoUrl: '',
    aiCharacterUrl: '',
    characterPrompt: '',
    cartoonStyle: 'vinyl-toy',
    stickerFont: 'futurist',
    strength1: 'scaling B2B fintech ventures from zero to regional leadership',
    strength2: 'mentoring young talent on applied AI commercialization',
    weakness: 'impatient when market experiments stall',
    dreamRole: 'Industry-Academia AI Ecosystem',
    tagline: 'Building resilient ventures where young talent thrives.',
    motivationalLine: '',
    tone: 'Confident',
  },
  {
    visitorType: 'PGDM Student',
    name: 'Meera Nair',
    currentPosition: '',
    specialisation: 'HR',
    characterId: 'harmony-ace',
    capturedPhotoUrl: '',
    aiCharacterUrl: '',
    characterPrompt: '',
    cartoonStyle: 'cyber-chibi',
    stickerFont: 'arcade',
    strength1: 'empathetic campus hiring pipelines & people analytics',
    strength2: '',
    weakness: 'bad at saying no to extra committee initiatives',
    dreamRole: 'HR Business Partner',
    tagline: 'Aligning human harmony with measurable business scale.',
    motivationalLine: '',
    tone: 'Confident',
  },
];

export function buildSampleVisitors(): VisitorCard[] {
  const now = Date.now();
  return SAMPLE_INPUTS.map((input, idx) => ({
    visitorType: input.visitorType,
    name: input.name,
    currentPosition: input.currentPosition,
    specialisation: input.specialisation,
    capturedPhotoUrl: input.capturedPhotoUrl,
    aiCharacterUrl: input.aiCharacterUrl,
    characterPrompt: input.characterPrompt,
    cartoonStyle: input.cartoonStyle,
    stickerFont: input.stickerFont,
    dreamRole: input.dreamRole,
    tone: input.tone,
    ...buildFallbackPitch(input, idx + 1),
    id: `sample-${idx + 1}`,
    createdAt: now - idx * 60_000,
    generationMs: 1200 + idx * 110,
    cardSerial: idx + 1,
  }));
}
