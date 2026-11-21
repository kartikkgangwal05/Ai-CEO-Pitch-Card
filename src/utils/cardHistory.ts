import type { VisitorCard } from '../types/pitch';

/**
 * Card history, saved in the browser's IndexedDB on this device: every card (with its original photo
 * and cartoon portrait) survives page reloads and restarts. Export/import moves it to another device.
 */
const DB_NAME = 'power-card-studio';
const DB_VERSION = 1;
const STORE = 'cards';

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('This browser has no IndexedDB, so card history cannot be saved.'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'id' });
        store.createIndex('createdAt', 'createdAt');
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('Could not open card history.'));
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
        tx.onerror = () => reject(tx.error ?? new Error('Card history error.'));
        tx.onabort = () => reject(tx.error ?? new Error('Card history write was aborted (storage full?).'));
      })
  );
}

/** Insert or update one card. */
export async function saveCardToHistory(card: VisitorCard): Promise<void> {
  await run('readwrite', (store) => store.put(card));
}

/** All saved cards, newest first. */
export async function listHistory(): Promise<VisitorCard[]> {
  const cards = ((await run<VisitorCard[]>('readonly', (store) => store.getAll())) ?? []) as VisitorCard[];
  return cards.sort((a, b) => b.createdAt - a.createdAt);
}

export async function deleteCardFromHistory(id: string): Promise<void> {
  await run('readwrite', (store) => store.delete(id));
}

/** Highest serial number used so far, so numbering continues after a reload. */
export async function highestSerial(): Promise<number> {
  const cards = await listHistory();
  return cards.reduce((max, c) => Math.max(max, c.cardSerial || 0), 0);
}

export const HISTORY_FILE_FORMAT = 'power-card-history@1';

export async function exportHistoryJson(): Promise<Blob> {
  const cards = await listHistory();
  return new Blob([JSON.stringify({ format: HISTORY_FILE_FORMAT, exportedAt: Date.now(), cards })], {
    type: 'application/json',
  });
}

/** Merges cards from an exported backup file; returns how many were imported. */
export async function importHistoryJson(file: File): Promise<number> {
  const data = JSON.parse(await file.text()) as { format?: string; cards?: VisitorCard[] };
  if (data.format !== HISTORY_FILE_FORMAT || !Array.isArray(data.cards)) {
    throw new Error('That file is not a Power Card history backup.');
  }
  const valid = data.cards.filter((c) => c && typeof c.id === 'string' && typeof c.name === 'string');
  await run('readwrite', (store) => {
    valid.forEach((c) => store.put(c));
  });
  return valid.length;
}
