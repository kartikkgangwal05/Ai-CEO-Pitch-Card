# Card details to a Google Sheet

Every card saved to History (booth, Guest card, Create Card, edits) is copied as one row to a Google Sheet:
Created, Member No, Name, Specialisation, Visitor Type, Position, Card Title, Strength, Weakness, Hobby.
An edited card updates its own row.

## One-time setup (in the Google account that should own the sheet)

1. Create a new Google Sheet, e.g. "DYPBSAICoE Power Cards".
2. Extensions > Apps Script. Replace the code with `docs/google-sheet-apps-script.js`.
3. Change `SECRET = 'change-me'` to a long random word. Save.
4. Deploy > New deployment > type **Web app**. Execute as: **Me**. Who has access: **Anyone**. Deploy, allow access,
   and copy the **Web app URL**.
5. In Vercel > dypaicoe-power-cards > Settings > Environment Variables (Production), add:
   - `SHEETS_WEBHOOK_URL` = the Web app URL
   - `SHEETS_SECRET` = the same secret word
6. Redeploy (`vercel deploy --prod`).
7. Open the app > History > **Sync Google Sheet** once, to copy the cards made before the sheet was connected.

History also has an **Excel** button that downloads all card details as a .csv file that opens in Excel.
