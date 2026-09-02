/* ============================================================
   LIFE BLUEPRINT OS — app.js  (v2 — Colorful Edition)
   Navigation, CRUD UI, charts, calendar, AI hub, popups.
   ============================================================ */

/* ---------- Toasts ---------- */
function toast(msg, type = "success") {
  const el = document.createElement("div");
  el.className = `toast ${type}`;
  el.textContent = msg;
  document.getElementById("toastContainer").appendChild(el);
  setTimeout(() => el.remove(), 3400);
}

/* ---------- Rain ---------- */
function startRain() {
  const canvas = document.getElementById("rainCanvas");
  const ctx = canvas.getContext("2d");
  function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
  resize();
  window.addEventListener("resize", resize);
  const drops = Array.from({ length: 120 }, () => ({
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
    len: 10 + Math.random() * 18,
    speed: 1.5 + Math.random() * 4,
    opacity: 0.04 + Math.random() * 0.13
  }));
  function frame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drops.forEach(d => {
      ctx.globalAlpha = d.opacity;
      ctx.strokeStyle = "#78c4ff";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(d.x, d.y);
      ctx.lineTo(d.x - 1, d.y + d.len);
      ctx.stroke();
      d.y += d.speed;
      if (d.y > canvas.height) { d.y = -d.len; d.x = Math.random() * canvas.width; }
    });
    ctx.globalAlpha = 1;
    requestAnimationFrame(frame);
  }
  frame();
}

/* ---------- Theme ---------- */
const THEMES = ["theme-dark", "theme-light", "theme-lofi"];
const THEME_ICONS = { "theme-dark": "🌙", "theme-light": "☀️", "theme-lofi": "🎵" };
function cycleTheme() {
  const body = document.body;
  let idx = THEMES.findIndex(t => body.classList.contains(t));
  body.classList.remove(...THEMES);
  idx = (idx + 1) % THEMES.length;
  body.classList.add(THEMES[idx]);
  localStorage.setItem("lbo_theme", THEMES[idx]);
  document.getElementById("themeToggle").textContent = THEME_ICONS[THEMES[idx]];
  toast(`Theme: ${THEMES[idx].replace("theme-", "").toUpperCase()}`);
}
function restoreTheme() {
  const saved = localStorage.getItem("lbo_theme") || "theme-dark";
  document.body.classList.remove(...THEMES);
  document.body.classList.add(saved);
  const btn = document.getElementById("themeToggle");
  if (btn) btn.textContent = THEME_ICONS[saved] || "🌙";
}

/* ======================================================
   WELCOME & DATA POPUPS
   ====================================================== */
function showWelcomePopup() {
  const seen = localStorage.getItem("lbo_welcome_seen");
  if (!seen) {
    document.getElementById("welcomePopup").classList.remove("hidden");
  }
}
function initWelcomePopup() {
  document.getElementById("closeWelcome").onclick = () => {
    const dontShow = document.getElementById("dontShowAgain").checked;
    if (dontShow) localStorage.setItem("lbo_welcome_seen", "1");
    document.getElementById("welcomePopup").classList.add("hidden");
  };
}
function showDataPopup() {
  document.getElementById("dataPopup").classList.remove("hidden");
}
function initDataPopup() {
  document.getElementById("closeDataPopup").onclick = () => document.getElementById("dataPopup").classList.add("hidden");
  document.getElementById("dataPopup").addEventListener("click", (e) => {
    if (e.target.id === "dataPopup") document.getElementById("dataPopup").classList.add("hidden");
  });
  document.getElementById("popupExportBtn").onclick = () => {
    exportDbFile();
    toast("✅ Database exported! Save this file somewhere safe.", "success");
  };
  document.getElementById("popupImportInput").addEventListener("change", async (e) => {
    if (e.target.files[0]) {
      await importDbFile(e.target.files[0]);
      toast("✅ Database imported successfully!", "success");
      renderAll();
      document.getElementById("dataPopup").classList.add("hidden");
    }
  });
}

/* ======================================================
   MODULE CONFIG — fields per table for CRUD UI
   ====================================================== */
