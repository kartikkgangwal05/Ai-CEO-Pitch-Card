import type { VisitorCard } from '../types/pitch';
import { nameFontStyle } from '../utils/nameFonts';
import { memberNo } from '../utils/foundingMember';
import { getCharacterById } from '../utils/characters';
import { TCG_THEMES, getPersona } from '../utils/pitch';
import { photoFilterLabel } from '../utils/photoFilters';
import { ArcaneCard } from './ArcaneCard';
import { CharacterIllustrationSvg } from './CharacterIllustrationSvg';

interface TcgPitchCardProps {
  card: VisitorCard;
  mode?: 'preview' | 'print';
}

const STAT_ROWS = [
  { key: 'strength1', label: 'Strength' },
  { key: 'weakness', label: 'Weakness' },
  { key: 'hobby', label: 'Hobby' },
] as const;

function getHeaderBadgeText(card: VisitorCard): string {
  if (card.visitorType === 'Company Owner / Founder') return 'OWNER / FOUNDER';
  if (card.visitorType === 'Director / CXO') return 'DIRECTOR / CXO';
  return 'PGDM 2026–28';
}

export function TcgPitchCard({ card, mode = 'preview' }: TcgPitchCardProps) {
  const isPrint = mode === 'print';

  if (card.design === 'arcane') {
    return <ArcaneCard card={card} mode={mode} />;
  }

  const theme = TCG_THEMES[card.specialisation];
  const character = getCharacterById(card.resolvedCharacterId);
  const headerBadge = getHeaderBadgeText(card);
  const portraitUrl = card.aiCharacterUrl || card.capturedPhotoUrl;

  return (
    <article
      data-testid={isPrint ? 'pokemon-card-front' : 'tcg-pitch-card'}
      data-card-size="63.5x88.9mm"
      className={`relative rounded-[12px] select-none shadow-[0_0_28px_rgba(0,212,255,0.28)] ${
        isPrint ? 'p-[2mm]' : 'p-2.5 w-full max-w-[356px] mx-auto aspect-[5/7]'
      }`}
      style={{
        background: theme.outerBorder,
        width: isPrint ? '63.5mm' : undefined,
        height: isPrint ? '88.9mm' : undefined,
      }}
    >
      {/* Inner Dark-Neon Collectible Card Face */}
      <div
        className="relative w-full h-full rounded-[9px] flex flex-col justify-between overflow-hidden text-white border border-sky-300/35"
        style={{
          background: theme.faceGradient,
          padding: isPrint ? '1.6mm 1.9mm' : '10px 11px',
        }}
      >
        {/* Subtle Holographic Circuit & Corner Notch Overlay */}
        <svg
          aria-hidden="true"
          viewBox="0 0 250 350"
          className="absolute inset-0 w-full h-full pointer-events-none opacity-55"
          preserveAspectRatio="none"
        >
          <defs>
            <pattern id={`card-bg-pattern-${card.id}-${mode}`} width="18" height="18" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="0.85" fill={theme.accentHex} fillOpacity="0.35" />
            </pattern>
            <linearGradient id={`holo-beam-${card.id}-${mode}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00D4FF" stopOpacity="0.16" />
              <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.06" />
              <stop offset="100%" stopColor="#2563EB" stopOpacity="0.16" />
            </linearGradient>
          </defs>
          <rect width="250" height="350" fill={`url(#card-bg-pattern-${card.id}-${mode})`} />
          <polygon points="0,40 250,110 250,165 0,95" fill={`url(#holo-beam-${card.id}-${mode})`} />
          <path d="M 6 18 L 6 6 L 18 6" fill="none" stroke="#00D4FF" strokeWidth="1.6" strokeOpacity="0.8" />
          <path d="M 232 6 L 244 6 L 244 18" fill="none" stroke="#00D4FF" strokeWidth="1.6" strokeOpacity="0.8" />
          <path d="M 6 332 L 6 344 L 18 344" fill="none" stroke="#00D4FF" strokeWidth="1.6" strokeOpacity="0.8" />
          <path d="M 232 344 L 244 344 L 244 332" fill="none" stroke="#00D4FF" strokeWidth="1.6" strokeOpacity="0.8" />
        </svg>

        <div className={`relative z-10 flex flex-col flex-1 min-h-0 ${isPrint ? 'gap-[1.1mm]' : 'gap-1.5'}`}>
          {/* 1. Header: badge row, funny title, name */}
          <header>
            <div className="flex items-center justify-between gap-1">
              <span
                className={`font-mono-nums font-bold uppercase tracking-wider rounded px-1 py-0.5 whitespace-nowrap shrink-0 ${
                  isPrint ? 'text-[5px]' : 'text-[8.5px]'
                }`}
                style={{ backgroundColor: theme.badgeBg, color: theme.badgeText }}
              >
                {headerBadge}
              </span>
              <span
                className={`font-mono-nums font-bold whitespace-nowrap text-sky-300 ${
                  isPrint ? 'text-[5.2px]' : 'text-[9px]'
                }`}
              >
                {memberNo(card) ? `FOUNDING MEMBER #${memberNo(card)}` : theme.typeLabel}
              </span>
            </div>

            <h3
              data-testid="card-title"
              className={`font-display font-extrabold tracking-tight text-white leading-[1.05] mt-0.5 ${
                isPrint ? 'text-[10.5px]' : 'text-[18px] title-reveal'
              } ${card.title.length > 22 ? (isPrint ? '!text-[9px]' : '!text-[15px]') : ''}`}
            >
              {card.title}
            </h3>
            <p
              className={`font-semibold uppercase tracking-[0.08em] text-sky-200 truncate ${
                isPrint ? 'text-[5.2px]' : 'text-[9.5px]'
              }`}
            >
              <span style={nameFontStyle(card.nameFont)}>{card.name}</span>
              {card.currentPosition.trim() ? ` · ${card.currentPosition.trim()}` : ''}
            </p>
          </header>

          {/* 2. Cartoon portrait: takes all spare height */}
          <div
            data-testid="svg-character-container"
            className="relative w-full flex-1 min-h-0 overflow-hidden rounded-[8px] border-2 border-[#00D4FF]/80 shadow-[0_0_18px_rgba(0,212,255,0.28),inset_0_0_14px_rgba(0,212,255,0.3)]"
            style={{ background: theme.artGradient }}
          >
            {portraitUrl ? (
              <img
                src={portraitUrl}
                alt={
                  card.aiCharacterUrl
                    ? `${card.name} AI cartoon character portrait`
                    : `${card.name} captured booth portrait`
                }
                className="w-full h-full object-cover"
              />
            ) : (
              <CharacterIllustrationSvg
                characterId={card.resolvedCharacterId}
                specialisation={card.specialisation}
                className="w-full h-full"
              />
            )}
            <div
              className={`absolute top-1 left-1 bg-[#030712]/80 border border-sky-400/50 text-white font-mono-nums font-bold uppercase tracking-wider rounded px-1 py-0.5 ${
                isPrint ? 'text-[4.5px]' : 'text-[8px]'
              }`}
            >
              {card.personaId && card.personaId !== 'none'
                ? `${getPersona(card.personaId).emoji} ${getPersona(card.personaId).label.toUpperCase()} EDITION`
                : card.aiCharacterUrl
                  ? card.cartoonStyle === 'pencil-sketch'
                    ? 'SKETCH EDITION'
                    : `${photoFilterLabel(card.cartoonStyle).toUpperCase()} EDITION`
                  : character.label}
            </div>
          </div>

          {/* 3. Two-line intro */}
          <p
            data-testid="card-intro"
            className={`italic text-[#030712] leading-[1.25] bg-gradient-to-r from-sky-100 via-white to-sky-100 border border-sky-300/60 rounded-[4px] ${
              isPrint ? 'text-[5.6px] px-1.5 py-[0.7mm]' : 'text-[10px] px-2 py-1'
            }`}
          >
            {card.intro}
          </p>

          {/* 4. One-word stats */}
          <dl data-testid="card-stats" className={`grid grid-cols-3 ${isPrint ? 'gap-[0.9mm]' : 'gap-1.5'}`}>
            {STAT_ROWS.map((row, i) => (
              <div
                key={row.key}
                className={`min-w-0 rounded-[5px] border text-center ${isPrint ? 'px-[0.8mm] py-[0.7mm]' : 'px-1 py-1 stat-pop'}`}
                style={{ backgroundColor: theme.moveBoxBg, borderColor: theme.moveBorder, '--i': i } as React.CSSProperties}
              >
                <dt
                  className={`font-display font-extrabold uppercase tracking-wide text-sky-300 ${
                    isPrint ? 'text-[4.6px]' : 'text-[8px]'
                  }`}
                >
                  {row.label}
                </dt>
                <dd
                  className={`font-display font-extrabold text-white truncate leading-tight ${
                    isPrint ? 'text-[7.4px]' : 'text-[13px]'
                  }`}
                >
                  {card[row.key]}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </article>
  );
}
