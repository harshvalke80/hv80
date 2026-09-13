/**
 * Harsh & Sneha — RSVP backend (Google Apps Script, bound to a Google Sheet)
 *
 * Endpoints (all on the single /exec Web App URL):
 *   POST  name, attending, guests, guestNames      -> appends an RSVP row
 *   POST  action=list, key=<HOST_KEY>              -> returns all RSVPs + summary (host only)
 *   GET   (no params)                              -> health check
 *
 * Setup: see SETUP.md in the project folder.
 */

const SHEET_NAME = 'RSVPs';
const HEADERS = ['Timestamp', 'Name', 'Attending', 'Guests', 'Guest Names'];
const ATTENDING = 'Joyfully attending';
const DECLINED = "Sadly can't make it";
const MAX_GUESTS = 20;

function doGet() {
  return json_({ ok: true, service: 'H&S RSVP' });
}

function doPost(e) {
  const p = (e && e.parameter) || {};
  try {
    if (p.action === 'list') return json_(listRsvps_(p.key));
    return json_(addRsvp_(p));
  } catch (err) {
    return json_({ ok: false, error: String((err && err.message) || err) });
  }
}

function addRsvp_(p) {
  const name = clean_(p.name, 100);
  if (!name) throw new Error('Name is required.');

  const attending = p.attending === DECLINED ? DECLINED : ATTENDING;
  let guests = parseInt(p.guests, 10);
  if (attending === DECLINED) guests = 0;
  else if (!(guests >= 1)) guests = 1;
  guests = Math.min(guests, MAX_GUESTS);

  const guestNames = clean_(p.guestNames, 2000);

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    getSheet_().appendRow([new Date(), name, attending, guests, guestNames]);
  } finally {
    lock.releaseLock();
  }
  return { ok: true };
}

function listRsvps_(key) {
  const hostKey = PropertiesService.getScriptProperties().getProperty('HOST_KEY');
  if (!hostKey) throw new Error('HOST_KEY script property is not set.');
  if (key !== hostKey) throw new Error('Invalid host key.');

  const values = getSheet_().getDataRange().getValues().slice(1);
  const rsvps = values.map(r => ({
    timestamp: r[0] instanceof Date ? r[0].toISOString() : String(r[0]),
    name: r[1],
    attending: r[2],
    guests: Number(r[3]) || 0,
    guestNames: r[4]
  }));

  const summary = {
    responses: rsvps.length,
    attending: rsvps.filter(r => r.attending === ATTENDING).length,
    declined: rsvps.filter(r => r.attending === DECLINED).length,
    totalGuests: rsvps.reduce((n, r) => n + (r.attending === ATTENDING ? r.guests : 0), 0)
  };
  return { ok: true, summary: summary, rsvps: rsvps.reverse() };
}

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

// Trim, cap length, and neutralise spreadsheet formula injection (=, +, -, @).
function clean_(v, max) {
  let s = String(v == null ? '' : v).trim().slice(0, max);
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return s;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
