/**
 * Brand Astra — Recykal's brand review portal, as a Google Apps Script web app.
 *
 * Everyone signs in with their @recykal.com Google account (Google handles the login), then picks
 * Employee or Marketing team on the sign-in page. Only people on the marketing team (the owners below,
 * plus anyone the team adds under Team & access) get the marketing views; the server checks every call.
 * Data lives in a Google Sheet owned by the account that deploys this script.
 * Every request is checked here on the server: employees only ever receive and change
 * their own submissions and conversations; requests, reviews, the Showcase and template
 * links can only be changed by the admins below.
 */

// ---------- Settings: edit these ----------
const CONFIG = {
  DOMAIN: "recykal.com",
  // Marketing team owners: always on the marketing team (review queue, every submission, reports, requests,
  // Team & access). More members can be added in the app under Team & access; only owners are listed here.
  ADMINS: [
    "marketing@recykal.com",
    "vinod.mylavarapu@recykal.com",
    "alokesh.sinha@recykal.com",
    "ramakrishna.ivaturi@recykal.com",
    "ayesha.ishrat@recykal.com",
    "chetan.baregar@recykal.com",
    "shreyas.devershetty@recykal.com",
  ],
  APP_NAME: "Brand Astra",
  // Brand Astra check: runs in each person's browser on the file itself. No AI, no API key, no running cost.
  APPROVE_AT: 85,                  // QC score at or above this passes the automatic check and goes to the brand team for the eye check
  CHANGES_AT: 60,                  // at or above this (but below APPROVE_AT) → changes requested; below → not approved
  // Email alerts (sent from the deploying account). Set any to false to turn it off.
  EMAIL_ADMINS_ON_SUBMIT: false,   // new or revised submission → all admins (off: the morning digest lists them)
  EMAIL_EMPLOYEE_ON_REVIEW: true,  // decision made → the employee
  EMAIL_ON_COMMENT: true,          // new message in a conversation → the other side
  DAILY_DIGEST_HOUR: 9,            // admins get a queue summary every morning (0–23, sheet time zone)
  EMAIL_ON_ASSIGN: true,           // a request assigned to specific people or teams → those people
  REMIND_DAYS_BEFORE: [2, 0],      // deadline reminders to assignees who haven't submitted (sent with the morning digest)
  SLA_WORKING_DAYS: 2,
};

// ---------- Web app entry ----------
function doGet() {
  return HtmlService.createHtmlOutputFromFile("Index")
    .setTitle(CONFIG.APP_NAME)
    .addMetaTag("viewport", "width=device-width, initial-scale=1, viewport-fit=cover");
}

// ---------- Sheet storage ----------
const SHEETS = {
  Requests: ["id", "title", "type", "deadline", "templateUrl", "brief", "closed", "createdBy", "updatedAt", "data"],
  Submissions: ["id", "email", "name", "team", "title", "type", "format", "channel", "audience", "neededBy", "link", "description", "request", "submittedAt", "version", "precheckScore", "data"],
  Reviews: ["submissionId", "email", "title", "status", "qcScore", "logo", "colour", "type", "layout", "imagery", "copy", "comment", "reviewer", "reviewedAt", "data"],
  Comments: ["submissionId", "email", "messages", "lastFrom", "lastAt", "data"],
  Showcase: ["submissionId", "title", "type", "team", "link", "qcScore", "note", "approvedAt", "data"],
  Settings: ["key", "value", "updatedAt", "data"],
  People: ["email", "name", "team", "firstSeen", "lastSeen", "data"],
};

function book_() {
  const props = PropertiesService.getScriptProperties();
  const id = props.getProperty("SHEET_ID");
  if (id) return SpreadsheetApp.openById(id);
  const ss = SpreadsheetApp.create(CONFIG.APP_NAME + " — Data");
  props.setProperty("SHEET_ID", ss.getId());
  ss.getSheets()[0].setName("Requests");
  initSheet_(ss.getSheetByName("Requests"), "Requests");
  return ss;
}
function initSheet_(sh, name) {
  sh.getRange(1, 1, 1, SHEETS[name].length).setValues([SHEETS[name]]).setFontWeight("bold");
  sh.setFrozenRows(1);
  sh.getRange(1, 1, sh.getMaxRows(), SHEETS[name].length).setNumberFormat("@");
  return sh;
}
function sheet_(name) {
  const ss = book_();
  return ss.getSheetByName(name) || initSheet_(ss.insertSheet(name), name);
}

/** All rows of a sheet as {row, key, obj} using the JSON in the last column. */
function rows_(name) {
  const sh = sheet_(name);
  const n = sh.getLastRow() - 1;
  if (n < 1) return [];
  const width = SHEETS[name].length;
  return sh.getRange(2, 1, n, width).getValues().map((r, i) => {
    let obj = null;
    try { obj = JSON.parse(r[width - 1] || "null"); } catch (e) { obj = null; }
    return { row: i + 2, key: String(r[0]), obj };
  }).filter((x) => x.obj);
}
function writeRow_(name, rowIndex, values) {
  const sh = sheet_(name);
  const width = SHEETS[name].length;
  const vals = values.map((v) => (v == null ? "" : typeof v === "object" ? JSON.stringify(v) : String(v)));
  if (rowIndex) sh.getRange(rowIndex, 1, 1, width).setValues([vals]);
  else { const r = sh.getLastRow() + 1; sh.getRange(r, 1, 1, width).setNumberFormat("@").setValues([vals]); }
}
function deleteRows_(name, rowIndexes) {
  const sh = sheet_(name);
  rowIndexes.sort((a, b) => b - a).forEach((r) => sh.deleteRow(r));
}