const MODULES = {
  health: {
    title: "Health Entry", icon: "❤️", listEl: "healthList",
    fields: [
      { key: "category", label: "Type", type: "select", options: ["sleep","water","workout","weight","goal"] },
      { key: "title",    label: "Title", type: "text", required: true },
      { key: "value",    label: "Value (hrs / glasses / kg / reps)", type: "number" },
      { key: "unit",     label: "Unit (h / glasses / kg / reps)", type: "text" },
      { key: "description", label: "Notes", type: "textarea" },
      { key: "status",   label: "Status", type: "select", options: ["active","completed"] },
    ]
  },
  goals: {
    title: "Goal", icon: "🎯", listEl: "goalsList",
    fields: [
      { key: "category",    label: "Type", type: "select", options: ["short","long","milestone"] },
      { key: "title",       label: "Title", type: "text", required: true },
      { key: "description", label: "Description", type: "textarea" },
      { key: "progress",    label: "Progress %", type: "number" },
      { key: "status",      label: "Status", type: "select", options: ["active","completed","paused"] },
    ]
  },
  money: {
    title: "Transaction", icon: "💰", listEl: "moneyList",
    fields: [
      { key: "category",    label: "Type", type: "select", options: ["income","expense","savings","budget"] },
      { key: "title",       label: "Title", type: "text", required: true },
      { key: "amount",      label: "Amount", type: "number", required: true },
      { key: "description", label: "Notes", type: "textarea" },
      { key: "status",      label: "Status", type: "select", options: ["pending","completed"] },
    ]
  },
  skills: {
    title: "Skill", icon: "⚡", listEl: "skillsList",
    fields: [
      { key: "title",       label: "Skill Name", type: "text", required: true },
      { key: "description", label: "Learning History / Notes", type: "textarea" },
      { key: "progress",    label: "Progress %", type: "number" },
      { key: "status",      label: "Status", type: "select", options: ["learning","practicing","mastered"] },
    ]
  },
  career: {
    title: "Career Entry", icon: "💼", listEl: "careerList",
    fields: [
      { key: "category",    label: "Type", type: "select", options: ["resume","job","certification"] },
      { key: "title",       label: "Title", type: "text", required: true },
      { key: "description", label: "Description", type: "textarea" },
      { key: "status",      label: "Status", type: "select", options: ["applied","in-progress","completed","rejected"] },
    ]
  },
  future: {
    title: "Future Plan", icon: "🔭", listEl: "futureList",
    fields: [
      { key: "category",    label: "Horizon", type: "select", options: ["1year","3year","5year"] },
      { key: "title",       label: "Title", type: "text", required: true },
      { key: "description", label: "Description", type: "textarea" },
      { key: "status",      label: "Status", type: "select", options: ["planned","in-progress","achieved"] },
    ]
  },
  explore: {
    title: "Explore Item", icon: "🧭", listEl: "exploreList",
    fields: [
      { key: "category",    label: "Type", type: "select", options: ["topic","book","course","idea"] },
      { key: "title",       label: "Title", type: "text", required: true },
      { key: "description", label: "Notes", type: "textarea" },
      { key: "status",      label: "Status", type: "select", options: ["to-explore","in-progress","done"] },
    ]
  },
  notes: {
    title: "Note", icon: "📝", listEl: "notesList",
    fields: [
      { key: "folder",      label: "Folder", type: "text" },
      { key: "title",       label: "Title", type: "text", required: true },
      { key: "description", label: "Content", type: "textarea" },
      { key: "status",      label: "Status", type: "select", options: ["active","archived"] },
    ]
  },
  calendar: {
    title: "Event", icon: "📅", listEl: "calendarList",
    fields: [
      { key: "title",       label: "Event Title", type: "text", required: true },
      { key: "event_date",  label: "Date", type: "date", required: true },
      { key: "event_time",  label: "Time", type: "time" },
      { key: "description", label: "Description", type: "textarea" },
      { key: "status",      label: "Status", type: "select", options: ["upcoming","done"] },
    ]
  },
  achievements: {
    title: "Achievement", icon: "🏆", listEl: "achievementsList",
    fields: [
      { key: "category",    label: "Type", type: "select", options: ["streak","milestone","record"] },
      { key: "title",       label: "Title", type: "text", required: true },
      { key: "description", label: "Description", type: "textarea" },
      { key: "status",      label: "Status", type: "select", options: ["active","achieved"] },
    ]
  }
};

let activeFilters = {};
let editState = null;

/* ---------- Category tag colors ---------- */
const CAT_COLORS = {
  sleep:"cat-sleep", water:"cat-water", workout:"cat-workout",
  income:"cat-income", expense:"cat-expense", savings:"cat-savings"
};

