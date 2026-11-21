import { useId, type CSSProperties } from 'react';
import { memberNo } from '../utils/foundingMember';
import type { VisitorCard } from '../types/pitch';
import { ICON_PATHS, STREAMS } from '../utils/streams';

interface ArcaneCardProps {
  card: VisitorCard;
  mode?: 'preview' | 'print';
}

const display: CSSProperties = { fontFamily: '"Cinzel", Georgia, serif' };
const serif: CSSProperties = { fontFamily: '"Cinzel", "Cormorant Garamond", Georgia, serif' };
const book: CSSProperties = { fontFamily: '"Cormorant Garamond", Georgia, serif' };

/**
 * The card's outer frame (viewBox matches the 5:7 card): a thick engraved metal band with filigree, cut-in
 * corners with beads, rosettes on the inner corners and jewels at the middle of each side, like the reference.
 * The band also defines the card's outer silhouette (everything outside it is transparent).
 */
function OrnateFrame({ id, gold, gem }: { id: string; gold: [string, string, string]; gem: string }) {
  const [g0, g1, g2] = gold;
  const metal = `url(#metal-${id})`;
  const gemFill = `url(#gem-${id})`;
  // outer edge with concave (cut-in) corners, inner edge with small rounded corners
  const outer = 'M19 5 H231 A14 14 0 0 0 245 19 V331 A14 14 0 0 0 231 345 H19 A14 14 0 0 0 5 331 V19 A14 14 0 0 0 19 5 Z';
  const inner = 'M21 16 H229 Q234 16 234 21 V329 Q234 334 229 334 H21 Q16 334 16 329 V21 Q16 16 21 16 Z';
  const corners: [number, number][] = [[16, 16], [234, 16], [16, 334], [234, 334]];
  const beads: [number, number][] = [[7, 7], [243, 7], [7, 343], [243, 343]];
  return (
    <svg viewBox="0 0 250 350" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 h-full w-full" style={{ zIndex: 30 }} aria-hidden="true">
      <defs>
        <linearGradient id={`metal-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={g0} />
          <stop offset="0.18" stopColor={g1} />
          <stop offset="0.32" stopColor={g2} />
          <stop offset="0.5" stopColor={g0} />
          <stop offset="0.68" stopColor={g1} />
          <stop offset="0.84" stopColor={g2} />
          <stop offset="1" stopColor={g0} />
        </linearGradient>
        <radialGradient id={`gem-${id}`} cx="0.38" cy="0.32" r="0.75">
          <stop offset="0" stopColor="#fff" />
          <stop offset="0.3" stopColor={gem} />
          <stop offset="1" stopColor="#000" stopOpacity="0.85" />
        </radialGradient>
        {/* engraved scroll-and-leaf filigree, tiled over the band */}
        <pattern id={`filigree-${id}`} width="26" height="11" patternUnits="userSpaceOnUse">
          {/* a flowing vine: a long wave with curled tendrils and small leaves, engraved (dark) with a lit edge */}
          <path
            d="M0 5.5 C4 1.5 9 1.5 13 5.5 C17 9.5 22 9.5 26 5.5 M6.5 2.6 c-0.6 -1.6 1.4 -2.4 2.2 -1 c0.6 1 -0.6 1.8 -1.2 1.1 M19.5 8.4 c0.6 1.6 -1.4 2.4 -2.2 1 c-0.6 -1 0.6 -1.8 1.2 -1.1 M10 3.4 c1.6 -0.4 2.6 0.4 2.8 1.6 c-1.4 0.3 -2.4 -0.4 -2.8 -1.6 Z M16 7.6 c-1.6 0.4 -2.6 -0.4 -2.8 -1.6 c1.4 -0.3 2.4 0.4 2.8 1.6 Z"
            fill="none"
            stroke="#000"
            strokeOpacity="0.55"
            strokeWidth="0.8"
            strokeLinecap="round"
          />
          <path d="M0 6.2 C4 2.2 9 2.2 13 6.2 C17 10.2 22 10.2 26 6.2" fill="none" stroke="#fff" strokeOpacity="0.4" strokeWidth="0.45" />
        </pattern>
        <pattern id={`filigree-v-${id}`} width="26" height="11" patternUnits="userSpaceOnUse" patternTransform="rotate(90)">
          {/* a flowing vine: a long wave with curled tendrils and small leaves, engraved (dark) with a lit edge */}
          <path
            d="M0 5.5 C4 1.5 9 1.5 13 5.5 C17 9.5 22 9.5 26 5.5 M6.5 2.6 c-0.6 -1.6 1.4 -2.4 2.2 -1 c0.6 1 -0.6 1.8 -1.2 1.1 M19.5 8.4 c0.6 1.6 -1.4 2.4 -2.2 1 c-0.6 -1 0.6 -1.8 1.2 -1.1 M10 3.4 c1.6 -0.4 2.6 0.4 2.8 1.6 c-1.4 0.3 -2.4 -0.4 -2.8 -1.6 Z M16 7.6 c-1.6 0.4 -2.6 -0.4 -2.8 -1.6 c1.4 -0.3 2.4 0.4 2.8 1.6 Z"
            fill="none"
            stroke="#000"
            strokeOpacity="0.55"
            strokeWidth="0.8"
            strokeLinecap="round"
          />
          <path d="M0 6.2 C4 2.2 9 2.2 13 6.2 C17 10.2 22 10.2 26 6.2" fill="none" stroke="#fff" strokeOpacity="0.4" strokeWidth="0.45" />
        </pattern>
        {/* the vine runs along each edge: horizontal on top and bottom, turned 90 degrees on the sides */}
        <clipPath id={`tb-${id}`}>
          <rect x="0" y="0" width="250" height="16" />
          <rect x="0" y="334" width="250" height="16" />
        </clipPath>
        <clipPath id={`lr-${id}`}>
          <rect x="0" y="16" width="16" height="318" />
          <rect x="234" y="16" width="16" height="318" />
        </clipPath>
      </defs>

      {/* band: metal, engraving, bevels */}
      <path d={`${outer} ${inner}`} fill="#000" fillOpacity="0.55" fillRule="evenodd" transform="translate(0 0.8)" />
      <path d={`${outer} ${inner}`} fill={metal} fillRule="evenodd" />
      <path d={`${outer} ${inner}`} fill={`url(#filigree-${id})`} fillRule="evenodd" clipPath={`url(#tb-${id})`} />
      <path d={`${outer} ${inner}`} fill={`url(#filigree-v-${id})`} fillRule="evenodd" clipPath={`url(#lr-${id})`} />
      <path d={outer} fill="none" stroke="#000" strokeOpacity="0.7" strokeWidth="1" />
      <path d="M21 8 H229 A13 13 0 0 0 242 21 V329 A13 13 0 0 0 229 342 H21 A13 13 0 0 0 8 329 V21 A13 13 0 0 0 21 8 Z" fill="none" stroke={g0} strokeOpacity="0.8" strokeWidth="0.6" />
      <path d="M22 13 H228 Q237 13 237 22 V328 Q237 337 228 337 H22 Q13 337 13 328 V22 Q13 13 22 13 Z" fill="none" stroke="#000" strokeOpacity="0.45" strokeWidth="0.6" />
      <path d={inner} fill="none" stroke={g0} strokeWidth="0.9" />
      <path d="M22 18.5 H228 Q231.5 18.5 231.5 22 V328 Q231.5 331.5 228 331.5 H22 Q18.5 331.5 18.5 328 V22 Q18.5 18.5 22 18.5 Z" fill="none" stroke="#000" strokeOpacity="0.6" strokeWidth="0.9" />

      {/* beads in the cut-in corners */}
      {beads.map(([x, y], i) => (
        <g key={`b${i}`}>
          <circle cx={x} cy={y} r="4.6" fill={metal} stroke="#000" strokeOpacity="0.6" strokeWidth="0.6" />
          <circle cx={x - 1} cy={y - 1} r="1.4" fill="#fff" fillOpacity="0.55" />
        </g>
      ))}

      {/* ornate corner pieces: leaf scrolls along both edges and a jewelled rosette on the inner corner */}
      {corners.map(([x, y], i) => (
        <g key={`r${i}`} transform={`translate(${x} ${y}) scale(${x > 125 ? -1 : 1} ${y > 175 ? -1 : 1})`}>
          <path
            d="M2 -2 C10 -9 20 -9 30 -4 C24 -3 19 -1 16 2 C12 -2 7 -2 2 -2 Z M-2 2 C-9 10 -9 20 -4 30 C-3 24 -1 19 2 16 C-2 12 -2 7 -2 2 Z"
            fill={metal}
            stroke="#000"
            strokeOpacity="0.6"
            strokeWidth="0.6"
          />
          <path d="M6 -4 C13 -7 20 -7 26 -4.5 M-4 6 C-7 13 -7 20 -4.5 26" fill="none" stroke="#fff" strokeOpacity="0.45" strokeWidth="0.5" />
          {[0, 60, 120, 180, 240, 300].map((r) => (
            <path key={r} d="M0 -4 C2.6 -6.5 2.6 -10 0 -11.5 C-2.6 -10 -2.6 -6.5 0 -4 Z" transform={`rotate(${r + 15})`} fill={metal} stroke="#000" strokeOpacity="0.55" strokeWidth="0.5" />
          ))}
          <circle r="7" fill={metal} stroke="#000" strokeOpacity="0.6" strokeWidth="0.6" />
          <circle r="5.2" fill="none" stroke={g2} strokeWidth="0.7" />
          <circle r="3.6" fill={gemFill} stroke="#000" strokeOpacity="0.5" strokeWidth="0.4" />
          <circle cx="-1.1" cy="-1.2" r="0.9" fill="#fff" fillOpacity="0.8" />
        </g>
      ))}

      {/* jewels at the middle of each side */}
      <g stroke="#000" strokeOpacity="0.6" strokeWidth="0.6">
        <path d="M10.5 158 L19 175 L10.5 192 L2 175 Z M239.5 158 L248 175 L239.5 192 L231 175 Z" fill={metal} />
        <path d="M104 10.5 L125 2 L146 10.5 L125 19 Z M104 339.5 L125 331 L146 339.5 L125 348 Z" fill={metal} />
        <path d="M10.5 166 L14.6 175 L10.5 184 L6.4 175 Z M239.5 166 L243.6 175 L239.5 184 L235.4 175 Z" fill={gemFill} />
        <path d="M114 10.5 L125 6.2 L136 10.5 L125 14.8 Z M114 339.5 L125 335.2 L136 339.5 L125 343.8 Z" fill={gemFill} />
      </g>
    </svg>
  );
}

function Icon({ path, color, size = '1.15em' }: { path: string; color: string; size?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" style={{ width: size, height: size }}>
      <path d={path} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * Ornate "magic academy" power card in the visitor's stream colours (original design).
 * Sized in em off the card width (container query units), so it is identical on screen and in print.
 */
export function ArcaneCard({ card, mode = 'preview' }: ArcaneCardProps) {
  const t = STREAMS[card.specialisation] ?? STREAMS['Business Analytics'];
  const isPrint = mode === 'print';
  const portrait = card.aiCharacterUrl || card.capturedPhotoUrl;
  const [g0, g1, g2] = t.frame;
  const deep = isPrint ? (t.printDeep ?? t.deep) : t.deep;
  const ink = isPrint ? (t.printInk ?? t.ink) : t.ink;
  // Gradient-clipped text can print blank, so print uses a solid gold fill with a darker edge.
  const goldText: CSSProperties = isPrint
    ? { color: g1, WebkitTextStroke: `0.02em ${g2}` }
    : {
        backgroundImage: `linear-gradient(180deg, ${g0} 0%, ${g1} 35%, ${g2} 50%, ${g1} 65%, ${g0} 100%)`,
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        color: 'transparent',
        WebkitTextStroke: '0.02em rgba(0,0,0,.55)',
        filter: 'drop-shadow(0 0.06em 0.08em rgba(0,0,0,0.8))',
      };
  const stats = [card.strength1, card.weakness, card.hobby];
  const firstName = card.name.trim().split(/\s+/)[0] || card.name;
  const plate = 'polygon(4% 0, 96% 0, 100% 50%, 96% 100%, 4% 100%, 0 50%)';
  const titleSize = card.title.length <= 18 ? '0.86em' : card.title.length <= 24 ? '0.74em' : '0.62em';
  // useId keeps SVG gradient ids unique when the same card renders twice (e.g. App's hidden print copy and the
  // print tab); a duplicate id inside a display:none subtree makes url(#id) paint nothing in Chrome.
  const uid = useId();
  const frameId = `${uid}-${card.id}-${mode}`.replace(/[^a-z0-9-]/gi, '');
  const articleStyle = {
    containerType: 'inline-size',
    width: isPrint ? '63.5mm' : undefined,
    height: isPrint ? '88.9mm' : undefined,
    printColorAdjust: 'exact',
    WebkitPrintColorAdjust: 'exact',
  } as CSSProperties;

  return (
    <article
      data-testid={isPrint ? 'pokemon-card-front' : 'tcg-pitch-card'}
      data-card-size="63.5x88.9mm"
      data-design="arcane"
      className={`relative select-none ${isPrint ? '' : 'w-full max-w-[356px] mx-auto aspect-[5/7]'}`}
      style={articleStyle}
    >
      <div
        className="relative h-full w-full"
        style={{
          fontSize: 'calc(100cqw / 22.25)',
          // glow follows the frame's ornate silhouette (screen only; filters do not print reliably)
          filter: isPrint ? undefined : `drop-shadow(0 0 0.35em ${t.glow}) drop-shadow(0 0 1.1em ${t.glow}aa)`,
        }}
      >
        {/* art and text, inset under the frame band (band inner edge is 16/250 of the width) */}
        <div className="absolute" style={{ inset: '1.3em', borderRadius: '0.4em', overflow: 'hidden' }}>
          <div
            className="relative flex h-full flex-col overflow-hidden"
            style={{
              background: `radial-gradient(130% 60% at 50% 30%, ${t.glow}66 0%, ${deep} 55%, ${ink} 100%)`,
              padding: '0.5em 0.55em 0.5em',
              gap: '0.18em',
            }}
          >
            {/* parchment grain (screen only: 1px grain breaks up on press) */}
            {!isPrint && (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 opacity-[0.12] mix-blend-overlay"
                style={{
                  backgroundImage:
                    'repeating-radial-gradient(circle at 30% 20%, rgba(255,255,255,0.5) 0 1px, transparent 1px 3px), repeating-linear-gradient(45deg, rgba(0,0,0,0.4) 0 1px, transparent 1px 4px)',
                }}
              />
            )}
            {/* printable stream glow under the bottom text (the screen box-shadow glow does not print) */}
            {isPrint && (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0"
                style={{ background: `radial-gradient(120% 50% at 50% 100%, ${t.glow}55, transparent 60%)` }}
              />
            )}
            {/* Header */}
            <header className="relative z-10 text-center" style={{ marginTop: '0.25em' }}>
              <span style={{ ...display, ...goldText, fontSize: '1.15em', fontWeight: 900, letterSpacing: '0.05em', lineHeight: 1 }}>
                #DYPAICOE
              </span>
              {memberNo(card) && (
                <div className="flex justify-center" style={{ marginTop: '0.3em' }}>
                  <p
                    data-testid="card-member-no"
                    className="uppercase whitespace-nowrap"
                    style={{
                      ...serif,
                      color: t.light,
                      background: `${ink}d9`,
                      border: `0.05em solid ${g1}`,
                      borderRadius: '0.3em',
                      padding: '0.22em 0.6em 0.2em',
                      fontSize: '0.56em',
                      fontWeight: 800,
                      letterSpacing: '0.12em',
                      lineHeight: 1,
                      fontVariantNumeric: 'lining-nums',
                    }}
                  >
                    Founding Member <span style={{ color: g0, letterSpacing: '0.06em' }}>#{memberNo(card)}</span>
                  </p>
                </div>
              )}
            </header>

            {/* Full-bleed portrait behind everything (like the reference cards), emblem if there is no image */}
            <div aria-hidden="true" className="absolute inset-0 flex items-center justify-center" style={{ background: `radial-gradient(circle at 50% 38%, ${t.glow}aa, ${t.deep} 70%)` }}>
              <Icon path={ICON_PATHS[t.icons[0]]} color={g0} size="7em" />
            </div>
            {portrait && (
              <img
                src={portrait}
                alt={`${card.name} power card portrait`}
                className="absolute inset-0 h-full w-full object-cover"
                style={{ objectPosition: '50% 18%' }}
                onError={(e) => (e.currentTarget.style.visibility = 'hidden')}
              />
            )}
            {/* shade: top for the header, bottom for the plaque and text */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0"
              style={{
                background: `linear-gradient(180deg, ${ink}cc 0%, transparent 13%, transparent 52%, ${ink}b3 66%, ${ink}f2 80%, ${ink} 100%)`,
              }}
            />

            <div className="flex-1" />

            {/* Name and title on one ornate plaque */}
            <div className="relative z-10" style={{ margin: '0 0.2em' }}>
              <svg viewBox="0 0 40 10" aria-hidden="true" className="absolute left-1/2 -translate-x-1/2" style={{ top: '-0.62em', width: '2.4em', height: '0.6em' }}>
                <path d="M0 9 Q12 9 17 4 L20 0 L23 4 Q28 9 40 9" fill="none" stroke={g1} strokeWidth="1.4" />
                <path d="M20 2 l2.5 3.5 l-2.5 3.5 l-2.5 -3.5 z" fill={g0} />
              </svg>
              <div style={{ padding: '0.09em', borderRadius: '0.35em', background: `linear-gradient(90deg, ${g2}, ${g0}, ${g1}, ${g0}, ${g2})` }}>
                <div
                  className="text-center"
                  style={{
                    borderRadius: '0.28em',
                    background: `linear-gradient(180deg, ${ink}f0, ${deep}f0 55%, ${ink}f0)`,
                    boxShadow: `inset 0 0 0 0.05em ${g2}, inset 0 0 0.8em ${t.glow}55`,
                    padding: '0.3em 0.7em 0.38em',
                  }}
                >
                  <p
                    data-testid="card-name"
                    className="truncate uppercase"
                    style={{ ...display, ...goldText, fontSize: firstName.length > 9 ? '1.35em' : '1.65em', fontWeight: 900, lineHeight: 1.05, letterSpacing: '0.03em' }}
                  >
                    {firstName}
                  </p>
                  <div aria-hidden="true" className="mx-auto" style={{ height: '0.06em', width: '70%', margin: '0.18em auto 0.16em', background: `linear-gradient(90deg, transparent, ${g1}, transparent)` }} />
                  <h3
                    data-testid="card-title"
                    className="truncate uppercase"
                    style={{ ...serif, ...goldText, fontSize: titleSize, fontWeight: 700, letterSpacing: '0.04em', lineHeight: 1.15 }}
                  >
                    {card.title}
                  </h3>
                </div>
              </div>
            </div>

            {/* Strength • Weakness • Hobby on one line */}
            <dl
              data-testid="card-stats"
              className="relative z-10 flex items-center justify-center text-center"
              style={{ ...serif, gap: '0.45em', marginTop: '0.45em', padding: '0 0.3em' }}
            >
              {stats.map((word, i) => (
                <div key={i} className="flex min-w-0 items-center" style={{ gap: '0.45em' }}>
                  {i > 0 && <span aria-hidden="true" style={{ color: g1, fontSize: '0.7em' }}>•</span>}
                  <dt className="sr-only">{['Strength', 'Weakness', 'Hobby'][i]}</dt>
                  <dd
                    className="truncate"
                    style={{ color: t.light, fontSize: stats.some((w) => (w ?? '').length > 9) ? '0.6em' : '0.7em', fontWeight: 700, letterSpacing: '0.02em', textShadow: '0 0.05em 0.15em #000' }}
                  >
                    {word}
                  </dd>
                </div>
              ))}
            </dl>

            {/* Intro (two-line clamp) */}
            <p
              data-testid="card-intro"
              className="relative z-10 text-center italic"
              style={{
                ...book,
                color: t.light,
                opacity: 0.9,
                fontSize: '0.56em',
                lineHeight: 1.18,
                padding: '0 0.6em',
                marginTop: '0.25em',
                // room for the seal at the bottom of the art
                marginBottom: '3.6em',
                fontWeight: 600,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {card.intro}
            </p>

            {/* Bottom seal (original round academy seal with the stream icon) */}
            <div className="absolute left-1/2 z-20 -translate-x-1/2" style={{ bottom: '0.45em', width: '1.6em', height: '1.6em' }}>
              <svg viewBox="0 0 40 40" className="h-full w-full" aria-hidden="true">
                <defs>
                  <linearGradient id={`crest-${frameId}`} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor={g0} />
                    <stop offset="0.5" stopColor={g1} />
                    <stop offset="1" stopColor={g2} />
                  </linearGradient>
                </defs>
                <circle cx="20" cy="20" r="18" fill={ink} stroke={`url(#crest-${frameId})`} strokeWidth="3" />
                <circle cx="20" cy="20" r="13" fill="none" stroke={g1} strokeWidth="0.8" opacity="0.85" />
                <g transform="translate(10.4 10.4) scale(0.8)">
                  <path d={ICON_PATHS[t.icons[0]]} fill="none" stroke={g0} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </g>
              </svg>
            </div>
          </div>
        </div>
        <OrnateFrame id={frameId} gold={t.frame} gem={t.glow} />
      </div>
    </article>
  );
}