// ---------- Identity ----------
function email_() {
  const email = String(Session.getActiveUser().getEmail() || "").toLowerCase();
  if (!email || !email.endsWith("@" + CONFIG.DOMAIN)) {
    throw new Error("Sign in with your @" + CONFIG.DOMAIN + " Google account to use Brand Astra.");
  }
  return email;
}
// The marketing team: the owners in CONFIG.ADMINS plus the members added in the app (Settings → "marketingTeam").
let TEAM_CACHE_ = null;                                   // one sheet read per call
function owners_() { return CONFIG.ADMINS.map((a) => a.toLowerCase().trim()).filter(Boolean); }
function addedAdmins_() {
  const r = rows_("Settings").filter((x) => x.key === "marketingTeam")[0];
  return r && Array.isArray(r.obj.emails) ? r.obj.emails : [];
}
function admins_() {
  if (!TEAM_CACHE_) TEAM_CACHE_ = owners_().concat(addedAdmins_().filter((e) => owners_().indexOf(e) < 0));
  return TEAM_CACHE_;
}
function isAdmin_(email) { return admins_().indexOf(email) >= 0; }
function teamInfo_() { const o = owners_(); return { owners: o, added: admins_().filter((e) => o.indexOf(e) < 0), domain: CONFIG.DOMAIN }; }

/** Add someone to the marketing team, or move them back to employee. Marketing team only. */
function setMarketing(target, on) {
  const email = email_();
  if (!isAdmin_(email)) throw new Error("Only the marketing team can change who's on it.");
  const t = String(target || "").toLowerCase().trim();
  if (!/^[a-z0-9._%+-]+@[a-z0-9.-]+$/.test(t) || !t.endsWith("@" + CONFIG.DOMAIN)) throw new Error("Use a @" + CONFIG.DOMAIN + " email address.");
  if (!on && owners_().indexOf(t) >= 0) throw new Error("This person is an owner, listed in Code.gs (CONFIG.ADMINS). Remove them there.");
  if (!on && t === email) throw new Error("You can't remove yourself. Ask another member of the marketing team.");
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  let added = false;
  try {
    const row = rows_("Settings").filter((r) => r.key === "marketingTeam")[0];
    let list = row && Array.isArray(row.obj.emails) ? row.obj.emails.slice() : [];
    if (on && list.indexOf(t) < 0 && owners_().indexOf(t) < 0) { list.push(t); added = true; }
    if (!on) list = list.filter((e) => e !== t);
    writeRow_("Settings", row && row.row, ["marketingTeam", list.join(", "), new Date().toISOString(), { emails: list, updatedBy: email }]);
    TEAM_CACHE_ = null;
  } finally { lock.releaseLock(); }
  if (added) sendMail_({ to: t, subject: "You're on the marketing team",
    body: `<p>${esc_(nameOf_(email))} added you to the marketing team in ${CONFIG.APP_NAME}.</p><p>Open the app, choose <b>Marketing team</b> on the sign-in page, and you'll see the review queue, every submission, requests and the compliance reports.</p>` });
  return teamInfo_();
}

/** An employee asks the marketing team for marketing access (at most once a day). */
function requestMarketingAccess() {
  const email = email_();
  if (isAdmin_(email)) return { already: true };
  const cache = CacheService.getScriptCache(); const key = "access:" + email;
  if (cache.get(key)) return { sent: true };
  sendMail_({ to: admins_().join(","), subject: `Marketing access request: ${nameOf_(email)}`,
    body: `<p><b>${esc_(nameOf_(email))}</b> (${esc_(email)}) asked for marketing team access in ${CONFIG.APP_NAME}.</p><p>If they should review work, open the app as the marketing team and add them under <b>Team &amp; access</b>.</p>` });
  cache.put(key, "1", 60 * 60 * 24);
  return { sent: true };
}
function nameFromEmail_(email) {
  return email.split("@")[0].split(/[._-]+/).filter(Boolean).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}
function nameOf_(email) {
  if (email === "ai") return "Brand Astra check";   // "ai": the stored reviewer id of the automatic check
  const p = rows_("People").filter((x) => x.key === email)[0];
  return p ? p.obj.name : nameFromEmail_(email);
}