/* ---------- Modal builder ---------- */
function openModal(moduleKey, existing = null) {
  const cfg = MODULES[moduleKey];
  const overlay = document.getElementById("modalOverlay");
  const form = document.getElementById("modalForm");
  document.getElementById("modalTitle").textContent =
    (existing ? "✏️ Edit " : "➕ Add ") + cfg.icon + " " + cfg.title;

  form.innerHTML = "";
  cfg.fields.forEach(f => {
    const row = document.createElement("div");
    row.className = "modal-form-row";
    const label = document.createElement("label");
    label.textContent = f.label;
    row.appendChild(label);
    let input;
    if (f.type === "select") {
      input = document.createElement("select");
      f.options.forEach(opt => {
        const o = document.createElement("option");
        o.value = opt; o.textContent = opt;
        input.appendChild(o);
      });
    } else if (f.type === "textarea") {
      input = document.createElement("textarea");
      input.rows = 3;
    } else {
      input = document.createElement("input");
      input.type = f.type;
    }
    input.name = f.key;
    if (f.required) input.required = true;
    if (existing && existing[f.key] !== undefined && existing[f.key] !== null)
      input.value = existing[f.key];
    row.appendChild(input);
    form.appendChild(row);
  });

  const actions = document.createElement("div");
  actions.className = "modal-actions";
  actions.innerHTML = `
    <button type="button" class="btn-secondary" id="modalCancel">Cancel</button>
    <button type="submit" class="btn-primary">${existing ? "💾 Save Changes" : "➕ Add"}</button>`;
  form.appendChild(actions);

  editState = existing ? { module: moduleKey, id: existing.id } : { module: moduleKey, id: null };
  overlay.classList.remove("hidden");
  document.getElementById("modalCancel").onclick = closeModal;
}

function closeModal() {
  document.getElementById("modalOverlay").classList.add("hidden");
  editState = null;
}

document.getElementById("modalForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const cfg = MODULES[editState.module];
  const data = {};
  cfg.fields.forEach(f => {
    const el = e.target.elements[f.key];
    let val = el.value;
    if (f.type === "number") val = val === "" ? null : parseFloat(val);
    data[f.key] = val;
  });
  if (editState.id) {
    Tables[editState.module].update(editState.id, data);
    toast("✅ Updated successfully.");
  } else {
    Tables[editState.module].add(currentUser.id, data);
    toast("✅ Added successfully!");
  }
  closeModal();
  renderAll();
});

/* ---------- Generic list renderer ---------- */
function renderList(moduleKey, containerId, filterFn = null) {
  let rows = Tables[moduleKey].all(currentUser.id);
  if (filterFn) rows = rows.filter(filterFn);
  const container = document.getElementById(containerId);
  if (!rows.length) {
    container.innerHTML = `<div class="empty-state"><span class="empty-state-icon">${MODULES[moduleKey].icon}</span>No entries yet. Click <strong>Add</strong> to create your first one.</div>`;
    return;
  }
  container.innerHTML = rows.map(r => itemRowHTML(moduleKey, r)).join("");
  container.querySelectorAll("[data-edit]").forEach(btn => {
    btn.onclick = () => {
      const row = rows.find(r => r.id === parseInt(btn.dataset.edit));
      openModal(moduleKey, row);
    };
  });
  container.querySelectorAll("[data-del]").forEach(btn => {
    btn.onclick = () => {
      if (confirm("🗑️ Delete this entry?")) {
        Tables[moduleKey].delete(parseInt(btn.dataset.del));
        toast("🗑️ Deleted.", "error");
        renderAll();
      }
    };
  });
}

