import type { VisitorCard } from '../types/pitch';

/**
 * Card history lives in the central store on the server (/api/history), so every device sees the
 * same cards. This browser also keeps a copy in IndexedDB: it shows cards when the network is down
 * and holds cards made offline (`_pending`) until they upload.
 */
const DB_NAME = 'power-card-studio';
const DB_VERSION = 1;
const STORE = 'cards';

type LocalCard = VisitorCard & { _pending?: boolean; _synced?: boolean };

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('No IndexedDB in this browser.'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' }).createIndex('createdAt', 'createdAt');
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('Could not open local history.'));
  });
  dbPromise.catch(() => {
    dbPromise = null;
  });
  return dbPromise;
}

function run<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T> | void): Promise<T | undefined> {
  return openDb().then(
    (db) =>
      new Promise<T | undefined>((resolve, reject) => {
        const tx = db.transaction(STORE, mode);
        const req = fn(tx.objectStore(STORE));
        tx.oncomplete = () => resolve(req ? req.result : undefined);
        tx.onerror = () => reject(tx.error ?? new Error('Local history error.'));
        tx.onabort = () => reject(tx.error ?? new Error('Local history write aborted (storage full?).'));
      })
  );
}

const localAll = async () => ((await run<LocalCard[]>('readonly', (s) => s.getAll()).catch(() => [])) ?? []) as LocalCard[];
const localPut = (cards: LocalCard[]) => run('readwrite', (s) => void cards.forEach((c) => s.put(c))).catch(() => undefined);
const localDelete = (id: string) => run('readwrite', (s) => s.delete(id)).catch(() => undefined);
const strip = ({ _pending, _synced, ...card }: LocalCard): VisitorCard => card;
const newestFirst = (a: VisitorCard, b: VisitorCard) => b.createdAt - a.createdAt;

/** Re-encodes a data-URL image as a JPEG of at most `max` px, so uploads stay under the 4.5 MB request limit. */
function shrinkImage(dataUrl: string, max = 1000): Promise<string> {
  if (!dataUrl.startsWith('data:image/') || dataUrl.startsWith('data:image/svg')) return Promise.resolve(dataUrl);
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
      const c = document.createElement('canvas');
      c.width = Math.round(img.naturalWidth * scale);
      c.height = Math.round(img.naturalHeight * scale);
      c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
      resolve(c.toDataURL('image/jpeg', 0.9));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

async function upload(card: VisitorCard): Promise<VisitorCard> {
  const body = {
    ...card,
    capturedPhotoUrl: await shrinkImage(card.capturedPhotoUrl, 1200),
    aiCharacterUrl: await shrinkImage(card.aiCharacterUrl, 1800),
  };
  const res = await fetch('/api/history', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const payload = (await res.json().catch(() => ({}))) as { card?: VisitorCard; error?: string };
  if (!res.ok || !payload.card) throw new Error(payload.error ?? `Upload failed (HTTP ${res.status}).`);
  return payload.card;
}

/** Saves a card centrally (and locally). Returns the stored card; if offline it stays queued locally. */
export async function saveCardToHistory(card: VisitorCard): Promise<VisitorCard> {
  await localPut([{ ...card, _pending: true }]);
  const saved = await upload(card);
  await localPut([{ ...saved, _synced: true }]);
  return saved;
}

/** Uploads cards made while offline, and cards from before history was central. */
export async function syncPending(): Promise<number> {
  const waiting = (await localAll()).filter((c) => c._pending || !c._synced);
  let done = 0;
  for (const card of waiting) {
    try {
      const saved = await upload(strip(card));
      await localPut([{ ...saved, _synced: true }]);
      done++;
    } catch {
      break; // still offline: try again on the next refresh
    }
  }
  return done;
}

/**
 * All cards, newest first: the central list plus any local cards not uploaded yet.
 * `offline` is true when the central store could not be reached (local copy shown).
 */
export async function listHistory(): Promise<{ cards: VisitorCard[]; offline: boolean }> {
  const local = await localAll();
  try {
    const res = await fetch('/api/history', { cache: 'no-store' });
    const payload = (await res.json().catch(() => ({}))) as { cards?: VisitorCard[]; error?: string };
    if (!res.ok || !payload.cards) throw new Error(payload.error ?? `HTTP ${res.status}`);
    const central = payload.cards;
    const ids = new Set(central.map((c) => c.id));
    const waiting = local.filter((c) => !ids.has(c.id) && (c._pending || !c._synced)).map(strip);
    // refresh the local copy (synced cards removed elsewhere are dropped here too)
    const centralLocal = local.filter((c) => c._synced && !ids.has(c.id));
    await Promise.all(centralLocal.map((c) => localDelete(c.id)));
    await localPut(central.map((c) => ({ ...c, _synced: true })));
    return { cards: [...central, ...waiting].sort(newestFirst), offline: false };
  } catch {
    return { cards: local.map(strip).sort(newestFirst), offline: true };
  }
}

/** Deletes a card everywhere. Needs the staff PIN set on the server. */
export async function deleteCardFromHistory(id: string, pin: string): Promise<void> {
  const res = await fetch(`/api/history/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { 'x-staff-pin': pin },
  });
  if (res.status === 404) {
    await localDelete(id);
    return;
  }
  const payload = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) throw Object.assign(new Error(payload.error ?? `Delete failed (HTTP ${res.status}).`), { status: res.status });
  await localDelete(id);
}

export const HISTORY_FILE_FORMAT = 'power-card-history@1';

async function toDataUrl(url: string): Promise<string> {
  if (!url || url.startsWith('data:')) return url;
  try {
    const blob = await (await fetch(url)).blob();
    return await new Promise((resolve) => {
      const fr = new FileReader();
      fr.onload = () => resolve(String(fr.result));
      fr.onerror = () => resolve(url);
      fr.readAsDataURL(blob);
    });
  } catch {
    return url;
  }
}

/** Backup file with the photos embedded, so it can be restored anywhere. */
export async function exportHistoryJson(cards: VisitorCard[]): Promise<Blob> {
  const full = await Promise.all(
    cards.map(async (c) => ({ ...c, capturedPhotoUrl: await toDataUrl(c.capturedPhotoUrl), aiCharacterUrl: await toDataUrl(c.aiCharacterUrl) }))
  );
  return new Blob([JSON.stringify({ format: HISTORY_FILE_FORMAT, exportedAt: Date.now(), cards: full })], {
    type: 'application/json',
  });
}

/** Uploads cards from a backup file to the central history; returns how many were imported. */
export async function importHistoryJson(file: File): Promise<number> {
  const data = JSON.parse(await file.text()) as { format?: string; cards?: VisitorCard[] };
  if (data.format !== HISTORY_FILE_FORMAT || !Array.isArray(data.cards)) {
    throw new Error('That file is not a Power Card history backup.');
  }
  const valid = data.cards.filter((c) => c && typeof c.id === 'string' && typeof c.name === 'string');
  await localPut(valid.map((c) => ({ ...c, _pending: true })));
  await syncPending();
  return valid.length;
}
