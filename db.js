/* ============================================================
   LIFE BLUEPRINT OS — db.js
   Real SQLite database running in the browser via sql.js (WASM).
   No backend, no Node. Persists to IndexedDB automatically.
   ============================================================ */

const DB_IDB_NAME = "LifeBlueprintDB";
const DB_IDB_STORE = "sqlite";
const DB_IDB_KEY = "main.db";

let SQL = null;       // sql.js module
let db = null;        // active sqlite Database instance
let saveTimer = null;

/* ---------- IndexedDB raw byte storage (just used to persist the .db file) ---------- */
function idbOpen() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_IDB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(DB_IDB_STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbSave(bytes) {
  const conn = await idbOpen();
  return new Promise((resolve, reject) => {
    const tx = conn.transaction(DB_IDB_STORE, "readwrite");
    tx.objectStore(DB_IDB_STORE).put(bytes, DB_IDB_KEY);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}

async function idbLoad() {
  const conn = await idbOpen();
  return new Promise((resolve, reject) => {
    const tx = conn.transaction(DB_IDB_STORE, "readonly");
    const req = tx.objectStore(DB_IDB_STORE).get(DB_IDB_KEY);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

/* ---------- Schema ---------- */
const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  created_date TEXT,
  updated_date TEXT
);

CREATE TABLE IF NOT EXISTS health (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  category TEXT,         -- sleep, water, workout, weight, goal
  title TEXT,
  description TEXT,
  value REAL,
  unit TEXT,
  status TEXT,
  created_date TEXT,
  updated_date TEXT
);

CREATE TABLE IF NOT EXISTS goals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  category TEXT,          -- short, long, milestone
  title TEXT,
  description TEXT,
  progress INTEGER DEFAULT 0,
  status TEXT,
  created_date TEXT,
  updated_date TEXT
);

CREATE TABLE IF NOT EXISTS money (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  category TEXT,          -- income, expense, savings, budget
  title TEXT,
  description TEXT,
  amount REAL,
  status TEXT,
  created_date TEXT,
  updated_date TEXT
);

CREATE TABLE IF NOT EXISTS skills (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT,
  description TEXT,
  progress INTEGER DEFAULT 0,
  status TEXT,
  created_date TEXT,
  updated_date TEXT
);

CREATE TABLE IF NOT EXISTS career (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  category TEXT,          -- resume, job, certification
  title TEXT,
  description TEXT,
  status TEXT,
  created_date TEXT,
  updated_date TEXT
);

CREATE TABLE IF NOT EXISTS future (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  category TEXT,          -- 1year, 3year, 5year
  title TEXT,
  description TEXT,
  status TEXT,
  created_date TEXT,
  updated_date TEXT
);

CREATE TABLE IF NOT EXISTS explore (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  category TEXT,          -- topic, book, course, idea
  title TEXT,
  description TEXT,
  status TEXT,
  created_date TEXT,
  updated_date TEXT
);

CREATE TABLE IF NOT EXISTS notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  folder TEXT DEFAULT 'General',
  title TEXT,
  description TEXT,
  status TEXT,
  created_date TEXT,
  updated_date TEXT
);

CREATE TABLE IF NOT EXISTS calendar (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  event_date TEXT,
  event_time TEXT,
  title TEXT,
  description TEXT,
  status TEXT,
  created_date TEXT,
  updated_date TEXT
);

CREATE TABLE IF NOT EXISTS achievements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  category TEXT,          -- streak, milestone, record
  title TEXT,
  description TEXT,
  status TEXT,
  created_date TEXT,
  updated_date TEXT
);
`;

/* ---------- Init ---------- */
async function initDatabase() {
  SQL = await initSqlJs({
    locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/${file}`
  });

  const saved = await idbLoad();
  if (saved) {
    db = new SQL.Database(new Uint8Array(saved));
  } else {
    db = new SQL.Database();
    db.run(SCHEMA);
    persist();
  }
  // Always ensure schema exists (covers fresh + safety)
  db.run(SCHEMA);
  return db;
}

function persist() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    const bytes = db.export();
    await idbSave(bytes);
  }, 300);
}

/* ---------- Generic helpers ---------- */
function nowISO() {
  return new Date().toISOString();
}

function run(sql, params = []) {
  db.run(sql, params);
  persist();
}

function all(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}

function exportDbFile() {
  const bytes = db.export();
  const blob = new Blob([bytes], { type: "application/x-sqlite3" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "database.db";
  a.click();
  URL.revokeObjectURL(url);
}

async function importDbFile(file) {
  const buf = await file.arrayBuffer();
  db = new SQL.Database(new Uint8Array(buf));
  db.run(SCHEMA);
  persist();
}

/* Generic CRUD factory for the simple tables (title/description/status pattern) */
function makeTableAPI(table, extraCols = []) {
  return {
    add(userId, data) {
      const cols = ["user_id", "created_date", "updated_date", ...extraCols, ...Object.keys(data)];
      // dedupe extraCols already present in data
      const uniqueCols = [...new Set(["user_id", ...Object.keys(data), "created_date", "updated_date"])];
      const placeholders = uniqueCols.map(() => "?").join(",");
      const values = uniqueCols.map(c => {
        if (c === "user_id") return userId;
        if (c === "created_date" || c === "updated_date") return nowISO();
        return data[c] !== undefined ? data[c] : null;
      });
      run(`INSERT INTO ${table} (${uniqueCols.join(",")}) VALUES (${placeholders})`, values);
    },
    update(id, data) {
      const cols = Object.keys(data);
      const setClause = cols.map(c => `${c} = ?`).join(", ") + ", updated_date = ?";
      const values = [...cols.map(c => data[c]), nowISO(), id];
      run(`UPDATE ${table} SET ${setClause} WHERE id = ?`, values);
    },
    delete(id) {
      run(`DELETE FROM ${table} WHERE id = ?`, [id]);
    },
    all(userId) {
      return all(`SELECT * FROM ${table} WHERE user_id = ? ORDER BY id DESC`, [userId]);
    },
    search(userId, term) {
      return all(
        `SELECT * FROM ${table} WHERE user_id = ? AND (title LIKE ? OR description LIKE ?) ORDER BY id DESC`,
        [userId, `%${term}%`, `%${term}%`]
      );
    }
  };
}

const Tables = {
  health: makeTableAPI("health"),
  goals: makeTableAPI("goals"),
  money: makeTableAPI("money"),
  skills: makeTableAPI("skills"),
  career: makeTableAPI("career"),
  future: makeTableAPI("future"),
  explore: makeTableAPI("explore"),
  notes: makeTableAPI("notes"),
  calendar: makeTableAPI("calendar"),
  achievements: makeTableAPI("achievements"),
};
