import { useMemo, useRef, useState } from 'react';
import { Download, Eye, Image as ImageIcon, Layers, Printer, Search, Trash2, Upload, X } from 'lucide-react';
import type { VisitorCard } from '../types/pitch';
import { downloadBlob } from '../utils/cardExport';
import { exportHistoryJson, importHistoryJson } from '../utils/cardHistory';
import { CardShareActions } from './CardShareActions';
import { TcgPitchCard } from './TcgPitchCard';

interface HistoryTabProps {
  cards: VisitorCard[];
  loading: boolean;
  error: string | null;
  onShow: (card: VisitorCard) => void;
  onPrint: (card: VisitorCard) => void;
  onDelete: (card: VisitorCard) => void;
  onImported: () => void;
}

// Preview cards are laid out for 356px; tiles show them scaled down so the text keeps its proportions.
const PREVIEW_W = 356;
const TILE_W = 220;
const SCALE = TILE_W / PREVIEW_W;

function formatWhen(ms: number) {
  return new Date(ms).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export function HistoryTab({ cards, loading, error, onShow, onPrint, onDelete, onImported }: HistoryTabProps) {
  const [query, setQuery] = useState('');
  const [view, setView] = useState<'cards' | 'photos'>('cards');
  const [photo, setPhoto] = useState<VisitorCard | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return cards;
    return cards.filter((c) =>
      [c.name, c.title, c.specialisation, String(c.cardSerial)].some((v) => v?.toLowerCase().includes(q))
    );
  }, [cards, query]);
  const withPhotos = filtered.filter((c) => c.capturedPhotoUrl || c.aiCharacterUrl);

  const handleExport = async () => {
    const blob = await exportHistoryJson();
    downloadBlob(blob, `power-card-history-${new Date().toISOString().slice(0, 10)}.json`);
  };

  const handleImport = async (file: File) => {
    try {
      const n = await importHistoryJson(file);
      setNotice(`Imported ${n} card${n === 1 ? '' : 's'}.`);
      onImported();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Import failed.');
    }
  };

  return (
    <div className="no-print space-y-5">
      <div className="bg-[#081226]/95 border border-sky-400/30 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white">Card History · {cards.length} saved</h2>
          <p className="text-xs text-sky-200/85 mt-0.5">
            Every card and photo made on this device is saved here. Tap a card to show it full screen.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-sky-300" aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, title, serial"
              aria-label="Search card history"
              className="w-56 rounded-xl border border-sky-400/35 bg-[#040A17] py-2 pl-8 pr-3 text-xs text-white placeholder:text-sky-200/50 focus:border-[#00D4FF] focus:outline-none"
            />
          </label>
          <div className="flex rounded-xl border border-sky-400/30 bg-[#040A17] p-0.5 text-xs">
            {(
              [
                { id: 'cards', label: 'Cards', Icon: Layers },
                { id: 'photos', label: 'Photos', Icon: ImageIcon },
              ] as const
            ).map(({ id, label, Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setView(id)}
                aria-pressed={view === id}
                className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 font-semibold cursor-pointer ${
                  view === id ? 'bg-[#00D4FF] text-[#030712]' : 'text-sky-200 hover:text-white'
                }`}
              >
                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                {label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => void handleExport()}
            disabled={cards.length === 0}
            title="Download a backup file of all cards and photos"
            className="inline-flex items-center gap-1.5 rounded-xl border border-sky-400/35 bg-[#040A17] hover:bg-[#0D1E42] disabled:opacity-50 text-white text-xs font-semibold px-3 py-2 cursor-pointer"
          >
            <Download className="h-3.5 w-3.5 text-[#00D4FF]" aria-hidden="true" /> Backup
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            title="Load cards from a backup file"
            className="inline-flex items-center gap-1.5 rounded-xl border border-sky-400/35 bg-[#040A17] hover:bg-[#0D1E42] text-white text-xs font-semibold px-3 py-2 cursor-pointer"
          >
            <Upload className="h-3.5 w-3.5 text-[#00D4FF]" aria-hidden="true" /> Restore
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = '';
              if (f) void handleImport(f);
            }}
          />
        </div>
      </div>

      {(notice || error) && (
        <div role="status" className="rounded-xl border border-sky-400/35 bg-sky-500/10 px-4 py-2.5 text-xs text-sky-100">
          {error ?? notice}
        </div>
      )}

      {loading ? (
        <p className="text-center text-sm text-sky-200/80 py-10">Loading saved cards…</p>
      ) : filtered.length === 0 ? (
        <div className="mx-auto max-w-md rounded-2xl border border-dashed border-sky-400/40 bg-[#081226]/95 p-8 text-center">
          <p className="text-sm font-bold text-white">{cards.length === 0 ? 'No cards saved yet' : 'No cards match your search'}</p>
          <p className="mt-1 text-xs text-sky-200/80">
            {cards.length === 0 ? 'Cards made in Booth Mode or Create Card show up here automatically.' : 'Try another name.'}
          </p>
        </div>
      ) : view === 'cards' ? (
        <ul className="grid gap-5" style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${TILE_W + 24}px, 1fr))` }}>
          {filtered.map((card) => (
            <li
              key={card.id}
              className="flex flex-col items-center gap-2 rounded-2xl border border-sky-400/25 bg-[#081226]/90 p-3"
              style={{ contentVisibility: 'auto', containIntrinsicSize: `${TILE_W + 24}px 520px` }}
            >
              <button
                type="button"
                onClick={() => onShow(card)}
                aria-label={`Show ${card.name}'s card full screen`}
                className="relative block cursor-pointer rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00D4FF]"
                style={{ width: TILE_W, height: (TILE_W * 7) / 5 }}
              >
                <div style={{ width: PREVIEW_W, transform: `scale(${SCALE})`, transformOrigin: 'top left' }}>
                  <TcgPitchCard card={card} mode="preview" />
                </div>
                {card.capturedPhotoUrl && (
                  <img
                    src={card.capturedPhotoUrl}
                    alt=""
                    className="absolute -bottom-2 -right-2 h-12 w-12 rounded-full border-2 border-[#00D4FF] object-cover shadow-lg"
                  />
                )}
              </button>
              <div className="w-full text-center">
                <p className="truncate text-sm font-bold text-white">{card.name}</p>
                <p className="truncate text-[11px] text-sky-200/80">
                  #{String(card.cardSerial).padStart(2, '0')} · {card.title} · {formatWhen(card.createdAt)}
                </p>
              </div>
              <div className="flex w-full items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onShow(card)}
                  className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg bg-[#00D4FF] px-2 py-1.5 text-[11px] font-bold text-[#030712] hover:bg-sky-300 cursor-pointer"
                >
                  <Eye className="h-3.5 w-3.5" aria-hidden="true" /> Show
                </button>
                <button
                  type="button"
                  onClick={() => onPrint(card)}
                  className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg border border-sky-400/40 px-2 py-1.5 text-[11px] font-bold text-white hover:bg-[#0D1E42] cursor-pointer"
                >
                  <Printer className="h-3.5 w-3.5" aria-hidden="true" /> Print
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(card)}
                  aria-label={`Delete ${card.name}'s card`}
                  className="rounded-lg border border-rose-400/40 p-1.5 text-rose-200 hover:bg-rose-500/20 cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
              <CardShareActions card={card} size="compact" />
            </li>
          ))}
        </ul>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {withPhotos.map((card) => (
            <li key={card.id}>
              <button
                type="button"
                onClick={() => setPhoto(card)}
                className="group block w-full overflow-hidden rounded-xl border border-sky-400/25 bg-[#081226] text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#00D4FF]"
              >
                <img
                  src={card.capturedPhotoUrl || card.aiCharacterUrl}
                  alt={`${card.name}'s photo`}
                  loading="lazy"
                  className="aspect-square w-full object-cover transition-transform group-hover:scale-105"
                />
                <p className="truncate px-2 py-1.5 text-xs font-semibold text-white">{card.name}</p>
              </button>
            </li>
          ))}
        </ul>
      )}

      {photo && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${photo.name}'s photos`}
          onClick={(e) => e.target === e.currentTarget && setPhoto(null)}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#020612]/95 p-4"
        >
          <button
            type="button"
            onClick={() => setPhoto(null)}
            aria-label="Close"
            className="absolute right-4 top-4 rounded-full border border-sky-400/40 bg-[#081226] p-2.5 text-white cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="flex max-h-full flex-wrap items-center justify-center gap-4 overflow-auto">
            {[
              { url: photo.capturedPhotoUrl, label: 'Original photo' },
              { url: photo.aiCharacterUrl, label: 'Card portrait' },
            ]
              .filter((p) => p.url)
              .map((p) => (
                <figure key={p.label} className="text-center">
                  <img src={p.url} alt={`${photo.name}: ${p.label}`} className="max-h-[75vh] max-w-[90vw] rounded-xl sm:max-w-[42vw]" />
                  <figcaption className="mt-2 text-xs text-sky-200">
                    {photo.name} · {p.label}
                  </figcaption>
                </figure>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
