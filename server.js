// Brand Astra on Render: Recykal's brand QC and task dashboard.
//   Sign-in: Google, restricted to @recykal.com accounts (the page then asks Employee or Marketing team).
//   App logic: app/Code.gs, the same server code as the Google Apps Script version, run by lib/gas.js.
//   Data: Postgres (DATABASE_URL), or data/ on this computer when testing locally.
// Environment: see .env.example and DEPLOY.md.
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const express = require("express");
const cookieSession = require("cookie-session");
const { openStore } = require("./lib/store");
const { loadApp } = require("./lib/gas");
const { createMailer } = require("./lib/mailer");

const PROD = process.env.NODE_ENV === "production";
const BASE_URL = (process.env.BASE_URL || process.env.RENDER_EXTERNAL_URL || `http://localhost:${process.env.PORT || 3000}`).replace(/\/$/, "");
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID, CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const DEV_LOGIN = !PROD && !CLIENT_ID && process.env.DEV_LOGIN === "1";   // local testing only: sign in as any @recykal.com address
const DRIVE = process.env.GOOGLE_DRIVE !== "0";                            // read access to the user's own Google files, to check Slides/Docs links
const SESSION_SECRET = process.env.SESSION_SECRET || (PROD ? null : "local-only-secret");
// On Render, the app only opens once its database and Google sign-in are set; until then every page lists what's missing.
const MISSING = PROD ? [!process.env.DATABASE_URL && "DATABASE_URL (the Neon connection string)", !(CLIENT_ID && CLIENT_SECRET) && "GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET (the Google sign-in client)",
  !SESSION_SECRET && "SESSION_SECRET (any long random text)"].filter(Boolean) : [];

// The functions of Code.gs the page may call. Everything else in Code.gs is internal.
const API = new Set(["getState", "write", "saveProfile", "setMarketing", "requestMarketingAccess", "saveAutoCheck", "uploadForQc", "fileForQc"]);
const UPLOAD_TYPES = { "image/png": 5, "image/jpeg": 5, "image/webp": 5, "application/pdf": 15, "application/vnd.openxmlformats-officedocument.presentationml.presentation": 15 };
const PPTX = "application/vnd.openxmlformats-officedocument.presentationml.presentation";
const GOOGLE_EXPORT = { "application/vnd.google-apps.presentation": "application/pdf", "application/vnd.google-apps.document": "application/pdf" };

const esc = (t) => String(t == null ? "" : t).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function setupPage(missing) {
  return `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Brand Astra · setup</title>
  <body style="font-family:Poppins,Arial,sans-serif;max-width:640px;margin:48px auto;padding:0 16px;color:#0B0F17;background:#fff">
  <h1 style="font-size:24px">Brand Astra isn't set up yet</h1>
  <p>Add these under <b>Environment</b> on the Render service, then save (Render restarts the app):</p>
  <ul>${missing.map((m) => `<li>${esc(m)}</li>`).join("")}</ul>
  <p>For Google sign-in, use this redirect address: <code>${esc(BASE_URL)}/auth/callback</code></p>
  <p>The steps are in DEPLOY.md in the repository.</p></body></html>`;
}

