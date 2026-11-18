import type { VisitorCard } from '../types/pitch';
import { getCharacterById } from '../utils/characters';
import { TCG_THEMES, getPersona, getStickerFontClass } from '../utils/pitch';
import { photoFilterLabel } from '../utils/photoFilters';
import { CharacterIllustrationSvg } from './CharacterIllustrationSvg';

interface TcgPitchCardProps {
  card: VisitorCard;
  mode?: 'preview' | 'print';
  side?: 'front' | 'back';
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

function CardBackSticker({
  card,
  isPrint,
}: {
  card: VisitorCard;
  isPrint: boolean;
}) {
  const theme = TCG_THEMES[card.specialisation];
  const character = getCharacterById(card.resolvedCharacterId);
  const badgeText = getHeaderBadgeText(card);
  const nameWords = card.name.trim().split(/\s+/);
  const longName = card.name.trim().length > 16;
  const portraitUrl = card.aiCharacterUrl || card.capturedPhotoUrl;
  const stickerFontClass = getStickerFontClass(card.stickerFont);

  return (
    <article
      data-testid={isPrint ? 'pokemon-card-back' : 'tcg-pitch-card-back'}
      data-card-size="63.5x88.9mm"
      data-sticker-font={card.stickerFont || 'cartoon'}
      className={`relative rounded-[12px] select-none shadow-[0_0_28px_rgba(0,212,255,0.28)] ${
        isPrint ? 'p-[2mm]' : 'p-2.5 w-full max-w-[356px] mx-auto aspect-[5/7]'
      }`}
      style={{
        background: theme.outerBorder,
        width: isPrint ? '63.5mm' : undefined,
        height: isPrint ? '88.9mm' : undefined,
      }}
    >
      <div
        className="relative w-full h-full rounded-[9px] overflow-hidden flex flex-col justify-between text-white border border-sky-300/45"
        style={{
          background:
            'radial-gradient(circle at 50% 44%, #0E3572 0%, #06132E 62%, #020612 100%)',
          padding: isPrint ? '2.4mm' : '14px',
        }}
      >
        {/* Vibrant Holographic Comic Sunburst & Cyber Ring Backdrop */}
        <svg
          aria-hidden="true"
          viewBox="0 0 250 350"
          className="absolute inset-0 w-full h-full opacity-45 pointer-events-none"
          preserveAspectRatio="none"
        >
          <defs>
            <pattern id={`sticker-grid-${card.id}`} width="18" height="18" patternUnits="userSpaceOnUse">
              <path d="M 18 0 L 0 0 0 18" fill="none" stroke="#38BDF8" strokeOpacity="0.25" strokeWidth="0.65" />
            </pattern>
          </defs>
          <rect width="250" height="350" fill={`url(#sticker-grid-${card.id})`} />
          <g stroke="#00D4FF" strokeOpacity="0.22" strokeWidth="1.2">
            <line x1="125" y1="175" x2="0" y2="20" />
            <line x1="125" y1="175" x2="250" y2="20" />
            <line x1="125" y1="175" x2="0" y2="330" />
            <line x1="125" y1="175" x2="250" y2="330" />
            <line x1="125" y1="175" x2="125" y2="0" />
            <line x1="125" y1="175" x2="125" y2="350" />
          </g>
          <circle cx="125" cy="175" r="102" fill="none" stroke="#00D4FF" strokeOpacity="0.48" strokeWidth="1.6" strokeDasharray="7 4" />
          <circle cx="125" cy="175" r="76" fill="none" stroke="#FFFFFF" strokeOpacity="0.28" strokeWidth="1.2" />
          <polygon points="34,54 38,62 46,66 38,70 34,78 30,70 22,66 30,62" fill="#00D4FF" fillOpacity="0.55" />
          <polygon points="216,284 219,290 225,293 219,296 216,302 213,296 207,293 213,290" fill="#FFFFFF" fillOpacity="0.5" />
        </svg>

        {/* Top Collector Seal */}
        <div className="relative z-10 flex items-center justify-between gap-1.5">
          <span
            className={`font-mono-nums font-bold uppercase tracking-wider rounded px-1.5 py-0.5 bg-[#00D4FF] text-[#030712] whitespace-nowrap ${
              isPrint ? 'text-[5.5px]' : 'text-[9px]'
            }`}
          >
            #DYPAICoE
          </span>
          <span
            className={`font-mono-nums font-semibold text-sky-200 whitespace-nowrap ${
              isPrint ? 'text-[5.5px]' : 'text-[9.5px]'
            }`}
          >
            ★{' '}
            {card.aiCharacterUrl
              ? card.cartoonStyle === 'pencil-sketch'
                ? 'SKETCH-AI'
                : 'CARTOON-AI'
              : character.stickerBadge}{' '}
            · #{String(card.cardSerial).padStart(3, '0')}
          </span>
        </div>

        {/* Center Die-Cut Full Name Sticker */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center my-1">
          {/* Die-Cut White Vinyl Sticker Container */}
          <div
            className={`relative w-full bg-white text-[#030712] rounded-2xl border-[3px] border-white shadow-[0_10px_28px_rgba(0,212,255,0.48)] transform -rotate-2 overflow-hidden ${
              isPrint ? 'px-2 py-2.5' : 'px-4 py-5'
            }`}
            style={{
              backgroundImage:
                'radial-gradient(circle at 14% 18%, rgba(0, 212, 255, 0.25), transparent 48%), radial-gradient(circle at 86% 85%, rgba(37, 99, 235, 0.18), transparent 52%)',
            }}
          >
            {/* Sticker Corner Peel Accent */}
            <div
              aria-hidden="true"
              className="absolute top-0 right-0 w-0 h-0 border-t-[16px] border-l-[16px] border-t-sky-300 border-l-transparent shadow-sm"
            />

            {/* Mini Portrait Crest inside Sticker */}
            <div className="flex items-center justify-center mb-1.5">
              <div
                className={`rounded-full overflow-hidden border-[2.5px] border-[#0284C7] shadow-[0_0_12px_rgba(0,212,255,0.45)] bg-[#040E26] ${
                  isPrint ? 'w-[12.5mm] h-[12.5mm]' : 'w-16 h-16'
                }`}
              >
                {portraitUrl ? (
                  <img
                    src={portraitUrl}
                    alt={`${card.name} character portrait`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <CharacterIllustrationSvg
                    characterId={card.resolvedCharacterId}
                    specialisation={card.specialisation}
                    className="w-full h-full"
                  />
                )}
              </div>
            </div>

            {/* Unique Collectible Sticker Name Display */}
            <div className="text-center">
              <p
                className={`font-mono-nums font-bold uppercase tracking-[0.22em] text-sky-700 ${
                  isPrint ? 'text-[5px]' : 'text-[9px]'
                }`}
              >
                COLLECTOR EDITION
              </p>

              <div
                data-testid="back-sticker-name"
                className={`${stickerFontClass} uppercase leading-[1.02] mt-1.5 break-words ${
                  isPrint
                    ? longName
                      ? 'text-[13px]'
                      : 'text-[16.5px]'
                    : longName
                      ? 'text-[22px]'
                      : 'text-[28px]'
                }`}
                style={{
                  color: '#03153A',
                  textShadow: '2px 2px 0px #00D4FF, 4px 4px 0px rgba(2,132,199,0.28)',
                }}
              >
                {nameWords.map((word, idx) => (
                  <span key={`${word}-${idx}`} className="block">
                    {word}
                  </span>
                ))}
              </div>

              {/* Optional Position / Target Role Banner inside Sticker */}
              <div
                className={`mt-2 inline-block rounded-lg bg-[#03153A] text-white font-semibold max-w-full truncate ${
                  isPrint ? 'px-2 py-0.5 text-[5.8px]' : 'px-3 py-1 text-[10.5px]'
                }`}
              >
                {card.currentPosition.trim() || card.dreamRole.trim() || card.specialisation}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Sticker Edition Footer */}
        <div className="relative z-10 text-center space-y-0.5">
          <p
            className={`font-bold text-white tracking-tight ${
              isPrint ? 'text-[6.2px]' : 'text-[11px]'
            }`}
          >
            Dr. D. Y. Patil B-School, Pune
          </p>
          <p
            className={`font-mono-nums text-sky-300 font-semibold ${
              isPrint ? 'text-[5.2px]' : 'text-[9.5px]'
            }`}
          >
            {badgeText} · {card.specialisation}
          </p>
        </div>
      </div>
    </article>
  );
}

export function TcgPitchCard({ card, mode = 'preview', side = 'front' }: TcgPitchCardProps) {
  const isPrint = mode === 'print';

  if (side === 'back') {
    return <CardBackSticker card={card} isPrint={isPrint} />;
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
                #{String(card.cardSerial).padStart(3, '0')} · {theme.typeLabel}
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
              {card.name}
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