function itemRowHTML(moduleKey, r) {
  const date = (r.created_date || "").slice(0, 10);
  const catClass = CAT_COLORS[r.category] || "";
  let tags = "";
  if (r.category) tags += `<span class="item-tag ${catClass}">${r.category}</span>`;
  if (r.status)   tags += `<span class="item-tag">${r.status}</span>`;
  if (r.amount !== undefined && r.amount !== null)
    tags += `<span class="item-tag" style="color:var(--accent-4);">💲${r.amount}</span>`;
  if (r.value !== undefined && r.value !== null)
    tags += `<span class="item-tag">${r.value}${r.unit ? " " + r.unit : ""}</span>`;
  if (r.folder) tags += `<span class="item-tag" style="color:var(--accent-5);">📁 ${escapeHTML(r.folder)}</span>`;

  let progressBar = "";
  if (r.progress !== undefined && r.progress !== null) {
    progressBar = `<div class="progress-bar"><div class="progress-fill" style="width:${Math.min(100, r.progress)}%"></div></div>`;
  }
  return `
    <div class="item-row">
      <div class="item-main">
        <strong>${escapeHTML(r.title || "(untitled)")}</strong>
        ${r.description ? `<span class="sub">${escapeHTML(r.description.slice(0, 80))}${r.description.length > 80 ? "…" : ""}</span>` : ""}
        <div class="item-tags">${tags}</div>
        ${progressBar}
        <span class="sub" style="margin-top:4px;display:block;">📆 ${date}</span>
      </div>
      <div class="item-actions">
        <button class="btn-secondary" data-edit="${r.id}">✏️</button>
        <button class="btn-danger" data-del="${r.id}">🗑️</button>
      </div>
    </div>`;
}