// ---------- Validation ----------
function str_(v, max) { return String(v == null ? "" : v).slice(0, max); }
function isGoogleLink_(v) { return /^https:\/\/(docs|drive)\.google\.com\//i.test(String(v || "")); }
function isDate_(v) { return /^\d{4}-\d{2}-\d{2}$/.test(String(v || "")); }
function cleanSubmission_(e) {
  if (!e || typeof e !== "object") throw new Error("Invalid submission.");
  if (!str_(e.title, 120).trim()) throw new Error("A title is required.");
  if (!isGoogleLink_(e.link)) throw new Error("Use a Google Slides, Docs or Drive link.");
  const checks = {};
  Object.keys(e.checks || {}).slice(0, 12).forEach((k) => { checks[str_(k, 3)] = !!e.checks[k]; });
  const pre = e.precheck || {};
  return {
    briefId: str_(e.briefId, 60), title: str_(e.title, 120).trim(), kind: str_(e.kind, 40), team: str_(e.team, 60),
    link: str_(e.link, 500), notes: str_(e.notes, 2000), format: str_(e.format, 20), checks: checks, copy: str_(e.copy, 3000),
    channel: str_(e.channel, 60), audience: e.audience === "Internal" ? "Internal" : "External", neededBy: isDate_(e.neededBy) ? e.neededBy : "",
    precheck: { score: Math.max(0, Math.min(100, Number(pre.score) || 0)), issues: (pre.issues || []).slice(0, 12).map((i) => ({ sev: str_(i.sev, 8), quote: str_(i.quote, 120), msg: str_(i.msg, 300) })) },
    submittedAt: str_(e.submittedAt, 40), firstSubmittedAt: str_(e.firstSubmittedAt, 40), version: Math.max(1, Math.min(99, Number(e.version) || 1)),
  };
}
const QC_KEYS = ["logo", "colour", "type", "layout", "imagery", "copy"];
function cleanReview_(r, email) {
  const history = (r.history || []).slice(-20).map((h) => ({ status: str_(h.status, 12), score: Number(h.score) || 0, at: str_(h.at, 40), by: str_(h.by, 120), version: Number(h.version) || 1 }));
  if (r.status === "inreview") return { status: "inreview", at: new Date().toISOString(), by: email, version: Number(r.version) || 1, history: history };
  const qc = {};
  QC_KEYS.forEach((k) => { qc[k] = ["pass", "minor", "fail"].indexOf(r.qc && r.qc[k]) >= 0 ? r.qc[k] : "pass"; });
  if (["approved", "changes", "rejected"].indexOf(r.status) < 0) throw new Error("Invalid review status.");
  // Per-rule verdicts from the rulebook scorecard; the score is recomputed here so it can't be edited by hand.
  const rules = {}; let score = Math.max(0, Math.min(100, Number(r.score) || 0));
  if (r.rules && typeof r.rules === "object") {
    BRAND.rules.forEach((x) => { const v = r.rules[x.id]; rules[x.id] = ["pass", "fail", "na"].indexOf(v) >= 0 ? v : "pass"; });
    const ev = BRAND.evaluate(r.format || "other", Object.keys(rules).reduce((o, k) => { o[k] = { status: rules[k] }; return o; }, {}));
    score = ev.score; QC_KEYS.forEach((k) => { qc[k] = ev.qc[k]; });
  }
  return { status: r.status, qc: qc, rules: r.rules ? rules : undefined, score: score, comment: str_(r.comment, 3000),
    at: new Date().toISOString(), by: email, version: Number(r.version) || 1, history: history };
}

// ---------- API called from the page ----------
function getState() {
  const email = email_();
  const admin = isAdmin_(email);
  const people = {};
  rows_("People").forEach((p) => { people[p.key] = { name: p.obj.name, team: p.obj.team, lastSeen: admin ? p.obj.lastSeen || "" : undefined }; });
  touch_(email);
  const briefs = {};
  rows_("Requests").forEach((r) => { briefs[r.key] = r.obj; });
  const subs = {}, owner = {};
  rows_("Submissions").forEach((r) => {
    const who = r.obj.email; owner[r.key] = who;
    if (!admin && who !== email) return;
    (subs[who] = subs[who] || { items: {} }).items[r.key] = r.obj.entry;
  });
  const reviews = {};
  rows_("Reviews").forEach((r) => {
    const who = owner[r.key]; if (!who) return;
    if (!admin && who !== email) return;
    (reviews[who] = reviews[who] || { items: {} }).items[r.key] = r.obj.review;
  });
  const threads = {};
  rows_("Comments").forEach((r) => {
    const who = owner[r.key]; if (!who) return;
    if (!admin && who !== email) return;
    (threads[who] = threads[who] || { items: {} }).items[r.key] = r.obj.messages;
  });
  const showcase = {};
  rows_("Showcase").forEach((r) => { showcase[r.key] = r.obj; });
  const settings = {};
  rows_("Settings").forEach((r) => { settings[r.key] = r.obj; });
  const me = people[email];
  // Employees see names of admins (reviewers) and of Showcase authors; admins see everyone.
  const visible = {};
  if (admin) Object.assign(visible, people);
  else {
    visible[email] = people[email] || { name: nameFromEmail_(email), team: "" };
    admins_().forEach((a) => { visible[a] = people[a] || { name: nameFromEmail_(a), team: "" }; });
    Object.keys(showcase).forEach((k) => { const o = showcase[k].owner; if (o) visible[o] = people[o] || { name: nameFromEmail_(o), team: "" }; });
  }
  return {
    me: { email: email, name: me ? me.name : nameFromEmail_(email), team: me ? me.team : "", isAdmin: admin, isNew: !me },
    people: visible, briefs: briefs, subs: subs, reviews: reviews, threads: threads, showcase: showcase, settings: settings,
    team: admin ? teamInfo_() : null,
    sheetUrl: admin ? book_().getUrl() : null,
    appUrl: ScriptApp.getService().getUrl(),
  };
}

/** Records when someone last opened the app (at most every 6 hours), for Team & access. */
function touch_(email) {
  const p = rows_("People").filter((x) => x.key === email)[0];
  if (!p || (p.obj.lastSeen && Date.now() - new Date(p.obj.lastSeen).getTime() < 6 * 3600000)) return;
  const obj = Object.assign({}, p.obj, { lastSeen: new Date().toISOString() });
  try { writeRow_("People", p.row, [email, obj.name, obj.team, obj.firstSeen, obj.lastSeen, obj]); } catch (e) {}
}

function saveProfile(name, team) {
  const email = email_();
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const now = new Date().toISOString();
    const existing = rows_("People").filter((p) => p.key === email)[0];
    const obj = { email: email, name: str_(name, 80).trim() || nameFromEmail_(email), team: str_(team, 60).trim(), firstSeen: existing ? existing.obj.firstSeen : now, lastSeen: now };
    writeRow_("People", existing && existing.row, [email, obj.name, obj.team, obj.firstSeen, obj.lastSeen, obj]);
    return { name: obj.name, team: obj.team };
  } finally { lock.releaseLock(); }
}

