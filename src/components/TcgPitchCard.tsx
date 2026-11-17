import { Flame, ShieldAlert, Sparkles, Star } from 'lucide-react';
import type { VisitorCard } from '../types/pitch';
import { getCharacterById } from '../utils/characters';
import { TCG_THEMES, formatQrPlainText, getStickerFontClass } from '../utils/pitch';
import { CharacterIllustrationSvg } from './CharacterIllustrationSvg';
import { QrCodeImage } from './QrCodeImage';

interface TcgPitchCardProps {
  card: VisitorCard;
  mode?: 'preview' | 'print';
  side?: 'front' | 'back';
}

function getHeaderBadgeText(card: VisitorCard): string {
  if (card.visitorType === 'Company Owner / Founder') return 'OWNER / FOUNDER';
  if (card.visitorType === 'Director / CXO') return 'DIRECTOR / CXO';
  return 'PGDM 2026–28';
}

function getRoleSubtitle(card: VisitorCard): string {
  if (card.visitorType === 'PGDM Student') {
    const roleOrPos = card.currentPosition.trim() || card.dreamRole.trim();
    return roleOrPos
      ? `Dr. D. Y. Patil B-School, Pune · ${roleOrPos}`
      : 'Dr. D. Y. Patil B-School, Pune';
  }
  const pos = card.currentPosition.trim();
  return pos
    ? `${pos} · Dr. D. Y. Patil B-School Guest`
    : `${card.visitorType} · #DYPAICoE Guest`;
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
  const qrText = formatQrPlainText(card);
  const headerBadge = getHeaderBadgeText(card);
  const subtitle = getRoleSubtitle(card);
  const portraitUrl = card.aiCharacterUrl || card.capturedPhotoUrl;
  const hasStrength2 = card.strength2.trim().length > 0;

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

        {/* Top Section: Header + Dynamic SVG Character + Tagline + Strengths */}
        <div className={`relative z-10 ${isPrint ? 'space-y-[1.1mm]' : 'space-y-1.5'}`}>
          {/* 1. Card Header */}
          <header>
            <div className="flex items-center justify-between gap-1">
              <div className="flex items-center gap-1 shrink-0">
                <span
                  className={`font-mono-nums font-bold uppercase tracking-wider rounded px-1 py-0.5 whitespace-nowrap shrink-0 ${
                    isPrint ? 'text-[5px]' : 'text-[8.5px]'
                  }`}
                  style={{ backgroundColor: theme.badgeBg, color: theme.badgeText }}
                >
                  {headerBadge}
                </span>
                <span
                  className={`font-mono-nums font-bold whitespace-nowrap shrink-0 text-sky-300 ${
                    isPrint ? 'text-[5.2px]' : 'text-[9px]'
                  }`}
                >
                  #DYPAICoE
                </span>
              </div>

              <div className="flex items-center gap-1 min-w-0">
                <span
                  className={`font-mono-nums font-bold tracking-tight truncate text-white ${
                    isPrint ? 'text-[5.2px]' : 'text-[9px]'
                  }`}
                >
                  {card.specialisation.toUpperCase()}
                </span>
                <span
                  className={`rounded-full flex items-center justify-center bg-sky-400 text-[#030712] shrink-0 ${
                    isPrint ? 'w-3 h-3' : 'w-4 h-4'
                  }`}
                  aria-hidden="true"
                >
                  <Sparkles className={isPrint ? 'w-2 h-2' : 'w-2.5 h-2.5'} />
                </span>
              </div>
            </div>

            <div className="flex items-baseline justify-between gap-1.5 mt-0.5">
              <h3
                className={`font-display font-extrabold tracking-tight text-white leading-tight truncate ${
                  isPrint ? 'text-[10.5px]' : 'text-[17px]'
                }`}
              >
                {card.name}
              </h3>
              <span
                className={`font-semibold text-sky-300 shrink-0 ${
                  isPrint ? 'text-[5.2px]' : 'text-[9.5px]'
                }`}
              >
                {card.aiCharacterUrl
                  ? card.cartoonStyle === 'pencil-sketch'
                    ? '★ Ink Sketch'
                    : '★ Cartoon AI'
                  : card.capturedPhotoUrl
                    ? 'Booth Snap'
                    : character.label}
              </span>
            </div>

            <p
              className={`font-medium text-sky-100/90 truncate ${
                isPrint ? 'text-[5.2px]' : 'text-[10px]'
              }`}
            >
              {subtitle}
            </p>
          </header>

          {/* 2. Camera AI-Generated Cartoon Character Container */}
          <div>
            <div
              data-testid="svg-character-container"
              className={`relative w-full overflow-hidden rounded-[8px] border-2 border-[#00D4FF]/80 shadow-[0_0_18px_rgba(0,212,255,0.28),inset_0_0_14px_rgba(0,212,255,0.3)] ${
                isPrint ? (hasStrength2 ? 'h-[20.5mm]' : 'h-[24mm]') : hasStrength2 ? 'h-[118px]' : 'h-[144px]'
              }`}
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
                {card.aiCharacterUrl
                  ? card.cartoonStyle === 'pencil-sketch'
                    ? 'SKETCH EDITION'
                    : 'CARTOON EDITION'
                  : theme.typeLabel}
              </div>
              <div
                className={`absolute bottom-1 right-1 bg-[#030712]/85 border border-sky-400/45 text-sky-300 font-mono-nums font-bold rounded px-1 py-0.5 ${
                  isPrint ? 'text-[5px]' : 'text-[8.5px]'
                }`}
              >
                #{String(card.cardSerial).padStart(3, '0')}
              </div>
            </div>

            {/* Creative Neon Tagline Banner */}
            <div
              className={`mt-1 bg-gradient-to-r from-sky-100 via-white to-sky-100 text-[#030712] border border-sky-300/60 rounded-[4px] px-1.5 py-0.5 text-center font-bold truncate ${
                isPrint ? 'text-[5.3px]' : 'text-[9.5px]'
              }`}
            >
              {card.tagline}
            </div>
          </div>

          {/* 3. Rephrased Executive Strength 1 & Strength 2 Rows */}
          <div className={isPrint ? 'space-y-[1mm]' : 'space-y-1.5'}>
            <div
              className={`rounded-[5px] border px-2 ${isPrint ? 'py-[1mm]' : 'py-1.5'}`}
              style={{ backgroundColor: theme.moveBoxBg, borderColor: theme.moveBorder }}
            >
              <div className="flex items-start gap-1.5">
                <div className="flex items-center gap-0.5 pt-0.5 shrink-0" aria-hidden="true">
                  <span
                    className={`rounded-full flex items-center justify-center bg-sky-400 text-[#030712] ${
                      isPrint ? 'w-2.5 h-2.5' : 'w-3.5 h-3.5'
                    }`}
                  >
                    <Star className={isPrint ? 'w-1.5 h-1.5 fill-current' : 'w-2 h-2 fill-current'} />
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span
                      className={`font-display font-extrabold uppercase tracking-wide text-sky-300 ${
                        isPrint ? 'text-[5.5px]' : 'text-[9.5px]'
                      }`}
                    >
                      Strength 01
                    </span>
                    <span
                      className={`font-mono-nums font-bold text-white/80 ${
                        isPrint ? 'text-[5px]' : 'text-[8.5px]'
                      }`}
                    >
                      +30 IMPACT
                    </span>
                  </div>
                  <p
                    className={`font-semibold text-white leading-tight line-clamp-2 ${
                      isPrint ? 'text-[6px]' : 'text-[11px]'
                    }`}
                  >
                    {card.strength1}
                  </p>
                </div>
              </div>
            </div>

            {hasStrength2 && (
              <div
                data-testid="card-strength-2"
                className={`rounded-[5px] border px-2 ${isPrint ? 'py-[1mm]' : 'py-1.5'}`}
                style={{ backgroundColor: theme.moveBoxBg, borderColor: theme.moveBorder }}
              >
                <div className="flex items-start gap-1.5">
                  <div className="flex items-center pt-0.5 shrink-0" aria-hidden="true">
                    <span
                      className={`rounded-full flex items-center justify-center bg-white text-[#030712] ${
                        isPrint ? 'w-2.5 h-2.5' : 'w-3.5 h-3.5'
                      }`}
                    >
                      <Flame className={isPrint ? 'w-1.5 h-1.5 fill-current' : 'w-2 h-2 fill-current'} />
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span
                        className={`font-display font-extrabold uppercase tracking-wide text-sky-300 ${
                          isPrint ? 'text-[5.5px]' : 'text-[9.5px]'
                        }`}
                      >
                        Strength 02
                      </span>
                      <span
                        className={`font-mono-nums font-bold text-white/80 ${
                          isPrint ? 'text-[5px]' : 'text-[8.5px]'
                        }`}
                      >
                        +20 EDGE
                      </span>
                    </div>
                    <p
                      className={`font-semibold text-white leading-tight line-clamp-2 ${
                        isPrint ? 'text-[6px]' : 'text-[11px]'
                      }`}
                    >
                      {card.strength2}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Section: Growth Edge (Weakness) + Keywords + QR + Motivational Line */}
        <div className={`relative z-10 ${isPrint ? 'space-y-[1mm]' : 'space-y-1.5'}`}>
          <div className="flex items-center justify-between gap-1.5 border-t border-sky-400/25 pt-1">
            <div className="min-w-0 flex-1 space-y-0.5">
              <div className="flex items-start gap-1">
                <ShieldAlert
                  className={`shrink-0 mt-0.5 text-sky-300 ${isPrint ? 'w-2 h-2' : 'w-3 h-3'}`}
                  aria-hidden="true"
                />
                <div className="min-w-0">
                  <span
                    className={`block font-bold uppercase tracking-wider text-sky-300 ${
                      isPrint ? 'text-[4.8px]' : 'text-[8px]'
                    }`}
                  >
                    Growth Edge (Weakness)
                  </span>
                  <p
                    className={`font-medium text-white leading-tight line-clamp-2 ${
                      isPrint ? 'text-[5.5px]' : 'text-[9.5px]'
                    }`}
                  >
                    {card.weakness}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-0.5 pt-0.5">
                {card.keywords.map((kw) => (
                  <span
                    key={kw}
                    className={`font-semibold bg-sky-400/15 border border-sky-400/35 rounded px-1 py-0.5 text-sky-100 truncate max-w-full ${
                      isPrint ? 'text-[4.5px]' : 'text-[8px]'
                    }`}
                  >
                    {kw}
                  </span>
                ))}
              </div>
            </div>

            <div className="shrink-0 bg-white p-0.5 rounded border border-sky-300">
              <QrCodeImage
                text={qrText}
                size={220}
                className={isPrint ? 'w-[12mm] h-[12mm]' : 'w-14 h-14'}
                alt={`Plain-text QR code for ${card.name}`}
              />
            </div>
          </div>

          {/* Bottom Collector Motivational Box */}
          <div
            data-testid="card-motivational-box"
            className={`rounded-[5px] border bg-[#020817]/95 ${
              isPrint ? 'px-1.5 py-[0.8mm]' : 'px-2 py-1'
            }`}
            style={{ borderColor: theme.loreBorder }}
          >
            <span
              className={`block font-display font-extrabold uppercase tracking-wider text-[#00D4FF] text-center ${
                isPrint ? 'text-[4.8px] mb-[0.2mm]' : 'text-[8px] mb-0.5'
              }`}
            >
              Motivational
            </span>
            <p
              className={`font-semibold text-white leading-tight text-center line-clamp-2 ${
                isPrint ? 'text-[5.2px]' : 'text-[9px]'
              }`}
            >
              “{card.motivationalLine}”
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}