function escapeHTML(str) {
  return String(str || "").replace(/[&<>"']/g, c =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

/* ======================================================
   PAGE RENDERERS
   ====================================================== */
function renderHealth() {
  const cat = activeFilters.health || "all";
  renderList("health", "healthList", cat === "all" ? null : r => r.category === cat);
  const rows = Tables.health.all(currentUser.id);
  const sleep   = rows.filter(r => r.category === "sleep");
  const water   = rows.filter(r => r.category === "water");
  const workout = rows.filter(r => r.category === "workout");
  const weight  = rows.filter(r => r.category === "weight");
  document.getElementById("healthSummary").innerHTML = `
    <div class="card glass card-glow-purple"><h3>😴 Avg Sleep</h3><p class="big-stat">${avg(sleep,"value")}</p><p class="muted">hours/night</p></div>
    <div class="card glass card-glow-blue"><h3>💧 Avg Water</h3><p class="big-stat">${avg(water,"value")}</p><p class="muted">glasses/day</p></div>
    <div class="card glass card-glow-pink"><h3>🏋️ Workouts</h3><p class="big-stat">${workout.length}</p><p class="muted">sessions logged</p></div>
    <div class="card glass card-glow-orange"><h3>⚖️ Latest Weight</h3><p class="big-stat">${weight.length ? weight[0].value : "--"}</p><p class="muted">${weight.length ? (weight[0].unit||"") : "no data"}</p></div>`;
}

function avg(rows, key) {
  if (!rows.length) return "--";
  return (rows.reduce((s, r) => s + (r[key] || 0), 0) / rows.length).toFixed(1);
}

function renderGoals() {
  const cat = activeFilters.goals || "all";
  renderList("goals", "goalsList", cat === "all" ? null : r => r.category === cat);
}

function renderMoney() {
  const cat = activeFilters.money || "all";
  renderList("money", "moneyList", cat === "all" ? null : r => r.category === cat);
  const rows    = Tables.money.all(currentUser.id);
  const income  = sum(rows.filter(r => r.category === "income"));
  const expense = sum(rows.filter(r => r.category === "expense"));
  const savings = sum(rows.filter(r => r.category === "savings"));
  const net     = income - expense;
  document.getElementById("moneySummary").innerHTML = `
    <div class="card glass card-glow-green"><h3>📈 Total Income</h3><p class="big-stat" style="color:var(--success)">${income}</p></div>
    <div class="card glass card-glow-pink"><h3>📉 Total Expenses</h3><p class="big-stat" style="color:var(--danger)">${expense}</p></div>
    <div class="card glass card-glow-orange"><h3>🏦 Savings</h3><p class="big-stat" style="color:var(--warn)">${savings}</p></div>
    <div class="card glass card-glow-blue"><h3>💎 Net Balance</h3><p class="big-stat" style="color:${net>=0?"var(--success)":"var(--danger)"}">${net >= 0 ? "+" : ""}${net}</p></div>`;
  drawBarChart("moneyChart", [
    { label: "💰 Income",  value: income,  color: "#3ddc97" },
    { label: "💸 Expense", value: expense, color: "#ff4f7b" },
    { label: "🏦 Savings", value: savings, color: "#38b6ff" },
  ]);
}
function sum(rows) { return Math.round(rows.reduce((s, r) => s + (r.amount || 0), 0)); }

function renderSkills()       { renderList("skills","skillsList"); }
function renderCareer()       { const c = activeFilters.career||"all"; renderList("career","careerList", c==="all"?null:r=>r.category===c); }
function renderFuture()       { const c = activeFilters.future||"all"; renderList("future","futureList", c==="all"?null:r=>r.category===c); }
function renderExplore()      { const c = activeFilters.explore||"all"; renderList("explore","exploreList", c==="all"?null:r=>r.category===c); }

function renderNotes() {
  const term = (document.getElementById("notesSearch").value || "").trim().toLowerCase();
  if (term) renderList("notes","notesList", r => (r.title||"").toLowerCase().includes(term) || (r.description||"").toLowerCase().includes(term));
  else renderList("notes","notesList");
}

function renderAchievementsPage() {
  renderList("achievements","achievementsList");
  const streak = AI.currentStreak(currentUser.id);
  document.getElementById("achStreak").textContent = streak + " 🔥";
  document.getElementById("achMilestones").textContent = Tables.goals.all(currentUser.id).filter(g=>g.status==="completed").length;
  const total = ["health","goals","money","skills","career","future","explore","notes","calendar","achievements"]
    .reduce((s,t) => s + Tables[t].all(currentUser.id).length, 0);
  document.getElementById("achTotal").textContent = total;
}

/* ---------- Calendar ---------- */
function renderCalendar() {
  renderList("calendar","calendarList");
  const rows  = Tables.calendar.all(currentUser.id);
  const today = new Date();
  const year  = today.getFullYear(), month = today.getMonth();
  const firstDay     = new Date(year, month, 1).getDay();
  const daysInMonth  = new Date(year, month+1, 0).getDate();
  const byDate = {};
  rows.forEach(r => { if(r.event_date) (byDate[r.event_date]=byDate[r.event_date]||[]).push(r); });

  const monthName = today.toLocaleDateString(undefined,{month:"long",year:"numeric"});
  let html = `<div style="font-weight:800;font-size:1rem;margin-bottom:12px;color:var(--accent);">📅 ${monthName}</div>`;
  html += `<div class="calendar-grid">`;
  ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].forEach(d =>
    html += `<div class="cal-header-cell">${d}</div>`);
  for(let i=0;i<firstDay;i++) html += `<div class="cal-cell"></div>`;
  for(let d=1;d<=daysInMonth;d++){
    const ds = `${year}-${String(month+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
    const isToday = d===today.getDate();
    const evs = byDate[ds]||[];
    html += `<div class="cal-cell${isToday?" today":""}">
      <div class="cal-day-num">${d}</div>
      ${evs.map(e=>`<div class="cal-event">• ${escapeHTML(e.title)}</div>`).join("")}
    </div>`;
  }
  html += `</div>`;
  document.getElementById("calendarView").innerHTML = html;
}

/* ---------- Dashboard ---------- */
function renderDashboard() {
  const now = new Date();
  document.getElementById("todayDate").innerHTML =
    `<strong>${now.toLocaleDateString(undefined,{weekday:"long"})}</strong><br>${now.toLocaleDateString(undefined,{month:"long",day:"numeric",year:"numeric"})}`;

  const level = AI.lifeLevel(currentUser.id);
  document.getElementById("lifeLevelText").textContent = level + "%";
  drawRing("lifeLevelRing", level);
  document.getElementById("streakStat").textContent = AI.currentStreak(currentUser.id) + " 🔥";

  const upcoming = Tables.calendar.all(currentUser.id)
    .filter(e => e.event_date >= now.toISOString().slice(0,10))
    .sort((a,b) => (a.event_date||"").localeCompare(b.event_date||""))
    .slice(0,5);
  document.getElementById("upcomingTasks").innerHTML = upcoming.length
    ? upcoming.map(e => `<div>📍 <strong>${escapeHTML(e.title)}</strong> — ${e.event_date}</div>`).join("")
    : `<div style="color:var(--text-2);">No upcoming events yet.</div>`;

  // AI snapshot on dashboard
  const sug = AI.suggestions(currentUser.id).slice(0,4);
  document.getElementById("aiSnapshotList").innerHTML = sug.map(s =>
    `<div style="padding:8px 0;border-bottom:1px solid var(--glass-border);font-size:0.82rem;">
      <span style="color:var(--accent);font-size:0.7rem;font-weight:700;">${s.area}</span>
      <p style="margin:3px 0 0;color:var(--text-2);">${escapeHTML(s.tip)}</p>
    </div>`).join("") || `<p class="muted">Add data to see AI insights.</p>`;

  const a = AI.analyze(currentUser.id,"weekly");
  drawBarChart("dashboardChart",[
    { label:"🎯 Goals",  value: a.goalProgressAvg,  color:"#38b6ff" },
    { label:"⚡ Skills", value: a.skillProgressAvg,  color:"#7c5cff" },
    { label:"😴 Sleep",  value: a.avgSleep ? Math.round((a.avgSleep/8)*100):0, color:"#3ddc97" },
    { label:"💧 Water",  value: a.avgWater ? Math.round((a.avgWater/8)*100):0, color:"#ff6b9d" },
  ]);
}

/* ---------- Canvas charts ---------- */
function drawRing(canvasId, percent) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const cx = canvas.width/2, cy = canvas.height/2, r = 50;
  ctx.clearRect(0,0,canvas.width,canvas.height);
  // Track
  ctx.lineWidth = 11; ctx.strokeStyle = "rgba(255,255,255,0.07)";
  ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.stroke();
  // Glow fill
  const grad = ctx.createLinearGradient(0,0,canvas.width,0);
  grad.addColorStop(0,"#38b6ff"); grad.addColorStop(0.5,"#7c5cff"); grad.addColorStop(1,"#ff6b9d");
  ctx.strokeStyle = grad; ctx.lineCap = "round";
  ctx.beginPath(); ctx.arc(cx,cy,r,-Math.PI/2,-Math.PI/2+(percent/100)*Math.PI*2); ctx.stroke();
}

function drawBarChart(canvasId, data) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const dpr = window.devicePixelRatio||1;
  const w = canvas.clientWidth||320, h = parseInt(canvas.getAttribute("height"))||160;
  canvas.width  = w * dpr;
  canvas.height = h * dpr;
  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);
  ctx.clearRect(0,0,w,h);
  const max = Math.max(10,...data.map(d=>d.value));
  const bw = Math.min(50, (w / (data.length * 2.5)));
  data.forEach((d,i) => {
    const bh = Math.max(4, (d.value/max)*(h-38));
    const x  = (i * (w / data.length)) + (w/data.length - bw)/2;
    const y  = h - bh - 24;
    const grad = ctx.createLinearGradient(0,y,0,y+bh);
    grad.addColorStop(0, d.color);
    grad.addColorStop(1, d.color + "66");
    ctx.fillStyle = grad;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x,y,bw,bh,6);
    else ctx.rect(x,y,bw,bh);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.font = `bold ${Math.min(11,bw*0.7)}px sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText(d.label, x+bw/2, h-8);
    ctx.fillStyle = d.color;
    ctx.font = `bold 11px sans-serif`;
    ctx.fillText(Math.round(d.value), x+bw/2, y-5);
  });
}

/* ---------- AI Hub renderers ---------- */
function renderAIAnalysis(range="daily") {
  const a = AI.analyze(currentUser.id, range);
  document.getElementById("aiAnalysisGrid").innerHTML = `
    <div class="card glass card-glow-purple"><h3>😴 Avg Sleep</h3><p class="big-stat">${a.avgSleep!==null?a.avgSleep.toFixed(1)+"h":"--"}</p></div>
    <div class="card glass card-glow-blue"><h3>💧 Avg Water</h3><p class="big-stat">${a.avgWater!==null?a.avgWater.toFixed(1)+" gl":"--"}</p></div>
    <div class="card glass card-glow-pink"><h3>🏋️ Workouts</h3><p class="big-stat">${a.workoutCount}</p></div>
    <div class="card glass card-glow-green"><h3>📈 Income</h3><p class="big-stat" style="color:var(--success)">${a.income}</p></div>
    <div class="card glass card-glow-pink"><h3>📉 Expenses</h3><p class="big-stat" style="color:var(--danger)">${a.expense}</p></div>
    <div class="card glass card-glow-orange"><h3>💎 Net</h3><p class="big-stat" style="color:${a.net>=0?"var(--success)":"var(--danger)"}">${a.net>=0?"+":""}${a.net}</p></div>
    <div class="card glass card-glow-blue"><h3>🎯 Goal Progress</h3><p class="big-stat">${a.goalProgressAvg}%</p></div>
    <div class="card glass card-glow-purple"><h3>⚡ Skill Progress</h3><p class="big-stat">${a.skillProgressAvg}%</p></div>
    <div class="card glass card-glow-green"><h3>📊 Entries Logged</h3><p class="big-stat">${a.entriesLogged}</p></div>`;
}

function renderAISuggestions() {
  const sug = AI.suggestions(currentUser.id);
  const areaColors = {Health:"#ff6b9d", Money:"#3ddc97", Skills:"#38b6ff", Productivity:"#ffb547"};
  document.getElementById("aiSuggestionsList").innerHTML = sug.map(s => `
    <div class="card glass suggestion-card" style="border-left:3px solid ${areaColors[s.area]||"var(--accent)"};">
      <div class="area" style="color:${areaColors[s.area]||"var(--accent)"};">${s.area}</div>
      <p>${escapeHTML(s.tip)}</p>
    </div>`).join("");
}

function renderLearnHub(subject="English") {
  const icons = {English:"🗣️", Finance:"💹", Technology:"💻", Productivity:"⚡"};
  document.getElementById("learnContent").innerHTML = LEARN_HUB[subject].map(l => `
    <div class="card glass card-glow-blue">
      <h3>${icons[subject]||"📚"} ${escapeHTML(l.title)}</h3>
      <p style="color:var(--text-2);font-size:0.84rem;line-height:1.6;">${escapeHTML(l.body)}</p>
    </div>`).join("");
}

/* ---------- Global search ---------- */
function globalSearch(term) {
  const box = document.getElementById("searchResults");
  if (!term.trim()) { box.classList.add("hidden"); return; }
  let html = "";
  Object.keys(Tables).forEach(t => {
    const rows = Tables[t].search(currentUser.id, term);
    if (rows.length) {
      html += `<h4 style="margin:8px 0 6px;color:var(--accent);text-transform:capitalize;">
        ${MODULES[t]?.icon||"📁"} ${t} <span style="color:var(--text-2);font-size:0.8rem;">(${rows.length})</span></h4>`;
      rows.slice(0,5).forEach(r =>
        html += `<div class="item-row" style="margin-bottom:6px;">
          <div class="item-main">
            <strong>${escapeHTML(r.title||"")}</strong>
            <span class="sub">${escapeHTML((r.description||"").slice(0,80))}</span>
          </div>
        </div>`);
    }
  });
  box.innerHTML = html || `<div class="empty-state">🔍 No results found for "${escapeHTML(term)}".</div>`;
  box.classList.remove("hidden");
}

/* ---------- Render all ---------- */
function renderAll() {
  renderDashboard();
  renderHealth();
  renderGoals();
  renderMoney();
  renderSkills();
  renderCareer();
  renderFuture();
  renderExplore();
  renderNotes();
  renderCalendar();
  renderAchievementsPage();
  renderAIAnalysis(document.querySelector('[data-range].active')?.dataset.range || "daily");
  renderAISuggestions();
  renderLearnHub(document.querySelector('[data-subject].active')?.dataset.subject || "English");
}

/* ======================================================
   EVENT WIRING
   ====================================================== */
function wireNav() {
  document.querySelectorAll(".nav-btn[data-page]").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".nav-btn[data-page]").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
      document.getElementById(`page-${btn.dataset.page}`).classList.add("active");
      document.getElementById("sidebar").classList.remove("open");
    });
  });

  document.getElementById("menuToggle").onclick = () =>
    document.getElementById("sidebar").classList.toggle("open");

  document.getElementById("logoutBtn").onclick = () => {
    if (confirm("🚪 Log out?")) { logoutUser(); location.reload(); }
  };

  document.getElementById("helpBtn").onclick = () =>
    document.getElementById("welcomePopup").classList.remove("hidden");

  document.getElementById("themeToggle").onclick = cycleTheme;
  document.getElementById("dataBtn").onclick = showDataPopup;

  // Add buttons
  document.querySelectorAll("[data-add]").forEach(btn =>
    btn.addEventListener("click", () => openModal(btn.dataset.add)));
  document.querySelectorAll("[data-quick]").forEach(btn =>
    btn.addEventListener("click", () => openModal(btn.dataset.quick)));

  // Category filter pills
  document.querySelectorAll(".tabs-row").forEach(row => {
    row.querySelectorAll(".tab-pill[data-cat]").forEach(pill => {
      pill.addEventListener("click", () => {
        row.querySelectorAll(".tab-pill[data-cat]").forEach(p => p.classList.remove("active"));
        pill.classList.add("active");
        const section = pill.closest(".page").id.replace("page-","");
        activeFilters[section] = pill.dataset.cat;
        renderAll();
      });
    });
  });

  // AI sub-tabs
  document.querySelectorAll(".tab-pill[data-aitab]").forEach(pill => {
    pill.addEventListener("click", () => {
      document.querySelectorAll(".tab-pill[data-aitab]").forEach(p => p.classList.remove("active"));
      pill.classList.add("active");
      document.querySelectorAll(".ai-panel").forEach(p => p.classList.add("hidden"));
      document.getElementById(`ai-${pill.dataset.aitab}`).classList.remove("hidden");
    });
  });
  document.querySelectorAll(".tab-pill[data-range]").forEach(pill => {
    pill.addEventListener("click", () => {
      document.querySelectorAll(".tab-pill[data-range]").forEach(p => p.classList.remove("active"));
      pill.classList.add("active");
      renderAIAnalysis(pill.dataset.range);
    });
  });
  document.querySelectorAll(".tab-pill[data-subject]").forEach(pill => {
    pill.addEventListener("click", () => {
      document.querySelectorAll(".tab-pill[data-subject]").forEach(p => p.classList.remove("active"));
      pill.classList.add("active");
      renderLearnHub(pill.dataset.subject);
    });
  });

  document.getElementById("globalSearch").addEventListener("input", e => globalSearch(e.target.value));
  document.getElementById("notesSearch").addEventListener("input", renderNotes);

  document.getElementById("modalOverlay").addEventListener("click", e => {
    if (e.target.id === "modalOverlay") closeModal();
  });
  document.getElementById("modalCloseBtn").onclick = closeModal;

  // Close sidebar when clicking outside on mobile
  document.addEventListener("click", e => {
    const sidebar = document.getElementById("sidebar");
    if (sidebar.classList.contains("open") && !sidebar.contains(e.target) && e.target.id !== "menuToggle") {
      sidebar.classList.remove("open");
    }
  });
}

