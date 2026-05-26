# People's Culture · Sit-down Dinner RSVP — Production Build

Mobile-first RSVP web app for the People's Culture sit-down dinner. React + Vite + TypeScript, with a Google Sheets backend via Apps Script.

## Stack

- **React 18.3** + **TypeScript** + **Vite 5**
- **react-hook-form** + **zod** + **@hookform/resolvers** for form state and validation
- **Google Apps Script** Web App backing a Google Sheet (no Node server, no DB to host)
- Design system: People's Culture (Anakotmai typeface, orange brand) — tokens inlined in `src/styles/global.css`

```
rsvp/production/
├── apps-script.gs       ← paste into Apps Script editor (bound to the sheet)
├── .env.example
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── public/
│   ├── assets/          ← brand logo PNGs
│   └── fonts/           ← Anakotmai .woff/.woff2
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── components/
    │   ├── InvitationHero.tsx
    │   ├── SeatCounter.tsx
    │   ├── RSVPForm.tsx
    │   └── Confirmation.tsx
    ├── lib/
    │   ├── api.ts       ← thin client over the Apps Script endpoint
    │   └── schema.ts    ← shared zod schemas + option lists
    └── styles/
        └── global.css   ← design tokens + all component CSS
```

---

## Setup — full path, ~15 minutes

### Step 1 · Create the Google Sheet

1. Go to <https://sheets.new> and create a new spreadsheet. Name it whatever (e.g. `PC Dinner RSVPs`).
2. Rename the default tab to **`Responses`**.
3. Don't add headers manually — the Apps Script does that.

### Step 2 · Paste the Apps Script

1. In the sheet: **Extensions → Apps Script**. A script editor opens.
2. Delete the placeholder `Code.gs` content and paste the entire contents of [`apps-script.gs`](./apps-script.gs).
3. Save (⌘S / Ctrl-S).
4. In the function dropdown at the top, pick **`ensureHeaders`** and click **Run**.
   - On first run, Apps Script will ask for permission (it needs read/write access to *this* spreadsheet only). Accept.
5. Switch back to the sheet — row 1 of `Responses` should now have headers.
6. Optional: in the script editor, run **`createSummarySheet`** to add a `Summary` tab with live count formulas (per-type, per-dietary-restriction).

### Step 3 · Deploy the Web App

1. In the Apps Script editor: **Deploy → New deployment**.
2. Click the gear icon and choose **Web app**.
3. Settings:
   - **Description:** `RSVP API v1`
   - **Execute as:** *Me (your Google account)*
   - **Who has access:** *Anyone* — required for the public RSVP page to call it without auth.
4. Click **Deploy**. Authorize again if prompted.
5. Copy the **Web app URL** (ends in `/exec`). This is your `VITE_RSVP_API_URL`.

> When you change `apps-script.gs`, you must **Deploy → Manage deployments → Edit (pencil) → New version → Deploy** to push it. Bare saves don't update the live `/exec`.

### Step 4 · Run the frontend

```bash
cd rsvp/production
cp .env.example .env
# edit .env, paste your /exec URL into VITE_RSVP_API_URL
npm install
npm run dev
```

Open <http://localhost:5173>. The seat counter should fetch live from your sheet. Submit a test row — refresh the sheet, you should see a new entry with `Status = Confirmed` and a `PC-DIN-XXXX` reference.

### Step 5 · Deploy the frontend

The app is a static SPA — drop it on Vercel, Netlify, Cloudflare Pages, or any static host:

```bash
npm run build
# uploads ./dist
```

**Vercel (one-click):** push this folder to a Git repo, import in Vercel, set Build Command `npm run build`, Output Directory `dist`. Add `VITE_RSVP_API_URL` (and optionally `VITE_RSVP_API_TOKEN`) under Project Settings → Environment Variables.

**Netlify:** same idea — Build command `npm run build`, Publish directory `dist`, env vars in Site Settings → Environment.

---

## API reference (Apps Script `/exec`)

### `GET ?action=count`

Returns current seat counts. Cached client-side for 10 seconds and re-polled every 30 seconds while the form is visible.

```json
{ "confirmed": 12, "waitlist": 0, "capacity": 20 }
```

### `POST` (body: `text/plain` JSON)

```json
{
  "action": "submit",
  "name": "...",
  "org": "...",
  "type": "mp" | "staff" | "guest",
  "phone": "08x-xxx-xxxx",
  "diet": "ไม่มีข้อจำกัด",
  "dietOther": ""
}
```

Status is decided **server-side** inside a `LockService` lock (race-condition-safe). If `confirmed < CAPACITY`, you get `"Confirmed"`; otherwise `"Waitlist"`.

```json
{
  "ok": true,
  "status": "Confirmed",
  "reference": "PC-DIN-0042",
  "position": 13
}
```

> Note: we send the POST body as `Content-Type: text/plain` deliberately. Google Apps Script Web Apps don't respond correctly to CORS preflights; `text/plain` avoids triggering one.

---

## Sheet schema

The `Responses` tab has these columns (row 1 is headers, set by `ensureHeaders`):

| Col | Header | Notes |
|-----|--------|-------|
| A | Timestamp | Set server-side at submit |
| B | ชื่อ | Required |
| C | สังกัด | Required |
| D | ประเภท | One of `สส.` / `ทีมงาน` / `แขกผู้มีเกียรติ` |
| E | เบอร์โทร | Thai phone, validated client-side via zod |
| F | ข้อจำกัดอาหาร | Comma-joined labels + `dietOther` if "other" was selected |
| G | Status | `Confirmed` or `Waitlist` — decided server-side |
| H | ลำดับที่ | 1-indexed position **within** its Status group |
| I | รหัสอ้างอิง | `PC-DIN-XXXX` (last 4 digits of total submissions) |

The `Summary` tab built by `createSummarySheet` shows:

- Total / Confirmed / Remaining / Waitlist
- Confirmed count broken down by attendee type
- Dietary restrictions tallied — useful for telling the restaurant how many vegan plates, allergy substitutions, etc.

Admins just open the sheet — no separate admin UI.

---

## Editing capacity

Change `CAPACITY` (top of `apps-script.gs`). Re-deploy a new version. The frontend reads capacity from the API, so no frontend redeploy needed.

## Optional: lock the endpoint with a token

If you don't want random people POSTing junk:

1. In `apps-script.gs`, set `SECRET_TOKEN` to a long random string.
2. Re-deploy a new version.
3. Add the same value to `.env` as `VITE_RSVP_API_TOKEN`.
4. Rebuild the frontend (`npm run build`).

Caveat: anyone who views the deployed SPA can extract the token from the JS bundle. It's a **friction barrier**, not real auth. For real protection you'd front the Apps Script with a real backend or use signed timestamps.

---

## Caveats

- **Apps Script rate limits.** Free tier allows ~20k script-runtime-seconds/day and 30 simultaneous executions. For a 20-seat dinner this is wildly sufficient. For a 10k-person event it isn't — move to a real backend.
- **CORS quirks.** We send POSTs as `text/plain` to avoid preflight; the Apps Script reads `e.postData.contents` as a JSON string. If you change Content-Type, you'll trip CORS preflight which Apps Script doesn't handle.
- **iOS Safari font cache.** First load may briefly flash system-font before Anakotmai loads. `font-display: swap` keeps text visible during the swap.
- **No email/SMS confirmation.** The reference code is shown on-screen only. If you want auto-emails, the Apps Script `appendRow` is a fine place to also call `MailApp.sendEmail` — left out by default to avoid quota concerns.
