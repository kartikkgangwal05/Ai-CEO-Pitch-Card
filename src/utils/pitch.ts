import { STREAMS } from './streams';
import type {
  CartoonStyleId,
  PersonaId,
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

export const EXACT_SYSTEM_PROMPT = `You write the text for funny, printable trading-style "power cards" handed out at the #DYPBSAICoE launch event.
Tone: playful, witty, warm. Roast gently so the person laughs and wants to keep the card.
Never mock appearance, body, age, gender, religion, caste, ethnicity or anything sensitive. No profanity.
Never reference Harry Potter or any franchise: no Hogwarts, Gryffindor, Slytherin, Ravenclaw, Hufflepuff, Muggle, Quidditch, Patronus, Horcrux, Sorting, Dumbledore, Voldemort, or named spells like Accio, Expelliarmus, Lumos. Keep any magic flavour original.
Return ONLY valid JSON with:
- title: a funny 2-4 word epithet like "The Spreadsheet Sorcerer" or "Captain Snooze Button", max 28 characters, never containing the person's name.
- intro: exactly two short sentences, 14-22 words in total, in the voice of a premium trading-card description. Build it from the person's own details: sentence one shows their strength in action in the world of their title and stream; sentence two lands a witty, affectionate twist on their weakness or hobby. Be specific and fresh: vivid verbs, one clever image, a punchline that makes them smile. Avoid clichés and filler such as "flick of their wand", "unleash", "journey", "passion", "game-changer", "secret weapon". Never use he/she/him/her: use the first name or "they", because you cannot know how the person identifies.
- If a card title is given, return exactly that title.
- strength, weakness, hobby: EXACTLY ONE WORD each (no spaces or hyphens), max 12 characters, capitalised, funny and specific to the facts when possible. If the user supplied a word for one of them, use that word.
- power: an integer from 60 to 99.`;

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

export const PERSONA_OPTIONS: ReadonlyArray<{
  id: PersonaId;
  label: string;
  emoji: string;
  /** Costume + setting sentence for the image model. */
  prompt: string;
  /** Flavour hint so the AI-written title and intro match the costume. */
  flavor: string;
}> = [
  { id: 'none', label: 'As I am', emoji: '🙂', prompt: '', flavor: '' },
  {
    id: 'warrior',
    label: 'Warrior',
    emoji: '⚔️',
    prompt:
      'a fierce legendary battle warrior in scratched steel armour with a flowing crimson cape, holding a glowing sword, standing on a smoky battlefield at stormy sunset with embers in the air',
    flavor: 'a legendary battle warrior (swords, war cries, glory)',
  },
  {
    id: 'samurai',
    label: 'Samurai',
    emoji: '🏯',
    prompt:
      'a noble samurai in ornate lacquered armour and a crested kabuto helmet, katana at the hip, cherry blossom petals drifting past a misty mountain temple at dawn',
    flavor: 'a disciplined samurai (honour, katana, calm focus)',
  },
  {
    id: 'ninja',
    label: 'Ninja',
    emoji: '🥷',
    prompt:
      'a stealthy ninja in a dark hooded outfit with a fabric half-mask showing the eyes, shuriken in hand, crouched on a moonlit rooftop with a glowing full moon behind',
    flavor: 'a stealthy ninja (shadows, silence, sneaking in)',
  },
  {
    id: 'viking',
    label: 'Viking',
    emoji: '🪓',
    prompt:
      'a mighty Viking chieftain with a horned-style fur-trimmed helmet, braided hair and beard, a round painted shield and a battle axe, a longship on a stormy sea behind',
    flavor: 'a mighty Viking raider (axes, longships, feasts)',
  },
  {
    id: 'wizard',
    label: 'Wizard',
    emoji: '🧙',
    prompt:
      'a wise, slightly chaotic wizard in a starry purple robe and a tall pointed hat, holding a glowing crystal staff, magical sparkles swirling in an ancient candle-lit library',
    flavor: 'a powerful wizard (spells, potions, arcane chaos)',
  },
  {
    id: 'superhero',
    label: 'Superhero',
    emoji: '🦸',
    prompt:
      'a bold comic-book superhero with a dramatic cape, a bright emblem on a skin-tight suit and a confident hands-on-hips pose, a glittering city skyline at golden hour behind',
    flavor: 'a superhero (capes, saving the day, secret identity)',
  },
  {
    id: 'astronaut',
    label: 'Astronaut',
    emoji: '🚀',
    prompt:
      'a space explorer in a white astronaut suit with the helmet visor open so the face is fully visible, mission patches on the suit, a colourful nebula and a ringed planet behind',
    flavor: 'a space explorer (rockets, zero gravity, the final frontier)',
  },
  {
    id: 'pirate',
    label: 'Pirate',
    emoji: '🏴‍☠️',
    prompt:
      'a swashbuckling pirate captain with a feathered tricorn hat, a red bandana and a bold coat, a treasure map in hand, a tall ship sailing on turquoise water behind',
    flavor: 'a swashbuckling pirate captain (treasure, seas, rum-free adventures)',
  },
  {
    id: 'cyber-hacker',
    label: 'Cyber Hacker',
    emoji: '🤖',
    prompt:
      'a neon cyberpunk hacker with glowing visor-style glasses, a tech jacket with LED trim and holographic screens floating around, a rainy neon city street at night behind',
    flavor: 'a cyberpunk hacker (code, neon, bugs and glitches)',
  },
  {
    id: 'rockstar',
    label: 'Rockstar',
    emoji: '🎸',
    prompt:
      'a flamboyant rockstar in a studded leather jacket and sunglasses, holding an electric guitar, on a smoky stage with spotlights and a roaring crowd behind',
    flavor: 'a rockstar (stage, encores, sold-out shows)',
  },
  {
    id: 'cowboy',
    label: 'Cowboy',
    emoji: '🤠',
    prompt:
      'a cool wild-west cowboy in a wide-brim hat, a leather vest and a bandana, a sheriff star on the chest, a dusty desert canyon at golden sunset behind',
    flavor: 'a wild-west cowboy (sheriffs, dust, high noon showdowns)',
  },
];

export function getPersona(id: PersonaId | undefined) {
  return PERSONA_OPTIONS.find((p) => p.id === id) ?? PERSONA_OPTIONS[0];
}

export const CARTOON_STYLE_OPTIONS: ReadonlyArray<{
  id: CartoonStyleId;
  label: string;
  artDirection: string;
  /** One-line description shown in the picker. */
  blurb?: string;
  /** Tile colours used when no reference thumbnail is present. */
  swatch?: [string, string];
  /** Booth-era styles use the clean portrait prompt (no forced 3D mascot wording). */
  modern?: boolean;
  /** Older styles kept for saved cards, not shown in pickers. */
  hidden?: boolean;
}> = [
  {
    id: 'bold-toon',
    label: 'Bold Toon',
    blurb: 'Thick outlines, big grin',
    swatch: ['#F3EEE4', '#7A4A2A'],
    modern: true,
    artDirection:
      'a clean modern cartoon portrait illustration with bold, smooth dark-brown outlines of even weight, crisp two-tone cel shading on skin and hair, warm natural skin tones, a big friendly toothy grin, expressive eyes with bright catch-lights, glossy highlights on glasses if worn, on a plain flat warm off-white background',
  },
  {
    id: 'retro-2d',
    label: 'Retro 2D',
    blurb: 'Classic hand-drawn feel',
    swatch: ['#F1E2D3', '#D9663C'],
    modern: true,
    artDirection:
      'a classic hand-drawn 2D animation character portrait with simple rounded shapes, confident thick black ink outlines, large shiny cartoon eyes, flat muted warm colours with one simple shadow tone, a subtle risograph paper-grain texture, on a plain flat soft beige background',
  },
  {
    id: 'cozy-painted',
    label: 'Cozy Painted',
    blurb: 'Warm cinematic glow',
    swatch: ['#3B2A1E', '#F2B35B'],
    modern: true,
    artDirection:
      'a semi-realistic animated-film character portrait with soft painterly rendering, large expressive eyes with long lashes, smooth glowing skin, gentle warm lamp light with soft rim light, cinematic shallow depth of field, in a cozy softly blurred room with warm bokeh behind',
  },
  {
    id: '3d-animated',
    label: '3D Animated',
    blurb: 'Animated-movie hero',
    swatch: ['#1E63E9', '#7FB4FF'],
    modern: true,
    artDirection:
      'a high-quality 3D animated-movie character render with stylised proportions, a slightly larger head, big glossy eyes, soft subsurface-scattered skin, detailed hair strands and fabric, warm studio key light with soft fill, on a smooth saturated solid royal-blue gradient background',
  },
  {
    id: 'cute-flat',
    label: 'Cute Minimal',
    blurb: 'Kawaii avatar, dot eyes',
    swatch: ['#FBF1E6', '#F4C99B'],
    modern: true,
    artDirection:
      'a minimal cute flat avatar illustration with simple dot eyes, a small smile, rosy circular blush cheeks, smooth thin dark-brown outlines, flat pastel colours with very little shading, and a soft peach circle behind the head on a cream background',
  },
  {
    id: 'line-art',
    label: 'Flat Line Art',
    blurb: 'Graphic, crisp & stylish',
    swatch: ['#C9BFB3', '#2E4A66'],
    modern: true,
    artDirection:
      'a flat graphic editorial portrait illustration in a clean ligne-claire style: crisp uniform black linework, flat colour blocks with no gradients, minimal blush shading, detailed flowing hair strands drawn as lines, calm confident expression, on a plain flat muted taupe background',
  },
  {
    id: 'anime-hero',
    hidden: true,
    label: 'Anime Hero',
    artDirection:
      'studio-quality modern Makoto Shinkai & Arcane-inspired cel-shaded hero portrait, 3D corporate mascot charisma, detailed fabric and hair textures, vibrant professional lighting, luminous expressive eyes, crisp refined ink linework, and volumetric cyan rim light',
  },
  {
    id: 'vinyl-toy',
    hidden: true,
    label: '3D Vinyl Mascot',
    artDirection:
      '3D corporate mascot, vibrant 3D rendered avatar styled like a Pixar & designer vinyl collectible bust, detailed textures on tailored lapels and hair strands, vibrant professional lighting, soft 3D render with silky subsurface porcelain-matte shader and cinema three-point cyan rim light',
  },
  {
    id: 'comic-pop',
    hidden: true,
    label: 'Comic Pop-Art',
    artDirection:
      'vibrant modern graphic novel protagonist illustration (Spider-Verse inspired), crisp bold ink contours, detailed painterly micro-textures, vibrant professional lighting, balanced bold cel color blocking, and dynamic collector-card hero presence',
  },
  {
    id: 'cyber-chibi',
    hidden: true,
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
  personaId?: PersonaId;
  /** True when a style reference image is attached after the photo. */
  hasStyleReference?: boolean;
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

  const persona = params.personaId && params.personaId !== 'none' ? getPersona(params.personaId) : null;
  const personaLine = persona
    ? `Costume & setting: dress the person as ${persona.prompt}. Keep their face, hairstyle, glasses, skin tone and expression clearly recognisable underneath the costume, and make the background rich, colourful and cinematic.`
    : '';
  const roleContext = persona
    ? `styled as an epic ${persona.label.toLowerCase()} character`
    : params.dreamRole?.trim()
    ? `styled as an inspiring ${params.dreamRole.trim()} (${visitorArchetypes[params.visitorType]})`
    : `representing ${params.specialisation} (${visitorArchetypes[params.visitorType]})`;

  const extraStyle = custom ? ` Additional creative direction: ${custom}.` : '';
  const funDirection =
    'Make it a funny, good-natured power-card caricature: a slightly oversized head, a playful confident grin or smirk, and a heroic trading-card pose. Flattering and joyful, never mean or grotesque. Keep their own clothing and accessories recognisable.';

  if (stylePreset.modern) {
    const likeness = hasPhoto
      ? 'Likeness is the top priority: keep their exact face shape, hairstyle and hair colour, skin tone, eyebrows, eye shape, nose, glasses, beard or moustache, earrings and expression, so friends instantly recognise them.'
      : '';
    return [
      hasPhoto
        ? `Turn the person in the FIRST image into ${stylePreset.artDirection}.`
        : `Create an original character as ${stylePreset.artDirection}.`,
      likeness,
      params.hasStyleReference
        ? 'The SECOND image is a STYLE REFERENCE only: match its art style exactly (line weight, shading, colour palette, eye style, level of detail and rendering), but never copy that person, their face, hair or clothes.'
        : '',
      persona
        ? personaLine
        : 'Keep their own everyday clothing, simplified to match the style.',
      'Mood: flattering, charming and fun with a confident smile; a collectible trading-card hero portrait.',
      'Framing: single person, head-and-shoulders, centred and facing the camera, eyes in the upper third, shoulders visible, generous headroom, 4:3 landscape canvas with the background filling the sides.',
      'Strictly NO text, letters, numbers, logos, signatures, watermarks, frames or borders.',
      extraStyle,
    ]
      .filter(Boolean)
      .join(' ');
  }

  if (isSketch) {
    const subjectLine = hasPhoto
      ? `Create a clean, expressive hand-drawn ink & graphite SKETCH portrait of the person in the reference photo (preserving exact facial likeness, hairstyle, glasses, and expression), ${roleContext}.`
      : `Create an original, expressive hand-drawn ink & graphite SKETCH portrait of an iconic ${params.specialisation} specialist (${visitorArchetypes[params.visitorType]}), ${roleContext}.`;

    return [
      subjectLine,
      funDirection,
      `Art style: ${stylePreset.artDirection}.`,
      persona ? personaLine : `Attire & textures: ${domainProps[params.specialisation]}.`,
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
    funDirection,
    'CRITICAL: Do NOT produce a raw photorealistic camera photo, uncanny skin pores, or noisy compression artifacts — craft stylized studio surfaces with detailed textures, silky subsurface softness, and cohesive volumetric illumination.',
    persona ? personaLine : `Wardrobe & material details: ${domainProps[params.specialisation]}.`,
    persona
      ? 'Composition & lighting: centered bust-up 4:3 hero portrait with generous headroom, cinematic global illumination, vibrant professional lighting, soft 3D render depth-of-field separation and a crisp electric-cyan (#00D4FF) rim light so the figure pops from the scene.'
      : 'Composition & lighting: centered bust-up 4:3 hero portrait with generous headroom, global illumination, vibrant professional lighting, soft 3D render depth-of-field separation against a clean deep midnight-navy (#061533) studio backdrop lit by electric neon-blue (#00D4FF) and crisp white rim lights.',
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
  (role, firstName) => `Every conversation at #DYPBSAICoE sparks a bold chapter — lead forward, ${firstName}.`,
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
    errors.name = 'Enter a name (at least 2 characters).';
  }
  if (!SPECIALISATIONS.includes(input.specialisation)) {
    errors.specialisation = 'Select a card theme.';
  }
  if (!TONES.includes(input.tone)) {
    errors.tone = 'Select a tone.';
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

/** Reduce any text to a single clean capitalised word (power-card stats are one word only). */
export function oneWord(value: unknown, fallback = ''): string {
  const parts = String(value ?? '')
    .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
    .trim()
    .split(/[\s-]+/)
    .filter(Boolean);
  const word = (parts[0] ?? '').slice(0, 14);
  if (!word) return fallback;
  return word.charAt(0).toUpperCase() + word.slice(1);
}

function clampText(value: unknown, max: number): string {
  const text = String(value ?? '').replace(/\s+/g, ' ').trim();
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  return `${cut.slice(0, lastSpace > max * 0.6 ? lastSpace : max).replace(/[,;:\s]+$/, '')}…`;
}

const FUN_TITLES = [
  'The Deadline Whisperer',
  'Captain Snooze Button',
  'The Snack Strategist',
  'Lord of the Tabs',
  'The Meeting Survivor',
  'Wi-Fi Wizard',
  'The Caffeine Overlord',
  'Professor Overthink',
];
const PERSONA_TITLES: Partial<Record<PersonaId, readonly string[]>> = {
  warrior: ['The Spreadsheet Warlord', 'Sir Snooze-a-Lot', 'Blade of the Deadline'],
  samurai: ['The Chai Ronin', 'Samurai of Standup', 'Master of Mondays'],
  ninja: ['The Silent Slacker', 'Ninja of the Inbox', 'Shadow of the Snack Drawer'],
  viking: ['Thor-ough Professional', 'Raider of the Fridge', 'Axe of the Agenda'],
  wizard: ['The Wi-Fi Wizard', 'Archmage of Excel', 'Sorcerer of Slack'],
  superhero: ['Captain Coffee', 'The Deadline Avenger', 'Super Snooze'],
  astronaut: ['Commander Caffeine', 'Lost in Space (Slides)', 'The Orbiting Overthinker'],
  pirate: ['Captain Wi-Fi Sparrow', 'Plunderer of Pastries', 'The Buried Treasure Hunter'],
  'cyber-hacker': ['The Bug Whisperer', 'Ctrl-Alt-Legend', 'Neon Debugger'],
  rockstar: ['The Meeting Rockstar', 'Frontman of the Funnel', 'Encore Engineer'],
  cowboy: ['The Sheriff of Standup', 'High Noon Hustler', 'Lasso of the Leads'],
};

const FUN_STRENGTHS = ['Hustle', 'Charm', 'Grit', 'Focus', 'Vibes', 'Wit', 'Patience', 'Rizz'];
const FUN_WEAKNESSES = ['Snacks', 'Mondays', 'Naps', 'Memes', 'Deadlines', 'Sarcasm', 'Shopping', 'Alarms'];
const FUN_HOBBIES = ['Napping', 'Doomscrolling', 'Karaoke', 'Chai', 'Gaming', 'Cricket', 'Baking', 'Binging'];

export function buildFunText(
  input: Pick<PitchInput, 'name' | 'currentPosition' | 'strength1' | 'weakness' | 'hobby'> & { personaId?: PersonaId },
  salt = 0
): Pick<PitchResult, 'title' | 'intro' | 'hobby'> & { strength1: string; weakness: string } {
  let h = salt * 7;
  for (const ch of `${input.name}|${input.currentPosition}`) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const pick = (list: readonly string[], offset: number) => list[(h + offset) % list.length];
  const first = input.name.trim().split(/\s+/)[0] || 'This legend';
  return {
    title: pick(PERSONA_TITLES[input.personaId ?? 'none'] ?? FUN_TITLES, 0),
    intro: `${first} enters the arena powered by pure confidence and one unfinished to-do list. Handle with care, highly contagious energy.`,
    strength1: oneWord(input.strength1) || pick(FUN_STRENGTHS, 1),
    weakness: oneWord(input.weakness) || pick(FUN_WEAKNESSES, 2),
    hobby: oneWord(input.hobby) || pick(FUN_HOBBIES, 3),
  };
}

export function buildFallbackPitch(input: PitchInput, salt = 0): PitchResult {
  const spec = input.specialisation;
  const fun = buildFunText(input, salt);
  const effectiveDreamRole = summarizePhrase(input.dreamRole, 5) || 'Legend';
  const tagline =
    input.tagline.trim() || generateDefaultTagline({ ...input, dreamRole: effectiveDreamRole }, salt);
  const motivationalLine =
    input.motivationalLine.trim() ||
    generateUniqueMotivationalLine({ ...input, dreamRole: effectiveDreamRole }, salt);

  return {
    title: clampText(input.cardTitle, 30) || fun.title,
    intro: fun.intro,
    hobby: fun.hobby,
    // pitch + headline stay populated so the Say It tab and QR text keep working.
    pitch: fun.intro,
    linkedin_headline: clampHeadline(fun.title),
    keywords: [...SPECIALISATION_KEYWORDS[spec]],
    strength1: fun.strength1,
    strength2: '',
    weakness: fun.weakness,
    tagline,
    motivationalLine,
    resolvedCharacterId: selectSmartCharacter(input),
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

/** Franchise words (Harry Potter) that must never be printed on a card. */
export const FRANCHISE =
  /\b(?:hogwarts|gryffindors?|slytherins?|ravenclaws?|hufflepuffs?|muggles?|quidditch|patronus(?:es)?|horcrux(?:es)?|sorting hat|dumbledore|voldemort|hermione|weasleys?|harry potter|potter(?:heads?)?|hogsmeade|dementors?|hagrid|snape|expecto|accio|expelliarmus|lumos|alohomora|wingardium|avada|snitch|diagon|azkaban)\b/i;

export function normalizePitchResponse(raw: unknown, input: PitchInput, salt = 0): PitchResult {
  const fallback = buildFallbackPitch(input, salt);
  if (!raw || typeof raw !== 'object') {
    return fallback;
  }
  const obj = raw as Record<string, unknown>;
  const title = clampText(input.cardTitle, 30) || clampText(obj.title, 30);
  const intro = clampText(obj.intro, 170);
  if (!title || !intro) {
    return fallback;
  }
  // Franchise names must never reach a printed card: drop the AI text and use the original archetype.
  if (FRANCHISE.test(title) || FRANCHISE.test(intro)) {
    const archetype = STREAMS[input.specialisation]?.archetype;
    return archetype ? { ...fallback, title: archetype, linkedin_headline: clampHeadline(archetype) } : fallback;
  }

  // Words the person typed win; the model only fills the blanks.
  // AI-written stats get the same franchise check as the title and intro.
  const stat = (typed: string, ai: unknown, fb: string) => {
    if (oneWord(typed)) return oneWord(typed);
    const word = oneWord(ai, fb);
    return FRANCHISE.test(word) ? fb : word;
  };

  let resolvedCharacterId = fallback.resolvedCharacterId;
  if (
    input.characterId === 'auto' &&
    typeof obj.recommended_character === 'string' &&
    VALID_CHARACTERS.has(obj.recommended_character as ResolvedCharacterId)
  ) {
    resolvedCharacterId = obj.recommended_character as ResolvedCharacterId;
  }

  return {
    ...fallback,
    title,
    intro,
    pitch: intro,
    linkedin_headline: clampHeadline(title),
    strength1: stat(input.strength1, obj.strength, fallback.strength1),
    weakness: stat(input.weakness, obj.weakness, fallback.weakness),
    hobby: stat(input.hobby, obj.hobby, fallback.hobby),
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
    '#DYPBSAICoE | Dr. D. Y. Patil B-School, Pune'
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
    personaId: 'none',
    stickerFont: 'cartoon',
    strength1: 'Excel',
    strength2: '',
    weakness: 'Overthinking',
    hobby: 'Cricket',
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
    personaId: 'none',
    stickerFont: 'vinyl',
    strength1: 'Creativity',
    strength2: '',
    weakness: 'Chatter',
    hobby: 'Karaoke',
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
    personaId: 'none',
    stickerFont: 'futurist',
    strength1: 'Hustle',
    strength2: '',
    weakness: 'Impatience',
    hobby: 'Golf',
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
    personaId: 'none',
    stickerFont: 'arcade',
    strength1: 'Empathy',
    strength2: '',
    weakness: 'Overcommitting',
    hobby: 'Baking',
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
    personaId: input.personaId,
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
