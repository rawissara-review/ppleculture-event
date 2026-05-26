/**
 * People's Culture — Sit-down Dinner RSVP
 * Google Apps Script backend (Web App endpoint)
 *
 * This script is bound to the RSVP Google Sheet. Deploy it as a Web App
 * (Deploy → New deployment → Type: Web app · Execute as: Me · Who has access:
 * Anyone). Copy the resulting /exec URL into VITE_RSVP_API_URL.
 *
 * Sheet "Responses" columns (header row first row):
 *   A: Timestamp
 *   B: ชื่อ
 *   C: สังกัด
 *   D: ประเภท
 *   E: เบอร์โทร
 *   F: ข้อจำกัดอาหาร
 *   G: Status         (Confirmed | Waitlist)
 *   H: ลำดับที่         (1-indexed within Status group)
 *   I: รหัสอ้างอิง
 *
 * Sheet "Summary" is populated via createSummarySheet() — run that once.
 */

// ────────────────────────────────────────────────────────────────────────────
// CONFIG
// ────────────────────────────────────────────────────────────────────────────

/** Total seats. Anyone beyond this goes onto the waitlist. */
const CAPACITY = 20;

/** Sheet tab names. Adjust if you renamed them. */
const RESP_SHEET    = 'Responses';
const SUMMARY_SHEET = 'Summary';

/**
 * Optional shared secret. If set here, all requests must include
 * ?token=THE_SAME_VALUE (GET) or {"token": "THE_SAME_VALUE"} (POST).
 * Leave as empty string for an open endpoint.
 */
const SECRET_TOKEN = '';

// ────────────────────────────────────────────────────────────────────────────
// REQUEST HANDLERS
// ────────────────────────────────────────────────────────────────────────────

/** GET handler — returns seat counts. */
function doGet(e) {
  try {
    if (!checkToken_(e.parameter.token)) return json_({ error: 'unauthorized' }, 401);
    const action = (e.parameter.action || 'count').toLowerCase();
    if (action === 'count') return json_(getCounts_());
    return json_({ error: 'unknown action' }, 400);
  } catch (err) {
    return json_({ error: String(err && err.message || err) }, 500);
  }
}

/** POST handler — accepts a JSON-stringified body, appends one row. */
function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const raw = e.postData && e.postData.contents;
    if (!raw) return json_({ ok: false, error: 'empty body' }, 400);
    const body = JSON.parse(raw);

    if (!checkToken_(body.token)) return json_({ ok: false, error: 'unauthorized' }, 401);

    const required = ['name', 'org', 'type', 'phone'];
    for (const k of required) {
      if (!body[k] || String(body[k]).trim() === '') {
        return json_({ ok: false, error: 'missing ' + k }, 400);
      }
    }

    const sheet = SpreadsheetApp.getActive().getSheetByName(RESP_SHEET);
    if (!sheet) return json_({ ok: false, error: 'sheet not found' }, 500);

    // Recompute confirmed count atomically (inside the lock)
    const counts = getCounts_();
    const status = counts.confirmed < CAPACITY ? 'Confirmed' : 'Waitlist';

    // Position within the Confirmed/Waitlist group (1-indexed)
    const position = status === 'Confirmed' ? counts.confirmed + 1 : counts.waitlist + 1;

    // Friendly reference, e.g. PC-DIN-0142
    const reference = 'PC-DIN-' + String(1000 + (counts.confirmed + counts.waitlist + 1)).slice(-4);

    const diet = body.diet || '';
    const dietOther = body.dietOther ? (' / ' + body.dietOther) : '';

    sheet.appendRow([
      new Date(),                       // A · Timestamp
      String(body.name).trim(),         // B · ชื่อ
      String(body.org).trim(),          // C · สังกัด
      labelForType_(body.type),         // D · ประเภท
      String(body.phone).trim(),        // E · เบอร์โทร
      diet + dietOther,                 // F · ข้อจำกัดอาหาร
      status,                           // G · Status
      position,                         // H · ลำดับที่
      reference,                        // I · รหัสอ้างอิง
    ]);

    return json_({ ok: true, status: status, reference: reference, position: position });
  } catch (err) {
    return json_({ ok: false, error: String(err && err.message || err) }, 500);
  } finally {
    lock.releaseLock();
  }
}

// ────────────────────────────────────────────────────────────────────────────
// HELPERS
// ────────────────────────────────────────────────────────────────────────────

function getCounts_() {
  const sheet = SpreadsheetApp.getActive().getSheetByName(RESP_SHEET);
  if (!sheet) return { confirmed: 0, waitlist: 0, capacity: CAPACITY };
  const last = sheet.getLastRow();
  if (last < 2) return { confirmed: 0, waitlist: 0, capacity: CAPACITY };

  const values = sheet.getRange(2, 7, last - 1, 1).getValues(); // column G (Status)
  let confirmed = 0, waitlist = 0;
  for (let i = 0; i < values.length; i++) {
    const v = String(values[i][0] || '').trim();
    if (v === 'Confirmed') confirmed++;
    else if (v === 'Waitlist') waitlist++;
  }
  return { confirmed: confirmed, waitlist: waitlist, capacity: CAPACITY };
}

