// Storage for Brand Astra on Render.
// The app's data (the same sheets Code.gs uses: Requests, Submissions, Reviews, ...) is held in memory while the
// server runs and written to Postgres after every change, one row per sheet. Uploaded files go in their own table.
// Without DATABASE_URL (local testing) everything is kept in data/local.json and data/files/.
const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "..", "data");

async function openStore() {
  const url = process.env.DATABASE_URL;
  const state = { props: {}, sheets: {} };          // sheets: name → { rows: [[...]] }
  const dirty = new Set();
  let pool = null;

  if (url) {
    const { Pool } = require("pg");
    pool = new Pool({ connectionString: url, ssl: /localhost|127\.0\.0\.1/.test(url) ? false : { rejectUnauthorized: false }, max: 4 });
    await pool.query(`create table if not exists brand_astra_data (key text primary key, value jsonb not null, updated_at timestamptz not null default now())`);
    await pool.query(`create table if not exists brand_astra_files (id text primary key, name text not null, mime text not null, owner text not null,
      created_at timestamptz not null default now(), data bytea not null)`);
    const { rows } = await pool.query("select key, value from brand_astra_data");
    rows.forEach((r) => {
      if (r.key === "props") state.props = r.value;
      else if (r.key.startsWith("sheet:")) state.sheets[r.key.slice(6)] = r.value;
    });
  } else {
    fs.mkdirSync(path.join(DATA_DIR, "files"), { recursive: true });
    const f = path.join(DATA_DIR, "local.json");
    if (fs.existsSync(f)) Object.assign(state, JSON.parse(fs.readFileSync(f, "utf8")));
  }

  return {
    state,
    markDirty: (key) => dirty.add(key),              // "props" or "sheet:<name>"
    /** Write every changed sheet. Called after each request, before the response goes out. */
    async flush() {
      if (!dirty.size) return;
      const keys = [...dirty]; dirty.clear();
      if (!pool) { fs.writeFileSync(path.join(DATA_DIR, "local.json"), JSON.stringify(state)); return; }
      for (const k of keys) {
        const value = k === "props" ? state.props : state.sheets[k.slice(6)];
        await pool.query(`insert into brand_astra_data (key, value, updated_at) values ($1, $2, now())
          on conflict (key) do update set value = excluded.value, updated_at = now()`, [k, JSON.stringify(value)]);
      }
    },
    async saveFile(id, name, mime, owner, bytes) {
      if (pool) await pool.query("insert into brand_astra_files (id, name, mime, owner, data) values ($1, $2, $3, $4, $5)", [id, name, mime, owner, bytes]);
      else {
        fs.writeFileSync(path.join(DATA_DIR, "files", id), bytes);
        fs.writeFileSync(path.join(DATA_DIR, "files", id + ".json"), JSON.stringify({ name, mime, owner }));
      }
    },
    async getFile(id) {
      if (!/^[A-Za-z0-9_-]{8,64}$/.test(id)) return null;
      if (pool) { const { rows } = await pool.query("select name, mime, owner, data from brand_astra_files where id = $1", [id]); return rows[0] || null; }
      const f = path.join(DATA_DIR, "files", id);
      if (!fs.existsSync(f)) return null;
      return Object.assign(JSON.parse(fs.readFileSync(f + ".json", "utf8")), { data: fs.readFileSync(f) });
    },
  };
}

module.exports = { openStore };
