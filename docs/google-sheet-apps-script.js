// Power Card Studio -> Google Sheet
// Paste this into the sheet's Extensions > Apps Script, set SECRET, then Deploy > New deployment > Web app
// (Execute as: Me, Who has access: Anyone). Put the web app URL in Vercel as SHEETS_WEBHOOK_URL and the
// same secret as SHEETS_SECRET. Each card is one row; an edited card updates its own row (matched by Card ID).

const SECRET = 'change-me';
const SHEET_NAME = 'Cards';
const HEADERS = ['Card ID', 'Created', 'Member No', 'Name', 'Specialisation', 'Visitor Type', 'Position', 'Card Title', 'Strength', 'Weakness', 'Hobby'];
const KEYS = ['id', 'created', 'memberNo', 'name', 'specialisation', 'visitorType', 'position', 'title', 'strength', 'weakness', 'hobby'];

function doPost(e) {
  const body = JSON.parse(e.postData.contents || '{}');
  if (SECRET && body.secret !== SECRET) return json({ ok: false, error: 'bad secret' });

  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(HEADERS);
      sheet.setFrozenRows(1);
      sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
    }
    const last = sheet.getLastRow();
    const ids = last > 1 ? sheet.getRange(2, 1, last - 1, 1).getValues().map((r) => String(r[0])) : [];
    (body.rows || []).forEach((row) => {
      const values = KEYS.map((k) => (row[k] == null ? '' : String(row[k])));
      const at = ids.indexOf(values[0]);
      if (at >= 0) {
        sheet.getRange(at + 2, 1, 1, values.length).setValues([values]);
      } else {
        sheet.appendRow(values);
        ids.push(values[0]);
      }
    });
    return json({ ok: true });
  } finally {
    lock.releaseLock();
  }
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