/* ---------- Auth wiring ---------- */
function wireAuth() {
  document.querySelectorAll(".auth-tab").forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".auth-tab").forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      document.getElementById("loginForm").classList.toggle("hidden", tab.dataset.tab !== "login");
      document.getElementById("registerForm").classList.toggle("hidden", tab.dataset.tab !== "register");
    });
  });

  document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const u = document.getElementById("loginUsername").value.trim();
    const p = document.getElementById("loginPassword").value;
    const res = await loginUser(u, p);
    const msg = document.getElementById("loginMsg");
    if (res.ok) { msg.textContent = ""; enterApp(); }
    else { msg.textContent = "❌ " + res.message; }
  });

  document.getElementById("registerForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const u = document.getElementById("registerUsername").value.trim();
    const p = document.getElementById("registerPassword").value;
    const res = await registerUser(u, p);
    const msg = document.getElementById("registerMsg");
    if (res.ok) {
      msg.style.color = "var(--success)";
      msg.textContent = "✅ Account created! You can log in now.";
      document.querySelector('.auth-tab[data-tab="login"]').click();
    } else {
      msg.style.color = "var(--danger)";
      msg.textContent = "❌ " + res.message;
    }
  });
}

/* ---------- Enter app ---------- */
function enterApp() {
  document.getElementById("authScreen").classList.add("hidden");
  document.getElementById("appShell").classList.remove("hidden");
  document.getElementById("welcomeUser").textContent = `👤 ${currentUser.username}`;
  document.getElementById("sidebarUserBadge").textContent = `👤 ${currentUser.username}`;
  renderAll();
  showWelcomePopup();
  // Periodic export reminder (every ~10 minutes in session)
  setTimeout(() => toast("💾 Reminder: Export your data to keep a backup!", "warn"), 10 * 60 * 1000);
}

/* ---------- Boot ---------- */
(async function boot() {
  restoreTheme();
  startRain();
  await initDatabase();
  initWelcomePopup();
  initDataPopup();
  wireAuth();
  wireNav();
  if (restoreSession()) enterApp();
})();
