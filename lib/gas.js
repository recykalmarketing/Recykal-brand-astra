// Runs the app's server code (app/Code.gs, written for Google Apps Script) on Node, unchanged.
// Each Apps Script service Code.gs uses gets a small stand-in here: the spreadsheet is the store in store.js,
// the signed-in user comes from the request, email goes out through mailer.js, and so on.
// Code.gs is synchronous, so one call runs start to finish before the next one starts.
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const TZ = "Asia/Kolkata";

function formatDate(d, tz, fmt) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-GB", { timeZone: tz || TZ, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" })
    .formatToParts(new Date(d)).map((p) => [p.type, p.value]));
  return String(fmt).replace(/yyyy|MM|dd|HH|mm|ss/g, (t) => ({ yyyy: parts.year, MM: parts.month, dd: parts.day, HH: parts.hour, mm: parts.minute, ss: parts.second })[t]);
}

function loadApp({ store, mailer, baseUrl }) {
  const S = store.state;
  const ctx = vm.createContext({ console });
  const IJSON = vm.runInContext("JSON", ctx);         // the sandbox's own JSON, so values handed to Code.gs are its own objects
  let user = "";

  // ---- SpreadsheetApp: one workbook whose sheets live in the store ----
  function Range(name, r, c, nr, nc) {
    const rows = () => S.sheets[name].rows;
    this.getValues = () => { const out = []; for (let i = 0; i < nr; i++) { const row = rows()[r - 1 + i] || []; const o = []; for (let j = 0; j < nc; j++) o.push(row[c - 1 + j] ?? ""); out.push(o); } return IJSON.parse(JSON.stringify(out)); };
    this.setValues = (vals) => { vals.forEach((v, i) => { const idx = r - 1 + i; rows()[idx] = rows()[idx] || []; v.forEach((x, j) => { rows()[idx][c - 1 + j] = x; }); }); store.markDirty("sheet:" + name); return this; };
    this.setFontWeight = () => this; this.setNumberFormat = () => this;
  }
  function Sheet(name) {
    this.getName = () => name;
    this.setName = (n) => { S.sheets[n] = S.sheets[name]; delete S.sheets[name]; store.markDirty("sheet:" + name); name = n; store.markDirty("sheet:" + n); return this; };
    this.getLastRow = () => { const rows = S.sheets[name].rows; let n = rows.length; while (n > 0 && !(rows[n - 1] || []).some((x) => x !== "" && x != null)) n--; return n; };
    this.getMaxRows = () => Math.max(1000, S.sheets[name].rows.length);
    this.getRange = (r, c, nr, nc) => new Range(name, r, c, nr || 1, nc || 1);
    this.deleteRow = (r) => { S.sheets[name].rows.splice(r - 1, 1); store.markDirty("sheet:" + name); };
    this.setFrozenRows = () => this;
  }
  const book = {
    getId: () => "brand-astra",
    getUrl: () => baseUrl + "/admin/backup",          // admins download a full backup instead of opening a sheet
    getSheets: () => Object.keys(S.sheets).map((n) => new Sheet(n)),
    insertSheet: (n) => { S.sheets[n] = { rows: [] }; store.markDirty("sheet:" + n); return new Sheet(n); },
    getSheetByName: (n) => (S.sheets[n] ? new Sheet(n) : null),
  };
  const cache = new Map();
  const services = {
    SpreadsheetApp: { create: () => { if (!Object.keys(S.sheets).length) book.insertSheet("Sheet1"); return book; }, openById: () => book },
    PropertiesService: { getScriptProperties: () => ({ getProperty: (k) => (k in S.props ? S.props[k] : null), setProperty: (k, v) => { S.props[k] = String(v); store.markDirty("props"); } }) },
    Session: { getActiveUser: () => ({ getEmail: () => user }), getScriptTimeZone: () => TZ },
    LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
    CacheService: { getScriptCache: () => ({
      get: (k) => { const e = cache.get(k); return e && e.exp > Date.now() ? e.v : null; },
      put: (k, v, ttl) => { cache.set(k, { v: String(v), exp: Date.now() + (ttl || 600) * 1000 }); } }) },
    MailApp: { sendEmail: (o) => mailer.send(o) },
    ScriptApp: { getService: () => ({ getUrl: () => baseUrl }), getProjectTriggers: () => [], deleteTrigger() {},
      newTrigger: () => { const t = { timeBased: () => t, everyDays: () => t, everyMinutes: () => t, atHour: () => t, create: () => t }; return t; } },
    Utilities: { formatDate, sleep() {},
      base64Encode: (b) => Buffer.from(b).toString("base64"), base64Decode: (s) => [...Buffer.from(String(s), "base64")] },
    MimeType: { PDF: "application/pdf", GOOGLE_SLIDES: "application/vnd.google-apps.presentation", GOOGLE_DOCS: "application/vnd.google-apps.document" },
    DriveApp: { Access: {}, Permission: {} },        // Drive is reached from server.js (fileForQc, uploadForQc), not from Code.gs
  };
  Object.assign(ctx, services);
  vm.runInContext(fs.readFileSync(path.join(__dirname, "..", "app", "Code.gs"), "utf8"), ctx, { filename: "Code.gs" });
  // Uploads are served by this server, so its own /files/ links count as file links too.
  const googleLink = ctx.isGoogleLink_;
  ctx.isGoogleLink_ = (v) => googleLink(v) || String(v || "").startsWith(baseUrl + "/files/");

  return {
    /** Call a function of Code.gs as `email`. Arguments and result are plain JSON. */
    call(fn, args, email) {
      user = email || "";
      try { return JSON.parse(JSON.stringify(ctx[fn](...IJSON.parse(JSON.stringify(args || []))) ?? null)); }
      finally { user = ""; }
    },
    has: (fn) => typeof ctx[fn] === "function",
    config: () => JSON.parse(JSON.stringify(vm.runInContext("CONFIG", ctx))),
    formatDate,
  };
}

module.exports = { loadApp, formatDate };
