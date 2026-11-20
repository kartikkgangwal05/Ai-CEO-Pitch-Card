// server.ts
import "dotenv/config";
import Anthropic2 from "@anthropic-ai/sdk";
import express from "express";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// server/claudeArt.ts
import Anthropic from "@anthropic-ai/sdk";
import { createAvatar } from "@dicebear/core";
import * as collection from "@dicebear/collection";

// src/utils/claudeStyles.ts
var CLAUDE_STYLES = {
  "bold-toon": {
    dicebear: "avataaars",
    label: "Bold Toon",
    blurb: "Classic cartoon avatar",
    bg: ["#7DD3FC", "#1D4ED8"],
    credit: "Avataaars by Pablo Stanley (free for personal and commercial use)"
  },
  "retro-2d": {
    dicebear: "openPeeps",
    label: "Hand-Drawn",
    blurb: "Ink sketch with attitude",
    bg: ["#FDE68A", "#F97316"],
    credit: "Open Peeps by Pablo Stanley (CC0)"
  },
  "cozy-painted": {
    dicebear: "personas",
    label: "Personas",
    blurb: "Soft, round & friendly",
    bg: ["#FBCFE8", "#9333EA"],
    credit: "Personas by Draftbit (CC BY 4.0)"
  },
  "3d-animated": {
    dicebear: "toonHead",
    label: "Toon Head",
    blurb: "Big-head toon hero",
    bg: ["#A7F3D0", "#0F766E"],
    credit: "Toon Head by Johan Melin (CC BY 4.0)"
  },
  "cute-flat": {
    dicebear: "bigSmile",
    label: "Big Smile",
    blurb: "Cute & cheerful",
    bg: ["#FFE4E6", "#FB7185"],
    credit: "Big Smile by Ashley Seo (CC BY 4.0)"
  },
  "line-art": {
    dicebear: "micah",
    label: "Flat Line Art",
    blurb: "Stylish flat portrait",
    bg: ["#E0E7FF", "#4338CA"],
    credit: "Micah by Micah Lanier (CC BY 4.0)"
  }
};

