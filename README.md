# Power Card Studio (#DYPAICoE)

Snap a photo → AI turns it into a cartoon → get a funny trading-style **power card** at real
**playing-card size, 63.5 × 88.9 mm (2.5 × 3.5 in)**:

- funny title (e.g. "Captain Snooze Button")
- cartoon portrait made from the camera photo
- a two-line intro
- one-word **Strength / Weakness / Hobby** (type them, or leave blank and AI invents funny ones)

The back of the card is the name sticker, so cards print double-sided.

## Run

```bash
npm install
cp .env.example .env     # paste your keys
npm run dev              # http://localhost:3000
```

| Job | Key / model |
| --- | --- |
| Photo → cartoon portrait | `ANTHROPIC_API_KEY` (default, see Portrait engines) or `GEMINI_API_KEY` with `IMAGE_ENGINE=gemini`. For Gemini the server picks the best image model the key can use (prefers `gemini-3.1-flash-image`); image models need billing enabled. |
| Title, intro, one-word stats | `ANTHROPIC_API_KEY` (Claude) if set, otherwise Gemini |

An Anthropic key alone runs the whole booth. The booth header shows **AI online / offline**, and the reveal shows an amber note when a portrait fell back.
Without keys the app
still works: an offline cartoon filter and built-in jokes are used, and the UI says so.

## Stream cards (booth default)

Each student picks their PGDM stream and gets an ornate "magic academy" card in that stream's colours
(an original design, not tied to any film or book):

| Stream | Colour | Archetype | Icons |
| --- | --- | --- | --- |
| HR | Gold | The People Champion | people · heart · handshake |
| Business Analytics | Blue | The Analytics Wizard | chart · target · bulb |
| Finance | Red | The Financial Strategist | coins · trend · shield |
| Marketing | Green | The Marketing Maverick | megaphone · like · play |
| Leadership (guests) | Purple | The Visionary Leader | crown · rocket · star |

The real photo is cut out in the browser (MediaPipe selfie segmenter, model in `public/models/`, wasm copied to
`public/mediapipe/` on `npm install`) and placed in a glowing scene with a rune circle, sparks, light ribbons and
floating stream icons. Claude writes a wizard-style title themed on the stream, the intro and any stats left on
"AI decides". Everything except the text runs offline. Themes live in `src/utils/streams.ts`.

## Portrait engines

| `IMAGE_ENGINE` | How the portrait is made | Needs |
| --- | --- | --- |
| `filter` (default) | The real photo gets an Instagram-style look in the browser: Neon Cyber, Comic Pop, Golden Hour, Holo Foil, Retro Film or Noir Hero. Instant, free, keeps the likeness. | Nothing |
| `claude` | Claude (`claude-opus-5-5`) looks at the photo and picks hair, glasses, beard, headwear, skin and hair colours from an avatar kit; [DiceBear](https://github.com/dicebear/dicebear) draws a crisp vector cartoon. | Anthropic key only |
| `gemini` | Gemini repaints the photo in the chosen style, guided by `public/styles/` reference images. | Gemini key with billing enabled |

Claude also writes the funny title, intro and any stats left on "AI decides" (structured JSON output, with
server-side refusal fallback enabled). Claude-engine avatar art credits: Avataaars and Open Peeps by Pablo Stanley,
Personas by Draftbit (CC BY 4.0), Toon Head by Johan Melin (CC BY 4.0), Big Smile by Ashley Seo (CC BY 4.0),
Micah by Micah Lanier (CC BY 4.0).

## Booth mode (default screen)

The app opens on a full-screen sci-fi kiosk (the start card shows the visitor's live camera with a neon tint):
1. **Name** → 2. **Face scan** (3-2-1 countdown, or upload) → 3. **Stream**: their own photo shown as all five
stream portraits → 4. **Powers** (pick Strength / Weakness / Hobby, or leave "AI decides") with a live
card preview, then **Create my card**.
The AI writes the funny title and intro (and any stats left on "AI decides"), then the card materialises front-first. Keys: **Enter** to advance,
**1–5** to pick a stream, **Esc** to go back. "Studio" (top right) opens the full editor.

### Art styles and style references

Styles: Bold Toon, Retro 2D, Cozy Painted, 3D Animated, Cute Minimal, Flat Line Art.
Put one example image per style in `public/styles/<style-id>.jpg` (ids: `bold-toon`, `retro-2d`,
`cozy-painted`, `3d-animated`, `cute-flat`, `line-art`). The booth shows them as thumbnails and the
server sends them to Gemini as a **style reference** next to the photo, so results match the look closely.

## Personas (AI photo textures)

Pick a **character persona** under the art style: Warrior, Samurai, Ninja, Viking, Wizard, Superhero,
Astronaut, Pirate, Cyber Hacker, Rockstar or Cowboy (or "As I am"). Gemini dresses the person in that
costume and world while keeping their face recognisable, the card gets an "⚔️ WARRIOR EDITION" badge, and
the AI-written title and intro match the theme. Persona and art style combine (e.g. Warrior + Comic Pop-Art).
Add more in `PERSONA_OPTIONS` in `src/utils/pitch.ts`.

## Showcase mode (for the big screen)

Generating a card plays a "summoning" animation, then a full-screen reveal: the card flies in face-down,
flips with a flash and confetti, then floats with a holographic foil that follows the cursor.
Keys on the reveal screen: **P** print · **Enter** next person · **Esc** close. Use the **Showcase** button to replay it.
The camera does a 3-2-1 countdown with a flash. Sound effects can be muted (speaker icon); all motion
respects the OS "reduce motion" setting.

## Printing

Use the **Print Card** tab (or 1-Tap Print). In the print dialog choose **Actual size / 100%** and enable
**Background graphics**.

## Scripts

`npm run lint` (type-check) · `npm test` · `npm run build`
