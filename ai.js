/* ============================================================
   LIFE BLUEPRINT OS — ai.js
   100% local, rule-based "AI". No external APIs.
   Reads real rows from the SQLite tables and generates
   suggestions/analysis using if/else rules and simple stats.
   ============================================================ */

const AI = {

  /* ---------- Helpers ---------- */
  daysAgo(n) {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d.toISOString().slice(0, 10);
  },

  isWithin(dateStr, days) {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return d >= cutoff;
  },

  /* ---------- Daily / Weekly / Monthly analysis ---------- */
  analyze(userId, range) {
    const days = range === "daily" ? 1 : range === "weekly" ? 7 : 30;
    const health = Tables.health.all(userId).filter(r => this.isWithin(r.created_date, days));
    const money = Tables.money.all(userId).filter(r => this.isWithin(r.created_date, days));
    const goals = Tables.goals.all(userId);
    const skills = Tables.skills.all(userId);

    const water = health.filter(h => h.category === "water");
    const sleep = health.filter(h => h.category === "sleep");
    const workout = health.filter(h => h.category === "workout");

    const avgWater = water.length ? (water.reduce((s, r) => s + (r.value || 0), 0) / water.length) : null;
    const avgSleep = sleep.length ? (sleep.reduce((s, r) => s + (r.value || 0), 0) / sleep.length) : null;
    const workoutCount = workout.length;

    const income = money.filter(m => m.category === "income").reduce((s, r) => s + (r.amount || 0), 0);
    const expense = money.filter(m => m.category === "expense").reduce((s, r) => s + (r.amount || 0), 0);
    const savings = money.filter(m => m.category === "savings").reduce((s, r) => s + (r.amount || 0), 0);

    const goalProgressAvg = goals.length ? Math.round(goals.reduce((s, g) => s + (g.progress || 0), 0) / goals.length) : 0;
    const skillProgressAvg = skills.length ? Math.round(skills.reduce((s, g) => s + (g.progress || 0), 0) / skills.length) : 0;

    return {
      range, avgWater, avgSleep, workoutCount,
      income, expense, savings, net: income - expense,
      goalProgressAvg, skillProgressAvg,
      entriesLogged: health.length + money.length
    };
  },

  /* ---------- Life Level score (0-100) used on Dashboard ---------- */
  lifeLevel(userId) {
    const a = this.analyze(userId, "weekly");
    let score = 0, max = 0;

    max += 25; if (a.avgSleep !== null) score += Math.min(25, (a.avgSleep / 8) * 25);
    max += 20; if (a.avgWater !== null) score += Math.min(20, (a.avgWater / 8) * 20);
    max += 15; score += Math.min(15, a.workoutCount * 3);
    max += 20; score += Math.min(20, (a.goalProgressAvg / 100) * 20);
    max += 10; score += Math.min(10, (a.skillProgressAvg / 100) * 10);
    max += 10; if (a.net >= 0) score += 10; else score += Math.max(0, 10 + (a.net / 100));

    return Math.max(0, Math.min(100, Math.round((score / max) * 100)));
  },

  /* ---------- Suggestions (rule-based, reacts to real data) ---------- */
  suggestions(userId) {
    const a = this.analyze(userId, "weekly");
    const out = [];

    // Health
    if (a.avgWater === null) out.push({ area: "Health", tip: "No water intake logged this week — start tracking to get personalized hydration advice." });
    else if (a.avgWater < 6) out.push({ area: "Health", tip: `Your average water intake is ${a.avgWater.toFixed(1)} glasses/day — try to reach 8 for better energy and focus.` });
    else out.push({ area: "Health", tip: `Great hydration habits! Averaging ${a.avgWater.toFixed(1)} glasses/day.` });

    if (a.avgSleep === null) out.push({ area: "Health", tip: "No sleep data logged — log your sleep to unlock real recovery insights." });
    else if (a.avgSleep < 6.5) out.push({ area: "Health", tip: `You're averaging ${a.avgSleep.toFixed(1)}h of sleep — aim for 7-9h to improve recovery and mood.` });
    else out.push({ area: "Health", tip: `Solid sleep average of ${a.avgSleep.toFixed(1)}h. Keep the consistency.` });

    if (a.workoutCount === 0) out.push({ area: "Health", tip: "No workouts logged this week — even a 20-minute walk counts. Add one today." });
    else if (a.workoutCount < 3) out.push({ area: "Health", tip: `Only ${a.workoutCount} workout(s) this week — try adding one more session.` });
    else out.push({ area: "Health", tip: `Strong activity level: ${a.workoutCount} workouts this week. Keep it up!` });

    // Money
    if (a.expense > a.income && a.income > 0) out.push({ area: "Money", tip: `Your expenses (${a.expense}) exceeded income (${a.income}) this week — review your budget planner.` });
    else if (a.income === 0 && a.expense === 0) out.push({ area: "Money", tip: "No income/expense logged this week — track transactions to see real spending insights." });
    else out.push({ area: "Money", tip: `Net this week: ${a.net >= 0 ? "+" : ""}${a.net}. ${a.net >= 0 ? "You're in the green." : "Consider trimming non-essential expenses."}` });

    if (a.savings === 0) out.push({ area: "Money", tip: "No savings logged this week — even small, consistent saving builds long-term security." });

    // Skills
    if (a.skillProgressAvg === 0) out.push({ area: "Skills", tip: "No skill progress logged — update your active skills to track real growth." });
    else if (a.skillProgressAvg < 40) out.push({ area: "Skills", tip: `Average skill progress is ${a.skillProgressAvg}% — pick one skill to focus on this week.` });
    else out.push({ area: "Skills", tip: `Skill progress averaging ${a.skillProgressAvg}% — you're building real momentum.` });

    // Productivity (goals)
    if (a.goalProgressAvg === 0) out.push({ area: "Productivity", tip: "Your goals show 0% average progress — break one goal into a small first step today." });
    else if (a.goalProgressAvg < 50) out.push({ area: "Productivity", tip: `Goals are at ${a.goalProgressAvg}% average progress — momentum is building, keep going.` });
    else out.push({ area: "Productivity", tip: `Goals averaging ${a.goalProgressAvg}% progress — you're closer than you think.` });

    return out;
  },

  /* ---------- Streak calculation for Achievements ---------- */
  currentStreak(userId) {
    const all1 = [
      ...Tables.health.all(userId), ...Tables.money.all(userId),
      ...Tables.goals.all(userId), ...Tables.skills.all(userId),
      ...Tables.notes.all(userId)
    ];
    const dateSet = new Set(all1.map(r => (r.created_date || "").slice(0, 10)));
    let streak = 0;
    let cursor = new Date();
    while (true) {
      const key = cursor.toISOString().slice(0, 10);
      if (dateSet.has(key)) {
        streak++;
        cursor.setDate(cursor.getDate() - 1);
      } else break;
    }
    return streak;
  }
};

