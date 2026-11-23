import type { VisitorCard } from '../types/pitch';
import { memberNo } from '../utils/foundingMember';
import { TcgPitchCard } from './TcgPitchCard';

interface RecentCardsWallProps {
  cards: VisitorCard[];
  onShow: (card: VisitorCard) => void;
  /** How many of the newest cards to show. */
  limit?: number;
}

// Preview cards are laid out for 356px; tiles show them scaled so the text keeps its proportions.
const PREVIEW_W = 356;
const TILE_W = 190;
const SCALE = TILE_W / PREVIEW_W;

/** Front-page wall of the latest cards from every booth device. Tap one to show it full screen. */
export function RecentCardsWall({ cards, onShow, limit = 36 }: RecentCardsWallProps) {
  if (cards.length === 0) return null;
  const shown = cards.slice(0, limit);
  return (
    <section aria-labelledby="recent-cards-title" className="relative z-10 mx-auto w-full max-w-6xl px-2 pb-16 pt-6">
      <div className="mb-6 text-center">
        <p className="font-mono-nums text-[11px] uppercase tracking-[0.45em] text-[#E7B547]/80">Founding members</p>
        <h2
          id="recent-cards-title"
          className="mt-1 text-3xl font-black tracking-wide text-[#FFE7A8] sm:text-4xl"
          style={{ fontFamily: 'Cinzel, Georgia, serif' }}
        >
          Recent Power Cards
        </h2>
        <p className="mt-1 text-xs text-white/50">
          {cards.length} card{cards.length === 1 ? '' : 's'} made so far · tap one to show it
        </p>
      </div>
      <ul className="grid justify-center gap-5" style={{ gridTemplateColumns: `repeat(auto-fill, ${TILE_W}px)` }}>
        {shown.map((card) => (
          <li key={card.id} style={{ contentVisibility: 'auto', containIntrinsicSize: `${TILE_W}px ${(TILE_W * 7) / 5 + 44}px` }}>
            <button
              type="button"
              onClick={() => onShow(card)}
              aria-label={`Show ${card.name}'s power card`}
              className="group block cursor-pointer rounded-xl text-left focus:outline-none focus:ring-2 focus:ring-[#E7B547]"
            >
              <div
                className="overflow-hidden transition-transform duration-200 group-hover:-translate-y-1 group-hover:scale-[1.03]"
                style={{ width: TILE_W, height: (TILE_W * 7) / 5 }}
              >
                <div style={{ width: PREVIEW_W, transform: `scale(${SCALE})`, transformOrigin: 'top left' }}>
                  <TcgPitchCard card={card} mode="preview" />
                </div>
              </div>
              <p className="mt-2 truncate text-center text-sm font-bold text-white">{card.name}</p>
              <p className="truncate text-center font-mono-nums text-[10px] uppercase tracking-[0.2em] text-[#E7B547]/80">
                Founding member #{memberNo(card)}
              </p>
            </button>
          </li>
        ))}
      </ul>
      {cards.length > shown.length && (
        <p className="mt-6 text-center text-xs text-white/50">
          Showing the newest {shown.length}. All {cards.length} are in Studio → History.
        </p>
      )}
    </section>
  );
}