async function main() {
  if (MISSING.length) {
    const server = express();
    server.get("/healthz", (req, res) => res.send("ok"));
    server.use((req, res) => res.status(503).type("html").send(setupPage(MISSING)));
    server.listen(Number(process.env.PORT || 3000), () => console.log("Brand Astra is waiting for setup: " + MISSING.join("; ")));
    return;
  }
  const store = await openStore();
  const mailer = createMailer();
  const app = loadApp({ store, mailer, baseUrl: BASE_URL });
  const CONFIG = app.config();
  const DOMAIN = CONFIG.DOMAIN;
  const page = fs.readFileSync(path.join(__dirname, "app", "Index.html"), "utf8");
  const tokens = new Map();                         // session id → Google access token, kept in memory only (never in the cookie)

  const server = express();
  server.disable("x-powered-by");
  server.set("trust proxy", 1);
  server.use(cookieSession({ name: "ba", keys: [SESSION_SECRET], maxAge: 30 * 86400000, sameSite: "lax", secure: PROD, httpOnly: true }));
  server.use((req, res, next) => {
    res.set({ "X-Content-Type-Options": "nosniff", "Referrer-Policy": "same-origin", "X-Frame-Options": "SAMEORIGIN" });
    next();
  });
  const signedIn = (req) => req.session && req.session.email && req.session.email.endsWith("@" + DOMAIN) ? req.session.email : null;

  // ---------- the page ----------
  server.get("/", (req, res) => {
    const email = signedIn(req);
    const boot = email
      ? `window.BA = ${JSON.stringify({ signOutUrl: "/auth/logout", switchUrl: "/auth/google?switch=1" })};${RUN_SHIM}`
      : `window.BA_SIGNIN = ${JSON.stringify({ url: "/auth/google", error: String(req.query.error || "").slice(0, 40), domain: DOMAIN })};`;
    res.set("Cache-Control", "no-store").type("html").send(page.replace("<head>", `<head>\n<script>${boot}</script>`));
  });
  server.get("/healthz", (req, res) => res.send("ok"));

  // ---------- Google sign-in ----------
  server.get("/auth/google", (req, res) => {
    if (DEV_LOGIN) return res.type("html").send(`<!doctype html><meta charset=utf-8><title>Local sign-in</title><body style="font-family:sans-serif;padding:40px">
      <h2>Local testing sign-in</h2><p>Google sign-in isn't configured, so on this computer you can sign in as any @${esc(DOMAIN)} address.</p>
      <form action="/auth/dev"><input name="email" placeholder="name@${esc(DOMAIN)}" size="40" autofocus> <button>Sign in</button></form>`);
    const state = crypto.randomBytes(16).toString("hex");
    req.session.oauthState = state;
    const scope = ["openid", "email", "profile"].concat(DRIVE ? ["https://www.googleapis.com/auth/drive.readonly"] : []).join(" ");
    const q = new URLSearchParams({ client_id: CLIENT_ID, redirect_uri: BASE_URL + "/auth/callback", response_type: "code", scope, state, hd: DOMAIN,
      prompt: req.query.switch ? "select_account consent" : "select_account", include_granted_scopes: "true" });
    res.redirect("https://accounts.google.com/o/oauth2/v2/auth?" + q);
  });
  server.get("/auth/callback", async (req, res) => {
    try {
      if (!req.query.code || !req.query.state || req.query.state !== req.session.oauthState) return res.redirect("/?error=expired");
      delete req.session.oauthState;
      const tr = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ code: String(req.query.code), client_id: CLIENT_ID, client_secret: CLIENT_SECRET, redirect_uri: BASE_URL + "/auth/callback", grant_type: "authorization_code" }) });
      const tok = await tr.json();
      if (!tr.ok || !tok.id_token) { console.warn("Google token error", tok.error); return res.redirect("/?error=google"); }
      // Google checks the ID token's signature and expiry; we check it was issued to this app, for a verified @recykal.com account.
      const ir = await fetch("https://oauth2.googleapis.com/tokeninfo?id_token=" + encodeURIComponent(tok.id_token));
      const info = await ir.json();
      const email = String(info.email || "").toLowerCase();
      if (!ir.ok || info.aud !== CLIENT_ID || String(info.email_verified) !== "true") return res.redirect("/?error=google");
      if (!email.endsWith("@" + DOMAIN) || info.hd !== DOMAIN) return res.redirect("/?error=domain");
      const sid = crypto.randomBytes(18).toString("hex");
      req.session = { email, sid };
      if (tok.access_token) tokens.set(sid, { token: tok.access_token, exp: Date.now() + (Number(tok.expires_in) || 3600) * 1000 - 60000 });
      res.redirect("/");
    } catch (e) { console.warn("Sign-in failed:", e.message); res.redirect("/?error=google"); }
  });
  server.get("/auth/dev", (req, res) => {
    if (!DEV_LOGIN) return res.status(404).end();
    const email = String(req.query.email || "").toLowerCase().trim();
    if (!email.endsWith("@" + DOMAIN)) return res.redirect("/?error=domain");
    req.session = { email, sid: crypto.randomBytes(18).toString("hex") };
    res.redirect("/");
  });
  server.get("/auth/logout", (req, res) => {
    if (req.session && req.session.sid) tokens.delete(req.session.sid);
    req.session = null;
    res.redirect("/");
  });

  // ---------- the app's server functions ----------
  server.post("/api/:fn", express.json({ limit: "25mb" }), async (req, res) => {
    const email = signedIn(req);
    if (!email) return res.status(401).json({ error: "Your sign-in has expired. Sign in again." });
    // Only this page may call the API: a same-origin request with the app's header (a cross-site form can't send either).
    const origin = req.get("origin");
    if (req.get("x-brand-astra") !== "1" || (origin && origin !== new URL(BASE_URL).origin)) return res.status(403).json({ error: "Not allowed." });
    const fn = req.params.fn, args = Array.isArray(req.body && req.body.args) ? req.body.args : [];
    if (!API.has(fn)) return res.status(404).json({ error: "Unknown function." });
    try {
      let result;
      if (fn === "uploadForQc") result = await uploadForQc(email, ...args);
      else if (fn === "fileForQc") result = await fileForQc(req, email, ...args);
      else result = app.call(fn, args, email);
      await store.flush();
      res.json({ result });
      daily();
    } catch (e) {
      await store.flush().catch(() => {});
      res.status(400).json({ error: e && e.message ? e.message : String(e) });
    }
  });

  /** An upload for the brand check and the brand team: kept in the database, opened by anyone at Recykal with the link. */
  async function uploadForQc(email, name, mime, b64) {
    if (!UPLOAD_TYPES[mime]) throw new Error("Upload a PowerPoint (.pptx), a PDF, or a PNG, JPG or WEBP image.");
    const bytes = Buffer.from(String(b64 || ""), "base64");
    if (!bytes.length) throw new Error("That file is empty.");
    if (bytes.length > UPLOAD_TYPES[mime] * 1048576) throw new Error(UPLOAD_TYPES[mime] === 15 ? "This file is over 15 MB. Compress the pictures, or share it as a Google Drive link instead." : "This image is over 5 MB. Export a smaller version.");
    const id = crypto.randomBytes(12).toString("base64url");
    const stamp = app.formatDate(new Date(), "Asia/Kolkata", "yyyy-MM-dd HHmm");
    await store.saveFile(id, `${stamp} · ${email.split("@")[0]} · ${String(name || "upload").slice(0, 80)}`, mime, email, bytes);
    return BASE_URL + "/files/" + id;
  }

  /** A file for the page's brand check: an upload from /files/, or a Google Drive file opened with the user's own Google access. */
  async function fileForQc(req, email, link) {
    link = String(link || "");
    if (link.startsWith(BASE_URL + "/files/")) {
      const f = await store.getFile(link.slice((BASE_URL + "/files/").length).split(/[/?#]/)[0]);
      if (!f) throw new Error("That upload no longer exists. Upload the file again.");
      return { name: f.name, mime: f.mime, b64: Buffer.from(f.data).toString("base64") };
    }
    const m = link.match(/\/d\/([A-Za-z0-9_-]{20,})/) || link.match(/[?&]id=([A-Za-z0-9_-]{20,})/);
    if (!/^https:\/\/(docs|drive)\.google\.com\//.test(link) || !m) throw new Error("Use a Google Slides, Docs or Drive link, or upload the file.");
    const t = tokens.get(req.session.sid);
    if (!DRIVE || !t || t.exp < Date.now()) throw new Error("To check a Google link, sign out and sign in again so Brand Astra can open your Google files (it asks once an hour). Or upload the file instead.");
    const auth = { Authorization: "Bearer " + t.token };
    const meta = await fetch(`https://www.googleapis.com/drive/v3/files/${m[1]}?fields=name,mimeType,size&supportsAllDrives=true`, { headers: auth });
    if (meta.status === 404 || meta.status === 403) throw new Error("Brand Astra can't open this file with your Google account. Check the link, or share it as “Anyone at Recykal with the link”.");
    if (!meta.ok) throw new Error("Google Drive didn't answer. Try again in a minute.");
    const info = await meta.json();
    const exportAs = GOOGLE_EXPORT[info.mimeType];
    if (!exportAs && !UPLOAD_TYPES[info.mimeType]) throw new Error("Brand Astra can check Google Slides, Google Docs, PowerPoint (.pptx), PDF and PNG, JPG or WEBP files. Export this file to one of those.");
    if (Number(info.size) > 15 * 1048576) throw new Error("This file is over 15 MB. Compress the pictures or split it, then try again.");
    const url = exportAs ? `https://www.googleapis.com/drive/v3/files/${m[1]}/export?mimeType=${encodeURIComponent(exportAs)}` : `https://www.googleapis.com/drive/v3/files/${m[1]}?alt=media&supportsAllDrives=true`;
    const fr = await fetch(url, { headers: auth });
    if (!fr.ok) throw new Error(fr.status === 403 ? "This file is too large for Google to export. Download it as PDF and upload that instead." : "Couldn't download the file from Google Drive. Try again.");
    const bytes = Buffer.from(await fr.arrayBuffer());
    if (bytes.length > 15 * 1048576) throw new Error("This file is over 15 MB. Compress the pictures or split it, then try again.");
    return { name: info.name + (exportAs ? ".pdf" : ""), mime: exportAs || info.mimeType, b64: bytes.toString("base64") };
  }

  // ---------- uploaded files and the admin backup ----------
  server.get("/files/:id", async (req, res) => {
    if (!signedIn(req)) return res.redirect("/");
    const f = await store.getFile(req.params.id);
    if (!f) return res.status(404).type("text").send("This file no longer exists.");
    res.set({ "Content-Type": f.mime, "Content-Disposition": `inline; filename="${String(f.name).replace(/[^\w .()-]/g, "_")}${f.mime === PPTX && !/\.pptx$/i.test(f.name) ? ".pptx" : ""}"`, "Cache-Control": "private, max-age=3600" });
    res.send(Buffer.from(f.data));
  });
  server.get("/admin/backup", (req, res) => {
    const email = signedIn(req);
    if (!email || !app.call("isAdmin_", [email], email)) return res.status(403).type("text").send("Only the marketing team can download the backup.");
    res.set("Content-Disposition", `attachment; filename="brand-astra-backup-${new Date().toISOString().slice(0, 10)}.json"`).json({ exportedAt: new Date().toISOString(), sheets: store.state.sheets });
  });

  // ---------- the morning digest and deadline reminders ----------
  // Free Render services sleep when idle, so instead of a timer this runs on the first request after the digest hour each day.
  function daily() {
    try {
      const now = new Date(), today = app.formatDate(now, "Asia/Kolkata", "yyyy-MM-dd"), hour = Number(app.formatDate(now, "Asia/Kolkata", "HH"));
      if (hour < (CONFIG.DAILY_DIGEST_HOUR || 9) || store.state.props.lastDaily === today) return;
      store.state.props.lastDaily = today; store.markDirty("props");
      if (app.has("dailyDigest")) app.call("dailyDigest", [], "");
      store.flush().catch((e) => console.warn("Saving after the digest failed:", e.message));
    } catch (e) { console.warn("Daily digest failed:", e.message); }
  }

  const port = Number(process.env.PORT || 3000);
  server.listen(port, () => console.log(`Brand Astra on ${BASE_URL} (port ${port}) · data: ${process.env.DATABASE_URL ? "Postgres" : "data/local.json"} · email: ${mailer.enabled ? "on" : "off"}${DEV_LOGIN ? " · local test sign-in" : ""}`));
}

// google.script.run for the page, over /api: same calls, same success and failure handlers as in Apps Script.
const RUN_SHIM = `(function () {
  function runner(ok, fail) {
    return new Proxy({}, { get: function (_, name) {
      if (name === "withSuccessHandler") return function (f) { return runner(f, fail); };
      if (name === "withFailureHandler") return function (f) { return runner(ok, f); };
      return function () {
        var args = Array.prototype.slice.call(arguments);
        fetch("/api/" + name, { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json", "X-Brand-Astra": "1" }, body: JSON.stringify({ args: args }) })
          .then(function (r) {
            if (r.status === 401) { location.href = "/"; return; }
            return r.json().catch(function () { return { error: "Brand Astra didn't answer. Try again." }; }).then(function (j) {
              if (r.ok && !j.error) { if (ok) ok(j.result); } else if (fail) fail(new Error(j.error || "Error " + r.status));
            });
          }, function () { if (fail) fail(new Error("Can't reach Brand Astra. Check your connection and try again.")); });
      };
    } });
  }
  window.google = { script: { run: runner(null, null) } };
})();`;

main().catch((e) => { console.error(e); process.exit(1); });