/* ---------- AI Learn Hub static lesson content (local, no API) ---------- */
const LEARN_HUB = {
  English: [
    { title: "5 Words to Sound More Confident", body: "Replace 'maybe' with 'I recommend', replace 'I think' with 'My assessment is'. Confident word choice changes how others perceive your ideas." },
    { title: "Active vs Passive Voice", body: "Active: 'I finished the report.' Passive: 'The report was finished by me.' Active voice is clearer and more direct — use it in professional writing." }
  ],
  Finance: [
    { title: "The 50/30/20 Rule", body: "Spend 50% of income on needs, 30% on wants, and 20% on savings/debt repayment. A simple framework to start budgeting." },
    { title: "Compound Interest Basics", body: "Money earning interest on interest grows exponentially over time. Starting early — even small amounts — matters more than starting big later." }
  ],
  Technology: [
    { title: "What is an API?", body: "An API lets two pieces of software talk to each other through a defined set of rules — like a menu of requests you can make to a service." },
    { title: "Cloud Storage Basics", body: "Cloud storage saves your files on remote servers instead of your device, accessible anywhere with internet — examples include Drive, Dropbox, iCloud." }
  ],
  Productivity: [
    { title: "The 2-Minute Rule", body: "If a task takes less than 2 minutes, do it immediately instead of postponing it — it prevents small tasks from piling up." },
    { title: "Time Blocking", body: "Assign specific blocks of time to specific tasks on your calendar instead of working from an open-ended to-do list — it reduces decision fatigue." }
  ]
};
