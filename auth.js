/* ============================================================
   LIFE BLUEPRINT OS — auth.js
   Local username/password accounts. No third-party auth.
   Passwords are salted + hashed with SHA-256 (Web Crypto API).
   ============================================================ */

let currentUser = null;

function randomSalt() {
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return Array.from(arr).map(b => b.toString(16).padStart(2, "0")).join("");
}

async function hashPassword(password, salt) {
  const enc = new TextEncoder().encode(password + salt);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

async function registerUser(username, password) {
  const existing = all("SELECT id FROM users WHERE username = ?", [username]);
  if (existing.length) return { ok: false, message: "Username already exists." };
  if (username.trim().length < 3) return { ok: false, message: "Username must be at least 3 characters." };
  if (password.length < 4) return { ok: false, message: "Password must be at least 4 characters." };

  const salt = randomSalt();
  const hash = await hashPassword(password, salt);
  run(
    "INSERT INTO users (username, password_hash, salt, created_date, updated_date) VALUES (?,?,?,?,?)",
    [username, hash, salt, nowISO(), nowISO()]
  );
  return { ok: true };
}

async function loginUser(username, password) {
  const rows = all("SELECT * FROM users WHERE username = ?", [username]);
  if (!rows.length) return { ok: false, message: "No account with that username." };
  const user = rows[0];
  const hash = await hashPassword(password, user.salt);
  if (hash !== user.password_hash) return { ok: false, message: "Incorrect password." };
  currentUser = { id: user.id, username: user.username };
  localStorage.setItem("lbo_session", JSON.stringify(currentUser));
  return { ok: true, user: currentUser };
}

function logoutUser() {
  currentUser = null;
  localStorage.removeItem("lbo_session");
}

function restoreSession() {
  const raw = localStorage.getItem("lbo_session");
  if (!raw) return false;
  try {
    const session = JSON.parse(raw);
    const rows = all("SELECT id, username FROM users WHERE id = ?", [session.id]);
    if (rows.length) {
      currentUser = rows[0];
      return true;
    }
  } catch (e) { /* ignore */ }
  return false;
}
