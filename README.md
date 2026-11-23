# Power Card Studio (#DYPAICoE)

Snap a photo → AI turns it into a cartoon → get a funny trading-style **power card** at real
**playing-card size, 63.5 × 88.9 mm (2.5 × 3.5 in)**:

- funny title (e.g. "Captain Snooze Button")
- cartoon portrait made from the camera photo
- a two-line intro
- one-word **Strength / Weakness / Hobby** (type them, or leave blank and AI invents funny ones)

Only the front of the card is printed (one card per page, page size 2.5 × 3.5 in, no margins).

- **Download card** saves a 750 × 1050 PNG (2.5 × 3.5 in at 300 dpi), so it also prints at exact size.
- **Share on WhatsApp** opens the phone's share sheet with the card image (pick WhatsApp). On desktop
  browsers that cannot share files, it downloads the image and opens WhatsApp Web with the message.
- **Central history**: every card (with its original photo and portrait) is saved to a private Vercel Blob
  store, so all booth devices share one history. The booth's start page shows a **Recent Power Cards** wall
  below the hero (tap a card to show it full screen), and Studio → **History** lists them all with search,
  print, download, share and Backup / Restore. Lists refresh every 30 seconds. If the network drops, cards
  are kept on the device and upload automatically when it is back.
- **Deleting** a card needs the staff PIN: set `STAFF_PIN` in the Vercel project settings (deleting is off
  until it is set). The store's `BLOB_READ_WRITE_TOKEN` is added to the project by Vercel.

## Run

```bash
npm install
cp .env.example .env     # paste your keys
npm run dev              # http://localhost:3000
```

| Job | Key / model |
| --- | --- |
| Photo → cartoon portrait | `GEMINI_API_KEY` (booth stream portraits; `IMAGE_ENGINE=gemini` for the Create tab). For Gemini the server picks the best image model the key can use (prefers `gemini-3.1-flash-image`); image models need billing enabled. |
| Title, intro, one-word stats | `GEMINI_API_KEY` |

The app uses only the Gemini key; no Anthropic key is needed or read. The booth header shows **AI online / offline**, and the reveal shows an amber note when a portrait fell back.
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
floating stream icons. Gemini writes a wizard-style title themed on the stream, the intro and any stats left on
"AI decides". Everything except the text runs offline. Themes live in `src/utils/streams.ts`.

## Booth flow (current)

Start screen (#DYPAICOE hero with sample stream cards and the live camera card) → **Name** → **Stream**
(HR, BA, Finance, Marketing, Leadership) → **Face scan** → **Powers** (the Gemini portrait is painted in the
background with a themed progress loader) → **Create my card** → reveal.

Sample cards on the start screen and stream picker live in `public/samples/` (`hr`, `ba`, `finance`,
`marketing`, `leadership` `.jpg`). Generate them once with Gemini (fictional students):

```bash
npx tsx scripts/generate-samples.ts
```

Until they exist the cards show a glowing stream emblem.

## Campus backdrop

Every portrait (and the sample cards) is painted in front of the real Dr. D. Y. Patil B-School PGDM campus at night:
the photo in `server/assets/campus.jpg` is sent to Gemini as a second reference image next to the visitor's photo.
To use a different photo, replace that file and regenerate the embedded copy (needed for the Vercel bundle):

```bash
python3 -c "import base64;b=base64.b64encode(open('server/assets/campus.jpg','rb').read()).decode();open('server/campusImage.ts','w').write('export const CAMPUS_JPEG_BASE64 =\\n  \\''+b+'\\';\\n')"
npm run build:api
```

## Gemini AI portraits

With `GEMINI_API_KEY` in `.env` (billing enabled on the key's Google project; free-tier keys have an image quota of 0),
the final card portrait is painted by Gemini (`gemini-3.1-flash-image`, the server picks the best image model the key
can use): the visitor's photo is the reference and the prompt dresses them in a wizard-academy robe in their stream's
colour, holding a glowing stream emblem, in front of an original gothic clock-tower campus at night (the client's art
brief: half-body, straight-facing, wizard robe, white shirt, plain academic tie, preserve facial identity; no house
stripes or franchise lookalikes). The card frame and all text are drawn by the app so names are always spelled
correctly. Stream previews render instantly in the browser. The booth header shows "AI portraits paused" if Gemini
refuses (quota or billing), and then the card keeps the in-browser portrait with an amber note giving the reason.

## Portrait engines

| `IMAGE_ENGINE` | How the portrait is made | Needs |
| --- | --- | --- |
| `filter` (default) | The real photo gets an Instagram-style look in the browser: Neon Cyber, Comic Pop, Golden Hour, Holo Foil, Retro Film or Noir Hero. Instant, free, keeps the likeness. | Nothing |
| `gemini` | Gemini repaints the photo in the chosen style, guided by `public/styles/` reference images. | Gemini key with billing enabled |

Gemini also writes the funny title, intro and any stats left on "AI decides" (JSON schema output).

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