/** One write from the page. Paths: briefs/<id>, subs/<email>, reviews/<email>, threads/<email>, showcase/<id>, settings/<key>. */
function write(path, op, data) {
  const email = email_();
  const admin = isAdmin_(email);
  const parts = String(path).split("/");
  const col = parts[0], id = parts.slice(1).join("/");
  const mails = [];
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    if (col === "briefs") {
      if (!admin) throw new Error("Only brand admins can change requests.");
      const existing = rows_("Requests").filter((r) => r.key === id)[0];
      if (op === "delete") { if (existing) deleteRows_("Requests", [existing.row]); return true; }
      const d = data || {};
      const stage = ["todo", "doing", "review", "done"].indexOf(d.stage) >= 0 ? d.stage : d.closed ? "done" : "todo";
      const obj = { title: str_(d.title, 120), kind: str_(d.kind, 40), deadline: str_(d.deadline, 10), templateUrl: str_(d.templateUrl, 500), description: str_(d.description, 1500),
        priority: ["high", "normal", "low"].indexOf(d.priority) >= 0 ? d.priority : "normal", stage: stage, closed: stage === "done",
        teams: (Array.isArray(d.teams) ? d.teams : []).slice(0, 20).map((t) => str_(t, 60)).filter(String),
        people: (Array.isArray(d.people) ? d.people : []).slice(0, 300).map((p) => str_(p, 120).toLowerCase().trim()).filter((p) => /^[^@\s]+@[^@\s]+$/.test(p) && p.endsWith("@" + CONFIG.DOMAIN)),
        createdAt: str_(d.createdAt, 40) || new Date().toISOString(), createdBy: existing ? existing.obj.createdBy : email, updatedAt: new Date().toISOString() };
      if (!obj.title || !isDate_(obj.deadline)) throw new Error("A request needs a title and a deadline.");
      if (CONFIG.EMAIL_ON_ASSIGN && !obj.closed) {
        const before = existing ? assignees_(existing.obj) : [];
        const added = assignees_(obj).filter((a) => before.indexOf(a) < 0 && a !== email);
        if (added.length) mails.push({ to: added.join(","), subject: `New request for you: ${obj.title}`,
          body: `<p><b>${esc_(nameOf_(email))}</b> assigned you a request${obj.priority === "high" ? " (high priority)" : ""}:</p><p><b>${esc_(obj.title)}</b> · ${esc_(obj.kind)} · due <b>${obj.deadline}</b></p>${obj.description ? "<p>" + esc_(obj.description).replace(/\n/g, "<br>") + "</p>" : ""}${obj.templateUrl ? '<p><a href="' + esc_(obj.templateUrl) + '">Open the template</a></p>' : ""}<p>Submit your work against this request in Brand Astra.</p>` });
      }
      writeRow_("Requests", existing && existing.row, [id, obj.title, obj.kind, obj.deadline, obj.templateUrl, obj.description, { todo: "To do", doing: "In progress", review: "In review", done: "Closed" }[obj.stage], obj.createdBy, obj.updatedAt, obj]);
      return true;
    }
    if (col === "subs") {
      if (id !== email) throw new Error("You can only change your own submissions.");
      if (op !== "set") throw new Error("Unsupported operation.");
      const items = (data && data.items) || {};
      const sids = Object.keys(items).slice(0, 300);
      const name = nameOf_(email);
      const briefs = {}; rows_("Requests").forEach((r) => { briefs[r.key] = r.obj.title; });
      const all = rows_("Submissions");
      const mine = all.filter((r) => r.obj.email === email);
      const before = {}; mine.forEach((r) => { before[r.key] = r.obj.entry; });
      deleteRows_("Submissions", mine.filter((r) => sids.indexOf(r.key) < 0).map((r) => r.row));
      const fresh = rows_("Submissions");
      sids.forEach((sid) => {
        if (!/^[A-Za-z0-9-]{1,60}$/.test(sid)) throw new Error("Invalid submission id.");
        if (all.filter((r) => r.key === sid && r.obj.email !== email)[0]) throw new Error("Invalid submission id.");
        const e = cleanSubmission_(items[sid]);
        const row = fresh.filter((r) => r.key === sid)[0];
        writeRow_("Submissions", row && row.row, [sid, email, name, e.team, e.title, e.kind, e.format, e.channel, e.audience, e.neededBy, e.link, e.notes, briefs[e.briefId] || "", e.submittedAt, e.version, e.precheck.score, { email: email, entry: e }]);
        const prev = before[sid];
        if (CONFIG.EMAIL_ADMINS_ON_SUBMIT && (!prev || e.version > (prev.version || 1))) {
          mails.push({ to: admins_().join(","), subject: `${prev ? "Revised" : "New"} for brand review: ${e.title}`,
            body: `<p><b>${esc_(name)}</b> (${esc_(e.team || "no team")}) ${prev ? "submitted version " + e.version + " of" : "submitted"} <b>${esc_(e.title)}</b> for a brand check.</p>
              <p>${esc_(e.kind)} · ${esc_(e.channel)} · ${esc_(e.audience)}${e.neededBy ? " · needed by <b>" + e.neededBy + "</b>" : ""} · pre-check ${e.precheck.score}/100</p>
              <p>${esc_(e.notes)}</p>` });
        }
      });
      return true;
    }
    if (col === "reviews") {
      if (!admin) throw new Error("Only brand admins can review work.");
      const items = (data && data.items) || {};
      const subs = {}; rows_("Submissions").forEach((r) => { subs[r.key] = r.obj; });
      const existing = rows_("Reviews");
      Object.keys(items).forEach((sid) => {
        const s = subs[sid];
        if (!s || s.email !== id) throw new Error("That submission no longer exists.");
        const rv = cleanReview_(Object.assign({}, items[sid], { format: s.entry.format }), email);
        const row = existing.filter((r) => r.key === sid)[0];
        if (row && row.obj.review.ai && row.obj.review.version === rv.version) rv.ai = row.obj.review.ai;
        writeRow_("Reviews", row && row.row, [sid, s.email, s.entry.title, rv.status, rv.status === "inreview" ? "" : rv.score].concat(QC_KEYS.map((k) => rv.qc ? rv.qc[k] : ""), [rv.comment || "", email, rv.at, { review: rv }]));
        if (CONFIG.EMAIL_EMPLOYEE_ON_REVIEW && rv.status !== "inreview") mails.push(reviewMail_(sid, s, rv));
      });
      return true;
    }
    if (col === "threads") {
      if (id !== email && !admin) throw new Error("You can only post in your own conversations.");
      const items = (data && data.items) || {};
      const subs = {}; rows_("Submissions").forEach((r) => { subs[r.key] = r.obj; });
      const existing = rows_("Comments");
      Object.keys(items).forEach((sid) => {
        const s = subs[sid];
        if (!s || s.email !== id) throw new Error("That submission no longer exists.");
        const row = existing.filter((r) => r.key === sid)[0];
        const old = row ? row.obj.messages : [];
        const seen = {}; old.forEach((m) => { seen[m.id] = true; });
        // Only append: earlier messages can't be edited, and authorship is always the signed-in user.
        const added = (items[sid] || []).filter((m) => m && m.id && !seen[m.id] && str_(m.text, 2000).trim()).slice(0, 5)
          .map((m) => ({ id: str_(m.id, 60), by: email, text: str_(m.text, 2000).trim(), at: new Date().toISOString() }));
        if (!added.length) return;
        const msgs = old.concat(added).slice(-200);
        writeRow_("Comments", row && row.row, [sid, s.email, msgs.length, email, added[added.length - 1].at, { messages: msgs }]);
        if (CONFIG.EMAIL_ON_COMMENT) {
          let to;
          if (email === s.email) {
            const rv = rows_("Reviews").filter((r) => r.key === sid)[0];
            const by = rv && rv.obj.review.by;
            to = by && by !== "ai" && by.indexOf("@") > 0 ? by : admins_().join(",");
          } else to = s.email;
          mails.push({ to: to, subject: `New message on “${s.entry.title}”`,
            body: `<p><b>${esc_(nameOf_(email))}</b> wrote:</p><blockquote>${esc_(added.map((m) => m.text).join("\n\n")).replace(/\n/g, "<br>")}</blockquote><p>Reply in Brand Astra.</p>` });
        }
      });
      return true;
    }
    if (col === "showcase") {
      if (!admin) throw new Error("Only brand admins can change the Showcase.");
      const existing = rows_("Showcase").filter((r) => r.key === id)[0];
      if (op === "delete") { if (existing) deleteRows_("Showcase", [existing.row]); return true; }
      const d = data || {};
      const s = rows_("Submissions").filter((r) => r.key === id)[0];
      if (!s) throw new Error("That submission no longer exists.");
      const obj = { title: str_(d.title, 120), kind: str_(d.kind, 40), format: str_(d.format, 20), team: str_(d.team, 60), link: s.obj.entry.link,
        score: Math.max(0, Math.min(100, Number(d.score) || 0)), note: str_(d.note, 160), owner: s.obj.email, approvedAt: new Date().toISOString(), by: email };
      writeRow_("Showcase", existing && existing.row, [id, obj.title, obj.kind, obj.team, obj.link, obj.score, obj.note, obj.approvedAt, obj]);
      return true;
    }
    if (col === "settings") {
      if (!admin) throw new Error("Only brand admins can change settings.");
      if (id !== "templates") throw new Error("Unknown setting.");
      const links = {};
      const src = (data && data.links) || {};
      Object.keys(src).slice(0, 20).forEach((k) => { const v = str_(src[k], 500); if (/^https:\/\//i.test(v)) links[str_(k, 20)] = v; });
      const existing = rows_("Settings").filter((r) => r.key === id)[0];
      writeRow_("Settings", existing && existing.row, [id, JSON.stringify(links), new Date().toISOString(), { links: links }]);
      return true;
    }
    throw new Error("Unknown data path.");
  } finally {
    lock.releaseLock();
    mails.forEach(sendMail_);
  }
}

// ---------- Email ----------
function reviewMail_(sid, s, rv) {
  const label = { approved: "Approved", changes: "Changes requested", rejected: "Not approved" }[rv.status];
  const flagged = QC_KEYS.filter((k) => rv.qc[k] !== "pass").map((k) => k + ": " + rv.qc[k]).join(", ");
  const who = rv.by === "ai" ? "The automatic brand check" : "The brand team";
  const fixes = rv.ai && rv.ai.fixes && rv.ai.fixes.length ? "<p><b>Fix these first</b></p><ol>" + rv.ai.fixes.map((f) => "<li>" + esc_(f) + "</li>").join("") + "</ol>" : "";
  return { to: s.email, subject: `${label}: ${s.entry.title}`,
    body: `<p>Hi ${esc_(nameOf_(s.email).split(" ")[0])},</p><p>${who} reviewed <b>${esc_(s.entry.title)}</b>: <b>${label}</b> · QC score ${rv.score}/100.</p>
      ${flagged ? "<p>Flagged: " + esc_(flagged) + "</p>" : ""}${rv.comment ? "<p>" + esc_(rv.comment).replace(/\n/g, "<br>") + "</p>" : ""}${fixes}
      ${rv.status === "approved" ? "<p>Approval ID: <b>" + approvalId_(sid, rv.at) + "</b>. Quote it when you publish or share this externally.</p>" : "<p>Open Brand Astra to submit a revised version. If you think the check got it wrong, ask for a human review from your submission.</p>"}` };
}
function esc_(t) { return String(t == null ? "" : t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }
function approvalId_(sid, at) {
  const d = new Date(at);
  return "BA-" + String(d.getFullYear()).slice(2) + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + sid.replace(/[^A-Za-z0-9]/g, "").slice(0, 5).toUpperCase();
}
function sendMail_(m) {
  if (!m || !m.to) return;
  try {
    const url = ScriptApp.getService().getUrl();
    MailApp.sendEmail({
      to: m.to, subject: "[Brand Astra] " + m.subject, name: CONFIG.APP_NAME,
      htmlBody: `<div style="font-family:Poppins,Arial,sans-serif;font-size:14px;color:#0B0F17;max-width:560px">${m.body}
        <p style="margin-top:20px"><a href="${url}" style="background:#005DFF;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;font-weight:600">Open Brand Astra</a></p>
        <p style="color:#8C95A6;font-size:12px;margin-top:24px">Recykal · Sustainable Circularity</p></div>`,
    });
  } catch (e) { console.warn("Email not sent: " + e); }
}
function workDays_(fromIso, toMs) {
  let t = new Date(fromIso).getTime(), ms = 0;
  while (t < toMs) { const d = new Date(t); const nx = Math.min(toMs, new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1).getTime()); if (d.getDay() !== 0 && d.getDay() !== 6) ms += nx - t; t = nx; }
  return ms / 86400000;
}

/** Emails of the people a request is assigned to (named people plus everyone in the named teams). Empty = everyone. */
function assignees_(b) {
  const out = {}; (b.people || []).forEach((p) => { out[p] = 1; });
  if (b.teams && b.teams.length) rows_("People").forEach((p) => { if (b.teams.indexOf(p.obj.team) >= 0) out[p.key] = 1; });
  return Object.keys(out);
}
/** Deadline reminders: assigned people who haven't submitted yet, REMIND_DAYS_BEFORE days before the deadline. Requests for everyone aren't mass-emailed. */
function remindAssignees_() {
  if (!CONFIG.REMIND_DAYS_BEFORE || !CONFIG.REMIND_DAYS_BEFORE.length) return;
  const tz = Session.getScriptTimeZone();
  const today = Utilities.formatDate(new Date(), tz, "yyyy-MM-dd");
  const daysTo = (d) => Math.round((new Date(d + "T00:00:00Z") - new Date(today + "T00:00:00Z")) / 86400000);
  const submitted = {}; rows_("Submissions").forEach((r) => { const e = r.obj.entry; if (e.briefId) (submitted[e.briefId] = submitted[e.briefId] || {})[r.obj.email] = 1; });
  rows_("Requests").forEach((r) => {
    const b = r.obj; if (!b || b.closed || !isDate_(b.deadline)) return;
    const n = daysTo(b.deadline); if (CONFIG.REMIND_DAYS_BEFORE.indexOf(n) < 0) return;
    const to = assignees_(b).filter((a) => !(submitted[r.key] || {})[a]);
    if (!to.length) return;
    sendMail_({ to: to.join(","), subject: `${n === 0 ? "Due today" : "Due in " + n + " days"}: ${b.title}`,
      body: `<p>A reminder: <b>${esc_(b.title)}</b> is due <b>${n === 0 ? "today" : "on " + b.deadline}</b> and we haven't received your submission yet.</p>${b.templateUrl ? '<p><a href="' + esc_(b.templateUrl) + '">Open the template</a></p>' : ""}<p>Run it through Brand QC, then submit it against the request in Brand Astra.</p>` });
  });
}

/** Runs every morning: deadline reminders, then a summary of the review queue for admins. */
function dailyDigest() {
  try { remindAssignees_(); } catch (e) { console.warn("Reminders failed: " + e); }
  const reviews = {}; rows_("Reviews").forEach((r) => { reviews[r.key] = r.obj.review; });
  const now = Date.now();
  const open = rows_("Submissions").map((r) => ({ sid: r.key, email: r.obj.email, e: r.obj.entry, rv: reviews[r.key] }))
    .filter((x) => !x.rv || x.rv.at < x.e.submittedAt || x.rv.status === "inreview");
  if (!open.length) return;
  const over = open.filter((x) => workDays_(x.e.submittedAt, now) > CONFIG.SLA_WORKING_DAYS);
  const urgent = open.filter((x) => x.e.neededBy && (new Date(x.e.neededBy + "T23:59:59").getTime() - now) < 2 * 86400000);
  const line = (x) => `<li><b>${esc_(x.e.title)}</b> · ${esc_(nameOf_(x.email))} · waiting ${workDays_(x.e.submittedAt, now).toFixed(1)} working days${x.e.neededBy ? " · needed by " + x.e.neededBy : ""}${x.rv && x.rv.status === "inreview" && x.rv.at >= x.e.submittedAt ? (x.rv.by === "ai" ? " · <b>passed the automatic check, needs the eye check</b>" : " · being reviewed by " + esc_(nameOf_(x.rv.by))) : ""}</li>`;
  sendMail_({ to: admins_().join(","), subject: `${open.length} waiting for review${over.length ? " · " + over.length + " over SLA" : ""}`,
    body: `<p>Good morning. <b>${open.length}</b> submission(s) are waiting for a brand check.</p>
      ${urgent.length ? "<p><b>Urgent (needed within 2 days)</b></p><ul>" + urgent.map(line).join("") + "</ul>" : ""}
      ${over.length ? "<p><b>Over the " + CONFIG.SLA_WORKING_DAYS + "-working-day SLA</b></p><ul>" + over.map(line).join("") + "</ul>" : ""}
      ${!urgent.length && !over.length ? "<ul>" + open.slice(0, 10).map(line).join("") + "</ul>" : ""}` });
}

/** Run once from the editor: creates the data sheet, approves permissions and schedules the daily digest. */
function setup() {
  const ss = book_();
  Object.keys(SHEETS).forEach((n) => sheet_(n));
  ScriptApp.getProjectTriggers().filter((t) => ["dailyDigest", "processPendingAi"].indexOf(t.getHandlerFunction()) >= 0).forEach((t) => ScriptApp.deleteTrigger(t));
  if (CONFIG.DAILY_DIGEST_HOUR != null && CONFIG.DAILY_DIGEST_HOUR !== false) {
    ScriptApp.newTrigger("dailyDigest").timeBased().everyDays(1).atHour(CONFIG.DAILY_DIGEST_HOUR).create();
  }
  Logger.log("Data sheet: " + ss.getUrl());
}

// =====================================================================
// Brand Astra check — automatic brand QC with no AI, against the rulebook in BRAND (rules.js).
//   The page runs the check (BRAND_CHECK in check.js) on the file itself, in the employee's browser: uploads are read
//   straight from their computer; for a Google link, fileForQc hands the page the file (Slides and Docs exported as PDF).
//   saveAutoCheck stores the result and rescores it here with BRAND.evaluate. The check never approves: measured
//   failures go straight back to the employee, and work that passes goes to the brand team, who check the rules a
//   computer can't judge (logo artwork, imagery, alignment, proofreading) by eye.
// =====================================================================

const FORMAT_KEYS_ = ["slide", "square", "portrait", "story", "landscape", "other"];
const SEV_ORDER_ = { critical: 0, major: 1, minor: 2 };
const PPTX_MIME_ = "application/vnd.openxmlformats-officedocument.presentationml.presentation";
const QC_FILE_LIMIT_ = 15 * 1024 * 1024;

function fileIdFromLink_(link) {
  const m = String(link).match(/\/d\/([A-Za-z0-9_-]{20,})/) || String(link).match(/[?&]id=([A-Za-z0-9_-]{20,})/);
  return m ? m[1] : null;
}
function openLinkedFile_(link) {
  const id = fileIdFromLink_(link);
  if (!id) throw new Error("Brand Astra couldn't find a file in that link. Copy it from the Share button in Google Slides, Docs or Drive.");
  try { return DriveApp.getFileById(id); }
  catch (e) { throw new Error("Brand Astra can't open this file. In Google Drive, click Share → General access → “Anyone at Recykal with the link” (Viewer), then try again."); }
}

/** A linked file for the page to check: { name, mime, b64 }. Google Slides and Docs come as PDF. Nothing is saved. */
function fileForQc(link) {
  email_();
  if (!isGoogleLink_(link)) throw new Error("Use a Google Slides, Docs or Drive link.");
  const file = openLinkedFile_(link); const mime = file.getMimeType();
  let blob;
  if (mime === MimeType.GOOGLE_SLIDES || mime === MimeType.GOOGLE_DOCS) blob = file.getAs(MimeType.PDF);
  else if (mime === MimeType.PDF || mime === PPTX_MIME_ || /^image\/(png|jpeg|webp)$/.test(mime)) blob = file.getBlob();
  else throw new Error("Brand Astra can check Google Slides, Google Docs, PowerPoint (.pptx), PDF and PNG, JPG or WEBP files. Export this file to one of those and share the link.");
  const bytes = blob.getBytes();
  if (bytes.length > QC_FILE_LIMIT_) throw new Error("This file is over 15 MB. Compress the pictures or split it, then try again.");
  const converted = blob.getContentType() === MimeType.PDF && mime !== MimeType.PDF;
  return { name: file.getName() + (converted ? ".pdf" : ""), mime: blob.getContentType(), b64: Utilities.base64Encode(bytes) };
}

/** The page's check result → the rule results and a clean report (only known rules, statuses and capped text are kept). */
function cleanCheck_(x, format) {
  if (!x || !Array.isArray(x.checks)) throw new Error("The check result is incomplete. Run the check again.");
  const given = {}; x.checks.forEach((c) => { if (c && BRAND.ruleById[c.id]) given[c.id] = c; });
  const results = {}, checks = [];
  BRAND.rules.forEach((r) => {
    const c = given[r.id] || {};
    let st = ["pass", "fail", "na", "unsure"].indexOf(c.status) >= 0 ? c.status : "unsure";
    if (r.f.indexOf(format) < 0) st = "na";
    results[r.id] = { status: st };
    checks.push({ id: r.id, status: st, evidence: str_(c.evidence, 600), where: str_(c.where, 160), fix: str_(c.fix, 400), by: st === "unsure" ? "reviewer" : r.f.indexOf(format) < 0 ? "rule" : "measured" });
  });
  let facts = {}; try { facts = JSON.parse(JSON.stringify(x.facts || {})); } catch (e) {}
  if (JSON.stringify(facts).length > 20000) facts = { kind: str_(facts.kind, 10), pages: Number(facts.pages) || 0, ratio: Number(facts.ratio) || null };
  return { results: results, report: { v: 3, mode: "auto", format: format, summary: str_(x.summary, 600), checks: checks, facts: facts, file: str_(x.file, 120), checkedAt: new Date().toISOString() } };
}

/** Saves the automatic check of a submission (run by the page) and decides what happens next. */
function saveAutoCheck(uid, sid, report) {
  const email = email_();
  const sub = rows_("Submissions").filter((r) => r.key === sid)[0];
  if (!sub || sub.obj.email !== uid || (uid !== email && !isAdmin_(email))) throw new Error("You can only check your own submissions.");
  const entry = sub.obj.entry;
  const format = FORMAT_KEYS_.indexOf(entry.format) >= 0 ? entry.format : "other";
  const clean = cleanCheck_(report, format);
  const ev = BRAND.evaluate(format, clean.results, { approveAt: CONFIG.APPROVE_AT, changesAt: CONFIG.CHANGES_AT });
  const rep = clean.report;
  const fails = rep.checks.filter((c) => c.status === "fail").sort((a, b) => SEV_ORDER_[BRAND.ruleById[a.id].sev] - SEV_ORDER_[BRAND.ruleById[b.id].sev]);
  rep.fixes = fails.map((c) => (c.where ? c.where + ": " : "") + (c.fix || c.evidence)).slice(0, 8);
  rep.deductions = ev.deductions; rep.needsHuman = ev.needsHuman; rep.eye = rep.checks.filter((c) => c.by === "reviewer").map((c) => c.id);
  rep.criteria = {}; BRAND.groups.forEach(([g]) => { rep.criteria[g] = { rating: ev.qc[g], feedback: fails.filter((c) => BRAND.ruleById[c.id].g === g).map((c) => c.evidence).join(" ").slice(0, 600) || "No measured problem." }; });
  // Measured failures go straight back; everything else waits for the brand team's eye check.
  const status = ev.score < CONFIG.APPROVE_AT ? ev.decision : "inreview";
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  let rv;
  try {
    const row = rows_("Reviews").filter((r) => r.key === sid)[0];
    const prev = row && row.obj.review;
    if (prev && prev.by !== "ai" && prev.at >= entry.submittedAt && prev.status !== "inreview" && !isAdmin_(email)) return { skipped: true, status: prev.status, score: prev.score };
    const at = new Date().toISOString();
    rv = { status: status, qc: ev.qc, score: ev.score, comment: rep.summary, at: at, by: "ai", version: entry.version || 1, ai: rep,
      history: ((prev && prev.history) || []).concat(status === "inreview" ? [] : [{ status: status, score: ev.score, at: at, by: "ai", version: entry.version || 1 }]).slice(-20) };
    writeRow_("Reviews", row && row.row, [sid, sub.obj.email, entry.title, rv.status, rv.status === "inreview" ? "" : rv.score].concat(QC_KEYS.map((k) => rv.qc[k]), [rv.comment, "Brand Astra check", rv.at, { review: rv }]));
  } finally { lock.releaseLock(); }
  if (CONFIG.EMAIL_EMPLOYEE_ON_REVIEW && rv.status !== "inreview") sendMail_(reviewMail_(sid, sub.obj, rv));
  return { status: rv.status, score: rv.score };
}

// ---------- Uploads (Brand QC "Upload image or PDF") ----------
// Uploaded files are saved to a "Brand Astra — Uploads" folder in the deploying account's Drive and
// shared view-only with Recykal, so the brand team opens them exactly like a pasted link.
function uploadsFolder_() {
  const props = PropertiesService.getScriptProperties();
  const id = props.getProperty("UPLOAD_FOLDER_ID");
  if (id) { try { return DriveApp.getFolderById(id); } catch (e) {} }
  const folder = DriveApp.createFolder(CONFIG.APP_NAME + " — Uploads");
  props.setProperty("UPLOAD_FOLDER_ID", folder.getId());
  return folder;
}
function uploadForQc(name, mime, b64) {
  const email = email_();
  const types = { "image/png": 5, "image/jpeg": 5, "image/webp": 5, "application/pdf": 15, [PPTX_MIME_]: 15 };
  if (!types[mime]) throw new Error("Upload a PowerPoint (.pptx), a PDF, or a PNG, JPG or WEBP image.");
  const bytes = Utilities.base64Decode(String(b64 || ""));
  if (!bytes.length) throw new Error("That file is empty.");
  if (bytes.length > types[mime] * 1024 * 1024) throw new Error(types[mime] === 15 ? "This file is over 15 MB. Compress it, or share it as a Google Drive link instead." : "This image is over 5 MB. Export a smaller version.");
  const stamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HHmm");
  const file = uploadsFolder_().createFile(Utilities.newBlob(bytes, mime, `${stamp} · ${email.split("@")[0]} · ${str_(name, 80) || "upload"}`));
  file.setDescription("Uploaded to Brand Astra by " + email);
  try { file.setSharing(DriveApp.Access.DOMAIN_WITH_LINK, DriveApp.Permission.VIEW); } catch (e) { console.warn("Could not share upload with the domain: " + e); }
  return "https://drive.google.com/file/d/" + file.getId() + "/view";
}
