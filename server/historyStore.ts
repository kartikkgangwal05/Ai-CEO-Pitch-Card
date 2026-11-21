// Central card history in a private Vercel Blob store, shared by every device.
//   history/cards/<id>.json      the card (image fields point at /api/history/image)
//   history/img/<id>-<field>.<ext>  the original photo and the card portrait
// Blobs are private: images are only served through /api/history/image.
import { Readable } from 'node:stream';
import type { Express, Request as Req, Response as Res } from 'express';
import { del, get, list, put } from '@vercel/blob';

const CARD_PREFIX = 'history/cards/';
const IMG_PREFIX = 'history/img/';
const IMAGE_FIELDS = ['capturedPhotoUrl', 'aiCharacterUrl'] as const;
const ID_RE = /^[A-Za-z0-9_-]{1,100}$/;

type StoredCard = Record<string, unknown> & { id: string; createdAt: number };

function configured() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

// Card JSON is immutable per upload, so reads are cached by pathname + upload time.
const cardCache = new Map<string, { uploadedAt: number; card: StoredCard }>();

async function readText(pathname: string): Promise<string | null> {
  const result = await get(pathname, { access: 'private', useCache: false });
  if (!result || !result.stream) return null;
  return new Response(result.stream as ReadableStream).text();
}

async function listCards(): Promise<StoredCard[]> {
  const blobs: { pathname: string; uploadedAt: Date }[] = [];
  let cursor: string | undefined;
  do {
    const page = await list({ prefix: CARD_PREFIX, cursor, limit: 1000 });
    blobs.push(...page.blobs);
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);

  const live = new Set(blobs.map((b) => b.pathname));
  for (const key of cardCache.keys()) if (!live.has(key)) cardCache.delete(key);

  const cards = await Promise.all(
    blobs.map(async (b) => {
      const uploadedAt = new Date(b.uploadedAt).getTime();
      const hit = cardCache.get(b.pathname);
      if (hit && hit.uploadedAt === uploadedAt) return hit.card;
      try {
        const text = await readText(b.pathname);
        if (!text) return null;
        const card = JSON.parse(text) as StoredCard;
        cardCache.set(b.pathname, { uploadedAt, card });
        return card;
      } catch {
        return null;
      }
    })
  );
  return cards.filter((c): c is StoredCard => Boolean(c)).sort((a, b) => b.createdAt - a.createdAt);
}

/** Moves data-URL images into their own blobs and points the card at them. */
async function saveCard(input: StoredCard): Promise<StoredCard> {
  const card: StoredCard = { ...input };
  delete card._pending;
  delete card._synced;
  for (const field of IMAGE_FIELDS) {
    const value = card[field];
    if (typeof value !== 'string') continue;
    const match = /^data:(image\/(png|jpe?g|webp|gif|svg\+xml));base64,(.+)$/.exec(value);
    if (!match) continue;
    const ext = match[2] === 'jpeg' ? 'jpg' : match[2] === 'svg+xml' ? 'svg' : match[2];
    const pathname = `${IMG_PREFIX}${card.id}-${field}.${ext}`;
    await put(pathname, Buffer.from(match[3], 'base64'), {
      access: 'private',
      contentType: match[1],
      allowOverwrite: true,
      addRandomSuffix: false,
    });
    card[field] = `/api/history/image?p=${encodeURIComponent(pathname)}&v=${Date.now()}`;
  }
  await put(`${CARD_PREFIX}${card.id}.json`, JSON.stringify(card), {
    access: 'private',
    contentType: 'application/json',
    allowOverwrite: true,
    addRandomSuffix: false,
  });
  return card;
}

async function deleteCard(id: string) {
  const imgs = await list({ prefix: `${IMG_PREFIX}${id}-` });
  await del([`${CARD_PREFIX}${id}.json`, ...imgs.blobs.map((b) => b.pathname)]);
  cardCache.delete(`${CARD_PREFIX}${id}.json`);
}

function notConfigured(res: Res) {
  res.status(503).json({ error: 'Central history is not set up (BLOB_READ_WRITE_TOKEN is missing).' });
}

export function registerHistoryRoutes(app: Express) {
  app.get('/api/history', async (_req: Req, res: Res) => {
    if (!configured()) return notConfigured(res);
    try {
      res.set('Cache-Control', 'no-store').json({ cards: await listCards() });
    } catch (err) {
      res.status(502).json({ error: err instanceof Error ? err.message : 'Could not read history.' });
    }
  });

  app.post('/api/history', async (req: Req, res: Res) => {
    if (!configured()) return notConfigured(res);
    const card = req.body as StoredCard | undefined;
    if (!card || typeof card.id !== 'string' || !ID_RE.test(card.id) || typeof card.name !== 'string') {
      res.status(400).json({ error: 'A card with an id and a name is required.' });
      return;
    }
    if (typeof card.createdAt !== 'number') card.createdAt = Date.now();
    try {
      res.json({ card: await saveCard(card) });
    } catch (err) {
      res.status(502).json({ error: err instanceof Error ? err.message : 'Could not save the card.' });
    }
  });

  app.delete('/api/history/:id', async (req: Req, res: Res) => {
    if (!configured()) return notConfigured(res);
    const pin = process.env.STAFF_PIN?.trim();
    if (!pin) {
      res.status(503).json({ error: 'Deleting is off: set STAFF_PIN in the Vercel project settings.' });
      return;
    }
    if (req.get('x-staff-pin') !== pin) {
      res.status(401).json({ error: 'Wrong staff PIN.' });
      return;
    }
    const id = String(req.params.id);
    if (!ID_RE.test(id)) {
      res.status(400).json({ error: 'Bad card id.' });
      return;
    }
    try {
      await deleteCard(id);
      res.json({ ok: true });
    } catch (err) {
      res.status(502).json({ error: err instanceof Error ? err.message : 'Could not delete the card.' });
    }
  });

  app.get('/api/history/image', async (req: Req, res: Res) => {
    if (!configured()) return notConfigured(res);
    const p = String(req.query.p ?? '');
    if (!p.startsWith(IMG_PREFIX) || p.includes('..')) {
      res.status(400).end();
      return;
    }
    try {
      const result = await get(p, { access: 'private' });
      if (!result || !result.stream) {
        res.status(404).end();
        return;
      }
      res.set('Content-Type', result.blob.contentType ?? 'application/octet-stream');
      // URLs carry a version (?v=), so the browser and CDN can keep them for good.
      res.set('Cache-Control', 'public, max-age=31536000, immutable');
      Readable.fromWeb(result.stream as import('node:stream/web').ReadableStream).pipe(res);
    } catch {
      res.status(502).end();
    }
  });
}
