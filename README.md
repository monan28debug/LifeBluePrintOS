# 📐 Life Blueprint OS

A complete, local-first life management dashboard.
**Stack:** HTML5, CSS3, Vanilla JavaScript, SQLite (via sql.js / WebAssembly — runs 100% in your browser, no backend, no Node, no frameworks).

---

## 📂 Project Files

```
/index.html      → App shell, all pages, login screen, modals
/style.css       → Dark-blue Blueprint glassmorphism theme (+ Light & LoFi modes)
/db.js           → SQLite schema + CRUD engine (sql.js, persisted to IndexedDB)
/auth.js         → Local username/password accounts (salted SHA-256 hashing)
/ai.js           → Rule-based local "AI" — analysis, suggestions, Learn Hub
/app.js          → Navigation, CRUD UI, charts, calendar, theming, search
```

There is no `database.db` file shipped — the database is created fresh in your
browser the first time you open the site (and saved automatically to IndexedDB
after that). You can also **Export** a real `.db` file any time using the ⬇️
button in the top bar, and **Import** one back in with the ⬆️ button.

---

## 🖥️ Run It Locally (before deploying)

Browsers block some features (like WebAssembly fetch) when you open `index.html`
directly via `file://`. Run a tiny local server instead:

**Option A — Python (already installed on most machines):**
```bash
cd life-blueprint-os
python3 -m http.server 8000
```
Then open `http://localhost:8000` in your browser.

**Option B — VS Code:**
Install the "Live Server" extension → right-click `index.html` → "Open with Live Server".

---

## 🚀 Deploy for Free — Step by Step (GitHub Pages)

### 1. Create a GitHub account & repository
1. Go to https://github.com and sign up (if you don't have an account).
2. Click the **+** icon (top right) → **New repository**.
3. Name it `life-blueprint-os`, set it to **Public**, click **Create repository**.

### 2. Upload your files
**Easiest way (no command line):**
1. On your new repo page, click **"uploading an existing file"**.
2. Drag in `index.html`, `style.css`, `db.js`, `auth.js`, `ai.js`, `app.js`.
3. Scroll down, click **Commit changes**.

**Or with Git (command line):**
```bash
git init
git add .
git commit -m "Initial commit: Life Blueprint OS"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/life-blueprint-os.git
git push -u origin main
```

### 3. Turn on GitHub Pages
1. In your repo, go to **Settings** → **Pages** (left sidebar).
2. Under **Build and deployment → Source**, select **Deploy from a branch**.
3. Under **Branch**, choose `main` and folder `/ (root)` → click **Save**.
4. Wait ~1 minute. GitHub will show you a live URL like:
   `https://YOUR_USERNAME.github.io/life-blueprint-os/`

🎉 Your site is now live and free, forever, with HTTPS included.

### 4. Updating the site later
Every time you push new changes to the `main` branch (upload new files or
`git push`), GitHub Pages automatically redeploys within a minute or two.

---

## 🌐 Alternative Free Hosts (also static, also work instantly)

| Host | Steps |
|---|---|
| **Netlify** | Go to netlify.com → "Add new site" → "Deploy manually" → drag your project folder into the upload box. Done — instant live URL. |
| **Vercel** | Go to vercel.com → "Add New Project" → Import your GitHub repo → Deploy (no build settings needed, it's static). |
| **Cloudflare Pages** | pages.cloudflare.com → Connect to Git → select repo → Deploy. |

All of these work because the entire app is static files — no server-side code required.

---

## 🔐 About Accounts & Data

- Each user creates their own username/password (stored hashed, never in plain text).
- All your data (Health, Goals, Money, Notes, etc.) is stored in a real SQLite
  database that lives in **your browser's IndexedDB** — it is private to your
  device/browser and is *not* sent anywhere.
- Because there's no server, data does **not** sync across different devices
  unless you manually **Export** the `.db` file on one device and **Import**
  it on another.
- Clearing your browser site data/cache will erase your local database —
  export a backup regularly using the ⬇️ button.

---

## 🤖 About the "AI" Features

There is no external AI API call anywhere in this app (no OpenAI, no Claude API, etc.).
The "AI Hub" is a **rule-based local engine** (`ai.js`) that:
- Reads your real rows from the SQLite tables (sleep, water, workouts, income, expenses, goal/skill progress)
- Applies if/else thresholds and simple averages to generate the Daily/Weekly/Monthly
  analysis, the improvement suggestions, and your Life Level score.
- The Learn Hub content (English/Finance/Technology/Productivity) is static,
  curated local content — also no external calls.

---

## 🛠️ Tech Notes

- **sql.js** is loaded from a CDN (`cdnjs.cloudflare.com`) inside `index.html`.
  This is the only external network dependency — it's the WebAssembly SQLite
  engine itself, not an API. If you want a fully offline/no-CDN version, download
  `sql-wasm.js` + `sql-wasm.wasm` from https://github.com/sql-js/sql.js/releases
  and place them next to `index.html`, then update the `<script src>` and the
  `locateFile` path in `db.js` to point to the local files.
- Charts (bar chart, progress ring) are drawn with plain `<canvas>` — no chart library.
- Fully responsive: sidebar collapses into a hamburger menu under 760px width.
