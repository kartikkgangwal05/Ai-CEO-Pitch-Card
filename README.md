# Power Card Studio (#DYPAICoE)

Snap a photo → Gemini turns it into a cartoon → get a funny trading-style **power card** at real
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
| Photo → cartoon portrait | `GEMINI_API_KEY`. The server asks Gemini which image models the key can use and picks the best (prefers `gemini-3.1-flash-image`). Force one with `GEMINI_IMAGE_MODEL`. Image models may need billing enabled. |
| Title, intro, one-word stats | `ANTHROPIC_API_KEY` (Claude) if set, otherwise Gemini |

Claude cannot generate images, so a Gemini key is what makes the cartoon portrait. The booth header shows **AI online / offline**, and the reveal shows an amber note when a portrait fell back.
Without keys the app
still works: an offline cartoon filter and built-in jokes are used, and the UI says so.

## Booth mode (default screen)

The app opens on a full-screen sci-fi kiosk that needs only three things:
1. **Name** → 2. **Look** (6 art styles + optional class) → 3. **Powers** (pick Strength / Weakness / Hobby,
or leave "AI decides") with a live card preview → 4. **Face scan** (3-2-1 countdown, or upload).
The AI writes the funny title and intro (and any stats left on "AI decides"), then the card materialises front-first. Keys: **Enter** to advance,
**1–6** to pick a style, **Esc** to go back. "Studio" (top right) opens the full editor.

### Art styles and style references

Styles: Bold Toon, Retro 2D, Cozy Painted, 3D Animated, Cute Minimal, Flat Line Art.
Put one example image per style in `public/styles/<style-id>.jpg` (ids: `bold-toon`, `retro-2d`,
`cozy-painted`, `3d-animated`, `cute-flat`, `line-art`). The booth shows them as thumbnails and the
server sends them to Gemini as a **style reference** next to the photo, so results match the look closely.
These images are git-ignored (they may be third-party art).

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
