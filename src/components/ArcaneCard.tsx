import type { CSSProperties } from 'react';
import type { VisitorCard } from '../types/pitch';
import { ICON_PATHS, STREAMS } from '../utils/streams';

interface ArcaneCardProps {
  card: VisitorCard;
  mode?: 'preview' | 'print';
}

const serif: CSSProperties = { fontFamily: '"Cinzel", "Cormorant Garamond", Georgia, serif' };

function Corner({ style, color }: { style: CSSProperties; color: string }) {
  return (
    <svg viewBox="0 0 40 40" aria-hidden="true" className="absolute" style={{ width: '2.4em', height: '2.4em', ...style }}>
      <path d="M2 38 V14 C2 7 7 2 14 2 H38" fill="none" stroke={color} strokeWidth="1.6" />
      <path d="M7 38 V16 C7 11 11 7 16 7 H38" fill="none" stroke={color} strokeWidth="0.8" opacity="0.7" />
      <path d="M13 13 l4 -4 l4 4 l-4 4 z" fill={color} />
      <circle cx="2" cy="38" r="1.6" fill={color} />
      <circle cx="38" cy="2" r="1.6" fill={color} />
    </svg>
  );
}

function Icon({ path, color }: { path: string; color: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" style={{ width: '1.15em', height: '1.15em' }}>
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
  const goldText: CSSProperties = {
    ...serif,
    backgroundImage: `linear-gradient(180deg, ${g0} 10%, ${g1} 55%, ${g2} 100%)`,
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    color: 'transparent',
  };
  const stats = [card.strength1, card.weakness, card.hobby];

  return (
    <article
      data-testid={isPrint ? 'pokemon-card-front' : 'tcg-pitch-card'}
      data-card-size="63.5x88.9mm"
      data-design="arcane"
      className={`relative select-none ${isPrint ? '' : 'w-full max-w-[356px] mx-auto aspect-[5/7]'}`}
      style={{ containerType: 'inline-size', width: isPrint ? '63.5mm' : undefined, height: isPrint ? '88.9mm' : undefined }}
    >
      <div className="h-full w-full" style={{ fontSize: 'calc(100cqw / 22.25)' }}>
        {/* Gold frame */}
        <div
          className="h-full w-full"
          style={{
            padding: '0.38em',
            borderRadius: '0.95em',
            background: `linear-gradient(145deg, ${g0}, ${g1} 30%, ${g2} 55%, ${g1} 80%, ${g0})`,
            boxShadow: isPrint ? undefined : `0 0 1.6em ${t.glow}aa, 0 0 0.4em ${t.glow}`,
          }}
        >
          <div
            className="relative flex h-full flex-col overflow-hidden"
            style={{
              borderRadius: '0.65em',
              background: `radial-gradient(120% 70% at 50% 28%, ${t.glow}55 0%, ${t.deep} 62%, ${t.ink} 100%)`,
              border: `0.07em solid ${g1}`,
              padding: '0.5em 0.65em 0.55em',
              gap: '0.3em',
            }}
          >
            <Corner color={g1} style={{ left: '0.15em', top: '0.15em' }} />
            <Corner color={g1} style={{ right: '0.15em', top: '0.15em', transform: 'scaleX(-1)' }} />
            <Corner color={g1} style={{ left: '0.15em', bottom: '0.15em', transform: 'scaleY(-1)' }} />
            <Corner color={g1} style={{ right: '0.15em', bottom: '0.15em', transform: 'scale(-1,-1)' }} />

            {/* Header */}
            <header className="relative z-10 flex items-center justify-center" style={{ gap: '0.45em', marginTop: '0.1em' }}>
              <span style={{ height: '0.06em', width: '2.2em', background: `linear-gradient(90deg, transparent, ${g1})` }} />
              <span style={{ ...goldText, fontSize: '1.2em', fontWeight: 700, letterSpacing: '0.06em', lineHeight: 1 }}>
                #DYPAICOE
              </span>
              <span style={{ height: '0.06em', width: '2.2em', background: `linear-gradient(270deg, transparent, ${g1})` }} />
            </header>

            {/* Portrait */}
            <div
              className="relative min-h-0 flex-1 overflow-hidden"
              style={{
                borderRadius: '0.55em',
                border: `0.06em solid ${g1}88`,
                background: t.deep,
                WebkitMaskImage: 'linear-gradient(180deg, #000 78%, transparent 100%)',
                maskImage: 'linear-gradient(180deg, #000 78%, transparent 100%)',
              }}
            >
              {portrait && <img src={portrait} alt={`${card.name} power card portrait`} className="h-full w-full object-cover" />}
            </div>

            {/* Name + title ribbon */}
            <div className="relative z-10 text-center" style={{ marginTop: '-1.1em' }}>
              <p
                data-testid="card-name"
                className="truncate uppercase"
                style={{ ...goldText, fontSize: card.name.length > 14 ? '1.25em' : '1.55em', fontWeight: 700, lineHeight: 1.05, letterSpacing: '0.03em' }}
              >
                {card.name.split(/\s+/)[0]}
              </p>
            </div>
            <div
              className="relative z-10 mx-auto"
              style={{
                padding: '0.07em',
                width: '96%',
                background: g1,
                clipPath: 'polygon(4% 0, 96% 0, 100% 50%, 96% 100%, 4% 100%, 0 50%)',
              }}
            >
              <div
                style={{
                  background: `linear-gradient(180deg, ${t.ink}, ${t.deep})`,
                  clipPath: 'polygon(4% 0, 96% 0, 100% 50%, 96% 100%, 4% 100%, 0 50%)',
                  padding: '0.32em 1.1em',
                }}
              >
                <h3
                  data-testid="card-title"
                  className="truncate text-center uppercase"
                  style={{ ...serif, color: g0, fontSize: card.title.length > 22 ? '0.72em' : '0.84em', fontWeight: 700, letterSpacing: '0.04em', lineHeight: 1.15 }}
                >
                  {card.title}
                </h3>
              </div>
            </div>
            <p className="relative z-10 text-center uppercase" style={{ ...serif, color: g1, fontSize: '0.56em', letterSpacing: '0.28em' }}>
              — {t.short} —
            </p>

            {/* Intro */}
            <p
              data-testid="card-intro"
              className="relative z-10 text-center italic"
              style={{ color: `${t.light}`, opacity: 0.92, fontSize: '0.56em', lineHeight: 1.3, padding: '0 0.6em' }}
            >
              {card.intro}
            </p>

            {/* Stats */}
            <dl data-testid="card-stats" className="relative z-10 grid grid-cols-3 text-center" style={{ marginBottom: '0.25em' }}>
              {stats.map((word, i) => (
                <div key={i} className="flex min-w-0 flex-col items-center" style={{ gap: '0.12em', borderLeft: i ? `0.05em solid ${g1}66` : undefined }}>
                  <dt className="sr-only">{['Strength', 'Weakness', 'Hobby'][i]}</dt>
                  <Icon path={ICON_PATHS[t.icons[i]]} color={g1} />
                  <dd className="w-full truncate" style={{ ...serif, color: g0, fontSize: '0.66em', fontWeight: 700 }}>
                    {word}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </article>
  );
}
