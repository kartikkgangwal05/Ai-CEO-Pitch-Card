import { useId } from 'react';
import type { ResolvedCharacterId, Specialisation } from '../types/pitch';

interface CharacterIllustrationSvgProps {
  characterId: ResolvedCharacterId;
  specialisation: Specialisation;
  className?: string;
}

function BackdropPattern({
  uid,
  specialisation,
}: {
  uid: string;
  specialisation: Specialisation;
}) {
  switch (specialisation) {
    case 'Marketing':
      return (
        <g opacity="0.9">
          <defs>
            <radialGradient id={`${uid}-mkt-bg`} cx="50%" cy="42%" r="65%">
              <stop offset="0%" stopColor="#0284C7" stopOpacity="0.85" />
              <stop offset="55%" stopColor="#0B1F4A" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#03091B" />
            </radialGradient>
          </defs>
          <rect width="320" height="190" fill={`url(#${uid}-mkt-bg)`} />
          {/* Radiant starburst speed lines */}
          <g stroke="#38BDF8" strokeOpacity="0.22" strokeWidth="1.5">
            <line x1="160" y1="95" x2="10" y2="10" />
            <line x1="160" y1="95" x2="90" y2="0" />
            <line x1="160" y1="95" x2="230" y2="0" />
            <line x1="160" y1="95" x2="310" y2="12" />
            <line x1="160" y1="95" x2="320" y2="145" />
            <line x1="160" y1="95" x2="0" y2="145" />
          </g>
          <circle cx="160" cy="95" r="68" fill="none" stroke="#00D4FF" strokeOpacity="0.28" strokeDasharray="5 5" />
          <circle cx="54" cy="40" r="3" fill="#FFFFFF" fillOpacity="0.7" />
          <circle cx="272" cy="34" r="2.5" fill="#00D4FF" fillOpacity="0.9" />
          <path d="M262 132 L268 122 L274 132 L268 142 Z" fill="#38BDF8" fillOpacity="0.45" />
        </g>
      );

    case 'Finance':
      return (
        <g opacity="0.95">
          <defs>
            <linearGradient id={`${uid}-fin-bg`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#041229" />
              <stop offset="50%" stopColor="#082D4F" />
              <stop offset="100%" stopColor="#030A1A" />
            </linearGradient>
            <pattern id={`${uid}-fin-hex`} width="28" height="24" patternUnits="userSpaceOnUse">
              <path
                d="M7 0 L21 0 L28 12 L21 24 L7 24 L0 12 Z"
                fill="none"
                stroke="#22D3EE"
                strokeOpacity="0.14"
                strokeWidth="1"
              />
            </pattern>
          </defs>
          <rect width="320" height="190" fill={`url(#${uid}-fin-bg)`} />
          <rect width="320" height="190" fill={`url(#${uid}-fin-hex)`} />
          <polyline
            points="16,154 68,132 108,142 154,98 214,110 264,54 306,40"
            fill="none"
            stroke="#00D4FF"
            strokeOpacity="0.45"
            strokeWidth="2.2"
          />
          <circle cx="264" cy="54" r="4" fill="#FFFFFF" />
        </g>
      );

    case 'HR':
      return (
        <g opacity="0.95">
          <defs>
            <radialGradient id={`${uid}-hr-bg`} cx="50%" cy="45%" r="70%">
              <stop offset="0%" stopColor="#1D4ED8" stopOpacity="0.7" />
              <stop offset="60%" stopColor="#0A193C" />
              <stop offset="100%" stopColor="#040A1B" />
            </radialGradient>
          </defs>
          <rect width="320" height="190" fill={`url(#${uid}-hr-bg)`} />
          <circle cx="160" cy="96" r="54" fill="none" stroke="#93C5FD" strokeOpacity="0.28" strokeWidth="1.5" />
          <circle cx="160" cy="96" r="82" fill="none" stroke="#60A5FA" strokeOpacity="0.2" strokeWidth="1.2" strokeDasharray="4 4" />
          <path d="M18 126 Q90 88 160 126 T302 122" fill="none" stroke="#00D4FF" strokeOpacity="0.35" strokeWidth="2" />
          <circle cx="52" cy="52" r="6" fill="#38BDF8" fillOpacity="0.25" />
          <circle cx="268" cy="48" r="8" fill="#FFFFFF" fillOpacity="0.2" />
        </g>
      );

    case 'Executive Leadership':
      return (
        <g opacity="0.96">
          <defs>
            <linearGradient id={`${uid}-exec-bg`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#020817" />
              <stop offset="50%" stopColor="#0E3069" />
              <stop offset="100%" stopColor="#030D24" />
            </linearGradient>
          </defs>
          <rect width="320" height="190" fill={`url(#${uid}-exec-bg)`} />
          <polygon points="160,12 288,95 160,178 32,95" fill="none" stroke="#00D4FF" strokeOpacity="0.28" strokeWidth="1.5" />
          <polygon points="160,30 258,95 160,160 62,95" fill="none" stroke="#FFFFFF" strokeOpacity="0.16" strokeWidth="1" />
          <rect x="28" y="138" width="22" height="44" fill="#38BDF8" fillOpacity="0.14" />
          <rect x="56" y="118" width="18" height="64" fill="#38BDF8" fillOpacity="0.18" />
          <rect x="252" y="112" width="20" height="70" fill="#38BDF8" fillOpacity="0.18" />
          <rect x="278" y="132" width="18" height="50" fill="#38BDF8" fillOpacity="0.14" />
        </g>
      );

    case 'Business Analytics':
    default:
      return (
        <g opacity="0.95">
          <defs>
            <radialGradient id={`${uid}-ba-bg`} cx="50%" cy="40%" r="70%">
              <stop offset="0%" stopColor="#0C3875" />
              <stop offset="65%" stopColor="#061430" />
              <stop offset="100%" stopColor="#020817" />
            </radialGradient>
            <pattern id={`${uid}-ba-grid`} width="24" height="24" patternUnits="userSpaceOnUse">
              <path d="M 24 0 L 0 0 0 24" fill="none" stroke="#00D4FF" strokeOpacity="0.16" strokeWidth="0.8" />
            </pattern>
          </defs>
          <rect width="320" height="190" fill={`url(#${uid}-ba-bg)`} />
          <rect width="320" height="190" fill={`url(#${uid}-ba-grid)`} />
          <circle cx="160" cy="94" r="64" fill="none" stroke="#00D4FF" strokeOpacity="0.32" strokeWidth="1.6" strokeDasharray="8 4" />
          <line x1="22" y1="44" x2="86" y2="44" stroke="#38BDF8" strokeOpacity="0.45" strokeWidth="1.5" />
          <circle cx="88" cy="44" r="3" fill="#FFFFFF" />
          <line x1="234" y1="146" x2="298" y2="146" stroke="#38BDF8" strokeOpacity="0.45" strokeWidth="1.5" />
          <circle cx="232" cy="146" r="3" fill="#00D4FF" />
        </g>
      );
  }
}

function CharacterArtwork({ characterId }: { characterId: ResolvedCharacterId }) {
  switch (characterId) {
    case 'gadget-cat':
      // Doraemon-inspired cyber robo-cat inventor with neon gadget halo
      return (
        <g transform="translate(160, 102)">
          {/* Soft neon aura */}
          <circle cx="0" cy="-4" r="62" fill="#00D4FF" fillOpacity="0.14" />
          {/* Body */}
          <path d="M-36 18 C-40 52 -32 76 0 76 C32 76 40 52 36 18 Z" fill="#00A8FF" stroke="#0F172A" strokeWidth="3" />
          {/* White belly & 4D pocket */}
          <ellipse cx="0" cy="46" rx="25" ry="24" fill="#FFFFFF" stroke="#0F172A" strokeWidth="2.2" />
          <path d="M-16 47 L16 47 A16 14 0 0 1 -16 47 Z" fill="#E0F2FE" stroke="#0284C7" strokeWidth="2" />
          {/* Arms */}
          <path d="M-34 22 L-54 10" stroke="#00A8FF" strokeWidth="13" strokeLinecap="round" />
          <circle cx="-56" cy="9" r="8" fill="#FFFFFF" stroke="#0F172A" strokeWidth="2.5" />
          <path d="M34 22 L54 6" stroke="#00A8FF" strokeWidth="13" strokeLinecap="round" />
          <circle cx="56" cy="5" r="8" fill="#FFFFFF" stroke="#0F172A" strokeWidth="2.5" />
          {/* Holographic neon chip above right paw */}
          <rect x="44" y="-32" width="24" height="22" rx="4" fill="#030712" stroke="#00D4FF" strokeWidth="2.2" />
          <path d="M50 -24 L56 -18 L63 -26" fill="none" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" />
          {/* Head */}
          <circle cx="0" cy="-24" r="44" fill="#00A8FF" stroke="#0F172A" strokeWidth="3" />
          <ellipse cx="0" cy="-16" rx="36" ry="32" fill="#FFFFFF" stroke="#0F172A" strokeWidth="2" />
          {/* Expressive Eyes */}
          <ellipse cx="-10" cy="-35" rx="9" ry="11" fill="#FFFFFF" stroke="#0F172A" strokeWidth="2.2" />
          <ellipse cx="10" cy="-35" rx="9" ry="11" fill="#FFFFFF" stroke="#0F172A" strokeWidth="2.2" />
          <circle cx="-8" cy="-34" r="3.4" fill="#0F172A" />
          <circle cx="8" cy="-34" r="3.4" fill="#0F172A" />
          <circle cx="-7" cy="-35" r="1.2" fill="#FFFFFF" />
          <circle cx="9" cy="-35" r="1.2" fill="#FFFFFF" />
          {/* Nose & happy smile */}
          <circle cx="0" cy="-23" r="5" fill="#EF4444" stroke="#0F172A" strokeWidth="1.8" />
          <line x1="0" y1="-18" x2="0" y2="-6" stroke="#0F172A" strokeWidth="2.2" />
          <path d="M-21 -12 Q0 6 21 -12" fill="none" stroke="#0F172A" strokeWidth="2.5" strokeLinecap="round" />
          {/* Whiskers */}
          <g stroke="#0F172A" strokeWidth="1.8" strokeLinecap="round">
            <line x1="-29" y1="-26" x2="-15" y2="-22" />
            <line x1="-31" y1="-18" x2="-15" y2="-18" />
            <line x1="-29" y1="-10" x2="-15" y2="-14" />
            <line x1="29" y1="-26" x2="15" y2="-22" />
            <line x1="31" y1="-18" x2="15" y2="-18" />
            <line x1="29" y1="-10" x2="15" y2="-14" />
          </g>
          {/* Red Collar + Golden Bell */}
          <rect x="-28" y="13" width="56" height="7" rx="3.5" fill="#EF4444" stroke="#0F172A" strokeWidth="2" />
          <circle cx="0" cy="22" r="7" fill="#FACC15" stroke="#0F172A" strokeWidth="2" />
          <line x1="-5" y1="21" x2="5" y2="21" stroke="#0F172A" strokeWidth="1.5" />
        </g>
      );

    case 'mischief-maverick':
      // Shinchan-inspired playful creative dynamo with bold brows, red tee & megaphone
      return (
        <g transform="translate(160, 102)">
          <circle cx="0" cy="-2" r="60" fill="#38BDF8" fillOpacity="0.14" />
          {/* Red Signature Tee & Shorts */}
          <path d="M-28 22 L28 22 L34 62 L-34 62 Z" fill="#EF4444" stroke="#0F172A" strokeWidth="2.8" />
          <path d="M-28 60 L28 60 L24 76 L4 76 L0 66 L-4 76 L-24 76 Z" fill="#FACC15" stroke="#0F172A" strokeWidth="2.6" />
          {/* Arms + Neon Megaphone */}
          <path d="M-28 26 L-50 42" stroke="#FDBA74" strokeWidth="10" strokeLinecap="round" />
          <circle cx="-51" cy="43" r="6" fill="#FDBA74" stroke="#0F172A" strokeWidth="2.2" />
          <path d="M28 26 L48 16" stroke="#FDBA74" strokeWidth="10" strokeLinecap="round" />
          <polygon points="46,12 76,-6 76,26 46,18" fill="#00D4FF" stroke="#0F172A" strokeWidth="2.4" />
          <line x1="82" y1="4" x2="94" y2="-2" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="84" y1="12" x2="98" y2="12" stroke="#00D4FF" strokeWidth="2.5" strokeLinecap="round" />
          {/* Head (iconic rounded cheek curve) */}
          <path
            d="M-34 -24 C-36 -56 36 -56 34 -24 C34 -8 24 14 0 16 C-26 16 -40 2 -34 -24 Z"
            fill="#FDBA74"
            stroke="#0F172A"
            strokeWidth="2.8"
          />
          {/* Ear */}
          <circle cx="-35" cy="-14" r="7" fill="#FDBA74" stroke="#0F172A" strokeWidth="2.4" />
          {/* Spiky dark crop */}
          <path
            d="M-34 -26 C-38 -52 -12 -64 8 -60 C26 -58 38 -42 35 -24 C25 -34 10 -38 -6 -36 C-20 -36 -28 -30 -34 -26 Z"
            fill="#0F172A"
          />
          {/* Bold Signature Eyebrows */}
          <path d="M-20 -34 Q-10 -41 -2 -33" fill="none" stroke="#0F172A" strokeWidth="5.5" strokeLinecap="round" />
          <path d="M5 -34 Q14 -41 23 -33" fill="none" stroke="#0F172A" strokeWidth="5.5" strokeLinecap="round" />
          {/* Expressive Eyes */}
          <ellipse cx="-10" cy="-21" rx="7" ry="6.5" fill="#FFFFFF" stroke="#0F172A" strokeWidth="2.2" />
          <ellipse cx="14" cy="-21" rx="7" ry="6.5" fill="#FFFFFF" stroke="#0F172A" strokeWidth="2.2" />
          <circle cx="-9" cy="-21" r="2.8" fill="#0F172A" />
          <circle cx="15" cy="-21" r="2.8" fill="#0F172A" />
          {/* Rosy cheek + cheeky grin */}
          <ellipse cx="-21" cy="-6" rx="5.5" ry="3.5" fill="#FB7185" fillOpacity="0.65" />
          <ellipse cx="22" cy="-6" rx="5.5" ry="3.5" fill="#FB7185" fillOpacity="0.65" />
          <path d="M-6 -2 Q4 7 14 -2" fill="none" stroke="#0F172A" strokeWidth="2.6" strokeLinecap="round" />
        </g>
      );

    case 'harmony-ace':
      // Shizuka-inspired warm people-leader cartoon with twin pigtails & neon harmony badge
      return (
        <g transform="translate(160, 102)">
          <circle cx="0" cy="-2" r="58" fill="#60A5FA" fillOpacity="0.16" />
          {/* Twin Pigtails + Neon Blue Clips */}
          <path d="M-32 -28 C-56 -24 -60 8 -42 20 C-34 10 -30 -8 -30 -20 Z" fill="#1E293B" stroke="#0F172A" strokeWidth="2.2" />
          <path d="M32 -28 C56 -24 60 8 42 20 C34 10 30 -8 30 -20 Z" fill="#1E293B" stroke="#0F172A" strokeWidth="2.2" />
          <rect x="-38" y="-30" width="9" height="6" rx="2" fill="#00D4FF" />
          <rect x="29" y="-30" width="9" height="6" rx="2" fill="#00D4FF" />
          {/* Top / Dress with crisp white collar */}
          <path d="M-28 20 L28 20 L36 74 L-36 74 Z" fill="#38BDF8" stroke="#0F172A" strokeWidth="2.6" />
          <polygon points="-14,20 0,34 14,20" fill="#FFFFFF" stroke="#0F172A" strokeWidth="2" />
          {/* Musical / Harmony Sparkle */}
          <path d="M52 -16 L52 10 M52 -16 L66 -20 L66 6" stroke="#FFFFFF" strokeWidth="2.4" fill="none" strokeLinecap="round" />
          <circle cx="48" cy="10" r="4.5" fill="#00D4FF" />
          <circle cx="62" cy="6" r="4.5" fill="#00D4FF" />
          {/* Head */}
          <circle cx="0" cy="-18" r="33" fill="#FDE68A" stroke="#0F172A" strokeWidth="2.6" />
          {/* Bangs */}
          <path d="M-33 -22 C-30 -54 30 -54 33 -22 C20 -34 -20 -34 -33 -22 Z" fill="#1E293B" />
          {/* Bright warm eyes */}
          <ellipse cx="-11" cy="-18" rx="5" ry="6.5" fill="#0F172A" />
          <ellipse cx="11" cy="-18" rx="5" ry="6.5" fill="#0F172A" />
          <circle cx="-12" cy="-20" r="2" fill="#FFFFFF" />
          <circle cx="10" cy="-20" r="2" fill="#FFFFFF" />
          <ellipse cx="-19" cy="-8" rx="4.5" ry="2.5" fill="#FB7185" fillOpacity="0.55" />
          <ellipse cx="19" cy="-8" rx="4.5" ry="2.5" fill="#FB7185" fillOpacity="0.55" />
          <path d="M-7 -4 Q0 3 7 -4" fill="none" stroke="#0F172A" strokeWidth="2.4" strokeLinecap="round" />
        </g>
      );

    case 'strategy-prodigy':
      // Sharp glasses strategist (Nobita/Finance analyst energy) with neon compass & upward graph
      return (
        <g transform="translate(160, 102)">
          <circle cx="0" cy="-4" r="58" fill="#22D3EE" fillOpacity="0.14" />
          {/* Crisp Navy/Teal Blazer + Neon Tie */}
          <path d="M-34 22 L34 22 L40 76 L-40 76 Z" fill="#0F172A" stroke="#38BDF8" strokeWidth="2.4" />
          <polygon points="-12,22 0,46 12,22" fill="#FFFFFF" />
          <polygon points="-4,24 4,24 6,54 0,62 -6,54" fill="#00D4FF" />
          {/* Floating Golden/Neon Valuation Compass */}
          <circle cx="56" cy="-6" r="15" fill="#041229" stroke="#22D3EE" strokeWidth="2.4" />
          <polygon points="56,-17 60,-6 56,5 52,-6" fill="#FFFFFF" />
          <circle cx="56" cy="-6" r="3" fill="#00D4FF" />
          {/* Head */}
          <circle cx="0" cy="-18" r="34" fill="#FDBA74" stroke="#0F172A" strokeWidth="2.6" />
          <path d="M-34 -24 C-32 -56 32 -56 34 -24 C20 -36 4 -38 -14 -34 C-24 -32 -30 -28 -34 -24 Z" fill="#0F172A" />
          {/* Signature Round Glasses */}
          <circle cx="-13" cy="-16" r="11" fill="#FFFFFF" fillOpacity="0.92" stroke="#0F172A" strokeWidth="2.8" />
          <circle cx="13" cy="-16" r="11" fill="#FFFFFF" fillOpacity="0.92" stroke="#0F172A" strokeWidth="2.8" />
          <line x1="-2" y1="-16" x2="2" y2="-16" stroke="#0F172A" strokeWidth="2.8" />
          <circle cx="-12" cy="-16" r="3.4" fill="#0F172A" />
          <circle cx="12" cy="-16" r="3.4" fill="#0F172A" />
          <path d="M-7 1 Q0 7 9 0" fill="none" stroke="#0F172A" strokeWidth="2.4" strokeLinecap="round" />
        </g>
      );

    case 'visionary-captain':
      // Company Owner / Director / CXO Trailblazer Hero Crest
      return (
        <g transform="translate(160, 102)">
          <circle cx="0" cy="-4" r="62" fill="#00D4FF" fillOpacity="0.18" />
          {/* Executive Blazer with White Pocket Square */}
          <path d="M-40 22 L40 22 L46 76 L-46 76 Z" fill="#0C2452" stroke="#00D4FF" strokeWidth="2.5" />
          <polygon points="-14,22 0,52 14,22" fill="#FFFFFF" />
          <polygon points="-4,24 4,24 5,50 0,58 -5,50" fill="#0EA5E9" />
          <rect x="16" y="40" width="12" height="5" rx="1" fill="#FFFFFF" />
          {/* Head */}
          <circle cx="0" cy="-18" r="34" fill="#FDBA74" stroke="#0F172A" strokeWidth="2.6" />
          {/* Swept Executive Hair */}
          <path d="M-34 -24 C-34 -56 18 -62 34 -28 C22 -36 0 -42 -20 -34 Z" fill="#1E293B" />
          {/* Crown / Leadership Crest above */}
          <polygon points="-16,-56 -10,-68 0,-59 10,-68 16,-56" fill="#00D4FF" stroke="#FFFFFF" strokeWidth="1.8" />
          {/* Confident Eyes & Smile */}
          <path d="M-19 -26 L-7 -24" stroke="#0F172A" strokeWidth="3" strokeLinecap="round" />
          <path d="M7 -24 L19 -26" stroke="#0F172A" strokeWidth="3" strokeLinecap="round" />
          <circle cx="-12" cy="-16" r="3.6" fill="#0F172A" />
          <circle cx="12" cy="-16" r="3.6" fill="#0F172A" />
          <path d="M-10 -2 Q0 7 12 -2" fill="none" stroke="#0F172A" strokeWidth="2.6" strokeLinecap="round" />
          {/* Floating Orbiting Star */}
          <path d="M62 -24 L66 -16 L74 -15 L68 -9 L69 -1 L62 -5 L55 -1 L56 -9 L50 -15 L58 -16 Z" fill="#FFFFFF" stroke="#00D4FF" strokeWidth="1.5" />
        </g>
      );

    case 'data-wizard':
    default:
      // Sci-Fi Anime Analytics Wiz casting glowing telemetry nodes
      return (
        <g transform="translate(160, 102)">
          <circle cx="0" cy="-4" r="62" fill="#3B82F6" fillOpacity="0.18" />
          {/* Cyber Jacket */}
          <path d="M-36 22 L36 22 L42 76 L-42 76 Z" fill="#091533" stroke="#00D4FF" strokeWidth="2.5" />
          <path d="M-14 22 L0 44 L14 22" fill="none" stroke="#38BDF8" strokeWidth="3" />
          {/* Holo Telemetry Orbit */}
          <ellipse cx="0" cy="-4" rx="68" ry="20" fill="none" stroke="#00D4FF" strokeOpacity="0.7" strokeWidth="2" transform="rotate(-14)" />
          <circle cx="-58" cy="14" r="5" fill="#FFFFFF" />
          <circle cx="58" cy="-20" r="5" fill="#00D4FF" />
          {/* Head */}
          <circle cx="0" cy="-20" r="33" fill="#FDE68A" stroke="#0F172A" strokeWidth="2.6" />
          <path d="M-35 -24 C-32 -58 34 -56 35 -22 C18 -38 -18 -38 -35 -24 Z" fill="#0F172A" />
          {/* Cyber Neon Visor Glasses */}
          <rect x="-25" y="-25" width="21" height="12" rx="3" fill="#020817" stroke="#00D4FF" strokeWidth="2.2" />
          <rect x="4" y="-25" width="21" height="12" rx="3" fill="#020817" stroke="#00D4FF" strokeWidth="2.2" />
          <line x1="-4" y1="-19" x2="4" y2="-19" stroke="#00D4FF" strokeWidth="2.2" />
          <line x1="-20" y1="-19" x2="-9" y2="-19" stroke="#FFFFFF" strokeWidth="2" />
          <line x1="9" y1="-19" x2="20" y2="-19" stroke="#FFFFFF" strokeWidth="2" />
          <path d="M-7 -3 Q0 4 8 -3" fill="none" stroke="#0F172A" strokeWidth="2.4" strokeLinecap="round" />
        </g>
      );
  }
}

export function CharacterIllustrationSvg({
  characterId,
  specialisation,
  className = 'w-full h-full',
}: CharacterIllustrationSvgProps) {
  const uid = useId().replace(/:/g, '');
  return (
    <svg
      viewBox="0 0 320 190"
      className={className}
      role="img"
      aria-label={`${characterId} SVG character illustration for ${specialisation}`}
      preserveAspectRatio="xMidYMid slice"
    >
      <BackdropPattern uid={uid} specialisation={specialisation} />
      <CharacterArtwork characterId={characterId} />
    </svg>
  );
}
