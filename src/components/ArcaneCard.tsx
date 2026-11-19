import { useId, type CSSProperties } from 'react';
import type { VisitorCard } from '../types/pitch';
import { ICON_PATHS, STREAMS } from '../utils/streams';

interface ArcaneCardProps {
  card: VisitorCard;
  mode?: 'preview' | 'print';
}

const display: CSSProperties = { fontFamily: '"Cinzel", Georgia, serif' };
const serif: CSSProperties = { fontFamily: '"Cinzel", "Cormorant Garamond", Georgia, serif' };
const book: CSSProperties = { fontFamily: '"Cormorant Garamond", Georgia, serif' };

/** Engraved gold filigree drawn over the card face (viewBox matches the 5:7 card). */
function OrnateFrame({ id, gold }: { id: string; gold: [string, string, string] }) {
  const [g0, g1, g2] = gold;
  const grad = `url(#gold-${id})`;
  const outer = 'M18 6 H232 L244 18 V332 L232 344 H18 L6 332 V18 Z';
  // Corner: curved rule, a C-scroll with curled ends, and a filled leaf (about 40x40 units).
  const scroll =
    'M10 50 V26 Q10 10 26 10 H50 ' +
    'M17 44 C15 28 28 15 44 17 c5 1 6 6 2 8 c-3 1 -5 -2 -3 -4 ' +
    'M17 44 c1 5 6 6 8 2 c1 -3 -2 -5 -4 -3';
  const leaf = 'M22 22 C29 23 34 28 35 35 C28 34 23 29 22 22 Z';
  const corners = ['', 'translate(250 0) scale(-1 1)', 'translate(0 350) scale(1 -1)', 'translate(250 350) scale(-1 -1)'];
  const diamond = (x: number, y: number) => `M${x} ${y - 3} l3 3 l-3 3 l-3 -3 z`;
  return (
    <svg
      viewBox="0 0 250 350"
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-0 h-full w-full"
      style={{ zIndex: 5 }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`gold-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={g0} />
          <stop offset="0.45" stopColor={g1} />
          <stop offset="0.7" stopColor={g2} />
          <stop offset="1" stopColor={g1} />
        </linearGradient>
      </defs>
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        {/* bevelled metal border: dark under-stroke, gold body, bright inner highlight */}
        <path d={outer} stroke="#000" strokeOpacity="0.6" strokeWidth="4" />
        <path d={outer} stroke={grad} strokeWidth="3" />
        <path d="M20 8 H230 L242 20 V330 L230 342 H20 L8 330 V20 Z" stroke={g0} strokeWidth="0.8" />
        <path d="M21 10 H229 L240 21 V329 L229 340 H21 L10 329 V21 Z" stroke={grad} strokeWidth="0.9" />
        {/* corner scrollwork */}
        {corners.map((tr, i) => (
          <g key={i} transform={tr || undefined}>
            <path d={scroll} stroke={grad} strokeWidth="2.2" />
            <path d={leaf} fill={grad} stroke={g2} strokeWidth="0.6" />
          </g>
        ))}
        {/* side jewels */}
        <path d="M6 175 l5 -9 l5 9 l-5 9 z M244 175 l-5 -9 l-5 9 l5 9 z" fill={grad} stroke={grad} strokeWidth="0.6" />
        {/* pointed arch over the header, with diamond finials */}
        <path d="M30 24 Q125 -20 220 24" stroke={grad} strokeWidth="1.6" />
        <path d={`${diamond(30, 24)} ${diamond(220, 24)} ${diamond(125, 4)}`} fill={grad} stroke={g2} strokeWidth="0.5" />
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
  const bevel = 'inset 0 0 0 0.05em rgba(0,0,0,.6), inset 0 0.08em 0.1em rgba(255,255,255,.5)';

  return (
    <article
      data-testid={isPrint ? 'pokemon-card-front' : 'tcg-pitch-card'}
      data-card-size="63.5x88.9mm"
      data-design="arcane"
      className={`relative select-none ${isPrint ? '' : 'w-full max-w-[356px] mx-auto aspect-[5/7]'}`}
      style={articleStyle}
    >
      <div className="h-full w-full" style={{ fontSize: 'calc(100cqw / 22.25)' }}>
        {/* Gold rim */}
        <div
          className="h-full w-full"
          style={{
            padding: '0.42em',
            borderRadius: '0.7em',
            background: `linear-gradient(135deg, ${g2} 0%, ${g0} 8%, ${g1} 18%, ${g2} 30%, ${g0} 45%, ${g1} 60%, ${g2} 72%, ${g0} 85%, ${g1} 100%)`,
            boxShadow: isPrint ? bevel : `0 0 2em ${t.glow}cc, 0 0 0.5em ${t.glow}, ${bevel}`,
          }}
        >
          <div
            className="relative flex h-full flex-col overflow-hidden"
            style={{
              borderRadius: '0.45em',
              background: `radial-gradient(130% 60% at 50% 30%, ${t.glow}66 0%, ${deep} 55%, ${ink} 100%)`,
              padding: '0.75em 0.95em 0.7em',
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
            <OrnateFrame id={frameId} gold={t.frame} />

            {/* Header */}
            <header className="relative z-10 text-center" style={{ marginTop: '0.05em' }}>
              <span style={{ ...display, ...goldText, fontSize: '1.15em', fontWeight: 900, letterSpacing: '0.05em', lineHeight: 1 }}>
                #DYPAICOE
              </span>
            </header>

            {/* Portrait */}
            <div
              className="relative min-h-0 flex-1 overflow-hidden"
              style={{
                borderRadius: '0.35em 0.35em 0.2em 0.2em',
                boxShadow: `inset 0 0 0 0.06em ${g1}aa`,
                background: deep,
                WebkitMaskImage: 'linear-gradient(180deg, #000 76%, transparent 100%)',
                maskImage: 'linear-gradient(180deg, #000 76%, transparent 100%)',
              }}
            >
              <div aria-hidden="true" className="absolute inset-0 flex items-center justify-center" style={{ background: `radial-gradient(circle at 50% 40%, ${t.glow}aa, ${t.deep} 70%)` }}>
                <Icon path={ICON_PATHS[t.icons[0]]} color={g0} size="6em" />
              </div>
              {portrait && (
                <img
                  src={portrait}
                  alt={`${card.name} power card portrait`}
                  className="relative h-full w-full object-cover object-top"
                  onError={(e) => (e.currentTarget.style.visibility = 'hidden')}
                />
              )}
            </div>

            {/* Name (sits over the robe) */}
            <div className="relative z-10 text-center" style={{ marginTop: '-2.2em' }}>
              <p
                data-testid="card-name"
                className="truncate uppercase"
                style={{ ...display, ...goldText, fontSize: firstName.length > 9 ? '1.5em' : '1.9em', fontWeight: 900, lineHeight: 1.05, letterSpacing: '0.02em' }}
              >
                {firstName}
              </p>
            </div>

            {/* Title on a pointed plaque */}
            <div className="relative z-10 mx-auto" style={{ width: '100%', padding: '0.08em', background: g1, clipPath: plate }}>
              <div style={{ background: `linear-gradient(180deg, ${ink}, ${deep} 60%, ${ink})`, clipPath: plate, padding: '0.4em 1.35em' }}>
                <h3
                  data-testid="card-title"
                  className="truncate text-center uppercase"
                  style={{ ...serif, color: g0, fontSize: titleSize, fontWeight: 700, letterSpacing: '0.05em', lineHeight: 1.15 }}
                >
                  {card.title}
                </h3>
              </div>
            </div>

            <p
              className="relative z-10 flex items-center justify-center uppercase"
              style={{ ...serif, color: t.id === 'Business Analytics' ? g0 : g1, fontSize: '0.62em', fontWeight: 700, letterSpacing: '0.22em', gap: '0.6em' }}
            >
              <span style={{ height: '0.08em', width: '2.4em', background: `linear-gradient(90deg, transparent, ${g1})` }} />
              {t.short}
              <span style={{ height: '0.08em', width: '2.4em', background: `linear-gradient(270deg, transparent, ${g1})` }} />
            </p>

            {/* Intro (two-line clamp) */}
            <p
              data-testid="card-intro"
              className="relative z-10 text-center italic"
              style={{
                ...book,
                color: t.light,
                opacity: 0.95,
                fontSize: '0.6em',
                lineHeight: 1.18,
                padding: '0 0.6em',
                fontWeight: 600,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {card.intro}
            </p>

            {/* Stats */}
            <dl data-testid="card-stats" className="relative z-10 grid grid-cols-3 text-center" style={{ padding: '0 2.2em', marginBottom: '1.9em' }}>
              {stats.map((word, i) => (
                <div key={i} className="flex min-w-0 flex-col items-center" style={{ gap: '0.1em', borderLeft: i ? `0.07em solid ${g1}cc` : undefined }}>
                  <dt className="sr-only">{['Strength', 'Weakness', 'Hobby'][i]}</dt>
                  <Icon path={ICON_PATHS[t.icons[i]]} color={g0} />
                  <dd
                    className="w-full"
                    style={{
                      ...serif,
                      color: g0,
                      fontSize: (word ?? '').length > 10 ? '0.56em' : '0.7em',
                      fontWeight: 700,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      lineHeight: 1.05,
                      wordBreak: 'break-word',
                    }}
                  >
                    {word}
                  </dd>
                </div>
              ))}
            </dl>

            {/* Bottom seal (original round academy seal with the stream icon) */}
            <div className="absolute left-1/2 z-20 -translate-x-1/2" style={{ bottom: '0.6em', width: '1.5em', height: '1.5em' }}>
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
      </div>
    </article>
  );
}
