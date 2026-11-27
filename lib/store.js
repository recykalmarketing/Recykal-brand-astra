// Storage for Brand Astra on Render.
// The app's data (the same sheets Code.gs uses: Requests, Submissions, Reviews, ...) is held in memory while the
// server runs and written to Postgres after every change, one row per sheet. Uploaded files go in their own table.
// Without DATABASE_URL (local testing) everything is kept in data/local.json and data/files/.
// Moving to a new database (e.g. Neon → Supabase): set DATABASE_URL to the new one and MIGRATE_FROM_URL to the old one. On the
// first start, if the new database is empty, everything is copied across; if the copy fails, the app doesn't start, so the
// running version keeps the old database. Remove MIGRATE_FROM_URL afterwards.
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
    const ssl = (u) => /localhost|127\.0\.0\.1/.test(u) ? false : { rejectUnauthorized: false };
    pool = new Pool({ connectionString: url, ssl: ssl(url), max: 4 });
    await pool.query(`create table if not exists brand_astra_data (key text primary key, value jsonb not null, updated_at timestamptz not null default now())`);
    await pool.query(`create table if not exists brand_astra_files (id text primary key, name text not null, mime text not null, owner text not null,
      created_at timestamptz not null default now(), data bytea not null)`);
    const from = process.env.MIGRATE_FROM_URL;
    if (from && from !== url) await migrate(pool, new Pool({ connectionString: from, ssl: ssl(from), max: 2 }));
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
        // A renamed or removed sheet leaves its old key behind: delete that row instead of writing null.
        if (value === undefined) { await pool.query("delete from brand_astra_data where key = $1", [k]); continue; }
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

/** Copy every record and file from the old database into an empty new one, in one transaction. */
async function migrate(target, source) {
  const has = await target.query("select (select count(*) from brand_astra_data)::int as d, (select count(*) from brand_astra_files)::int as f");
  if (has.rows[0].d || has.rows[0].f) { console.log("MIGRATE_FROM_URL is set, but the new database already has data: nothing copied. Remove MIGRATE_FROM_URL."); await source.end(); return; }
  const client = await target.connect();
  try {
    const data = await source.query("select key, value, updated_at from brand_astra_data");
    const ids = (await source.query("select id from brand_astra_files order by created_at")).rows.map((r) => r.id);
    await client.query("begin");
    for (const r of data.rows) await client.query("insert into brand_astra_data (key, value, updated_at) values ($1, $2, $3)", [r.key, JSON.stringify(r.value), r.updated_at]);
    for (const id of ids) {   // one file at a time, so large uploads don't all sit in memory
      const f = (await source.query("select id, name, mime, owner, created_at, data from brand_astra_files where id = $1", [id])).rows[0];
      await client.query("insert into brand_astra_files (id, name, mime, owner, created_at, data) values ($1, $2, $3, $4, $5, $6)", [f.id, f.name, f.mime, f.owner, f.created_at, f.data]);
    }
    await client.query("commit");
    console.log(`Copied ${data.rows.length} records and ${ids.length} files from the old database. You can now remove MIGRATE_FROM_URL.`);
  } catch (e) {
    await client.query("rollback").catch(() => {});
    throw new Error("Copying from the old database failed, so the app didn't start (the running version keeps the old database): " + e.message);
  } finally { client.release(); await source.end(); }
}

module.exports = { openStore };