// server/claudeArt.ts
var CLAUDE_MODEL = "claude-opus-5-5";
var COLOR_KEYS = /* @__PURE__ */ new Set([
  "skinColor",
  "baseColor",
  "hairColor",
  "facialHairColor",
  "beardColor",
  "clothesColor",
  "clothingColor",
  "shirtColor"
]);
function styleFor(styleId) {
  const meta = CLAUDE_STYLES[styleId] ?? CLAUDE_STYLES["bold-toon"];
  const style = collection[meta.dicebear];
  return { meta, style };
}
function kitFields(style) {
  const props = style.schema?.properties ?? {};
  const fields = [];
  for (const [key, prop] of Object.entries(props)) {
    const options = prop.items?.enum ?? prop.enum;
    if (options && options.length > 1) {
      fields.push({ key, kind: "part", options: [...options] });
      if (props[`${key}Probability`]) fields.push({ key, kind: "toggle" });
    } else if (COLOR_KEYS.has(key)) {
      fields.push({ key, kind: "color" });
    }
  }
  return fields;
}
function outputSchema(fields) {
  const properties = {};
  for (const f of fields) {
    if (f.kind === "part") properties[f.key] = { type: "string", enum: f.options };
    if (f.kind === "toggle") properties[`${f.key}_visible`] = { type: "boolean" };
    if (f.kind === "color") properties[f.key] = { type: "string", description: "6-digit hex colour without #" };
  }
  return { type: "object", properties, required: Object.keys(properties), additionalProperties: false };
}
var SYSTEM_PROMPT = `You are a caricature artist building a cartoon avatar of a real person from an avatar kit.
You get a photo and must pick one value for every kit slot so the avatar is instantly recognisable as that person.
Priorities, in order: hair (length, shape, parting, texture, colour), skin tone, glasses (only if they wear them),
facial hair (only if they have it), headwear (only if worn: hijab, turban, cap), earrings (only if visible).
Expression: always friendly and confident, a smile.
Slots ending in "_visible": true only when that item is clearly present in the photo.
Colour slots: a 6-digit hex sampled from the photo (skin from the cheek, hair from the hair), no "#".
Clothing colour: match their top. If no person is visible, build a cheerful generic avatar.`;
var hex = (v, fallback) => {
  const s = String(v ?? "").replace("#", "").trim().toLowerCase();
  return /^[0-9a-f]{6}$/.test(s) ? s : fallback;
};
function composeCardArt(avatarSvg, bg) {
  const inner = avatarSvg.replace(/<svg\b([^>]*)>/, (_m, attrs) => {
    const cleaned = attrs.replace(/\s(width|height|x|y)="[^"]*"/g, "");
    return `<svg x="60" y="12" width="280" height="288"${cleaned}>`;
  });
  const rays = Array.from({ length: 12 }, (_, i) => {
    const a = i * Math.PI / 6;
    const x1 = 200 + Math.cos(a - 0.08) * 420;
    const y1 = 150 + Math.sin(a - 0.08) * 420;
    const x2 = 200 + Math.cos(a + 0.08) * 420;
    const y2 = 150 + Math.sin(a + 0.08) * 420;
    return `<polygon points="200,150 ${x1.toFixed(1)},${y1.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)}" fill="#ffffff" fill-opacity="0.09"/>`;
  }).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="800" height="600">
<defs><radialGradient id="bg" cx="50%" cy="42%" r="75%"><stop offset="0" stop-color="${bg[0]}"/><stop offset="1" stop-color="${bg[1]}"/></radialGradient></defs>
<rect width="400" height="300" fill="url(#bg)"/>${rays}
<circle cx="200" cy="150" r="118" fill="#ffffff" fill-opacity="0.16"/>
${inner}</svg>`;
}
function toDataUrl(svg) {
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}
function renderAvatar(styleId, seed, picks, partial = false) {
  const { meta, style } = styleFor(styleId);
  const options = { seed, backgroundColor: ["transparent"] };
  if (picks) {
    for (const f of kitFields(style)) {
      if (f.kind === "part" && typeof picks[f.key] === "string" && f.options.includes(picks[f.key])) {
        options[f.key] = [picks[f.key]];
      }
      if (f.kind === "toggle" && (!partial || `${f.key}_visible` in picks)) {
        options[`${f.key}Probability`] = picks[`${f.key}_visible`] ? 100 : 0;
      } else if (f.kind === "toggle" && partial && !/^(hair|top)$/.test(f.key)) {
        options[`${f.key}Probability`] = 0;
      }
      if (f.kind === "color" && picks[f.key]) options[f.key] = [hex(picks[f.key], "000000")];
    }
  }
  const avatar = createAvatar(style, options).toString();
  return composeCardArt(avatar, meta.bg);
}
var PREVIEW_PICKS = {
  avataaars: { eyes: "happy", mouth: "smile", eyebrows: "defaultNatural", top_visible: true },
  openPeeps: { face: "smileBig" },
  personas: { eyes: "happy", mouth: "bigSmile", hair: "shortCombover" },
  toonHead: { eyes: "happy", mouth: "laugh", eyebrows: "happy" },
  bigSmile: { eyes: "cheery", mouth: "openedSmile" },
  micah: { eyes: "smiling", mouth: "smile", hair_visible: true }
};
function stylePreviewSvg(styleId, seed = "Power Card") {
  const { meta } = styleFor(styleId);
  return renderAvatar(styleId, seed, PREVIEW_PICKS[meta.dicebear], true);
}
var client = null;
function getAnthropicClient() {
  const key = process.env.ANTHROPIC_API_KEY?.trim();
  if (!key || key === "MY_ANTHROPIC_API_KEY") return null;
  client ??= new Anthropic({ apiKey: key, timeout: 45e3, maxRetries: 1 });
  return client;
}
async function claudePortrait(params) {
  const anthropic = getAnthropicClient();
  if (!anthropic) throw new Error("ANTHROPIC_API_KEY is not set.");
  const { style } = styleFor(params.styleId);
  const fields = kitFields(style);
  const response = await anthropic.beta.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 4e3,
    output_config: { effort: "low", format: { type: "json_schema", schema: outputSchema(fields) } },
    // Server-side fallback: if the request is declined, it re-runs on a fallback model automatically.
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: params.mimeType, data: params.imageBase64 }
          },
          { type: "text", text: "Build this person's avatar from the kit." }
        ]
      }
    ]
  });
  if (response.stop_reason === "refusal") throw new Error("Claude declined to describe this photo.");
  const text = response.content.find((b) => b.type === "text");
  if (!text || text.type !== "text") throw new Error("Claude returned no avatar description.");
  const picks = JSON.parse(text.text);
  return { imageUrl: toDataUrl(renderAvatar(params.styleId, params.seed, picks)), picks };
}

// src/utils/streams.ts
var GOLD = ["#FFF1B8", "#E7B547", "#8A5A12"];
var STREAMS = {
  HR: {
    id: "HR",
    short: "HR Stream",
    archetype: "The People Champion",
    glow: "#FFB020",
    light: "#FFE08A",
    deep: "#2A1604",
    printDeep: "#4A2A08",
    printInk: "#2E1904",
    ink: "#1A0E02",
    frame: GOLD,
    icons: ["people", "heart", "handshake"],
    words: ["Empathy", "Leadership", "Culture"],
    flavor: "an HR wizard who casts spells of empathy, hiring and team culture"
  },
  "Business Analytics": {
    id: "Business Analytics",
    short: "BA Stream",
    archetype: "The Analytics Wizard",
    glow: "#2F8CFF",
    light: "#9CCBFF",
    deep: "#030F2E",
    printDeep: "#0A2350",
    printInk: "#061738",
    ink: "#020818",
    frame: ["#E8F1FF", "#9DB7E0", "#5B79AD"],
    icons: ["chart", "target", "bulb"],
    words: ["Analyse", "Strategise", "Innovate"],
    flavor: "a data wizard who conjures dashboards, SQL and predictions"
  },
  Finance: {
    id: "Finance",
    short: "Finance Stream",
    archetype: "The Financial Strategist",
    glow: "#FF3B2F",
    light: "#FFB199",
    deep: "#2A0404",
    printDeep: "#4A0B0B",
    printInk: "#2C0606",
    ink: "#160202",
    frame: GOLD,
    icons: ["coins", "trend", "shield"],
    words: ["Plan", "Invest", "Grow"],
    flavor: "a finance sorcerer who multiplies money, models and valuations"
  },
  Marketing: {
    id: "Marketing",
    short: "Marketing Stream",
    archetype: "The Marketing Maverick",
    glow: "#22D36B",
    light: "#A6F5C4",
    deep: "#03200F",
    printDeep: "#0B3A1F",
    printInk: "#06261A",
    ink: "#021208",
    frame: GOLD,
    icons: ["megaphone", "like", "play"],
    words: ["Create", "Connect", "Grow"],
    flavor: "a marketing magician who makes brands go viral and campaigns sparkle"
  },
  "Executive Leadership": {
    id: "Executive Leadership",
    short: "Leadership",
    archetype: "The Visionary Leader",
    glow: "#A855F7",
    light: "#DDB8FF",
    deep: "#16052A",
    printDeep: "#2E0C4E",
    printInk: "#1A0530",
    ink: "#0C0218",
    frame: GOLD,
    icons: ["crown", "rocket", "star"],
    words: ["Vision", "Mentor", "Scale"],
    flavor: "a visionary leader and founder who summons growth, partnerships and big bets"
  }
};

// server/portraitArt.ts
var STREAM_LOOK = {
  HR: {
    colour: "warm gold and amber",
    prop: "holding a glowing golden hologram of three people icons floating above the open palm",
    symbols: "faint glowing silhouettes of people and teams"
  },
  "Business Analytics": {
    colour: "electric sapphire blue",
    prop: "holding a floating holographic dashboard with glowing bar charts and a pie chart above the open palm",
    symbols: "faint glowing charts, graphs and data streams"
  },
  Finance: {
    colour: "deep crimson red",
    prop: "holding a stack of glowing gold coins with a rising golden arrow above the open palm",
    symbols: "faint glowing stock-market candlestick charts"
  },
  Marketing: {
    colour: "emerald green",
    prop: "holding a glowing golden megaphone above the open palm",
    symbols: "faint glowing social media icons such as play buttons, likes, hearts and targets"
  },
  "Executive Leadership": {
    colour: "royal purple",
    prop: "holding a glowing golden crown of light above the open palm",
    symbols: "faint glowing stars and rising arrows"
  }
};
function artBrief(stream, subject) {
  const look = STREAM_LOOK[stream] ?? STREAM_LOOK["Business Analytics"];
  return [
    `Premium cinematic fantasy collectible trading-card artwork, inspired by magical wizard-school fantasy and enchanted academies, magical realism.`,
    `A half-body portrait of ${subject} in the exact centre, looking directly at the camera, straight-facing pose, confident and friendly.`,
    `They wear an elegant black wizard robe with ${look.colour} lining and hood, a crisp white shirt and a plain solid ${look.colour} academic tie with no stripes.`,
    `${look.prop}.`,
    `Dramatic ${look.colour} magical lighting, glowing particles, swirling energy ribbons and ${look.symbols} surrounding the character.`,
    "Background: a grand dark-stone Indian-gothic university palace with a tall central clock tower, wide stone arches and glowing windows under a stormy sky, clearly different from any famous wizard-school castle.",
    "Original design only: no striped house ties, no house crests, no lightning-bolt scar, and nothing that copies any existing film, book or franchise.",
    "Premium realistic 3D digital artwork, cinematic lighting, highly detailed, sharp focus on the face.",
    "No text, no letters, no numbers, no logos, no watermark, no card border or frame."
  ].join(" ");
}
function buildGeminiPrompt(stream) {
  return [
    "Using the attached photo as the identity reference, create a new image.",
    artBrief(stream, "the exact person in the attached photo"),
    "Preserve the person's actual facial identity, facial structure, hairstyle, skin tone, glasses, beard and natural appearance exactly; they must be instantly recognisable.",
    "Portrait orientation."
  ].join(" ");
}

// server.ts
import { GoogleGenAI, ThinkingLevel, Type } from "@google/genai";

// src/utils/pitch.ts
var SPECIALISATIONS = [
  "Business Analytics",
  "Marketing",
  "Finance",
  "HR",
  "Executive Leadership"
];
var TONES = ["Confident", "Friendly", "Formal"];
var EXACT_SYSTEM_PROMPT = `You write the text for funny, printable trading-style "power cards" handed out at the #DYPAICoE launch event.
Tone: playful, witty, warm. Roast gently so the person laughs and wants to keep the card.
Never mock appearance, body, age, gender, religion, caste, ethnicity or anything sensitive. No profanity.
Never reference Harry Potter or any franchise: no Hogwarts, Gryffindor, Slytherin, Ravenclaw, Hufflepuff, Muggle, Quidditch, Patronus, Horcrux, Sorting, Dumbledore, Voldemort, or named spells like Accio, Expelliarmus, Lumos. Keep any magic flavour original.
Return ONLY valid JSON with:
- title: a funny 2-4 word epithet like "The Spreadsheet Sorcerer" or "Captain Snooze Button", max 28 characters, never containing the person's name.
- intro: exactly two short sentences, 14-24 words in total, punchy, in the voice of a trading-card description. Never use he/she/him/her: use the first name or "they", because you cannot know how the person identifies.
- strength, weakness, hobby: EXACTLY ONE WORD each (no spaces or hyphens), max 12 characters, capitalised, funny and specific to the facts when possible. If the user supplied a word for one of them, use that word.
- power: an integer from 60 to 99.`;
var SPECIALISATION_KEYWORDS = {
  Marketing: ["Brand Positioning", "Go-to-Market Strategy", "Campaign Analytics"],
  Finance: ["Financial Modeling", "Valuation Analysis", "Capital Allocation"],
  "Business Analytics": ["SQL & BI Dashboards", "Data Storytelling", "Predictive Modeling"],
  HR: ["Talent Acquisition", "People Analytics", "Organizational Alignment"],
  "Executive Leadership": ["Strategic Growth", "AI Transformation", "Enterprise Partnerships"]
};
var PERSONA_OPTIONS = [
  { id: "none", label: "As I am", emoji: "\u{1F642}", prompt: "", flavor: "" },
  {
    id: "warrior",
    label: "Warrior",
    emoji: "\u2694\uFE0F",
    prompt: "a fierce legendary battle warrior in scratched steel armour with a flowing crimson cape, holding a glowing sword, standing on a smoky battlefield at stormy sunset with embers in the air",
    flavor: "a legendary battle warrior (swords, war cries, glory)"
  },
  {
    id: "samurai",
    label: "Samurai",
    emoji: "\u{1F3EF}",
    prompt: "a noble samurai in ornate lacquered armour and a crested kabuto helmet, katana at the hip, cherry blossom petals drifting past a misty mountain temple at dawn",
    flavor: "a disciplined samurai (honour, katana, calm focus)"
  },
  {
    id: "ninja",
    label: "Ninja",
    emoji: "\u{1F977}",
    prompt: "a stealthy ninja in a dark hooded outfit with a fabric half-mask showing the eyes, shuriken in hand, crouched on a moonlit rooftop with a glowing full moon behind",
    flavor: "a stealthy ninja (shadows, silence, sneaking in)"
  },
  {
    id: "viking",
    label: "Viking",
    emoji: "\u{1FA93}",
    prompt: "a mighty Viking chieftain with a horned-style fur-trimmed helmet, braided hair and beard, a round painted shield and a battle axe, a longship on a stormy sea behind",
    flavor: "a mighty Viking raider (axes, longships, feasts)"
  },
  {
    id: "wizard",
    label: "Wizard",
    emoji: "\u{1F9D9}",
    prompt: "a wise, slightly chaotic wizard in a starry purple robe and a tall pointed hat, holding a glowing crystal staff, magical sparkles swirling in an ancient candle-lit library",
    flavor: "a powerful wizard (spells, potions, arcane chaos)"
  },
  {
    id: "superhero",
    label: "Superhero",
    emoji: "\u{1F9B8}",
    prompt: "a bold comic-book superhero with a dramatic cape, a bright emblem on a skin-tight suit and a confident hands-on-hips pose, a glittering city skyline at golden hour behind",
    flavor: "a superhero (capes, saving the day, secret identity)"
  },
  {
    id: "astronaut",
    label: "Astronaut",
    emoji: "\u{1F680}",
    prompt: "a space explorer in a white astronaut suit with the helmet visor open so the face is fully visible, mission patches on the suit, a colourful nebula and a ringed planet behind",
    flavor: "a space explorer (rockets, zero gravity, the final frontier)"
  },
  {
    id: "pirate",
    label: "Pirate",
    emoji: "\u{1F3F4}\u200D\u2620\uFE0F",
    prompt: "a swashbuckling pirate captain with a feathered tricorn hat, a red bandana and a bold coat, a treasure map in hand, a tall ship sailing on turquoise water behind",
    flavor: "a swashbuckling pirate captain (treasure, seas, rum-free adventures)"
  },
  {
    id: "cyber-hacker",
    label: "Cyber Hacker",
    emoji: "\u{1F916}",
    prompt: "a neon cyberpunk hacker with glowing visor-style glasses, a tech jacket with LED trim and holographic screens floating around, a rainy neon city street at night behind",
    flavor: "a cyberpunk hacker (code, neon, bugs and glitches)"
  },
  {
    id: "rockstar",
    label: "Rockstar",
    emoji: "\u{1F3B8}",
    prompt: "a flamboyant rockstar in a studded leather jacket and sunglasses, holding an electric guitar, on a smoky stage with spotlights and a roaring crowd behind",
    flavor: "a rockstar (stage, encores, sold-out shows)"
  },
  {
    id: "cowboy",
    label: "Cowboy",
    emoji: "\u{1F920}",
    prompt: "a cool wild-west cowboy in a wide-brim hat, a leather vest and a bandana, a sheriff star on the chest, a dusty desert canyon at golden sunset behind",
    flavor: "a wild-west cowboy (sheriffs, dust, high noon showdowns)"
  }
];
function getPersona(id) {
  return PERSONA_OPTIONS.find((p) => p.id === id) ?? PERSONA_OPTIONS[0];
}
var CARTOON_STYLE_OPTIONS = [
  {
    id: "bold-toon",
    label: "Bold Toon",
    blurb: "Thick outlines, big grin",
    swatch: ["#F3EEE4", "#7A4A2A"],
    modern: true,
    artDirection: "a clean modern cartoon portrait illustration with bold, smooth dark-brown outlines of even weight, crisp two-tone cel shading on skin and hair, warm natural skin tones, a big friendly toothy grin, expressive eyes with bright catch-lights, glossy highlights on glasses if worn, on a plain flat warm off-white background"
  },
  {
    id: "retro-2d",
    label: "Retro 2D",
    blurb: "Classic hand-drawn feel",
    swatch: ["#F1E2D3", "#D9663C"],
    modern: true,
    artDirection: "a classic hand-drawn 2D animation character portrait with simple rounded shapes, confident thick black ink outlines, large shiny cartoon eyes, flat muted warm colours with one simple shadow tone, a subtle risograph paper-grain texture, on a plain flat soft beige background"
  },
  {
    id: "cozy-painted",
    label: "Cozy Painted",
    blurb: "Warm cinematic glow",
    swatch: ["#3B2A1E", "#F2B35B"],
    modern: true,
    artDirection: "a semi-realistic animated-film character portrait with soft painterly rendering, large expressive eyes with long lashes, smooth glowing skin, gentle warm lamp light with soft rim light, cinematic shallow depth of field, in a cozy softly blurred room with warm bokeh behind"
  },
  {
    id: "3d-animated",
    label: "3D Animated",
    blurb: "Animated-movie hero",
    swatch: ["#1E63E9", "#7FB4FF"],
    modern: true,
    artDirection: "a high-quality 3D animated-movie character render with stylised proportions, a slightly larger head, big glossy eyes, soft subsurface-scattered skin, detailed hair strands and fabric, warm studio key light with soft fill, on a smooth saturated solid royal-blue gradient background"
  },
  {
    id: "cute-flat",
    label: "Cute Minimal",
    blurb: "Kawaii avatar, dot eyes",
    swatch: ["#FBF1E6", "#F4C99B"],
    modern: true,
    artDirection: "a minimal cute flat avatar illustration with simple dot eyes, a small smile, rosy circular blush cheeks, smooth thin dark-brown outlines, flat pastel colours with very little shading, and a soft peach circle behind the head on a cream background"
  },
  {
    id: "line-art",
    label: "Flat Line Art",
    blurb: "Graphic, crisp & stylish",
    swatch: ["#C9BFB3", "#2E4A66"],
    modern: true,
    artDirection: "a flat graphic editorial portrait illustration in a clean ligne-claire style: crisp uniform black linework, flat colour blocks with no gradients, minimal blush shading, detailed flowing hair strands drawn as lines, calm confident expression, on a plain flat muted taupe background"
  },
  {
    id: "anime-hero",
    hidden: true,
    label: "Anime Hero",
    artDirection: "studio-quality modern Makoto Shinkai & Arcane-inspired cel-shaded hero portrait, 3D corporate mascot charisma, detailed fabric and hair textures, vibrant professional lighting, luminous expressive eyes, crisp refined ink linework, and volumetric cyan rim light"
  },
  {
    id: "vinyl-toy",
    hidden: true,
    label: "3D Vinyl Mascot",
    artDirection: "3D corporate mascot, vibrant 3D rendered avatar styled like a Pixar & designer vinyl collectible bust, detailed textures on tailored lapels and hair strands, vibrant professional lighting, soft 3D render with silky subsurface porcelain-matte shader and cinema three-point cyan rim light"
  },
  {
    id: "comic-pop",
    hidden: true,
    label: "Comic Pop-Art",
    artDirection: "vibrant modern graphic novel protagonist illustration (Spider-Verse inspired), crisp bold ink contours, detailed painterly micro-textures, vibrant professional lighting, balanced bold cel color blocking, and dynamic collector-card hero presence"
  },
  {
    id: "cyber-chibi",
    hidden: true,
    label: "Cyber Chibi",
    artDirection: "adorable high-craft stylized chibi 3D corporate mascot, detailed textures, vibrant professional lighting, soft 3D render finish with expressive oversized eyes, warm charismatic smile, and sleek minimalist holographic cyan tech accents"
  },
  {
    id: "pencil-sketch",
    label: "Ink Sketch",
    artDirection: "masterclass hand-drawn charcoal & fine-liner architectural ink portrait sketch on crisp cool-ivory textured sketchbook paper, detailed graphite grain and tailored cloth textures, confident clean contour linework, subtle diagonal cross-hatching shadows, and delicate electric cyan (#00D4FF) highlight accents"
  }
];
function buildCharacterGenerationPrompt(params) {
  const custom = (params.customPrompt ?? "").trim();
  const stylePreset = CARTOON_STYLE_OPTIONS.find((s) => s.id === params.cartoonStyle) ?? CARTOON_STYLE_OPTIONS[0];
  const isSketch = stylePreset.id === "pencil-sketch";
  const hasPhoto = params.hasReferencePhoto ?? true;
  if (params.isEdit && custom) {
    return `Edit this ${isSketch ? "hand-drawn ink & graphite portrait sketch with detailed paper and cloth textures" : "high-craft 3D corporate mascot / vibrant 3D rendered avatar portrait (detailed textures, vibrant professional lighting, soft 3D render)"}: ${custom}. Keep silhouette separation crisp and studio-grade (${stylePreset.artDirection}) with strictly zero text, letters, logos, or watermarks.`;
  }
  const domainProps = {
    "Business Analytics": "finely tailored midnight-navy wool blazer over a crisp cotton crew tee with detailed weave textures, subtle glowing brushed-cyan data prism beside shoulder, sleek eyeglasses optional",
    Marketing: "sharp contemporary smart-casual textured jacket in navy & white, confident charismatic smile, minimalist luminous spark lapel accent",
    Finance: "tailored midnight-navy suit jacket with crisp collar and matte satin lapel texture, calm executive poise, subtle geometric diamond pin",
    HR: "approachable textured smart blazer, warm genuine smile, subtle glowing constellation star lapel pin",
    "Executive Leadership": "distinguished dark-navy structured tailored coat with rich fabric grain, poised visionary expression, subtle luminous apex geometric halo behind head"
  };
  const visitorArchetypes = {
    "PGDM Student": "ambitious next-generation PGDM management scholar with crisp high-growth executive energy",
    "Company Owner / Founder": "visionary founder & entrepreneur aura with charismatic trailblazer poise",
    "Director / CXO": "distinguished C-suite enterprise leader presence with calm strategic authority"
  };
  const persona = params.personaId && params.personaId !== "none" ? getPersona(params.personaId) : null;
  const personaLine = persona ? `Costume & setting: dress the person as ${persona.prompt}. Keep their face, hairstyle, glasses, skin tone and expression clearly recognisable underneath the costume, and make the background rich, colourful and cinematic.` : "";
  const roleContext = persona ? `styled as an epic ${persona.label.toLowerCase()} character` : params.dreamRole?.trim() ? `styled as an inspiring ${params.dreamRole.trim()} (${visitorArchetypes[params.visitorType]})` : `representing ${params.specialisation} (${visitorArchetypes[params.visitorType]})`;
  const extraStyle = custom ? ` Additional creative direction: ${custom}.` : "";
  const funDirection = "Make it a funny, good-natured power-card caricature: a slightly oversized head, a playful confident grin or smirk, and a heroic trading-card pose. Flattering and joyful, never mean or grotesque. Keep their own clothing and accessories recognisable.";
  if (stylePreset.modern) {
    const likeness = hasPhoto ? "Likeness is the top priority: keep their exact face shape, hairstyle and hair colour, skin tone, eyebrows, eye shape, nose, glasses, beard or moustache, earrings and expression, so friends instantly recognise them." : "";
    return [
      hasPhoto ? `Turn the person in the FIRST image into ${stylePreset.artDirection}.` : `Create an original character as ${stylePreset.artDirection}.`,
      likeness,
      params.hasStyleReference ? "The SECOND image is a STYLE REFERENCE only: match its art style exactly (line weight, shading, colour palette, eye style, level of detail and rendering), but never copy that person, their face, hair or clothes." : "",
      persona ? personaLine : "Keep their own everyday clothing, simplified to match the style.",
      "Mood: flattering, charming and fun with a confident smile; a collectible trading-card hero portrait.",
      "Framing: single person, head-and-shoulders, centred and facing the camera, eyes in the upper third, shoulders visible, generous headroom, 4:3 landscape canvas with the background filling the sides.",
      "Strictly NO text, letters, numbers, logos, signatures, watermarks, frames or borders.",
      extraStyle
    ].filter(Boolean).join(" ");
  }
  if (isSketch) {
    const subjectLine = hasPhoto ? `Create a clean, expressive hand-drawn ink & graphite SKETCH portrait of the person in the reference photo (preserving exact facial likeness, hairstyle, glasses, and expression), ${roleContext}.` : `Create an original, expressive hand-drawn ink & graphite SKETCH portrait of an iconic ${params.specialisation} specialist (${visitorArchetypes[params.visitorType]}), ${roleContext}.`;
    return [
      subjectLine,
      funDirection,
      `Art style: ${stylePreset.artDirection}.`,
      persona ? personaLine : `Attire & textures: ${domainProps[params.specialisation]}.`,
      "Composition & lighting: centered head-and-shoulders studio portrait with generous headroom, crisp smooth light-tinted paper grain, vibrant studio key-to-shadow contrast, and clean electric-cyan edge accents so the portrait pops cleanly on a dark collector card.",
      "Quality rules: clean confident strokes, balanced proportions, NO distorted hands/faces, NO messy smudges, and strictly NO text, signatures, labels, or card frames.",
      extraStyle
    ].filter(Boolean).join(" ");
  }
  const heroSubject = hasPhoto ? `Transform the person in the attached reference photo (preserving recognizable hairstyle, glasses, facial structure, and friendly expression) into a high-craft CARTOON / ILLUSTRATED CHARACTER portrait styled as a 3D corporate mascot with detailed textures, vibrant professional lighting, and soft 3D render polish (${stylePreset.artDirection}), ${roleContext}.` : `Design an original, iconic professional corporate mascot & vibrant 3D rendered avatar character portrait (3D corporate mascot, detailed textures, vibrant professional lighting, soft 3D render; ${stylePreset.artDirection}), ${roleContext}.`;
  return [
    heroSubject,
    funDirection,
    "CRITICAL: Do NOT produce a raw photorealistic camera photo, uncanny skin pores, or noisy compression artifacts \u2014 craft stylized studio surfaces with detailed textures, silky subsurface softness, and cohesive volumetric illumination.",
    persona ? personaLine : `Wardrobe & material details: ${domainProps[params.specialisation]}.`,
    persona ? "Composition & lighting: centered bust-up 4:3 hero portrait with generous headroom, cinematic global illumination, vibrant professional lighting, soft 3D render depth-of-field separation and a crisp electric-cyan (#00D4FF) rim light so the figure pops from the scene." : "Composition & lighting: centered bust-up 4:3 hero portrait with generous headroom, global illumination, vibrant professional lighting, soft 3D render depth-of-field separation against a clean deep midnight-navy (#061533) studio backdrop lit by electric neon-blue (#00D4FF) and crisp white rim lights.",
    "Quality rules: balanced anatomy, symmetrical expressive eyes, uncluttered background, strictly NO text, words, letters, signatures, logos, or borders inside the image.",
    extraStyle
  ].filter(Boolean).join(" ");
}
var TAGLINE_TEMPLATES = {
  Marketing: [
    (role) => `Turning brand stories into measurable ${role} velocity.`,
    (role) => `Where customer insight meets sharp ${role} execution.`
  ],
  Finance: [
    (role) => `Bringing analytical precision to every ${role} decision.`,
    (role) => `Capital rigor engineered for high-stakes ${role} impact.`
  ],
  "Business Analytics": [
    (role) => `Converting raw telemetry into decisive ${role} action.`,
    (role) => `Data clarity powered by AI speed for ${role}.`
  ],
  HR: [
    (role) => `Aligning human potential with strategic ${role} outcomes.`,
    (role) => `Building high-trust cultures ready for ${role} scale.`
  ],
  "Executive Leadership": [
    (role) => `Architecting AI-era ventures and ${role} excellence.`,
    (role) => `Where boardroom vision meets decisive ${role} execution.`
  ]
};
var MOTIVATIONAL_TEMPLATES = [
  (role, firstName) => `${firstName}, clarity in 30 seconds opens doors \u2014 own your ${role} journey.`,
  (role) => `Lead with measurable impact today, and every ${role} room will remember your name.`,
  (role, firstName) => `Preparation turns vision into reality \u2014 step boldly into ${role}, ${firstName}.`,
  (role) => `Your insight is your edge; bring structured conviction to every ${role} conversation.`,
  (role, firstName) => `${firstName}, great ${role} leaders turn complex challenges into calm clarity.`,
  (role) => `Speak with proof, listen with intent, and build your signature in ${role}.`,
  (role, firstName) => `Every conversation at #DYPAICoE sparks a bold chapter \u2014 lead forward, ${firstName}.`,
  (role) => `Discipline beats noise: let clarity and integrity power your ${role} impact.`,
  (role, firstName) => `${firstName}, pair curiosity with commercial rigor and the ${role} frontier is yours.`,
  (role) => `Real outcomes speak loudest \u2014 walk into every room ready to build.`,
  (role, firstName) => `Confidence is proof organized well; go make your mark in ${role}, ${firstName}.`,
  (role) => `Stay grounded in evidence, bold in vision, and relentless in your ${role} craft.`
];
function hashVisitorSeed(input, salt = 0) {
  const raw = `${input.name.trim().toLowerCase()}|${input.specialisation}|${input.dreamRole.trim().toLowerCase()}|${input.strength1.trim().toLowerCase()}|${salt}`;
  let hash = 2166136261;
  for (let i = 0; i < raw.length; i++) {
    hash ^= raw.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash);
}
function selectSmartCharacter(input) {
  if (input.characterId && input.characterId !== "auto") {
    return input.characterId;
  }
  const combined = [
    input.currentPosition,
    input.dreamRole,
    input.strength1,
    input.strength2,
    input.weakness
  ].join(" ").toLowerCase();
  if (input.visitorType !== "PGDM Student" || /\b(founder|owner|director|ceo|cxo|md|managing|entrepreneur|venture|board)\b/.test(combined)) {
    if (/\b(ai|gadget|robot|automation|tech|bot|product)\b/.test(combined) && input.visitorType === "PGDM Student") {
      return "gadget-cat";
    }
    return "visionary-captain";
  }
  if (/\b(creative|viral|reel|social|meme|funny|humor|brand|campaign|story|pitch|gtm|stage|sales)\b/.test(combined)) {
    return "mischief-maverick";
  }
  if (/\b(ai|bot|gadget|automation|python|code|build|prototype|app|tool|smart|robot)\b/.test(combined)) {
    return "gadget-cat";
  }
  if (/\b(hr|people|empathy|culture|team|hiring|music|listen|mentor|trust|harmony|conflict|coach)\b/.test(combined)) {
    return "harmony-ace";
  }
  if (/\b(finance|valuation|dcf|equity|risk|audit|excel|capital|money|credit|invest|margin)\b/.test(combined)) {
    return "strategy-prodigy";
  }
  if (/\b(data|sql|bi|tableau|power\s?bi|analytics|telemetry|forecast|metric|dashboard)\b/.test(combined)) {
    return "data-wizard";
  }
  switch (input.specialisation) {
    case "Marketing":
      return "mischief-maverick";
    case "Finance":
      return "strategy-prodigy";
    case "HR":
      return "harmony-ace";
    case "Executive Leadership":
      return "visionary-captain";
    case "Business Analytics":
    default:
      return "data-wizard";
  }
}
function generateUniqueMotivationalLine(input, salt = 0) {
  const firstName = (input.name.trim().split(/\s+/)[0] || "Scholar").replace(/[^a-zA-Z'-]/g, "") || "Scholar";
  const role = summarizePhrase(input.dreamRole || input.specialisation, 4) || "leadership";
  const idx = hashVisitorSeed(input, salt) % MOTIVATIONAL_TEMPLATES.length;
  return MOTIVATIONAL_TEMPLATES[idx](role, firstName);
}
function generateDefaultTagline(input, salt = 0) {
  const role = summarizePhrase(input.dreamRole || input.specialisation, 3) || "executive";
  const list = TAGLINE_TEMPLATES[input.specialisation];
  const idx = hashVisitorSeed(input, salt) % list.length;
  return list[idx](role);
}
function validatePitchInput(input) {
  const errors = {};
  if (!input.name.trim() || input.name.trim().length < 2) {
    errors.name = "Enter a name (at least 2 characters).";
  }
  if (!SPECIALISATIONS.includes(input.specialisation)) {
    errors.specialisation = "Select a card theme.";
  }
  if (!TONES.includes(input.tone)) {
    errors.tone = "Select a tone.";
  }
  return errors;
}
function clampHeadline(headline) {
  const normalized = headline.replace(/\s+/g, " ").trim();
  if (normalized.length <= 200) return normalized;
  return normalized.slice(0, 197).trimEnd() + "...";
}
function summarizePhrase(phrase, maxWords = 8) {
  const words = phrase.trim().replace(/\.$/, "").split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return words.join(" ");
  return words.slice(0, maxWords).join(" ");
}
function oneWord(value, fallback = "") {
  const parts = String(value ?? "").replace(/[^\p{L}\p{N}\s-]/gu, " ").trim().split(/[\s-]+/).filter(Boolean);
  const word = (parts[0] ?? "").slice(0, 14);
  if (!word) return fallback;
  return word.charAt(0).toUpperCase() + word.slice(1);
}
function clampText(value, max) {
  const text = String(value ?? "").replace(/\s+/g, " ").trim();
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return `${cut.slice(0, lastSpace > max * 0.6 ? lastSpace : max).replace(/[,;:\s]+$/, "")}\u2026`;
}
var FUN_TITLES = [
  "The Deadline Whisperer",
  "Captain Snooze Button",
  "The Snack Strategist",
  "Lord of the Tabs",
  "The Meeting Survivor",
  "Wi-Fi Wizard",
  "The Caffeine Overlord",
  "Professor Overthink"
];
var PERSONA_TITLES = {
  warrior: ["The Spreadsheet Warlord", "Sir Snooze-a-Lot", "Blade of the Deadline"],
  samurai: ["The Chai Ronin", "Samurai of Standup", "Master of Mondays"],
  ninja: ["The Silent Slacker", "Ninja of the Inbox", "Shadow of the Snack Drawer"],
  viking: ["Thor-ough Professional", "Raider of the Fridge", "Axe of the Agenda"],
  wizard: ["The Wi-Fi Wizard", "Archmage of Excel", "Sorcerer of Slack"],
  superhero: ["Captain Coffee", "The Deadline Avenger", "Super Snooze"],
  astronaut: ["Commander Caffeine", "Lost in Space (Slides)", "The Orbiting Overthinker"],
  pirate: ["Captain Wi-Fi Sparrow", "Plunderer of Pastries", "The Buried Treasure Hunter"],
  "cyber-hacker": ["The Bug Whisperer", "Ctrl-Alt-Legend", "Neon Debugger"],
  rockstar: ["The Meeting Rockstar", "Frontman of the Funnel", "Encore Engineer"],
  cowboy: ["The Sheriff of Standup", "High Noon Hustler", "Lasso of the Leads"]
};
var FUN_STRENGTHS = ["Hustle", "Charm", "Grit", "Focus", "Vibes", "Wit", "Patience", "Rizz"];
var FUN_WEAKNESSES = ["Snacks", "Mondays", "Naps", "Memes", "Deadlines", "Sarcasm", "Shopping", "Alarms"];
var FUN_HOBBIES = ["Napping", "Doomscrolling", "Karaoke", "Chai", "Gaming", "Cricket", "Baking", "Binging"];
function buildFunText(input, salt = 0) {
  let h = salt * 7;
  for (const ch of `${input.name}|${input.currentPosition}`) h = h * 31 + ch.charCodeAt(0) >>> 0;
  const pick = (list, offset) => list[(h + offset) % list.length];
  const first = input.name.trim().split(/\s+/)[0] || "This legend";
  return {
    title: pick(PERSONA_TITLES[input.personaId ?? "none"] ?? FUN_TITLES, 0),
    intro: `${first} enters the arena powered by pure confidence and one unfinished to-do list. Handle with care, highly contagious energy.`,
    strength1: oneWord(input.strength1) || pick(FUN_STRENGTHS, 1),
    weakness: oneWord(input.weakness) || pick(FUN_WEAKNESSES, 2),
    hobby: oneWord(input.hobby) || pick(FUN_HOBBIES, 3)
  };
}
function buildFallbackPitch(input, salt = 0) {
  const spec = input.specialisation;
  const fun = buildFunText(input, salt);
  const effectiveDreamRole = summarizePhrase(input.dreamRole, 5) || "Legend";
  const tagline = input.tagline.trim() || generateDefaultTagline({ ...input, dreamRole: effectiveDreamRole }, salt);
  const motivationalLine = input.motivationalLine.trim() || generateUniqueMotivationalLine({ ...input, dreamRole: effectiveDreamRole }, salt);
  return {
    title: fun.title,
    intro: fun.intro,
    hobby: fun.hobby,
    // pitch + headline stay populated so the Say It tab and QR text keep working.
    pitch: fun.intro,
    linkedin_headline: clampHeadline(fun.title),
    keywords: [...SPECIALISATION_KEYWORDS[spec]],
    strength1: fun.strength1,
    strength2: "",
    weakness: fun.weakness,
    tagline,
    motivationalLine,
    resolvedCharacterId: selectSmartCharacter(input),
    source: "template"
  };
}
var VALID_CHARACTERS = /* @__PURE__ */ new Set([
  "gadget-cat",
  "mischief-maverick",
  "harmony-ace",
  "strategy-prodigy",
  "visionary-captain",
  "data-wizard"
]);
function extractJsonObject(rawText) {
  const trimmed = rawText.trim();
  const fenced = /^```(?:json)?\s*([\s\S]*?)\s*```$/i.exec(trimmed);
  const candidate = fenced ? fenced[1].trim() : trimmed;
  try {
    return JSON.parse(candidate);
  } catch {
    const start = candidate.indexOf("{");
    const end = candidate.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(candidate.slice(start, end + 1));
    }
    throw new Error("Response did not contain valid JSON.");
  }
}
var FRANCHISE = /\b(?:hogwarts|gryffindors?|slytherins?|ravenclaws?|hufflepuffs?|muggles?|quidditch|patronus(?:es)?|horcrux(?:es)?|sorting hat|dumbledore|voldemort|hermione|weasleys?|harry potter|potter(?:heads?)?|hogsmeade|dementors?|hagrid|snape|expecto|accio|expelliarmus|lumos|alohomora|wingardium|avada|snitch|diagon|azkaban)\b/i;
function normalizePitchResponse(raw, input, salt = 0) {
  const fallback = buildFallbackPitch(input, salt);
  if (!raw || typeof raw !== "object") {
    return fallback;
  }
  const obj = raw;
  const title = clampText(obj.title, 30);
  const intro = clampText(obj.intro, 170);
  if (!title || !intro) {
    return fallback;
  }
  if (FRANCHISE.test(title) || FRANCHISE.test(intro)) {
    const archetype = STREAMS[input.specialisation]?.archetype;
    return archetype ? { ...fallback, title: archetype, linkedin_headline: clampHeadline(archetype) } : fallback;
  }
  const stat = (typed, ai, fb) => {
    if (oneWord(typed)) return oneWord(typed);
    const word = oneWord(ai, fb);
    return FRANCHISE.test(word) ? fb : word;
  };
  let resolvedCharacterId = fallback.resolvedCharacterId;
  if (input.characterId === "auto" && typeof obj.recommended_character === "string" && VALID_CHARACTERS.has(obj.recommended_character)) {
    resolvedCharacterId = obj.recommended_character;
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
    source: "ai"
  };
}

// server.ts
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var PORT = Number(process.env.PORT || 3e3);
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build"
      }
    }
  });
}
function getAnthropicApiKey() {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey || apiKey === "MY_ANTHROPIC_API_KEY") {
    return null;
  }
  return apiKey;
}
var CARD_TEXT_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string", description: "Funny 2-4 word epithet, max 28 chars, no name." },
    intro: { type: "string", description: "Exactly two short punchy sentences, 14-24 words total." },
    strength: { type: "string", description: "ONE word." },
    weakness: { type: "string", description: "ONE word." },
    hobby: { type: "string", description: "ONE word." },
    power: { type: "integer", description: "60-99" },
    recommended_character: {
      type: "string",
      enum: ["gadget-cat", "mischief-maverick", "harmony-ace", "strategy-prodigy", "visionary-captain", "data-wizard"]
    }
  },
  required: ["title", "intro", "strength", "weakness", "hobby", "power", "recommended_character"],
  additionalProperties: false
};
async function callAnthropicJson(params) {
  const anthropic = getAnthropicClient();
  if (!anthropic) throw new Error("ANTHROPIC_API_KEY is not set.");
  const response = await anthropic.beta.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 4e3,
    output_config: { effort: "low", format: { type: "json_schema", schema: CARD_TEXT_SCHEMA } },
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    system: params.system,
    messages: [{ role: "user", content: params.userPrompt }]
  });
  if (response.stop_reason === "refusal") throw new Error("Claude declined to write this card.");
  const text = response.content.find((b) => b.type === "text");
  if (!text || text.type !== "text") throw new Error("Claude returned no card text.");
  return JSON.parse(text.text);
}
function getImageEngine() {
  const forced = process.env.IMAGE_ENGINE?.trim().toLowerCase();
  if (forced === "claude" || forced === "gemini" || forced === "filter") return forced;
  return "filter";
}
function loadStyleReference(styleId) {
  if (!/^[a-z0-9-]+$/.test(styleId)) return null;
  const types = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp" };
  for (const [ext, mimeType] of Object.entries(types)) {
    const file = path.resolve(__dirname, "public", "styles", `${styleId}.${ext}`);
    if (fs.existsSync(file)) {
      return { mimeType, data: fs.readFileSync(file).toString("base64") };
    }
  }
  return null;
}
var PREFERRED_IMAGE_MODELS = [
  "gemini-3.1-flash-image",
  "gemini-3.1-flash-image-preview",
  "gemini-3-pro-image",
  "gemini-3-pro-image-preview",
  "gemini-2.5-flash-image",
  "gemini-2.5-flash-image-preview"
];
var imageModelCandidates = null;
var workingImageModel = null;
async function getImageModelCandidates(ai) {
  const envModel = process.env.GEMINI_IMAGE_MODEL?.trim();
  if (imageModelCandidates) return imageModelCandidates;
  let available = [];
  try {
    const pager = await ai.models.list({ config: { pageSize: 200 } });
    for await (const m of pager) {
      const id = (m.name ?? "").replace(/^models\//, "");
      const actions = m.supportedActions ?? [];
      if (/gemini/i.test(id) && /image/i.test(id) && (actions.length === 0 || actions.includes("generateContent"))) {
        available.push(id);
      }
    }
  } catch (err) {
    console.warn("[image] could not list models, using defaults:", err instanceof Error ? err.message : err);
    available = [];
  }
  const ordered = available.length ? [
    ...PREFERRED_IMAGE_MODELS.filter((m) => available.includes(m)),
    ...available.filter((m) => !PREFERRED_IMAGE_MODELS.includes(m)).sort((a, b) => Number(/flash/.test(b)) - Number(/flash/.test(a)))
  ] : PREFERRED_IMAGE_MODELS;
  imageModelCandidates = [envModel, ...ordered].filter((m, i, all) => Boolean(m) && all.indexOf(m) === i);
  console.log("[image] model candidates:", imageModelCandidates.join(", "));
  return imageModelCandidates;
}
function explainGeminiError(err) {
  const msg = err instanceof Error ? err.message : String(err);
  if (/API key not valid|API_KEY_INVALID|PERMISSION_DENIED|401|403/i.test(msg)) return "Gemini rejected the API key.";
  if (/spending cap/i.test(msg)) return "Gemini monthly spending cap reached: raise it at ai.studio/spend. (quota)";
  if (/quota|RESOURCE_EXHAUSTED|429|billing/i.test(msg)) return "Gemini image quota used up or billing not enabled for this key.";
  if (/timed out/i.test(msg)) return "Gemini took too long to draw the portrait.";
  if (/not found|404|not supported/i.test(msg)) return "No Gemini image model available for this key.";
  return msg.slice(0, 160);
}
var isModelMissing = (err) => /not found|404|not supported|unsupported|does not support|INVALID_ARGUMENT.*model/i.test(err instanceof Error ? err.message : String(err));
var geminiQuotaUntil = 0;
function geminiStatus() {
  if (!getGeminiClient()) return "off";
  return Date.now() < geminiQuotaUntil ? "quota" : "ok";
}
async function geminiPortrait(ai, photo, stream) {
  const listed = await getImageModelCandidates(ai);
  const candidates = workingImageModel ? [workingImageModel, ...listed.filter((m) => m !== workingImageModel)] : listed;
  const parts = [
    { inlineData: { mimeType: photo.mimeType, data: photo.data.toString("base64") } },
    { text: buildGeminiPrompt(stream) }
  ];
  let lastErr = new Error("No Gemini image model available for this key.");
  const started = Date.now();
  for (const model of candidates) {
    if (Date.now() - started > 55e3) break;
    try {
      const response = await Promise.race([
        ai.models.generateContent({
          model,
          contents: { parts },
          config: { responseModalities: ["IMAGE"], imageConfig: { aspectRatio: "4:5" } }
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Gemini timed out")), 6e4))
      ]);
      for (const part of response.candidates?.[0]?.content?.parts ?? []) {
        if (part.inlineData?.data) {
          workingImageModel = model;
          geminiQuotaUntil = 0;
          return { image: `data:${part.inlineData.mimeType ?? "image/png"};base64,${part.inlineData.data}`, model };
        }
      }
      lastErr = new Error("Gemini returned no image (it may have declined this photo).");
    } catch (err) {
      lastErr = err;
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[gemini] ${model} failed:`, msg.slice(0, 200));
      if (!isModelMissing(err) && !/quota|RESOURCE_EXHAUSTED|429/i.test(msg)) break;
    }
  }
  if (/quota|RESOURCE_EXHAUSTED|429/i.test(lastErr instanceof Error ? lastErr.message : String(lastErr))) {
    geminiQuotaUntil = Date.now() + 15 * 6e4;
  }
  throw lastErr;
}
async function createApp() {
  const app = express();
  app.use(express.json({ limit: "15mb" }));
  app.get("/api/health", async (_req, res) => {
    const ai = getGeminiClient();
    const imageModels = ai ? await getImageModelCandidates(ai).catch(() => []) : [];
    res.json({
      ok: true,
      imageEngine: getImageEngine(),
      imageModel: getImageEngine() === "filter" ? "browser photo filter" : getImageEngine() === "claude" ? CLAUDE_MODEL : workingImageModel ?? imageModels[0] ?? null,
      aiConfigured: Boolean(getGeminiClient() || getAnthropicApiKey()),
      geminiConfigured: Boolean(getGeminiClient()),
      anthropicConfigured: Boolean(getAnthropicApiKey()),
      geminiStatus: geminiStatus()
    });
  });
  app.post("/api/pitch", async (req, res) => {
    const rawBody = req.body ?? {};
    const input = {
      visitorType: rawBody.visitorType || "PGDM Student",
      name: String(rawBody.name ?? ""),
      currentPosition: String(rawBody.currentPosition ?? ""),
      specialisation: rawBody.specialisation,
      characterId: rawBody.characterId || "auto",
      capturedPhotoUrl: String(rawBody.capturedPhotoUrl ?? ""),
      aiCharacterUrl: String(rawBody.aiCharacterUrl ?? ""),
      characterPrompt: String(rawBody.characterPrompt ?? ""),
      cartoonStyle: rawBody.cartoonStyle || "anime-hero",
      personaId: rawBody.personaId || "none",
      stickerFont: rawBody.stickerFont || "cartoon",
      strength1: String(rawBody.strength1 ?? rawBody.strength ?? ""),
      strength2: String(rawBody.strength2 ?? ""),
      weakness: String(rawBody.weakness ?? ""),
      hobby: String(rawBody.hobby ?? ""),
      dreamRole: String(rawBody.dreamRole ?? ""),
      tagline: String(rawBody.tagline ?? ""),
      motivationalLine: String(rawBody.motivationalLine ?? ""),
      tone: rawBody.tone
    };
    const validationErrors = validatePitchInput(input);
    if (Object.keys(validationErrors).length > 0) {
      res.status(400).json({ error: "Please complete all required fields.", fields: validationErrors });
      return;
    }
    const ai = getGeminiClient();
    const anthropicKey = getAnthropicApiKey();
    if (!ai && !anthropicKey) {
      res.status(503).json({
        error: "Configure GEMINI_API_KEY or ANTHROPIC_API_KEY in Settings > Secrets."
      });
      return;
    }
    try {
      const typed = (label, value) => value.trim() ? `${label}: ${value.trim()} (use exactly this word)` : `${label}: (not given, invent a funny one-word answer)`;
      const userPrompt = [
        `Name: ${input.name.trim()}`,
        input.currentPosition.trim() ? `Fun facts / what they do: ${input.currentPosition.trim()}` : "Fun facts: (none given, invent something light and relatable such as coffee, meetings, phone battery or snacks)",
        getPersona(input.personaId).flavor ? `Card persona: the person is drawn as ${getPersona(input.personaId).flavor}. Make the title and intro playfully match this theme.` : "Card persona: none (everyday portrait).",
        rawBody.design === "arcane" ? `Stream: ${input.specialisation}. This is a magic-academy card: the person is ${STREAMS[input.specialisation]?.flavor ?? "a business wizard"}. Make the title a funny wizard-style epithet tied to this stream (e.g. "The Spreadsheet Sorcerer", "Archmage of Appraisals"), and keep any invented stats relevant to the stream.` : `Stream: ${input.specialisation}.`,
        typed("Strength", input.strength1),
        typed("Weakness", input.weakness),
        typed("Hobby", input.hobby),
        "Return ONLY valid JSON with fields: title, intro, strength, weakness, hobby, power, recommended_character."
      ].join("\n");
      if (anthropicKey) {
        try {
          const parsed2 = await callAnthropicJson({
            system: EXACT_SYSTEM_PROMPT,
            userPrompt
          });
          const normalized2 = normalizePitchResponse(parsed2, input);
          res.json(normalized2);
          return;
        } catch (anthropicErr) {
          if (!ai) {
            throw anthropicErr;
          }
          console.warn(
            "Anthropic pitch call failed, falling back to Gemini:",
            anthropicErr instanceof Error ? anthropicErr.message : anthropicErr
          );
        }
      }
      const response = await Promise.race([
        ai.models.generateContent({
          model: "gemini-4-hydrogen",
          contents: userPrompt,
          config: {
            systemInstruction: EXACT_SYSTEM_PROMPT,
            responseMimeType: "application/json",
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING, description: "Funny 2-4 word epithet, max 28 chars, no name." },
                intro: { type: Type.STRING, description: "Exactly two short punchy sentences, 14-24 words total." },
                strength: { type: Type.STRING, description: "ONE word." },
                weakness: { type: Type.STRING, description: "ONE word." },
                hobby: { type: Type.STRING, description: "ONE word." },
                power: { type: Type.INTEGER, description: "60-99" },
                recommended_character: {
                  type: Type.STRING,
                  description: "Pick the best matching cartoon ID from: gadget-cat, mischief-maverick, harmony-ace, strategy-prodigy, visionary-captain, data-wizard."
                }
              },
              required: ["title", "intro", "strength", "weakness", "hobby", "power", "recommended_character"]
            }
          }
        }),
        new Promise(
          (_, reject) => setTimeout(() => reject(new Error("Gemini API timed out after 10s.")), 1e4)
        )
      ]);
      const rawText = (response.text ?? "").trim();
      const parsed = extractJsonObject(rawText);
      const normalized = normalizePitchResponse(parsed, input);
      res.json(normalized);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to generate pitch via AI.";
      res.status(502).json({ error: message });
    }
  });
  app.post("/api/say-it", async (req, res) => {
    const { audioBase64, mimeType, targetPitch, dreamRole, name } = req.body ?? {};
    if (!audioBase64 || !mimeType) {
      res.status(400).json({ error: "Audio recording payload is required." });
      return;
    }
    const ai = getGeminiClient();
    if (!ai) {
      res.status(503).json({ error: "Gemini API key is not configured on this server." });
      return;
    }
    try {
      const transcribeResponse = await ai.models.generateContent({
        model: "gemini-3.5-transcribe",
        contents: {
          parts: [
            {
              inlineData: {
                mimeType,
                data: audioBase64
              }
            },
            {
              text: "Transcribe this spoken 30-second elevator pitch verbatim in English."
            }
          ]
        }
      });
      const transcript = (transcribeResponse.text ?? "").trim();
      if (!transcript) {
        res.status(422).json({ error: "No clear speech was detected in the recording. Please try speaking closer to the mic." });
        return;
      }
      const coachResponse = await ai.models.generateContent({
        model: "gemini-4-hydrogen",
        contents: [
          `Speaker: ${name || "Booth Visitor"}`,
          `Focus / Role: ${dreamRole || "Leadership Pitch"}`,
          `Target Script: ${targetPitch || "(none provided)"}`,
          `Spoken Transcript: ${transcript}`,
          "Give ONE specific, encouraging, practical improvement tip (max 28 words) on delivery, clarity, or example impact."
        ].join("\n"),
        config: {
          systemInstruction: "You are a concise, supportive placement & leadership pitch coach at Dr. D. Y. Patil B-School, Pune. Return ONLY valid JSON with one string field named tip.",
          responseMimeType: "application/json",
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              tip: {
                type: Type.STRING,
                description: "One concise improvement tip (max 28 words)."
              }
            },
            required: ["tip"]
          }
        }
      });
      const parsedTip = JSON.parse((coachResponse.text ?? "{}").trim());
      res.json({
        transcript,
        tip: parsedTip.tip?.trim() || "Pause briefly before sharing your example metric so listeners catch the impact clearly."
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to transcribe or coach the audio.";
      res.status(502).json({ error: message });
    }
  });
  app.post("/api/magic-portrait", async (req, res) => {
    const { imageDataUrl, stream } = req.body ?? {};
    const gemini = getGeminiClient();
    if (!gemini) {
      res.status(503).json({ error: "GEMINI_API_KEY is not set, so AI portraits are off." });
      return;
    }
    const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/.exec(imageDataUrl ?? "");
    if (!match || !stream || !(stream in STREAMS)) {
      res.status(400).json({ error: "A photo and a valid stream are required." });
      return;
    }
    const photo = { mimeType: match[1], data: Buffer.from(match[2], "base64") };
    {
      const started = Date.now();
      try {
        const { image, model } = await geminiPortrait(gemini, photo, stream);
        console.log(`[gemini] portrait for ${stream} with ${model} in ${Date.now() - started} ms`);
        res.json({ image, provider: "gemini" });
        return;
      } catch (err) {
        const reason = explainGeminiError(err);
        console.warn("[gemini]", reason);
        res.status(reason.includes("quota") ? 429 : 502).json({ error: reason });
      }
    }
  });
  app.get("/api/style-preview/:styleId.svg", (req, res) => {
    try {
      res.type("image/svg+xml").set("Cache-Control", "public, max-age=3600");
      res.send(stylePreviewSvg(req.params.styleId, String(req.query.seed ?? "Power Card")));
    } catch {
      res.status(404).end();
    }
  });
  app.post("/api/character", async (req, res) => {
    const rawBody = req.body ?? {};
    const imageDataUrl = (rawBody.imageDataUrl ?? "").trim();
    const customPrompt = (rawBody.customPrompt ?? "").trim();
    const resolvedStyle = rawBody.cartoonStyle || "bold-toon";
    if (getImageEngine() === "filter" && !rawBody.isEdit) {
      res.json({ imageUrl: null, fallbackMode: "photo-filter", styleUsed: resolvedStyle });
      return;
    }
    if (getImageEngine() === "claude" && imageDataUrl && !rawBody.isEdit) {
      const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/.exec(imageDataUrl);
      if (!match) {
        res.status(400).json({ error: "Invalid captured image format. Please capture or upload PNG/JPEG/WebP." });
        return;
      }
      try {
        const { imageUrl } = await claudePortrait({
          imageBase64: match[2],
          mimeType: match[1],
          styleId: resolvedStyle,
          seed: String(imageDataUrl.length)
        });
        res.json({ imageUrl, fallbackMode: "claude-avatar", model: CLAUDE_MODEL, styleUsed: resolvedStyle });
      } catch (err) {
        const reason = err instanceof Anthropic2.AuthenticationError ? "Claude rejected the API key." : err instanceof Anthropic2.RateLimitError ? "Claude rate limit reached, try again in a moment." : err instanceof Error ? err.message.slice(0, 160) : "Claude portrait failed.";
        console.warn("[claude-art] falling back to offline filter:", reason);
        res.json({
          imageUrl: null,
          fallbackMode: "comic-cel-shade",
          styleUsed: resolvedStyle,
          notice: `AI portrait unavailable (${reason}) Used the offline cartoon filter instead.`
        });
      }
      return;
    }
    const ai = getGeminiClient();
    if (!ai) {
      res.json({
        imageUrl: null,
        fallbackMode: "comic-cel-shade",
        styleUsed: resolvedStyle,
        notice: "AI portrait unavailable (no GEMINI_API_KEY in .env). Used the offline cartoon filter instead."
      });
      return;
    }
    try {
      const parts = [];
      if (imageDataUrl) {
        const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/.exec(imageDataUrl);
        if (!match) {
          res.status(400).json({ error: "Invalid captured image format. Please capture or upload PNG/JPEG/WebP." });
          return;
        }
        parts.push({
          inlineData: {
            mimeType: match[1],
            data: match[2]
          }
        });
      }
      const styleRef = imageDataUrl && !rawBody.isEdit ? loadStyleReference(resolvedStyle) : null;
      if (styleRef) {
        parts.push({ inlineData: styleRef });
      }
      const promptText = buildCharacterGenerationPrompt({
        hasStyleReference: Boolean(styleRef),
        specialisation: rawBody.specialisation || "Business Analytics",
        visitorType: rawBody.visitorType || "PGDM Student",
        dreamRole: rawBody.dreamRole,
        cartoonStyle: resolvedStyle,
        personaId: rawBody.personaId,
        customPrompt,
        isEdit: Boolean(rawBody.isEdit),
        hasReferencePhoto: Boolean(imageDataUrl)
      });
      parts.push({ text: promptText });
      const tryGenerateWithModel = async (modelId) => {
        const imageConfig = { aspectRatio: "4:3" };
        const response = await Promise.race([
          ai.models.generateContent({
            model: modelId,
            contents: { parts },
            config: { responseModalities: ["IMAGE"], imageConfig }
          }),
          new Promise(
            (_, reject) => setTimeout(() => reject(new Error(`Image generation timed out on ${modelId}.`)), 4e4)
          )
        ]);
        for (const part of response.candidates?.[0]?.content?.parts ?? []) {
          if (part.inlineData?.data) {
            const mime = part.inlineData.mimeType ?? "image/png";
            return `data:${mime};base64,${part.inlineData.data}`;
          }
        }
        return "";
      };
      const listed = await getImageModelCandidates(ai);
      const candidates = workingImageModel ? [workingImageModel, ...listed.filter((m) => m !== workingImageModel)] : listed;
      let generatedImageUrl = "";
      let usedModel = candidates[0];
      let lastErr = null;
      const started = Date.now();
      for (const modelId of candidates) {
        if (Date.now() - started > 55e3) break;
        try {
          generatedImageUrl = await tryGenerateWithModel(modelId);
          usedModel = modelId;
          if (generatedImageUrl) {
            workingImageModel = modelId;
            break;
          }
        } catch (err) {
          lastErr = err;
          console.warn(`[image] ${modelId} failed:`, err instanceof Error ? err.message : err);
          if (!isModelMissing(err)) break;
        }
      }
      if (!generatedImageUrl && lastErr) throw lastErr;
      if (!generatedImageUrl) {
        res.json({
          imageUrl: null,
          fallbackMode: "comic-cel-shade",
          styleUsed: resolvedStyle,
          notice: "Applied Studio Comic & Sketch filter automatically (no image part returned by Gemini)."
        });
        return;
      }
      res.json({
        imageUrl: generatedImageUrl,
        fallbackMode: "gemini-ai",
        model: usedModel,
        styleUsed: resolvedStyle
      });
    } catch (err) {
      const reason = explainGeminiError(err);
      console.warn("[image] falling back to offline filter:", reason);
      res.json({
        imageUrl: null,
        fallbackMode: "comic-cel-shade",
        styleUsed: resolvedStyle,
        notice: `AI portrait unavailable (${reason}) Used the offline cartoon filter instead.`
      });
    }
  });
  return app;
}
async function startServer() {
  const app = await createApp();
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`My Pitch Card booth server listening on http://localhost:${PORT}`);
  });
}
if (!process.env.VERCEL) void startServer();

// server/vercelEntry.ts
var appReady = createApp();
async function handler(req, res) {
  const app = await appReady;
  app(req, res);
}
export {
  handler as default
};
