// Sends each saved card's details (name, specialisation, ...) to a Google Sheet.
// The sheet runs a small Apps Script web app (docs/google-sheet-apps-script.js); its URL goes in the
// SHEETS_WEBHOOK_URL environment variable, and SHEETS_SECRET (optional) must match the script's secret.

type Card = Record<string, unknown>;

export function sheetConfigured(): boolean {
  return Boolean(process.env.SHEETS_WEBHOOK_URL?.trim());
}

const str = (v: unknown) => (typeof v === 'string' ? v.trim() : typeof v === 'number' ? String(v) : '');

/** One sheet row per card. The script updates the row with the same Card ID, so edits do not duplicate. */
export function sheetRow(card: Card) {
  const typed = str(card.foundingMemberNo).replace(/^(no\.?|#)\s*/i, '');
  const serial = typeof card.cardSerial === 'number' && card.cardSerial > 0 ? String(card.cardSerial).padStart(3, '0') : '';
  const created = typeof card.createdAt === 'number' ? new Date(card.createdAt) : new Date();
  return {
    id: str(card.id),
    created: created.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
    memberNo: typed || serial,
    name: str(card.name),
    specialisation: str(card.specialisation),
    visitorType: str(card.visitorType),
    position: str(card.currentPosition),
    title: str(card.title),
    strength: str(card.strength1),
    weakness: str(card.weakness),
    hobby: str(card.hobby),
  };
}

/** Posts rows to the sheet. Never throws; returns false when it could not be sent. */
export async function sendToSheet(cards: Card[]): Promise<boolean> {
  const url = process.env.SHEETS_WEBHOOK_URL?.trim();
  if (!url || cards.length === 0) return false;
  try {
    const res = await fetch(url, {
      method: 'POST',
      // text/plain keeps Apps Script happy (no preflight); the body is JSON.
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ secret: process.env.SHEETS_SECRET?.trim() ?? '', rows: cards.map(sheetRow) }),
      redirect: 'follow',
      signal: AbortSignal.timeout(8000),
    });
    // The script answers {ok:false} (with HTTP 200) when the secret does not match.
    const reply = (await res.json().catch(() => null)) as { ok?: boolean } | null;
    return res.ok && reply?.ok === true;
  } catch {
    return false;
  }
}