function labelForType_(id) {
  switch (String(id)) {
    case 'mp':    return 'สส.';
    case 'staff': return 'ทีมงาน';
    case 'guest': return 'แขกผู้มีเกียรติ';
    default:      return String(id || '');
  }
}

function checkToken_(provided) {
  if (!SECRET_TOKEN) return true;
  return String(provided || '') === SECRET_TOKEN;
}

function json_(obj, statusCode) {
  // ContentService doesn't expose status codes for Web Apps — clients should
  // check `ok` / `error` in the body. statusCode is informational.
  const out = ContentService.createTextOutput(JSON.stringify(obj));
  out.setMimeType(ContentService.MimeType.JSON);
  return out;
}

// ────────────────────────────────────────────────────────────────────────────
// ONE-TIME SETUP — run from the Apps Script editor (Run > createSummarySheet)
// ────────────────────────────────────────────────────────────────────────────

/**
 * Creates (or rebuilds) the "Summary" tab with live formulas.
 * Safe to re-run.
 */
function createSummarySheet() {
  const ss = SpreadsheetApp.getActive();
  let sheet = ss.getSheetByName(SUMMARY_SHEET);
  if (sheet) ss.deleteSheet(sheet);
  sheet = ss.insertSheet(SUMMARY_SHEET);

  const R = "'" + RESP_SHEET + "'";

  sheet.getRange('A1').setValue('Sit-down Dinner · สรุปการลงทะเบียน')
    .setFontWeight('bold').setFontSize(16);

  // Totals
  sheet.getRange('A3').setValue('ที่นั่งทั้งหมด').setFontWeight('bold');
  sheet.getRange('B3').setValue(CAPACITY);

  sheet.getRange('A4').setValue('ยืนยันแล้ว (Confirmed)').setFontWeight('bold');
  sheet.getRange('B4').setFormula('=COUNTIF(' + R + '!G2:G, "Confirmed")');

  sheet.getRange('A5').setValue('คงเหลือ').setFontWeight('bold');
  sheet.getRange('B5').setFormula('=MAX(0, B3-B4)');

  sheet.getRange('A6').setValue('รายการสำรอง (Waitlist)').setFontWeight('bold');
  sheet.getRange('B6').setFormula('=COUNTIF(' + R + '!G2:G, "Waitlist")');

  // By attendee type — confirmed only
  sheet.getRange('A8').setValue('สรุปตามประเภท (เฉพาะ Confirmed)').setFontWeight('bold');
  sheet.getRange('A9:B9').setValues([['ประเภท', 'จำนวน']]).setFontWeight('bold');
  sheet.getRange('A10').setValue('สส.');
  sheet.getRange('B10').setFormula('=COUNTIFS(' + R + '!D2:D, "สส.", ' + R + '!G2:G, "Confirmed")');
  sheet.getRange('A11').setValue('ทีมงาน');
  sheet.getRange('B11').setFormula('=COUNTIFS(' + R + '!D2:D, "ทีมงาน", ' + R + '!G2:G, "Confirmed")');
  sheet.getRange('A12').setValue('แขกผู้มีเกียรติ');
  sheet.getRange('B12').setFormula('=COUNTIFS(' + R + '!D2:D, "แขกผู้มีเกียรติ", ' + R + '!G2:G, "Confirmed")');

  // Dietary breakdown — counts how many Confirmed mentioned each constraint
  sheet.getRange('A14').setValue('ข้อจำกัดด้านอาหาร (Confirmed)').setFontWeight('bold');
  sheet.getRange('A15:B15').setValues([['ข้อจำกัด', 'จำนวน']]).setFontWeight('bold');
  const diets = [
    ['ไม่มีข้อจำกัด',         'ไม่มีข้อจำกัด'],
    ['มังสวิรัติ / วีแกน',    'มังสวิรัติ'],
    ['แพ้อาหารทะเล',        'อาหารทะเล'],
    ['แพ้ถั่ว',              'ถั่ว'],
    ['อื่น ๆ (โปรดระบุ)',     'อื่น ๆ'],
  ];
  for (let i = 0; i < diets.length; i++) {
    sheet.getRange('A' + (16 + i)).setValue(diets[i][0]);
    sheet.getRange('B' + (16 + i)).setFormula(
      '=COUNTIFS(' + R + '!F2:F, "*' + diets[i][1] + '*", ' + R + '!G2:G, "Confirmed")'
    );
  }

  sheet.setColumnWidth(1, 240);
  sheet.setColumnWidth(2, 120);
  SpreadsheetApp.flush();
}

/** Convenience: run once to add headers to the Responses sheet. */
function ensureHeaders() {
  const sheet = SpreadsheetApp.getActive().getSheetByName(RESP_SHEET) ||
                SpreadsheetApp.getActive().insertSheet(RESP_SHEET);
  const headers = [
    'Timestamp', 'ชื่อ', 'สังกัด', 'ประเภท', 'เบอร์โทร',
    'ข้อจำกัดอาหาร', 'Status', 'ลำดับที่', 'รหัสอ้างอิง',
  ];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');
  sheet.setFrozenRows(1);
}
