/* ═══════════════════════════════════════════════════════════
   HABIT TRACKER — APPLICATION LOGIC
   Complete vanilla JS application with localStorage persistence
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  // ── Utility Helpers ──

  /** Generate a unique ID */
  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  /** Get today's date as YYYY-MM-DD */
  function todayKey() {
    return new Date().toISOString().slice(0, 10);
  }

  /** Format a date string for display */
  function formatDate(d) {
    const date = new Date(d + 'T00:00:00');
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  }

  /** Format time for display (e.g., "05:30" -> "5:30 AM") */
  function formatTime(t) {
    if (!t) return '';
    const [h, m] = t.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hr = h % 12 || 12;
    return `${hr}:${String(m).padStart(2, '0')} ${ampm}`;
  }

  /** Clamp a number between min and max */
  function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

  /** Escape HTML to prevent XSS */
  function esc(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ── Data Management ──

  const STORAGE_KEY = 'habitTracker_v1';

  const AVAILABLE_AVATARS = ['🎯', '🚀', '⚡', '🌟', '🦁', '🐨', '🐼', '🦊', '🥑', '🔥', '✨', '🎨', '📚', '💪'];

  const defaultData = {
    username: '',
    avatar: '🎯',
    habits: [],
    habitsToQuit: [],
    schedule: {},      // keyed by date
    checkpoints: [],
    hobbies: [],
    notes: [],
    history: {},       // keyed by date: { score, habitsCompleted, habitsMissed, ... }
    settings: { theme: 'light', accent: 'blue' }
  };

  function getSeedData() {
    const today = todayKey();
    const d1 = new Date(); d1.setDate(d1.getDate() - 1);
    const yesterday = d1.toISOString().slice(0, 10);
    const d2 = new Date(); d2.setDate(d2.getDate() - 2);
    const twoDaysAgo = d2.toISOString().slice(0, 10);
    const d3 = new Date(); d3.setDate(d3.getDate() - 3);
    const threeDaysAgo = d3.toISOString().slice(0, 10);

    return {
      username: '',
      habits: [
        {
          id: 'seed-h1',
          name: 'Morning Hydration & Sunlight',
          category: 'health',
          frequency: 'daily',
          color: 'green',
          targetDays: 30,
          notes: 'Drink 500ml water and get 10 mins of natural light',
          createdAt: threeDaysAgo,
          completions: { [threeDaysAgo]: true, [yesterday]: true, [today]: true }
        },
        {
          id: 'seed-h2',
          name: 'Deep Work Session (90 mins)',
          category: 'productivity',
          frequency: 'daily',
          color: 'blue',
          targetDays: 30,
          notes: 'No phone or notifications during focus blocks',
          createdAt: threeDaysAgo,
          completions: { [yesterday]: true }
        },
        {
          id: 'seed-h3',
          name: 'Read 20 Pages',
          category: 'personal',
          frequency: 'daily',
          color: 'purple',
          targetDays: 30,
          notes: 'Reading high-impact books or articles',
          createdAt: threeDaysAgo,
          completions: { [twoDaysAgo]: true, [yesterday]: true }
        },
        {
          id: 'seed-h4',
          name: '30-Min Workout or Walk',
          category: 'fitness',
          frequency: 'daily',
          color: 'orange',
          targetDays: 30,
          notes: 'Movement to stay alert and energized',
          createdAt: threeDaysAgo,
          completions: { [threeDaysAgo]: true, [twoDaysAgo]: true, [yesterday]: true }
        }
      ],
      habitsToQuit: [
        {
          id: 'seed-q1',
          name: 'Late-night phone screen time',
          reason: 'Wake up energized, avoid mental fatigue, and sleep deeply',
          quitDate: threeDaysAgo,
          lapses: {}
        }
      ],
      schedule: {
        [today]: [
          { id: 'seed-s1', time: '07:00', activity: 'Morning hydration & outdoor walk', category: 'health', notes: 'Start the day grounded', done: true },
          { id: 'seed-s2', time: '09:00', activity: 'Deep Work Block 1: High priority goals', category: 'work', notes: 'Zero distractions', done: false },
          { id: 'seed-s3', time: '13:00', activity: 'Healthy lunch & break', category: 'health', notes: 'Step away from screen', done: false },
          { id: 'seed-s4', time: '14:30', activity: 'Sprint reviews & communication', category: 'work', notes: 'Wrap key tasks', done: false },
          { id: 'seed-s5', time: '18:30', activity: 'Fitness / Movement', category: 'fitness', notes: 'Gym or jogging', done: false },
          { id: 'seed-s6', time: '21:30', activity: 'Reading & reflection', category: 'personal', notes: 'Wind down journal', done: false }
        ]
      },
      checkpoints: [
        {
          id: 'seed-cp-morning',
          name: '🌅 Morning Checkpoint (7:00 - 9:00 AM)',
          items: [
            { id: 'seed-cpi-1', label: '500ml water before coffee', completions: { [today]: true } },
            { id: 'seed-cpi-2', label: 'Identify top 3 outcomes for today', completions: { [today]: true } },
            { id: 'seed-cpi-3', label: 'No social media for first 45 minutes', completions: {} }
          ]
        },
        {
          id: 'seed-cp-afternoon',
          name: '☀️ Midday Checkpoint (12:00 - 2:00 PM)',
          items: [
            { id: 'seed-cpi-4', label: 'Complete primary deep work chunk', completions: {} },
            { id: 'seed-cpi-5', label: 'Nutritious lunch & stretch', completions: {} }
          ]
        },
        {
          id: 'seed-cp-evening',
          name: '🌙 Evening Checkpoint (8:00 - 10:00 PM)',
          items: [
            { id: 'seed-cpi-6', label: 'Log habit consistency & check timetable', completions: {} },
            { id: 'seed-cpi-7', label: 'Prepare tomorrow morning schedule', completions: {} },
            { id: 'seed-cpi-8', label: 'Screens off 30 mins before sleep', completions: {} }
          ]
        }
      ],
      hobbies: [
        {
          id: 'seed-hobby-1',
          name: 'Creative Writing & Journaling',
          targetDays: 30,
          oath: 'I solemnly commit to writing at least 200 words every evening for 30 consecutive days, prioritizing raw self-expression and creative growth over perfection.',
          completions: { [twoDaysAgo]: true, [yesterday]: true },
          startDate: threeDaysAgo,
          createdAt: threeDaysAgo,
          hasVideo: false
        }
      ],
      notes: [
        {
          id: 'seed-note-1',
          title: 'Welcome to your Personal Habit Planner',
          category: 'general',
          content: 'This application combines the flexibility of Notion with an actionable habit system.\n\n• Timetable: Keep your daily flow structured.\n• Habits to Build: Consistency over intensity.\n• Habits to Quit: Count days clean and build momentum.\n• Checkpoints: Review key moments throughout the day.\n• Hobbies: Take an oath, upload or record your personal commitment video, and build genuine mastery.',
          createdAt: threeDaysAgo,
          updatedAt: threeDaysAgo
        }
      ],
      history: {
        [threeDaysAgo]: { score: 75, habitsCompleted: 3, habitsMissed: 1, tasksCompleted: 4, tasksTotal: 5 },
        [twoDaysAgo]: { score: 80, habitsCompleted: 3, habitsMissed: 1, tasksCompleted: 5, tasksTotal: 5 },
        [yesterday]: { score: 90, habitsCompleted: 4, habitsMissed: 0, tasksCompleted: 5, tasksTotal: 6 }
      },
      settings: { theme: 'light', accent: 'blue' }
    };
  }

  let data = {};

  function loadData() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        data = { ...defaultData, ...JSON.parse(raw) };
      } else {
        // Fresh start — clean slate
        data = JSON.parse(JSON.stringify(defaultData));
      }
    } catch {
      data = JSON.parse(JSON.stringify(defaultData));
    }
    // Ensure sub-objects exist
    if (!data.schedule) data.schedule = {};
    if (!data.history) data.history = {};
    if (!data.settings) data.settings = { theme: 'light', accent: 'blue' };
    if (!Array.isArray(data.habits)) data.habits = [];
    if (!Array.isArray(data.habitsToQuit)) data.habitsToQuit = [];
    if (!Array.isArray(data.checkpoints)) data.checkpoints = [];
    if (!Array.isArray(data.hobbies)) data.hobbies = [];
    if (!Array.isArray(data.notes)) data.notes = [];
    if (!data.avatar) data.avatar = '🎯';

    // Auto-clean legacy seed demo items so they don't hinder the user's real planner
    data.habits = data.habits.filter(h => !String(h.id).startsWith('seed-'));
    data.habitsToQuit = data.habitsToQuit.filter(h => !String(h.id).startsWith('seed-'));
    if (data.schedule && typeof data.schedule === 'object') {
      for (const k in data.schedule) {
        if (Array.isArray(data.schedule[k])) {
          data.schedule[k] = data.schedule[k].filter(s => !String(s.id).startsWith('seed-'));
        }
        if (data.schedule[k].length === 0) delete data.schedule[k];
      }
    }
    data.checkpoints = data.checkpoints.filter(cp => !String(cp.id).startsWith('seed-'));
    data.hobbies = data.hobbies.filter(hb => !String(hb.id).startsWith('seed-'));
    data.notes = data.notes.filter(n => !String(n.id).startsWith('seed-'));
  }

  /** Explicitly purge sample data and refresh views */
  function purgeSeedData() {
    data.habits = (data.habits || []).filter(h => !String(h.id).startsWith('seed-'));
    data.habitsToQuit = (data.habitsToQuit || []).filter(h => !String(h.id).startsWith('seed-'));
    if (data.schedule) {
      for (const k in data.schedule) {
        if (Array.isArray(data.schedule[k])) {
          data.schedule[k] = data.schedule[k].filter(s => !String(s.id).startsWith('seed-'));
        }
        if (data.schedule[k].length === 0) delete data.schedule[k];
      }
    }
    data.checkpoints = (data.checkpoints || []).filter(cp => !String(cp.id).startsWith('seed-'));
    data.hobbies = (data.hobbies || []).filter(hb => !String(hb.id).startsWith('seed-'));
    data.notes = (data.notes || []).filter(n => !String(n.id).startsWith('seed-'));
    saveData();
    updateSidebarChip();
    renderPage(currentPage);
    showToast('Sample data removed! Your habit tracker is completely clean.');
  }

  function saveData() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save data:', e);
    }
  }

  // ── IndexedDB for Videos ──

  let videoDB = null;
  const VIDEO_DB_NAME = 'habitTrackerVideos';
  const VIDEO_STORE = 'videos';

  function openVideoDB() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(VIDEO_DB_NAME, 1);
      req.onupgradeneeded = () => {
        req.result.createObjectStore(VIDEO_STORE, { keyPath: 'id' });
      };
      req.onsuccess = () => { videoDB = req.result; resolve(videoDB); };
      req.onerror = () => reject(req.error);
    });
  }

  function saveVideo(id, blob) {
    return new Promise((resolve, reject) => {
      const tx = videoDB.transaction(VIDEO_STORE, 'readwrite');
      tx.objectStore(VIDEO_STORE).put({ id, blob, savedAt: Date.now() });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  function getVideo(id) {
    return new Promise((resolve, reject) => {
      const tx = videoDB.transaction(VIDEO_STORE, 'readonly');
      const req = tx.objectStore(VIDEO_STORE).get(id);
      req.onsuccess = () => resolve(req.result ? req.result.blob : null);
      req.onerror = () => reject(req.error);
    });
  }

  function deleteVideo(id) {
    return new Promise((resolve, reject) => {
      const tx = videoDB.transaction(VIDEO_STORE, 'readwrite');
      tx.objectStore(VIDEO_STORE).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  // ── DOM References ──

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  // ── Navigation ──

  let currentPage = 'dashboard';

  function navigateTo(page) {
    currentPage = page;
    $$('.page').forEach(p => p.classList.remove('active'));
    const target = $(`#page-${page}`);
    if (target) target.classList.add('active');

    $$('.nav-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.page === page);
    });

    // Close mobile sidebar
    $('#sidebar').classList.remove('open');
    $('#sidebar-overlay').classList.remove('open');

    // Render the page
    renderPage(page);
  }

  function renderPage(page) {
    switch (page) {
      case 'dashboard': renderDashboard(); break;
      case 'timetable': renderTimetable(); break;
      case 'habits': renderHabits(); break;
      case 'quit-habits': renderQuitHabits(); break;
      case 'checkpoints': renderCheckpoints(); break;
      case 'hobbies': renderHobbies(); break;
      case 'notes': renderNotes(); break;
      case 'progress': renderProgress(); break;
      case 'history': renderHistory(); break;
      case 'settings': renderSettings(); break;
    }
  }

  // ── Modal System ──

  function openModal(title, bodyHTML, footerHTML) {
    $('#modal-title').textContent = title;
    $('#modal-body').innerHTML = bodyHTML;
    $('#modal-footer').innerHTML = footerHTML || '';
    $('#modal-overlay').classList.add('open');
    $('#modal-overlay').setAttribute('aria-hidden', 'false');
    // Focus first input
    setTimeout(() => {
      const firstInput = $('#modal-body input, #modal-body textarea, #modal-body select');
      if (firstInput) firstInput.focus();
    }, 100);
  }

  function closeModal() {
    if (window._activeModalCleanup) {
      try { window._activeModalCleanup(); } catch (e) {}
      window._activeModalCleanup = null;
    }
    $('#modal-overlay').classList.remove('open');
    $('#modal-overlay').setAttribute('aria-hidden', 'true');
  }

  function showConfirm(title, message) {
    return new Promise((resolve) => {
      $('#confirm-title').textContent = title;
      $('#confirm-message').textContent = message;
      $('#confirm-overlay').classList.add('open');
      const ok = $('#confirm-ok');
      const cancel = $('#confirm-cancel');
      function cleanup() {
        ok.removeEventListener('click', onOk);
        cancel.removeEventListener('click', onCancel);
        $('#confirm-overlay').classList.remove('open');
      }
      function onOk() { cleanup(); resolve(true); }
      function onCancel() { cleanup(); resolve(false); }
      ok.addEventListener('click', onOk);
      cancel.addEventListener('click', onCancel);
    });
  }

  // ── Streak Calculation ──

  /**
   * Calculate current and best streak from a completions object.
   * completions: { 'YYYY-MM-DD': true/false, ... }
   * Returns { current, best }
   */
  function calculateStreak(completions) {
    if (!completions || typeof completions !== 'object') return { current: 0, best: 0 };

    const dates = Object.keys(completions).filter(d => completions[d]).sort();
    if (dates.length === 0) return { current: 0, best: 0 };

    let best = 1, current = 1;
    // Calculate best streak
    for (let i = 1; i < dates.length; i++) {
      const prev = new Date(dates[i - 1] + 'T00:00:00');
      const curr = new Date(dates[i] + 'T00:00:00');
      const diff = (curr - prev) / (1000 * 60 * 60 * 24);
      if (diff === 1) {
        current++;
        best = Math.max(best, current);
      } else {
        current = 1;
      }
    }
    best = Math.max(best, current);

    // Calculate current streak from today backwards
    const today = todayKey();
    let checkDate = today;
    let curStreak = 0;

    // Check if today is completed
    if (completions[today]) {
      curStreak = 1;
      let d = new Date(today + 'T00:00:00');
      while (true) {
        d.setDate(d.getDate() - 1);
        const key = d.toISOString().slice(0, 10);
        if (completions[key]) {
          curStreak++;
        } else {
          break;
        }
      }
    } else {
      // Check from yesterday
      let d = new Date(today + 'T00:00:00');
      d.setDate(d.getDate() - 1);
      while (true) {
        const key = d.toISOString().slice(0, 10);
        if (completions[key]) {
          curStreak++;
          d.setDate(d.getDate() - 1);
        } else {
          break;
        }
      }
    }

    return { current: curStreak, best };
  }

  // ── Daily Score Calculation ──

  function calculateDailyScore(date) {
    const dk = date || todayKey();
    let total = 0, completed = 0;

    // Timetable
    const sched = data.schedule[dk] || [];
    sched.forEach(s => { total++; if (s.done) completed++; });

    // Habits to build
    data.habits.forEach(h => {
      total++;
      if (h.completions && h.completions[dk]) completed++;
    });

    // Habits to quit (if NOT relapsed today, that's a success)
    data.habitsToQuit.forEach(h => {
      total++;
      if (!h.relapses || !h.relapses[dk]) completed++;
    });

    // Checkpoints
    data.checkpoints.forEach(g => {
      (g.items || []).forEach(item => {
        total++;
        if (item.completions && item.completions[dk]) completed++;
      });
    });

    // Hobbies
    data.hobbies.forEach(h => {
      total++;
      if (h.completions && h.completions[dk]) completed++;
    });

    const score = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { score, completed, total };
  }

  function getScoreMessage(score) {
    if (score >= 90) return 'Outstanding! You crushed it today.';
    if (score >= 75) return 'Strong day. You completed most of your planned habits.';
    if (score >= 50) return 'Decent progress. Keep pushing forward.';
    if (score >= 25) return 'Slow start. There\'s still time to turn it around.';
    if (score > 0) return 'Every step counts. Try to get a few more done.';
    return 'Start your day strong. You\'ve got this.';
  }

  function getGreeting() {
    const h = new Date().getHours();
    if (h < 5) return 'Good night';
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  }

  // ── Overall Streak (how many consecutive days with score >= 50%) ──

  function calculateOverallStreak() {
    let streak = 0;
    const d = new Date();
    // Check today first
    const todayScore = calculateDailyScore(todayKey());
    if (todayScore.total > 0 && todayScore.score >= 50) {
      streak = 1;
    } else if (todayScore.total > 0) {
      // Today exists but is under 50%, streak is 0
      return 0;
    }
    // Go backwards
    d.setDate(d.getDate() - 1);
    for (let i = 0; i < 365; i++) {
      const key = d.toISOString().slice(0, 10);
      const s = calculateDailyScore(key);
      if (s.total > 0 && s.score >= 50) {
        streak++;
        d.setDate(d.getDate() - 1);
      } else if (s.total > 0) {
        break;
      } else {
        // No data for this day, skip
        break;
      }
    }
    return streak;
  }

  // ── Sidebar User Chip ──

  function updateSidebarChip() {
    const chip = document.getElementById('user-name-chip');
    const avatar = document.getElementById('user-avatar');
    if (!chip) return;
    const name = data.username ? data.username.trim() : '';
    chip.textContent = name || 'Set your nickname';
    if (avatar) avatar.textContent = data.avatar || '🎯';
  }

  // ═══════════════════════════════════
  // RENDER: DASHBOARD
  // ═══════════════════════════════════

  function renderDashboard() {
    const name = data.username || '';
    const greeting = getGreeting();
    $('#greeting-text').textContent = `${greeting}${name ? ', ' + name : ''}!`;
    $('#greeting-date').textContent = formatDate(todayKey());
    updateClock();
    updateSidebarChip();

    const { score, completed, total } = calculateDailyScore();
    const streak = calculateOverallStreak();

    // Score circle
    const pct = score / 100;
    const circumference = 2 * Math.PI * 52; // r=52
    const offset = circumference * (1 - pct);
    $('#score-fill').style.strokeDashoffset = offset;
    $('#score-value').textContent = score + '%';
    $('#score-message').textContent = getScoreMessage(score);

    // Stats
    let habitsDone = 0;
    data.habits.forEach(h => { if (h.completions && h.completions[todayKey()]) habitsDone++; });
    const tasksDone = (data.schedule[todayKey()] || []).filter(s => s.done).length;

    $('#stat-streak').textContent = streak;
    $('#stat-habits-done').textContent = habitsDone;
    $('#stat-tasks-done').textContent = tasksDone;

    // 7-Day Habit Flow Bar (Bright vs Dull)
    renderDashboardWeekFlow();

    // Dashboard mini-cards
    renderDashMini();

    // Save today's history
    data.history[todayKey()] = { score, completed, total };
    saveData();
  }

  function renderDashboardWeekFlow() {
    const container = document.getElementById('dash-week-days');
    if (!container) return;

    const today = new Date();
    const currentDay = today.getDay(); // 0 is Sun
    const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayOffset);

    const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const todayStr = todayKey();
    let html = '';

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateKey = d.toISOString().slice(0, 10);
      const isToday = dateKey === todayStr;
      const isPast = dateKey < todayStr;
      const { score, total } = calculateDailyScore(dateKey);

      let pillClass = 'empty';
      let badge = '–';

      if (total > 0) {
        if (score >= 80) { pillClass = 'great'; badge = '🌟 ' + score + '%'; }
        else if (score >= 60) { pillClass = 'good'; badge = '✓ ' + score + '%'; }
        else if (score >= 35) { pillClass = 'partial'; badge = score + '%'; }
        else { pillClass = 'dull'; badge = score + '%'; }
      } else if (isPast && (data.habits.length > 0 || Object.keys(data.schedule).length > 0)) {
        pillClass = 'dull';
        badge = 'Missed';
      }

      html += `
        <div class="week-flow-pill ${pillClass} ${isToday ? 'today' : ''}" data-nav-date="${dateKey}" title="${dateKey}: ${total > 0 ? score + '% completed' : 'No activity logged'}">
          <span class="wf-day">${dayLabels[i]}</span>
          <span class="wf-num">${d.getDate()}</span>
          <span class="wf-badge">${badge}</span>
        </div>
      `;
    }

    container.innerHTML = html;

    container.querySelectorAll('[data-nav-date]').forEach(pill => {
      pill.addEventListener('click', () => {
        navigateTo('history');
        renderHistoryDetail(pill.dataset.navDate);
      });
    });
  }

  function renderDashMini() {
    const today = todayKey();

    // Timetable mini
    const sched = data.schedule[today] || [];
    const ttBody = $('#dash-timetable-body');
    if (sched.length === 0) {
      ttBody.innerHTML = '<p style="color:var(--text-tertiary);font-size:13px;">No schedule for today.</p>';
    } else {
      ttBody.innerHTML = sched.slice(0, 5).map(s => `
        <div class="dash-mini-item">
          <span class="check-indicator ${s.done ? 'done' : ''}">${s.done ? '✓' : ''}</span>
          <span>${esc(formatTime(s.time))} — ${esc(s.activity)}</span>
        </div>
      `).join('') + (sched.length > 5 ? `<p style="color:var(--text-tertiary);font-size:12px;margin-top:4px;">+${sched.length - 5} more</p>` : '');
    }

    // Habits mini
    const hBody = $('#dash-habits-body');
    if (data.habits.length === 0) {
      hBody.innerHTML = '<p style="color:var(--text-tertiary);font-size:13px;">No habits yet.</p>';
    } else {
      hBody.innerHTML = data.habits.slice(0, 5).map(h => {
        const done = h.completions && h.completions[today];
        return `<div class="dash-mini-item">
          <span class="check-indicator ${done ? 'done' : ''}">${done ? '✓' : ''}</span>
          <span>${esc(h.name)}</span>
        </div>`;
      }).join('');
    }

    // Checkpoints mini
    const cpBody = $('#dash-checkpoints-body');
    let cpTotal = 0, cpDone = 0;
    data.checkpoints.forEach(g => {
      (g.items || []).forEach(item => {
        cpTotal++;
        if (item.completions && item.completions[today]) cpDone++;
      });
    });
    if (cpTotal === 0) {
      cpBody.innerHTML = '<p style="color:var(--text-tertiary);font-size:13px;">No checkpoints yet.</p>';
    } else {
      cpBody.innerHTML = `
        <p style="font-size:22px;font-weight:700;margin-bottom:4px;">${cpDone}/${cpTotal}</p>
        <div class="progress-bar"><div class="progress-fill accent" style="width:${cpTotal > 0 ? (cpDone/cpTotal)*100 : 0}%"></div></div>
        <p style="color:var(--text-tertiary);font-size:12px;margin-top:6px;">checkpoints completed</p>
      `;
    }

    // Hobbies mini
    const hoBody = $('#dash-hobbies-body');
    if (data.hobbies.length === 0) {
      hoBody.innerHTML = '<p style="color:var(--text-tertiary);font-size:13px;">No hobbies yet.</p>';
    } else {
      hoBody.innerHTML = data.hobbies.slice(0, 3).map(h => {
        const done = h.completions && h.completions[today];
        return `<div class="dash-mini-item">
          <span class="check-indicator ${done ? 'done' : ''}">${done ? '✓' : ''}</span>
          <span>${esc(h.name)}</span>
        </div>`;
      }).join('');
    }
  }

  function updateClock() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit' });
    $('#greeting-time').textContent = timeStr;
  }

  // ═══════════════════════════════════
  // RENDER: TIMETABLE
  // ═══════════════════════════════════

  function renderTimetable() {
    const today = todayKey();
    const sched = data.schedule[today] || [];
    const tbody = $('#timetable-tbody');
    const empty = $('#timetable-empty');
    const timeline = $('#timetable-timeline');

    if (sched.length === 0) {
      tbody.innerHTML = '';
      empty.style.display = '';
      $('#timetable-table').parentElement.style.display = 'none';
      timeline.innerHTML = '';
      return;
    }

    empty.style.display = 'none';
    $('#timetable-table').parentElement.style.display = '';

    // Sort by time
    sched.sort((a, b) => (a.time || '').localeCompare(b.time || ''));

    // Timeline
    timeline.innerHTML = sched.map((s, i) => {
      const dotClass = s.done ? 'done' : '';
      const connector = i < sched.length - 1 ? '<span class="timeline-connector"></span>' : '';
      return `<span class="timeline-dot ${dotClass}" title="${esc(s.activity)}"></span>${connector}`;
    }).join('');

    // Table rows
    tbody.innerHTML = sched.map((s, i) => `
      <tr>
        <td class="time-cell">${esc(formatTime(s.time))}</td>
        <td>${esc(s.activity)}</td>
        <td><span class="category-badge ${(s.category || 'other').toLowerCase()}">${esc(s.category || 'Other')}</span></td>
        <td style="color:var(--text-tertiary);font-size:13px;">${esc(s.notes || '—')}</td>
        <td>
          <input type="checkbox" class="checkpoint-checkbox" aria-label="Mark ${esc(s.activity)} as done"
            ${s.done ? 'checked' : ''} data-sched-idx="${i}">
        </td>
        <td class="timetable-actions">
          <button class="btn btn-ghost btn-sm" data-edit-sched="${i}" aria-label="Edit">✎</button>
          <button class="btn btn-ghost btn-sm" data-del-sched="${i}" aria-label="Delete">✕</button>
        </td>
      </tr>
    `).join('');

    // Event listeners
    tbody.querySelectorAll('[data-sched-idx]').forEach(cb => {
      cb.addEventListener('change', (e) => {
        const idx = parseInt(e.target.dataset.schedIdx);
        sched[idx].done = e.target.checked;
        data.schedule[today] = sched;
        saveData();
        renderTimetable();
      });
    });
    tbody.querySelectorAll('[data-edit-sched]').forEach(btn => {
      btn.addEventListener('click', () => openScheduleModal(parseInt(btn.dataset.editSched)));
    });
    tbody.querySelectorAll('[data-del-sched]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const idx = parseInt(btn.dataset.delSched);
        if (await showConfirm('Delete Time Slot', 'Remove this time slot from your schedule?')) {
          sched.splice(idx, 1);
          data.schedule[today] = sched;
          saveData();
          renderTimetable();
        }
      });
    });
  }

  function openScheduleModal(editIdx) {
    const today = todayKey();
    const sched = data.schedule[today] || [];
    const item = editIdx !== undefined ? sched[editIdx] : null;
    const isEdit = !!item;

    openModal(isEdit ? 'Edit Time Slot' : 'Add Time Slot', `
      <div class="form-group">
        <label for="sched-time">Time</label>
        <input type="time" id="sched-time" value="${item ? item.time : ''}">
      </div>
      <div class="form-group">
        <label for="sched-activity">Activity</label>
        <input type="text" id="sched-activity" placeholder="e.g. Study, Exercise…" value="${item ? esc(item.activity) : ''}" maxlength="100">
      </div>
      <div class="form-row">
        <div class="form-group">
          <label for="sched-category">Category</label>
          <select id="sched-category">
            ${['Routine', 'Study', 'Health', 'Work', 'Personal', 'Other'].map(c =>
              `<option value="${c}" ${item && item.category === c ? 'selected' : ''}>${c}</option>`
            ).join('')}
          </select>
        </div>
      </div>
      <div class="form-group">
        <label for="sched-notes">Notes (optional)</label>
        <input type="text" id="sched-notes" placeholder="Any notes…" value="${item ? esc(item.notes || '') : ''}" maxlength="200">
      </div>
    `, `
      <button class="btn btn-secondary" onclick="window._closeModal()">Cancel</button>
      <button class="btn btn-primary" id="sched-save">${isEdit ? 'Save' : 'Add'}</button>
    `);

    $('#sched-save').addEventListener('click', () => {
      const time = $('#sched-time').value;
      const activity = $('#sched-activity').value.trim();
      if (!activity) { $('#sched-activity').focus(); return; }

      const entry = {
        time, activity,
        category: $('#sched-category').value,
        notes: $('#sched-notes').value.trim(),
        done: item ? item.done : false
      };

      if (!data.schedule[today]) data.schedule[today] = [];
      if (isEdit) {
        data.schedule[today][editIdx] = entry;
      } else {
        data.schedule[today].push(entry);
      }
      saveData();
      closeModal();
      renderTimetable();
    });
  }

  // ═══════════════════════════════════
  // RENDER: HABITS TO BUILD
  // ═══════════════════════════════════

  function renderHabits() {
    const grid = $('#habits-grid');
    const empty = $('#habits-empty');
    const today = todayKey();

    if (data.habits.length === 0) {
      grid.innerHTML = '';
      empty.style.display = '';
      return;
    }
    empty.style.display = 'none';

    grid.innerHTML = data.habits.map((h, i) => {
      const streak = calculateStreak(h.completions || {});
      const totalDays = Object.values(h.completions || {}).filter(Boolean).length;
      const allDays = Object.keys(h.completions || {}).length || 1;
      const pct = Math.round((totalDays / Math.max(allDays, 1)) * 100);
      const doneToday = h.completions && h.completions[today];

      return `
        <div class="habit-card">
          <div class="habit-card-header">
            <div>
              <h4>${esc(h.name)}</h4>
              ${h.description ? `<p class="habit-card-desc">${esc(h.description)}</p>` : ''}
              ${h.target ? `<p class="habit-card-desc" style="font-size:12px;">Target: ${esc(h.target)}</p>` : ''}
            </div>
            <div style="display:flex;gap:4px;">
              <button class="btn btn-ghost btn-sm" data-edit-habit="${i}" aria-label="Edit habit">✎</button>
              <button class="btn btn-ghost btn-sm" data-del-habit="${i}" aria-label="Delete habit">✕</button>
            </div>
          </div>
          <div class="habit-stats">
            <div class="habit-stat">
              <span class="habit-stat-val">${streak.current}</span>
              <span class="habit-stat-label">Current Streak</span>
            </div>
            <div class="habit-stat">
              <span class="habit-stat-val">${streak.best}</span>
              <span class="habit-stat-label">Best Streak</span>
            </div>
            <div class="habit-stat">
              <span class="habit-stat-val">${pct}%</span>
              <span class="habit-stat-label">Completion</span>
            </div>
          </div>
          <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
          <div class="habit-card-footer">
            <button class="habit-check-btn ${doneToday ? 'checked' : ''}" data-toggle-habit="${i}">
              ${doneToday ? '✓ Done' : '○ Mark Done'}
            </button>
          </div>
        </div>
      `;
    }).join('');

    // Event listeners
    grid.querySelectorAll('[data-toggle-habit]').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.toggleHabit);
        toggleHabit(idx);
      });
    });
    grid.querySelectorAll('[data-edit-habit]').forEach(btn => {
      btn.addEventListener('click', () => openHabitModal(parseInt(btn.dataset.editHabit)));
    });
    grid.querySelectorAll('[data-del-habit]').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (await showConfirm('Delete Habit', 'This will remove the habit and all its history. Continue?')) {
          data.habits.splice(parseInt(btn.dataset.delHabit), 1);
          saveData(); renderHabits();
        }
      });
    });
  }

  function toggleHabit(idx) {
    const h = data.habits[idx];
    if (!h.completions) h.completions = {};
    const today = todayKey();
    h.completions[today] = !h.completions[today];
    saveData();
    renderHabits();
  }

  function openHabitModal(editIdx) {
    const item = editIdx !== undefined ? data.habits[editIdx] : null;
    const isEdit = !!item;

    openModal(isEdit ? 'Edit Habit' : 'Add Habit', `
      <div class="form-group">
        <label for="habit-name">Habit Name</label>
        <input type="text" id="habit-name" placeholder="e.g. Read 20 pages" value="${item ? esc(item.name) : ''}" maxlength="80">
      </div>
      <div class="form-group">
        <label for="habit-desc">Description (optional)</label>
        <input type="text" id="habit-desc" placeholder="Why this habit matters…" value="${item ? esc(item.description || '') : ''}" maxlength="200">
      </div>
      <div class="form-group">
        <label for="habit-target">Daily Target (optional)</label>
        <input type="text" id="habit-target" placeholder="e.g. 20 pages, 30 minutes" value="${item ? esc(item.target || '') : ''}" maxlength="100">
      </div>
    `, `
      <button class="btn btn-secondary" onclick="window._closeModal()">Cancel</button>
      <button class="btn btn-primary" id="habit-save">${isEdit ? 'Save' : 'Add Habit'}</button>
    `);

    $('#habit-save').addEventListener('click', () => {
      const name = $('#habit-name').value.trim();
      if (!name) { $('#habit-name').focus(); return; }

      if (isEdit) {
        data.habits[editIdx].name = name;
        data.habits[editIdx].description = $('#habit-desc').value.trim();
        data.habits[editIdx].target = $('#habit-target').value.trim();
      } else {
        data.habits.push({
          id: uid(), name,
          description: $('#habit-desc').value.trim(),
          target: $('#habit-target').value.trim(),
          completions: {},
          createdAt: todayKey()
        });
      }
      saveData(); closeModal(); renderHabits();
    });
  }

  // ═══════════════════════════════════
  // RENDER: HABITS TO QUIT
  // ═══════════════════════════════════

  function renderQuitHabits() {
    const grid = $('#quit-habits-grid');
    const empty = $('#quit-habits-empty');
    const today = todayKey();

    if (data.habitsToQuit.length === 0) {
      grid.innerHTML = '';
      empty.style.display = '';
      return;
    }
    empty.style.display = 'none';

    grid.innerHTML = data.habitsToQuit.map((h, i) => {
      // For quit habits, relapses stores the days they failed
      // "completions" = days they stayed free
      // Build a completions-like object where each day NOT in relapses since startDate is a success
      const relapses = h.relapses || {};
      const startDate = h.startDate || h.createdAt || todayKey();

      // Calculate streak (consecutive days without relapse)
      let currentStreak = 0;
      const d = new Date();
      const relapsedToday = relapses[today];

      if (!relapsedToday) {
        currentStreak = 1;
        const check = new Date(d);
        check.setDate(check.getDate() - 1);
        while (true) {
          const key = check.toISOString().slice(0, 10);
          if (key < startDate) break;
          if (relapses[key]) break;
          currentStreak++;
          check.setDate(check.getDate() - 1);
        }
      }

      // Best streak
      let bestStreak = 0, tempStreak = 0;
      const start = new Date(startDate + 'T00:00:00');
      const end = new Date();
      for (let dd = new Date(start); dd <= end; dd.setDate(dd.getDate() + 1)) {
        const key = dd.toISOString().slice(0, 10);
        if (!relapses[key]) {
          tempStreak++;
          bestStreak = Math.max(bestStreak, tempStreak);
        } else {
          tempStreak = 0;
        }
      }

      // Total successful days and relapse days
      const totalRelapses = Object.values(relapses).filter(Boolean).length;
      const daysSinceStart = Math.max(1, Math.floor((new Date() - start) / (1000 * 60 * 60 * 24)) + 1);
      const successDays = daysSinceStart - totalRelapses;
      const pct = Math.round((successDays / daysSinceStart) * 100);

      return `
        <div class="habit-card quit-card">
          <div class="habit-card-header">
            <div>
              <h4>${esc(h.name)}</h4>
              ${h.description ? `<p class="habit-card-desc">${esc(h.description)}</p>` : ''}
            </div>
            <div style="display:flex;gap:4px;">
              <button class="btn btn-ghost btn-sm" data-edit-quit="${i}" aria-label="Edit">✎</button>
              <button class="btn btn-ghost btn-sm" data-del-quit="${i}" aria-label="Delete">✕</button>
            </div>
          </div>
          <div class="quit-streak-badge">
            ${currentStreak} day${currentStreak !== 1 ? 's' : ''} free
          </div>
          <div class="habit-stats" style="margin-top:12px;">
            <div class="habit-stat">
              <span class="habit-stat-val">${currentStreak}</span>
              <span class="habit-stat-label">Current Streak</span>
            </div>
            <div class="habit-stat">
              <span class="habit-stat-val">${bestStreak}</span>
              <span class="habit-stat-label">Best Streak</span>
            </div>
            <div class="habit-stat">
              <span class="habit-stat-val">${successDays}</span>
              <span class="habit-stat-label">Successful Days</span>
            </div>
            <div class="habit-stat">
              <span class="habit-stat-val">${totalRelapses}</span>
              <span class="habit-stat-label">Relapses</span>
            </div>
          </div>
          <div class="progress-bar"><div class="progress-fill ${pct >= 70 ? '' : 'red'}" style="width:${pct}%"></div></div>
          <p style="font-size:12px;color:var(--text-tertiary);margin-top:4px;">${pct}% success rate</p>
          <div class="habit-card-footer">
            <button class="habit-check-btn ${relapsedToday ? 'checked-red' : ''}" data-toggle-quit="${i}">
              ${relapsedToday ? '✕ Relapsed Today' : '✓ Stayed Strong'}
            </button>
          </div>
        </div>
      `;
    }).join('');

    // Events
    grid.querySelectorAll('[data-toggle-quit]').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.toggleQuit);
        const h = data.habitsToQuit[idx];
        if (!h.relapses) h.relapses = {};
        h.relapses[todayKey()] = !h.relapses[todayKey()];
        saveData(); renderQuitHabits();
      });
    });
    grid.querySelectorAll('[data-edit-quit]').forEach(btn => {
      btn.addEventListener('click', () => openQuitHabitModal(parseInt(btn.dataset.editQuit)));
    });
    grid.querySelectorAll('[data-del-quit]').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (await showConfirm('Delete Habit', 'Remove this habit and all its history?')) {
          data.habitsToQuit.splice(parseInt(btn.dataset.delQuit), 1);
          saveData(); renderQuitHabits();
        }
      });
    });
  }

  function openQuitHabitModal(editIdx) {
    const item = editIdx !== undefined ? data.habitsToQuit[editIdx] : null;
    const isEdit = !!item;

    openModal(isEdit ? 'Edit Quit Habit' : 'Track a Habit to Quit', `
      <div class="form-group">
        <label for="quit-name">Habit Name</label>
        <input type="text" id="quit-name" placeholder="e.g. Excessive scrolling" value="${item ? esc(item.name) : ''}" maxlength="80">
      </div>
      <div class="form-group">
        <label for="quit-desc">Description (optional)</label>
        <input type="text" id="quit-desc" placeholder="Why you want to quit…" value="${item ? esc(item.description || '') : ''}" maxlength="200">
      </div>
    `, `
      <button class="btn btn-secondary" onclick="window._closeModal()">Cancel</button>
      <button class="btn btn-danger" id="quit-save">${isEdit ? 'Save' : 'Start Tracking'}</button>
    `);

    $('#quit-save').addEventListener('click', () => {
      const name = $('#quit-name').value.trim();
      if (!name) { $('#quit-name').focus(); return; }
      if (isEdit) {
        data.habitsToQuit[editIdx].name = name;
        data.habitsToQuit[editIdx].description = $('#quit-desc').value.trim();
      } else {
        data.habitsToQuit.push({
          id: uid(), name,
          description: $('#quit-desc').value.trim(),
          relapses: {},
          startDate: todayKey(),
          createdAt: todayKey()
        });
      }
      saveData(); closeModal(); renderQuitHabits();
    });
  }

  // ═══════════════════════════════════
  // RENDER: CHECKPOINTS
  // ═══════════════════════════════════

  function renderCheckpoints() {
    const container = $('#checkpoints-container');
    const empty = $('#checkpoints-empty');
    const today = todayKey();

    if (data.checkpoints.length === 0) {
      container.innerHTML = '';
      empty.style.display = '';
      $('#checkpoint-progress').style.display = 'none';
      return;
    }
    empty.style.display = 'none';
    $('#checkpoint-progress').style.display = '';

    let totalItems = 0, doneItems = 0;

    container.innerHTML = data.checkpoints.map((group, gi) => {
      const itemsHTML = (group.items || []).map((item, ii) => {
        const done = item.completions && item.completions[today];
        totalItems++;
        if (done) doneItems++;
        return `
          <div class="checkpoint-item ${done ? 'done' : ''}">
            <input type="checkbox" class="checkpoint-checkbox"
              aria-label="${esc(item.label)}"
              ${done ? 'checked' : ''}
              data-cp-group="${gi}" data-cp-item="${ii}">
            <span class="checkpoint-label">${esc(item.label)}</span>
            <div class="checkpoint-actions">
              <button class="btn btn-ghost btn-sm" data-del-cp-item="${gi}-${ii}" aria-label="Delete checkpoint item">✕</button>
            </div>
          </div>
        `;
      }).join('');

      return `
        <div class="checkpoint-group">
          <div class="checkpoint-group-header">
            <h4>${esc(group.name)}</h4>
            <div style="display:flex;gap:4px;">
              <button class="btn btn-ghost btn-sm" data-add-cp-item="${gi}" aria-label="Add item to ${esc(group.name)}">+</button>
              <button class="btn btn-ghost btn-sm" data-del-cp-group="${gi}" aria-label="Delete group">✕</button>
            </div>
          </div>
          ${itemsHTML || '<p style="color:var(--text-tertiary);font-size:13px;">No items yet. Click + to add.</p>'}
        </div>
      `;
    }).join('');

    // Progress
    $('#checkpoint-count').textContent = `${doneItems}/${totalItems}`;
    const pct = totalItems > 0 ? (doneItems / totalItems) * 100 : 0;
    $('#checkpoint-progress-fill').style.width = pct + '%';

    // Events
    container.querySelectorAll('[data-cp-group]').forEach(cb => {
      cb.addEventListener('change', (e) => {
        const gi = parseInt(e.target.dataset.cpGroup);
        const ii = parseInt(e.target.dataset.cpItem);
        const item = data.checkpoints[gi].items[ii];
        if (!item.completions) item.completions = {};
        item.completions[today] = e.target.checked;
        saveData(); renderCheckpoints();
      });
    });
    container.querySelectorAll('[data-add-cp-item]').forEach(btn => {
      btn.addEventListener('click', () => {
        const gi = parseInt(btn.dataset.addCpItem);
        openModal('Add Checkpoint Item', `
          <div class="form-group">
            <label for="cp-item-label">What to do</label>
            <input type="text" id="cp-item-label" placeholder="e.g. Wake up on time" maxlength="100">
          </div>
        `, `
          <button class="btn btn-secondary" onclick="window._closeModal()">Cancel</button>
          <button class="btn btn-primary" id="cp-item-save">Add</button>
        `);
        $('#cp-item-save').addEventListener('click', () => {
          const label = $('#cp-item-label').value.trim();
          if (!label) return;
          if (!data.checkpoints[gi].items) data.checkpoints[gi].items = [];
          data.checkpoints[gi].items.push({ id: uid(), label, completions: {} });
          saveData(); closeModal(); renderCheckpoints();
        });
      });
    });
    container.querySelectorAll('[data-del-cp-item]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const [gi, ii] = btn.dataset.delCpItem.split('-').map(Number);
        if (await showConfirm('Delete Item', 'Remove this checkpoint item?')) {
          data.checkpoints[gi].items.splice(ii, 1);
          saveData(); renderCheckpoints();
        }
      });
    });
    container.querySelectorAll('[data-del-cp-group]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const gi = parseInt(btn.dataset.delCpGroup);
        if (await showConfirm('Delete Group', 'Remove this entire checkpoint group?')) {
          data.checkpoints.splice(gi, 1);
          saveData(); renderCheckpoints();
        }
      });
    });
  }

  function openCheckpointGroupModal() {
    openModal('Add Checkpoint Group', `
      <div class="form-group">
        <label for="cp-group-name">Group Name</label>
        <input type="text" id="cp-group-name" placeholder="e.g. Morning, Afternoon, Evening" maxlength="50">
      </div>
    `, `
      <button class="btn btn-secondary" onclick="window._closeModal()">Cancel</button>
      <button class="btn btn-primary" id="cp-group-save">Add Group</button>
    `);
    $('#cp-group-save').addEventListener('click', () => {
      const name = $('#cp-group-name').value.trim();
      if (!name) return;
      data.checkpoints.push({ id: uid(), name, items: [] });
      saveData(); closeModal(); renderCheckpoints();
    });
  }

  // ═══════════════════════════════════
  // RENDER: HOBBIES
  // ═══════════════════════════════════

  function renderHobbies() {
    const grid = $('#hobbies-grid');
    const empty = $('#hobbies-empty');
    const today = todayKey();

    if (data.hobbies.length === 0) {
      grid.innerHTML = '';
      empty.style.display = '';
      return;
    }
    empty.style.display = 'none';

    grid.innerHTML = data.hobbies.map((h, i) => {
      const doneToday = h.completions && h.completions[today];
      const totalDays = Object.values(h.completions || {}).filter(Boolean).length;
      const targetDays = h.targetDays || 30;
      const pct = Math.round((totalDays / targetDays) * 100);
      const streak = calculateStreak(h.completions || {});
      const startDate = h.startDate || h.createdAt || todayKey();

      return `
        <div class="hobby-card">
          <div style="display:flex;justify-content:space-between;align-items:start;">
            <h4>${esc(h.name)}</h4>
            <div style="display:flex;gap:4px;">
              <button class="btn btn-ghost btn-sm" data-edit-hobby="${i}" aria-label="Edit hobby">✎</button>
              <button class="btn btn-ghost btn-sm" data-del-hobby="${i}" aria-label="Delete hobby">✕</button>
            </div>
          </div>
          ${h.oath ? `<div class="hobby-oath">"${esc(h.oath)}"</div>` : ''}
          ${h.hasVideo ? `<div class="hobby-video-preview"><video id="hobby-video-${h.id}" controls preload="metadata">Your browser does not support video.</video></div>` : ''}
          <div class="hobby-stats">
            <div class="habit-stat">
              <span class="habit-stat-val">${streak.current}</span>
              <span class="habit-stat-label">Streak</span>
            </div>
            <div class="habit-stat">
              <span class="habit-stat-val">${totalDays}/${targetDays}</span>
              <span class="habit-stat-label">Days Done</span>
            </div>
            <div class="habit-stat">
              <span class="habit-stat-val">${pct}%</span>
              <span class="habit-stat-label">Progress</span>
            </div>
          </div>
          <div class="hobby-progress">
            <div class="progress-bar"><div class="progress-fill purple" style="width:${clamp(pct, 0, 100)}%"></div></div>
          </div>
          <p style="font-size:12px;color:var(--text-tertiary);">Started ${formatDate(startDate)}</p>
          <div class="habit-card-footer">
            <button class="habit-check-btn ${doneToday ? 'checked' : ''}" data-toggle-hobby="${i}">
              ${doneToday ? '✓ Done Today' : '○ Mark Done'}
            </button>
            <div style="display:flex;gap:4px;">
              <button class="btn btn-secondary btn-sm" data-upload-video="${i}" aria-label="${h.hasVideo ? 'Manage commitment video' : 'Record or upload commitment video'}">
                📹 ${h.hasVideo ? 'Manage Video' : 'Add Video'}
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Load videos from IndexedDB
    data.hobbies.forEach(h => {
      if (h.hasVideo && videoDB) {
        getVideo(h.id).then(blob => {
          if (blob) {
            const video = $(`#hobby-video-${h.id}`);
            if (video) video.src = URL.createObjectURL(blob);
          }
        }).catch(() => {});
      }
    });

    // Events
    grid.querySelectorAll('[data-toggle-hobby]').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.toggleHobby);
        const h = data.hobbies[idx];
        if (!h.completions) h.completions = {};
        h.completions[todayKey()] = !h.completions[todayKey()];
        saveData(); renderHobbies();
      });
    });
    grid.querySelectorAll('[data-edit-hobby]').forEach(btn => {
      btn.addEventListener('click', () => openHobbyModal(parseInt(btn.dataset.editHobby)));
    });
    grid.querySelectorAll('[data-del-hobby]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const idx = parseInt(btn.dataset.delHobby);
        if (await showConfirm('Delete Hobby', 'Remove this hobby and all its data?')) {
          const h = data.hobbies[idx];
          if (h.hasVideo && videoDB) deleteVideo(h.id).catch(() => {});
          data.hobbies.splice(idx, 1);
          saveData(); renderHobbies();
        }
      });
    });
    grid.querySelectorAll('[data-upload-video]').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.uploadVideo);
        openVideoUploadModal(idx);
      });
    });
  }

  function openHobbyModal(editIdx) {
    const item = editIdx !== undefined ? data.hobbies[editIdx] : null;
    const isEdit = !!item;

    openModal(isEdit ? 'Edit Hobby' : 'Start a New Hobby', `
      <div class="form-group">
        <label for="hobby-name">Hobby Name</label>
        <input type="text" id="hobby-name" placeholder="e.g. Photography, Guitar, Painting" value="${item ? esc(item.name) : ''}" maxlength="80">
      </div>
      <div class="form-group">
        <label for="hobby-target">Target Duration (days)</label>
        <input type="number" id="hobby-target" placeholder="30" min="1" max="365" value="${item ? (item.targetDays || 30) : 30}">
      </div>
      <div class="form-group">
        <label for="hobby-oath">Your Commitment / Oath</label>
        <textarea id="hobby-oath" placeholder="I commit to practicing … for at least … every day for the next … days.">${item ? esc(item.oath || '') : ''}</textarea>
      </div>
    `, `
      <button class="btn btn-secondary" onclick="window._closeModal()">Cancel</button>
      <button class="btn btn-purple" id="hobby-save">${isEdit ? 'Save' : 'Start Hobby'}</button>
    `);

    $('#hobby-save').addEventListener('click', () => {
      const name = $('#hobby-name').value.trim();
      if (!name) { $('#hobby-name').focus(); return; }
      const oath = $('#hobby-oath').value.trim();
      if (!oath) { $('#hobby-oath').focus(); return; }

      if (isEdit) {
        data.hobbies[editIdx].name = name;
        data.hobbies[editIdx].targetDays = parseInt($('#hobby-target').value) || 30;
        data.hobbies[editIdx].oath = oath;
      } else {
        data.hobbies.push({
          id: uid(), name,
          targetDays: parseInt($('#hobby-target').value) || 30,
          oath, completions: {},
          startDate: todayKey(),
          createdAt: todayKey(),
          hasVideo: false
        });
      }
      saveData(); closeModal(); renderHobbies();
    });
  }

  function openVideoUploadModal(hobbyIdx) {
    const hobby = data.hobbies[hobbyIdx];
    let selectedBlob = null;
    let cameraStream = null;
    let mediaRecorder = null;
    let recordedChunks = [];
    let recordTimerInterval = null;
    let recordSeconds = 0;

    openModal(`Commitment Video — ${esc(hobby.name)}`, `
      <div class="video-modal-tabs">
        <button type="button" class="video-tab-btn active" id="tab-btn-record">📹 Record with Camera</button>
        <button type="button" class="video-tab-btn" id="tab-btn-upload">📁 Upload Video File</button>
      </div>

      <!-- Record Section -->
      <div id="video-record-section">
        <p style="font-size:13px;color:var(--text-secondary);margin-bottom:12px;">
          Record a short commitment oath for <strong>${esc(hobby.name)}</strong>. Videos remain private and securely stored in your browser.
        </p>
        <div class="camera-container" id="camera-container">
          <video id="camera-stream-preview" class="camera-video-preview" autoplay playsinline muted></video>
          <div class="camera-controls">
            <button type="button" class="btn btn-danger" id="record-start-btn">
              <span class="record-dot"></span> Start Recording
            </button>
            <button type="button" class="btn btn-secondary" id="record-stop-btn" style="display:none;">
              ⏹ Stop (<span class="record-timer" id="record-timer-text">00:00</span>)
            </button>
            <button type="button" class="btn btn-ghost btn-sm" id="record-retake-btn" style="display:none;color:#fff;">
              ↺ Retake
            </button>
          </div>
        </div>
        <div id="camera-notice" style="font-size:12px;color:var(--text-tertiary);text-align:center;">
          Ensure camera & mic permissions are allowed in your browser.
        </div>
      </div>

      <!-- Upload Section -->
      <div id="video-upload-section" style="display:none;">
        <p style="font-size:13px;color:var(--text-secondary);margin-bottom:12px;">
          Choose an existing video from your device (MP4, WebM, or MOV up to 50 MB).
        </p>
        <div class="form-group">
          <label for="video-file-picker">Select Video File</label>
          <input type="file" id="video-file-picker" accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov">
        </div>
      </div>

      <!-- Playback Preview -->
      <div id="video-playback-preview" style="margin-top:10px;"></div>

      ${hobby.hasVideo ? '<div style="margin-top:14px;border-top:1px solid var(--border);padding-top:12px;"><button type="button" class="btn btn-danger btn-sm" id="video-delete-btn">🗑 Delete Current Video</button></div>' : ''}
    `, `
      <button class="btn btn-secondary" onclick="window._closeModal()">Cancel</button>
      <button class="btn btn-purple" id="video-save-btn" disabled>Save Video</button>
    `);

    const recordTab = $('#tab-btn-record');
    const uploadTab = $('#tab-btn-upload');
    const recordSection = $('#video-record-section');
    const uploadSection = $('#video-upload-section');
    const previewArea = $('#video-playback-preview');
    const startRecordBtn = $('#record-start-btn');
    const stopRecordBtn = $('#record-stop-btn');
    const retakeRecordBtn = $('#record-retake-btn');
    const timerText = $('#record-timer-text');
    const camNotice = $('#camera-notice');
    const streamVideo = $('#camera-stream-preview');
    const fileInput = $('#video-file-picker');
    const saveBtn = $('#video-save-btn');

    function stopCameraTracks() {
      if (recordTimerInterval) {
        clearInterval(recordTimerInterval);
        recordTimerInterval = null;
      }
      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        try { mediaRecorder.stop(); } catch (e) {}
      }
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        cameraStream = null;
      }
    }

    // Modal cleanup on close
    window._activeModalCleanup = stopCameraTracks;

    // Switch tabs
    recordTab.addEventListener('click', () => {
      recordTab.classList.add('active');
      uploadTab.classList.remove('active');
      recordSection.style.display = 'block';
      uploadSection.style.display = 'none';
      if (!selectedBlob) startCameraStream();
    });

    uploadTab.addEventListener('click', () => {
      uploadTab.classList.add('active');
      recordTab.classList.remove('active');
      recordSection.style.display = 'none';
      uploadSection.style.display = 'block';
      stopCameraTracks();
    });

    async function startCameraStream() {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Camera recording is not supported in this browser.');
        }
        cameraStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true }).catch(() => {
          return navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        });
        if (streamVideo) {
          streamVideo.srcObject = cameraStream;
          streamVideo.style.display = 'block';
          streamVideo.play().catch(() => {});
        }
        if (camNotice) camNotice.textContent = 'Camera active. Click "Start Recording" when ready.';
      } catch (err) {
        console.warn('Camera stream error:', err);
        if (camNotice) {
          camNotice.innerHTML = `<span style="color:var(--yellow);">⚠️ Camera preview unavailable (${esc(err.message || 'Permission denied')}). You can switch to the <strong>Upload Video File</strong> tab.</span>`;
        }
      }
    }

    // Initialize camera stream
    startCameraStream();

    // Start recording
    startRecordBtn.addEventListener('click', () => {
      if (!cameraStream) {
        startCameraStream().then(beginRecording).catch(() => {});
      } else {
        beginRecording();
      }
    });

    function beginRecording() {
      if (!cameraStream) return;
      recordedChunks = [];
      const mimeTypes = ['video/webm;codecs=vp9,opus', 'video/webm', 'video/mp4'];
      let selectedMime = '';
      if (window.MediaRecorder) {
        for (const type of mimeTypes) {
          if (MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(type)) {
            selectedMime = type;
            break;
          }
        }
      }

      try {
        mediaRecorder = selectedMime ? new MediaRecorder(cameraStream, { mimeType: selectedMime }) : new MediaRecorder(cameraStream);
      } catch (e) {
        mediaRecorder = new MediaRecorder(cameraStream);
      }

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) recordedChunks.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const type = mediaRecorder.mimeType || 'video/webm';
        selectedBlob = new Blob(recordedChunks, { type });
        const videoUrl = URL.createObjectURL(selectedBlob);
        previewArea.innerHTML = `
          <div style="margin-top:10px;">
            <p style="font-size:12px;font-weight:600;color:var(--text-secondary);margin-bottom:6px;">Recorded Video Preview:</p>
            <video src="${videoUrl}" controls style="width:100%;max-height:220px;border-radius:var(--radius-sm);background:#000;"></video>
          </div>
        `;
        saveBtn.disabled = false;
        retakeRecordBtn.style.display = 'inline-flex';
        stopRecordBtn.style.display = 'none';
        startRecordBtn.style.display = 'none';
        if (streamVideo) streamVideo.style.display = 'none';
      };

      mediaRecorder.start(250);
      recordSeconds = 0;
      timerText.textContent = '00:00';
      startRecordBtn.style.display = 'none';
      stopRecordBtn.style.display = 'inline-flex';
      retakeRecordBtn.style.display = 'none';
      recordTimerInterval = setInterval(() => {
        recordSeconds++;
        const mins = String(Math.floor(recordSeconds / 60)).padStart(2, '0');
        const secs = String(recordSeconds % 60).padStart(2, '0');
        timerText.textContent = `${mins}:${secs}`;
      }, 1000);
    }

    // Stop recording
    stopRecordBtn.addEventListener('click', () => {
      if (recordTimerInterval) {
        clearInterval(recordTimerInterval);
        recordTimerInterval = null;
      }
      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
      }
    });

    // Retake recording
    retakeRecordBtn.addEventListener('click', () => {
      selectedBlob = null;
      previewArea.innerHTML = '';
      saveBtn.disabled = true;
      retakeRecordBtn.style.display = 'none';
      startRecordBtn.style.display = 'inline-flex';
      stopRecordBtn.style.display = 'none';
      startCameraStream();
    });

    // File input handler
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const validTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
      if (!validTypes.includes(file.type) && !/\.(mp4|webm|mov)$/i.test(file.name)) {
        previewArea.innerHTML = '<p style="color:var(--red);font-size:13px;margin-top:8px;">Invalid file type. Please upload MP4, WebM, or MOV.</p>';
        saveBtn.disabled = true;
        return;
      }

      if (file.size > 50 * 1024 * 1024) {
        previewArea.innerHTML = '<p style="color:var(--red);font-size:13px;margin-top:8px;">File too large. Maximum size is 50 MB.</p>';
        saveBtn.disabled = true;
        return;
      }

      selectedBlob = file;
      const url = URL.createObjectURL(file);
      previewArea.innerHTML = `
        <div style="margin-top:10px;">
          <p style="font-size:12px;font-weight:600;color:var(--text-secondary);margin-bottom:6px;">Selected File Preview (${(file.size / (1024 * 1024)).toFixed(1)} MB):</p>
          <video src="${url}" controls style="width:100%;max-height:220px;border-radius:var(--radius-sm);background:#000;"></video>
        </div>
      `;
      saveBtn.disabled = false;
    });

    // Save button click
    saveBtn.addEventListener('click', async () => {
      if (!selectedBlob || !videoDB) return;
      saveBtn.disabled = true;
      saveBtn.textContent = 'Saving...';
      try {
        await saveVideo(hobby.id, selectedBlob);
        data.hobbies[hobbyIdx].hasVideo = true;
        saveData();
        stopCameraTracks();
        closeModal();
        renderHobbies();
      } catch (err) {
        console.error('Video save error:', err);
        previewArea.innerHTML += '<p style="color:var(--red);font-size:13px;margin-top:8px;">Failed to save video to local storage.</p>';
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save Video';
      }
    });

    // Delete existing video
    const delBtn = $('#video-delete-btn');
    if (delBtn) {
      delBtn.addEventListener('click', async () => {
        if (await showConfirm('Delete Video', 'Remove this commitment video?')) {
          try { await deleteVideo(hobby.id); } catch {}
          data.hobbies[hobbyIdx].hasVideo = false;
          saveData();
          stopCameraTracks();
          closeModal();
          renderHobbies();
        }
      });
    }
  }

  // ═══════════════════════════════════
  // RENDER: NOTES
  // ═══════════════════════════════════

  function renderNotes() {
    const grid = $('#notes-grid');
    const empty = $('#notes-empty');
    const searchTerm = ($('#notes-search').value || '').toLowerCase();
    const catFilter = $('#notes-category-filter').value;

    let filtered = data.notes.filter(n => {
      if (catFilter !== 'all' && n.category !== catFilter) return false;
      if (searchTerm && !n.title.toLowerCase().includes(searchTerm) && !n.content.toLowerCase().includes(searchTerm)) return false;
      return true;
    });

    // Sort: pinned first, then by date
    filtered.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return (b.updatedAt || b.createdAt || '').localeCompare(a.updatedAt || a.createdAt || '');
    });

    if (filtered.length === 0 && data.notes.length === 0) {
      grid.innerHTML = '';
      empty.style.display = '';
      return;
    }
    empty.style.display = 'none';

    if (filtered.length === 0) {
      grid.innerHTML = '<p style="color:var(--text-tertiary);padding:20px;">No notes match your search.</p>';
      return;
    }

    grid.innerHTML = filtered.map(n => `
      <div class="note-card ${n.pinned ? 'pinned' : ''}" data-view-note="${n.id}" tabindex="0" role="button" aria-label="View note: ${esc(n.title)}">
        ${n.pinned ? '<span class="pin-indicator" aria-label="Pinned">📌</span>' : ''}
        <h4>${esc(n.title)}</h4>
        <p class="note-preview">${esc(n.content)}</p>
        <div class="note-meta">
          <span class="note-category-badge ${n.category}">${esc(n.category)}</span>
          <span>${n.updatedAt || n.createdAt || ''}</span>
        </div>
      </div>
    `).join('');

    grid.querySelectorAll('[data-view-note]').forEach(card => {
      const handler = () => {
        const noteId = card.dataset.viewNote;
        openNoteViewModal(noteId);
      };
      card.addEventListener('click', handler);
      card.addEventListener('keydown', (e) => { if (e.key === 'Enter') handler(); });
    });
  }

  function openNoteModal(editId) {
    const item = editId ? data.notes.find(n => n.id === editId) : null;
    const isEdit = !!item;

    openModal(isEdit ? 'Edit Note' : 'New Note', `
      <div class="form-group">
        <label for="note-title">Title</label>
        <input type="text" id="note-title" placeholder="Note title…" value="${item ? esc(item.title) : ''}" maxlength="100">
      </div>
      <div class="form-group">
        <label for="note-category">Category</label>
        <select id="note-category">
          ${['daily', 'habit', 'hobby', 'general'].map(c =>
            `<option value="${c}" ${item && item.category === c ? 'selected' : ''}>${c.charAt(0).toUpperCase() + c.slice(1)}</option>`
          ).join('')}
        </select>
      </div>
      <div class="form-group">
        <label for="note-content">Content</label>
        <textarea id="note-content" rows="6" placeholder="Write your note…">${item ? esc(item.content) : ''}</textarea>
      </div>
      <div class="form-group" style="display:flex;align-items:center;gap:8px;">
        <input type="checkbox" id="note-pinned" ${item && item.pinned ? 'checked' : ''} style="width:auto;">
        <label for="note-pinned" style="margin:0;font-size:14px;">Pin this note</label>
      </div>
    `, `
      <button class="btn btn-secondary" onclick="window._closeModal()">Cancel</button>
      <button class="btn btn-primary" id="note-save">${isEdit ? 'Save' : 'Create Note'}</button>
    `);

    $('#note-save').addEventListener('click', () => {
      const title = $('#note-title').value.trim();
      const content = $('#note-content').value.trim();
      if (!title) { $('#note-title').focus(); return; }

      if (isEdit) {
        item.title = title;
        item.content = content;
        item.category = $('#note-category').value;
        item.pinned = $('#note-pinned').checked;
        item.updatedAt = todayKey();
      } else {
        data.notes.push({
          id: uid(), title, content,
          category: $('#note-category').value,
          pinned: $('#note-pinned').checked,
          createdAt: todayKey(),
          updatedAt: todayKey()
        });
      }
      saveData(); closeModal(); renderNotes();
    });
  }

  function openNoteViewModal(noteId) {
    const note = data.notes.find(n => n.id === noteId);
    if (!note) return;

    openModal(note.title, `
      <div style="margin-bottom:8px;">
        <span class="note-category-badge ${note.category}">${esc(note.category)}</span>
        ${note.pinned ? '<span style="margin-left:8px;font-size:12px;color:var(--yellow);">📌 Pinned</span>' : ''}
      </div>
      <div style="white-space:pre-wrap;font-size:14px;color:var(--text);line-height:1.7;">${esc(note.content)}</div>
      <p style="margin-top:12px;font-size:12px;color:var(--text-tertiary);">Created: ${note.createdAt}${note.updatedAt !== note.createdAt ? ' • Updated: ' + note.updatedAt : ''}</p>
    `, `
      <button class="btn btn-danger btn-sm" id="note-delete">Delete</button>
      <button class="btn btn-secondary" onclick="window._closeModal()">Close</button>
      <button class="btn btn-primary" id="note-edit">Edit</button>
    `);

    $('#note-edit').addEventListener('click', () => { closeModal(); openNoteModal(noteId); });
    $('#note-delete').addEventListener('click', async () => {
      if (await showConfirm('Delete Note', 'Permanently delete this note?')) {
        data.notes = data.notes.filter(n => n.id !== noteId);
        saveData(); closeModal(); renderNotes();
      }
    });
  }

  // ═══════════════════════════════════
  // RENDER: PROGRESS / ANALYTICS
  // ═══════════════════════════════════

  function renderProgress() {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0=Sun
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - dayOfWeek);

    let weekCompleted = 0, weekMissed = 0;
    const weekScores = [];

    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      const { score, completed, total } = calculateDailyScore(key);
      weekScores.push({ day: d.toLocaleDateString('en-US', { weekday: 'short' }), score, completed, total });
      weekCompleted += completed;
      weekMissed += (total - completed);
    }

    // Best streak across all habits
    let bestStreak = 0;
    data.habits.forEach(h => {
      const s = calculateStreak(h.completions || {});
      bestStreak = Math.max(bestStreak, s.best);
    });

    // Avg score last 7 days
    const avgScore = weekScores.length > 0
      ? Math.round(weekScores.reduce((s, ws) => s + ws.score, 0) / weekScores.length)
      : 0;

    $('#analytics-week-completed').textContent = weekCompleted;
    $('#analytics-week-missed').textContent = weekMissed;
    $('#analytics-best-streak').textContent = bestStreak;
    $('#analytics-avg-score').textContent = avgScore + '%';

    // Weekly Completion Chart
    drawBarChart('chart-weekly', weekScores.map(ws => ({
      label: ws.day,
      value: ws.score,
      color: ws.score >= 75 ? getComputedStyle(document.documentElement).getPropertyValue('--green').trim()
           : ws.score >= 40 ? getComputedStyle(document.documentElement).getPropertyValue('--yellow').trim()
           : getComputedStyle(document.documentElement).getPropertyValue('--red').trim()
    })), '%');

    // Habit Consistency Chart
    const habitData = data.habits.slice(0, 7).map(h => {
      const totalDays = Object.values(h.completions || {}).filter(Boolean).length;
      const allDays = Object.keys(h.completions || {}).length || 1;
      const pct = Math.round((totalDays / Math.max(allDays, 1)) * 100);
      return {
        label: h.name.length > 12 ? h.name.slice(0, 12) + '…' : h.name,
        value: pct,
        color: getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()
      };
    });
    if (habitData.length > 0) {
      drawBarChart('chart-consistency', habitData, '%');
    } else {
      const ctx = document.getElementById('chart-consistency').getContext('2d');
      ctx.clearRect(0, 0, 500, 250);
      ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-tertiary').trim();
      ctx.font = '14px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Add habits to see consistency data', 250, 130);
    }
  }

  function drawBarChart(canvasId, dataPoints, suffix) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.parentElement.clientWidth - 40;
    const h = 220;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    if (dataPoints.length === 0) return;

    const textColor = getComputedStyle(document.documentElement).getPropertyValue('--text-tertiary').trim();
    const borderColor = getComputedStyle(document.documentElement).getPropertyValue('--border').trim();

    const padding = { top: 20, right: 20, bottom: 35, left: 40 };
    const chartW = w - padding.left - padding.right;
    const chartH = h - padding.top - padding.bottom;
    const barWidth = Math.min(40, (chartW / dataPoints.length) * 0.6);
    const gap = (chartW - barWidth * dataPoints.length) / (dataPoints.length + 1);
    const maxVal = Math.max(100, ...dataPoints.map(d => d.value));

    // Grid lines
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + chartH - (chartH * (i * 25) / maxVal);
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(w - padding.right, y);
      ctx.stroke();
      ctx.fillStyle = textColor;
      ctx.font = '11px Inter, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText((i * 25) + (suffix || ''), padding.left - 6, y + 4);
    }

    // Bars
    dataPoints.forEach((dp, i) => {
      const x = padding.left + gap + i * (barWidth + gap);
      const barH = (dp.value / maxVal) * chartH;
      const y = padding.top + chartH - barH;

      ctx.fillStyle = dp.color;
      ctx.beginPath();
      // Rounded top
      const r = Math.min(4, barWidth / 2);
      ctx.moveTo(x, y + r);
      ctx.arcTo(x, y, x + r, y, r);
      ctx.arcTo(x + barWidth, y, x + barWidth, y + r, r);
      ctx.lineTo(x + barWidth, padding.top + chartH);
      ctx.lineTo(x, padding.top + chartH);
      ctx.closePath();
      ctx.fill();

      // Label
      ctx.fillStyle = textColor;
      ctx.font = '11px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(dp.label, x + barWidth / 2, h - 8);

      // Value on top
      ctx.fillStyle = dp.color;
      ctx.font = '11px Inter, sans-serif';
      ctx.fillText(dp.value + (suffix || ''), x + barWidth / 2, y - 6);
    });
  }

  // ═══════════════════════════════════
  // RENDER: HISTORY / CALENDAR
  // ═══════════════════════════════════

  let calendarYear, calendarMonth;

  function renderHistory() {
    const now = new Date();
    if (calendarYear === undefined) {
      calendarYear = now.getFullYear();
      calendarMonth = now.getMonth();
    }
    renderCalendar();
  }

  function renderCalendar() {
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    $('#calendar-month').textContent = `${monthNames[calendarMonth]} ${calendarYear}`;

    const grid = $('#calendar-grid');
    const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
    let html = dayNames.map(d => `<span class="cal-header">${d}</span>`).join('');

    const firstDay = new Date(calendarYear, calendarMonth, 1).getDay();
    const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
    const today = todayKey();

    // Previous month fill
    const prevDays = new Date(calendarYear, calendarMonth, 0).getDate();
    for (let i = firstDay - 1; i >= 0; i--) {
      html += `<button class="cal-day other-month" disabled>${prevDays - i}</button>`;
    }

    // Current month — full-cell coloring
    for (let d = 1; d <= daysInMonth; d++) {
      const dateKey = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const isToday = dateKey === today;
      const { score, total } = calculateDailyScore(dateKey);

      // Determine day class: Bright for well-spent days, Dull for missed/incomplete days
      let dayClass = 'day-empty';
      let dotClass = '';
      const isPast = dateKey < today;

      if (total > 0) {
        if (score >= 80) { dayClass = 'day-great'; dotClass = 'great'; }
        else if (score >= 60) { dayClass = 'day-good'; dotClass = 'good'; }
        else if (score >= 35) { dayClass = 'day-partial'; dotClass = 'partial'; }
        else { dayClass = 'day-poor day-dull'; dotClass = 'dull'; }
      } else if (isPast && (data.habits.length > 0 || Object.keys(data.schedule).length > 0)) {
        // Inactive / missed day in the past with no completions
        dayClass = 'day-poor day-dull'; dotClass = 'dull';
      }

      html += `<button class="cal-day ${dayClass} ${isToday ? 'today' : ''}" data-date="${dateKey}" title="${dateKey}: ${total > 0 ? score + '% score' : (isPast ? 'Missed / No tasks done' : 'No data')}">
        ${d}
        ${dotClass ? `<span class="cal-dot ${dotClass}"></span>` : ''}
      </button>`;
    }

    // Next month fill
    const totalCells = firstDay + daysInMonth;
    const remaining = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
    for (let i = 1; i <= remaining; i++) {
      html += `<button class="cal-day other-month" disabled>${i}</button>`;
    }

    grid.innerHTML = html;

    // Day click
    grid.querySelectorAll('[data-date]').forEach(btn => {
      btn.addEventListener('click', () => {
        grid.querySelectorAll('.cal-day').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        renderHistoryDetail(btn.dataset.date);
      });
    });
  }

  function renderHistoryDetail(dateKey) {
    $('#history-date-title').textContent = formatDate(dateKey);
    const content = $('#history-content');

    const { score, completed, total } = calculateDailyScore(dateKey);
    const sched = data.schedule[dateKey] || [];

    let html = '';

    // Score
    html += `<div class="history-section">
      <h4>Daily Score</h4>
      <p style="font-size:22px;font-weight:700;">${score}% <span style="font-size:13px;font-weight:400;color:var(--text-tertiary);">(${completed}/${total} completed)</span></p>
      <div class="progress-bar" style="margin-top:6px;"><div class="progress-fill accent" style="width:${score}%"></div></div>
    </div>`;

    // Schedule
    if (sched.length > 0) {
      html += `<div class="history-section"><h4>Schedule</h4>`;
      sched.forEach(s => {
        html += `<div class="history-item">
          <span class="${s.done ? 'history-check' : 'history-miss'}">${s.done ? '✓' : '✕'}</span>
          <span>${esc(formatTime(s.time))} — ${esc(s.activity)}</span>
        </div>`;
      });
      html += '</div>';
    }

    // Habits
    if (data.habits.length > 0) {
      html += `<div class="history-section"><h4>Habits</h4>`;
      data.habits.forEach(h => {
        const done = h.completions && h.completions[dateKey];
        html += `<div class="history-item">
          <span class="${done ? 'history-check' : 'history-miss'}">${done ? '✓' : '✕'}</span>
          <span>${esc(h.name)}</span>
        </div>`;
      });
      html += '</div>';
    }

    // Checkpoints
    let cpHTML = '';
    data.checkpoints.forEach(g => {
      (g.items || []).forEach(item => {
        const done = item.completions && item.completions[dateKey];
        cpHTML += `<div class="history-item">
          <span class="${done ? 'history-check' : 'history-miss'}">${done ? '✓' : '✕'}</span>
          <span>${esc(item.label)}</span>
        </div>`;
      });
    });
    if (cpHTML) {
      html += `<div class="history-section"><h4>Checkpoints</h4>${cpHTML}</div>`;
    }

    // Notes for this date
    const dayNotes = data.notes.filter(n => n.createdAt === dateKey || n.updatedAt === dateKey);
    if (dayNotes.length > 0) {
      html += `<div class="history-section"><h4>Notes</h4>`;
      dayNotes.forEach(n => {
        html += `<div class="history-item"><span style="color:var(--accent);">📝</span> <span>${esc(n.title)}</span></div>`;
      });
      html += '</div>';
    }

    if (!html) {
      html = '<p style="color:var(--text-tertiary);">No data for this date.</p>';
    }

    content.innerHTML = html;
  }

  // ═══════════════════════════════════
  // RENDER: SETTINGS
  // ═══════════════════════════════════

  function renderSettings() {
    $('#theme-select').value = data.settings.theme || 'light';
    $('#accent-select').value = data.settings.accent || 'blue';
    const nameInput = $('#username-input');
    if (nameInput) nameInput.value = data.username || '';
    renderAvatarPicker('settings-avatar-picker', (sel) => {
      data.avatar = sel;
      saveData();
      updateSidebarChip();
      updateProfilePreview();
    });
    updateProfilePreview();
  }

  function updateProfilePreview() {
    const preview = document.getElementById('profile-preview-text');
    if (!preview) return;
    const name = data.username ? data.username.trim() : 'Friend';
    const av = data.avatar || '🎯';
    preview.textContent = `${getGreeting()}, ${name}! ${av}`;
  }

  function renderAvatarPicker(containerId, onSelect, selectedAvatar) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const current = selectedAvatar || data.avatar || '🎯';
    container.innerHTML = AVAILABLE_AVATARS.map(av => `
      <button type="button" class="avatar-btn ${av === current ? 'selected' : ''}" data-avatar="${av}" aria-label="Select avatar ${av}">
        ${av}
      </button>
    `).join('');

    container.querySelectorAll('.avatar-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        container.querySelectorAll('.avatar-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        if (onSelect) onSelect(btn.dataset.avatar);
      });
    });
  }

  function applyTheme() {
    document.documentElement.setAttribute('data-theme', data.settings.theme || 'light');
    document.documentElement.setAttribute('data-accent', data.settings.accent || 'blue');
  }

  // ═══════════════════════════════════
  // SEARCH
  // ═══════════════════════════════════

  function performSearch(query) {
    const results = [];
    const q = query.toLowerCase();
    if (!q) return results;

    // Search habits
    data.habits.forEach(h => {
      if (h.name.toLowerCase().includes(q) || (h.description || '').toLowerCase().includes(q)) {
        results.push({ type: 'habit', text: h.name, page: 'habits' });
      }
    });

    // Search quit habits
    data.habitsToQuit.forEach(h => {
      if (h.name.toLowerCase().includes(q)) {
        results.push({ type: 'habit', text: h.name + ' (quit)', page: 'quit-habits' });
      }
    });

    // Search notes
    data.notes.forEach(n => {
      if (n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)) {
        results.push({ type: 'note', text: n.title, page: 'notes' });
      }
    });

    // Search hobbies
    data.hobbies.forEach(h => {
      if (h.name.toLowerCase().includes(q) || (h.oath || '').toLowerCase().includes(q)) {
        results.push({ type: 'hobby', text: h.name, page: 'hobbies' });
      }
    });

    // Search schedule (today)
    const sched = data.schedule[todayKey()] || [];
    sched.forEach(s => {
      if (s.activity.toLowerCase().includes(q)) {
        results.push({ type: 'schedule', text: s.activity, page: 'timetable' });
      }
    });

    return results.slice(0, 10);
  }

  // ═══════════════════════════════════
  // EXPORT / IMPORT
  // ═══════════════════════════════════

  function exportData() {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `habit-tracker-export-${todayKey()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function importData(file) {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const imported = JSON.parse(e.target.result);
        if (await showConfirm('Import Data', 'This will replace all your current data. Are you sure?')) {
          data = { ...defaultData, ...imported };
          saveData();
          applyTheme();
          renderPage(currentPage);
        }
      } catch {
        alert('Invalid JSON file. Please check the file and try again.');
      }
    };
    reader.readAsText(file);
  }

  // ═══════════════════════════════════
  // EVENT BINDINGS
  // ═══════════════════════════════════

  function bindEvents() {
    // Global modal close
    window._closeModal = closeModal;
    $('#modal-close').addEventListener('click', closeModal);
    $('#modal-overlay').addEventListener('click', (e) => {
      if (e.target === $('#modal-overlay')) closeModal();
    });

    // Navigation
    $$('.nav-btn').forEach(btn => {
      btn.addEventListener('click', () => navigateTo(btn.dataset.page));
    });
    $$('.dash-card-link').forEach(btn => {
      btn.addEventListener('click', () => navigateTo(btn.dataset.page));
    });

    // Mobile
    $('#hamburger').addEventListener('click', () => {
      $('#sidebar').classList.add('open');
      $('#sidebar-overlay').classList.add('open');
    });
    $('#sidebar-close').addEventListener('click', () => {
      $('#sidebar').classList.remove('open');
      $('#sidebar-overlay').classList.remove('open');
    });
    $('#sidebar-overlay').addEventListener('click', () => {
      $('#sidebar').classList.remove('open');
      $('#sidebar-overlay').classList.remove('open');
    });
    $('#mobile-search-btn').addEventListener('click', () => {
      $('#search-input').focus();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // Search
    const searchInput = $('#search-input');
    const searchResults = $('#search-results');

    searchInput.addEventListener('input', () => {
      const q = searchInput.value.trim();
      if (!q) { searchResults.classList.remove('open'); searchResults.innerHTML = ''; return; }
      const results = performSearch(q);
      if (results.length === 0) {
        searchResults.innerHTML = '<div class="search-result-item" style="color:var(--text-tertiary);">No results found</div>';
        searchResults.classList.add('open');
        return;
      }
      searchResults.innerHTML = results.map(r => `
        <div class="search-result-item" data-search-page="${r.page}" role="option">
          <span class="search-result-type ${r.type}">${r.type}</span>
          <span>${esc(r.text)}</span>
        </div>
      `).join('');
      searchResults.classList.add('open');
      searchResults.querySelectorAll('[data-search-page]').forEach(item => {
        item.addEventListener('click', () => {
          navigateTo(item.dataset.searchPage);
          searchInput.value = '';
          searchResults.classList.remove('open');
        });
      });
    });

    searchInput.addEventListener('blur', () => {
      setTimeout(() => searchResults.classList.remove('open'), 200);
    });

    // Ctrl+K shortcut
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInput.focus();
      }
      if (e.key === 'Escape') {
        closeModal();
        searchResults.classList.remove('open');
      }
    });

    // Timetable buttons
    $('#add-schedule-btn').addEventListener('click', () => openScheduleModal());
    const schedBtnEmpty = $('#add-schedule-btn-empty');
    if (schedBtnEmpty) schedBtnEmpty.addEventListener('click', () => openScheduleModal());

    // Habits buttons
    $('#add-habit-btn').addEventListener('click', () => openHabitModal());
    const habitBtnEmpty = $('#add-habit-btn-empty');
    if (habitBtnEmpty) habitBtnEmpty.addEventListener('click', () => openHabitModal());

    // Quit habits buttons
    $('#add-quit-btn').addEventListener('click', () => openQuitHabitModal());
    const quitBtnEmpty = $('#add-quit-btn-empty');
    if (quitBtnEmpty) quitBtnEmpty.addEventListener('click', () => openQuitHabitModal());

    // Checkpoints buttons
    $('#add-checkpoint-btn').addEventListener('click', () => openCheckpointGroupModal());
    const cpBtnEmpty = $('#add-checkpoint-btn-empty');
    if (cpBtnEmpty) cpBtnEmpty.addEventListener('click', () => openCheckpointGroupModal());

    // Hobbies buttons
    $('#add-hobby-btn').addEventListener('click', () => openHobbyModal());
    const hobbyBtnEmpty = $('#add-hobby-btn-empty');
    if (hobbyBtnEmpty) hobbyBtnEmpty.addEventListener('click', () => openHobbyModal());

    // Notes buttons
    $('#add-note-btn').addEventListener('click', () => openNoteModal());
    const noteBtnEmpty = $('#add-note-btn-empty');
    if (noteBtnEmpty) noteBtnEmpty.addEventListener('click', () => openNoteModal());

    // Notes search/filter
    $('#notes-search').addEventListener('input', () => renderNotes());
    $('#notes-category-filter').addEventListener('change', () => renderNotes());

    // Calendar nav
    $('#cal-prev').addEventListener('click', () => {
      calendarMonth--;
      if (calendarMonth < 0) { calendarMonth = 11; calendarYear--; }
      renderCalendar();
    });
    $('#cal-next').addEventListener('click', () => {
      calendarMonth++;
      if (calendarMonth > 11) { calendarMonth = 0; calendarYear++; }
      renderCalendar();
    });

    // Settings
    $('#theme-select').addEventListener('change', (e) => {
      data.settings.theme = e.target.value;
      applyTheme(); saveData();
    });
    $('#accent-select').addEventListener('change', (e) => {
      data.settings.accent = e.target.value;
      applyTheme(); saveData();
      // Re-render current page to update chart colors etc.
      renderPage(currentPage);
    });
    $('#username-input').addEventListener('change', (e) => {
      data.username = e.target.value.trim();
      saveData();
      if (currentPage === 'dashboard') renderDashboard();
    });

    // Export
    $('#export-btn').addEventListener('click', exportData);

    // Import
    $('#import-btn').addEventListener('click', () => $('#import-file').click());
    $('#import-file').addEventListener('change', (e) => {
      if (e.target.files[0]) importData(e.target.files[0]);
      e.target.value = '';
    });

    // Reset today
    $('#reset-today-btn').addEventListener('click', async () => {
      if (await showConfirm('Reset Today', 'This will clear today\'s completions for all habits, schedule, and checkpoints. Continue?')) {
        const today = todayKey();
        // Clear schedule completions
        if (data.schedule[today]) {
          data.schedule[today].forEach(s => s.done = false);
        }
        // Clear habit completions for today
        data.habits.forEach(h => { if (h.completions) delete h.completions[today]; });
        data.habitsToQuit.forEach(h => { if (h.relapses) delete h.relapses[today]; });
        // Clear checkpoint completions
        data.checkpoints.forEach(g => {
          (g.items || []).forEach(item => { if (item.completions) delete item.completions[today]; });
        });
        // Clear hobby completions
        data.hobbies.forEach(h => { if (h.completions) delete h.completions[today]; });
        saveData();
        renderPage(currentPage);
      }
    });

    // Clear Sample Data
    const clearSampleBtn = document.getElementById('clear-sample-btn');
    if (clearSampleBtn) {
      clearSampleBtn.addEventListener('click', async () => {
        if (await showConfirm('Purge Pre-existing Sample Data', 'This will remove all template habits, schedule items, and checkpoints so only your real personal tasks remain. Continue?')) {
          purgeSeedData();
        }
      });
    }

    // Quick Nickname Modal
    const btnEditNickname = document.getElementById('btn-edit-nickname');
    const userChip = document.getElementById('sidebar-user-chip');
    if (btnEditNickname) btnEditNickname.addEventListener('click', openQuickNicknameModal);
    if (userChip) userChip.addEventListener('click', openQuickNicknameModal);

    const nickClose = document.getElementById('nickname-modal-close');
    const nickCancel = document.getElementById('nickname-modal-cancel');
    const nickSave = document.getElementById('nickname-modal-save');
    if (nickClose) nickClose.addEventListener('click', closeQuickNicknameModal);
    if (nickCancel) nickCancel.addEventListener('click', closeQuickNicknameModal);
    if (nickSave) {
      nickSave.addEventListener('click', () => {
        const inp = document.getElementById('quick-nickname-input');
        if (inp) {
          data.username = inp.value.trim();
          saveData();
          updateSidebarChip();
          renderDashboard();
          updateProfilePreview();
          closeQuickNicknameModal();
          showToast(`Nickname updated to "${data.username || 'Friend'}"!`);
          showMascotBubble(`Looking good, ${data.username || 'Friend'}! 🌟`);
        }
      });
    }

    // Clear all data
    $('#clear-all-btn').addEventListener('click', async () => {
      if (await showConfirm('Clear All Data', 'This will permanently delete ALL your data including habits, notes, hobbies, and history. This cannot be undone. Are you sure?')) {
        data = JSON.parse(JSON.stringify(defaultData));
        saveData();
        applyTheme();
        updateSidebarChip();
        // Clear IndexedDB videos
        if (videoDB) {
          const tx = videoDB.transaction(VIDEO_STORE, 'readwrite');
          tx.objectStore(VIDEO_STORE).clear();
        }
        renderPage(currentPage);
      }
    });
  }

  function openQuickNicknameModal() {
    const overlay = document.getElementById('nickname-modal-overlay');
    const input = document.getElementById('quick-nickname-input');
    if (!overlay || !input) return;
    input.value = data.username || '';
    renderAvatarPicker('quick-avatar-picker', (av) => {
      data.avatar = av;
      updateSidebarChip();
      updateProfilePreview();
    }, data.avatar);
    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');
    setTimeout(() => input.focus(), 150);
  }

  function closeQuickNicknameModal() {
    const overlay = document.getElementById('nickname-modal-overlay');
    if (overlay) {
      overlay.classList.remove('open');
      overlay.setAttribute('aria-hidden', 'true');
    }
  }

  // ═══════════════════════════════════
  // MASCOT COMPANION SYSTEM
  // ═══════════════════════════════════

  const MASCOT_MESSAGES = {
    idle: [
      'Keep going! 💪', 'You got this! 🌟', 'Stay consistent! 🔥',
      'Believe in yourself! ✨', 'One day at a time 🎯', 'Hydrate & stay sharp! 💧',
      'Focus leads to freedom! 🚀', 'Small steps = big wins! 🏆'
    ],
    typing: [
      'Thinking... 💭', 'Writing something great? 📝',
      'Words of power! ✍️', 'Capturing thoughts! 💡', 'Locking in goals! 🎯'
    ],
    checkbox: [
      'Nice! Checked off! ✅', 'Crushed it! 🎉', 'That\'s the spirit! 🚀',
      'Habit locked in! 🔒', 'Keep that streak alive! 🔥', 'One step closer! 🌟'
    ],
    greet: [
      'Welcome back! 🌟', 'Let\'s do this! 🚀',
      'I believe in you! ✨', 'Ready to crush today? 💪'
    ]
  };

  let mascotBubbleTimer = null;

  function initMascot() {
    const mascot = document.getElementById('mascot-svg');
    const avatarContainer = document.getElementById('mascot-avatar-container');
    const bubble = document.getElementById('mascot-bubble');
    const toggleBtn = document.getElementById('mascot-toggle-btn');
    const wrapper = document.getElementById('mascot-wrapper');
    if (!mascot || !bubble) return;

    // Toggle minimize/expand
    if (toggleBtn && wrapper) {
      toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isMin = wrapper.classList.toggle('minimized');
        toggleBtn.textContent = isMin ? '🤖' : '✕';
        toggleBtn.title = isMin ? 'Expand Buddy' : 'Minimize Buddy';
      });
    }

    // Click on mascot avatar to wave + cheerful boost
    if (avatarContainer) {
      avatarContainer.addEventListener('click', () => {
        mascot.classList.remove('typing', 'excited');
        void mascot.offsetWidth; // force reflow
        mascot.classList.add('excited');
        showMascotBubble(MASCOT_MESSAGES.idle[Math.floor(Math.random() * MASCOT_MESSAGES.idle.length)]);
        setTimeout(() => mascot.classList.remove('excited'), 1200);
      });
    }

    // Motion while typing: bobbing bounce + thought bubbles
    let typingTimer = null;
    document.addEventListener('input', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        mascot.classList.add('typing');
        clearTimeout(typingTimer);
        if (Math.random() < 0.28) {
          showMascotBubble(MASCOT_MESSAGES.typing[Math.floor(Math.random() * MASCOT_MESSAGES.typing.length)]);
        }
        typingTimer = setTimeout(() => {
          mascot.classList.remove('typing');
        }, 700);
      }
    });

    // Motion while checking boxes or habit buttons
    document.addEventListener('click', (e) => {
      const isHabitBtn = e.target.closest('.habit-check-btn, .check-indicator, .checkpoint-check');
      if (isHabitBtn) {
        mascot.classList.remove('typing');
        void mascot.offsetWidth;
        mascot.classList.add('excited');
        showMascotBubble(MASCOT_MESSAGES.checkbox[Math.floor(Math.random() * MASCOT_MESSAGES.checkbox.length)]);
        setTimeout(() => mascot.classList.remove('excited'), 1200);
      }
    });

    // Motion while adjusting dropdowns or range sliders
    document.addEventListener('change', (e) => {
      if (e.target.tagName === 'SELECT' || e.target.type === 'range' || (e.target.type === 'checkbox' && e.target.checked)) {
        mascot.classList.remove('typing');
        void mascot.offsetWidth;
        mascot.classList.add('excited');
        showMascotBubble('Adjusted! Looking sharp ✨');
        setTimeout(() => mascot.classList.remove('excited'), 1000);
      }
    });

    // Periodic idle cheerful tips
    setInterval(() => {
      if (!mascot.classList.contains('typing') && !mascot.classList.contains('excited')) {
        if (Math.random() < 0.22) {
          showMascotBubble(MASCOT_MESSAGES.idle[Math.floor(Math.random() * MASCOT_MESSAGES.idle.length)]);
        }
      }
    }, 18000);

    // Greet on load
    const name = data.username ? data.username.split(' ')[0] : '';
    const greetMsg = name ? `Hey ${name}! 👋 Ready for today?` : 'Hey friend! 👋 Let\'s build great habits!';
    setTimeout(() => showMascotBubble(greetMsg), 1400);
  }

  function showMascotBubble(message) {
    const bubble = document.getElementById('mascot-bubble');
    if (!bubble) return;
    clearTimeout(mascotBubbleTimer);
    bubble.textContent = message;
    bubble.classList.add('visible');
    mascotBubbleTimer = setTimeout(() => {
      bubble.classList.remove('visible');
    }, 3200);
  }

  // ═══════════════════════════════════
  // ONBOARDING
  // ═══════════════════════════════════

  function checkOnboarding() {
    const raw = localStorage.getItem(STORAGE_KEY);
    // Show onboarding if no username is set yet
    if (!raw || !data.username) {
      const overlay = document.getElementById('onboarding-overlay');
      if (!overlay) return;
      overlay.setAttribute('aria-hidden', 'false');
      overlay.classList.add('open');
      const input = document.getElementById('onboarding-name');
      const submitBtn = document.getElementById('onboarding-submit');

      let chosenAvatar = data.avatar || '🎯';
      renderAvatarPicker('onboarding-avatar-picker', (av) => {
        chosenAvatar = av;
      }, chosenAvatar);

      setTimeout(() => { if (input) input.focus(); }, 300);

      function completeOnboarding() {
        const name = input ? input.value.trim() : '';
        data.username = name;
        data.avatar = chosenAvatar;
        saveData();
        overlay.classList.remove('open');
        overlay.setAttribute('aria-hidden', 'true');
        updateSidebarChip();
        renderDashboard();
        updateProfilePreview();
        const greetMsg = name ? `Welcome, ${name}! 🎉` : 'Welcome! Let\'s build great habits! 🚀';
        setTimeout(() => showMascotBubble(greetMsg), 600);
      }

      if (submitBtn) submitBtn.onclick = completeOnboarding;
      if (input) {
        input.onkeydown = (e) => {
          if (e.key === 'Enter') completeOnboarding();
        };
      }
    }
  }

  // ═══════════════════════════════════
  // INITIALIZATION
  // ═══════════════════════════════════

  async function init() {
    loadData();
    applyTheme();

    try {
      await openVideoDB();
    } catch (e) {
      console.warn('IndexedDB not available for video storage:', e);
    }

    bindEvents();
    updateSidebarChip();
    navigateTo('dashboard');
    checkOnboarding();
    initMascot();

    // Username change in settings updates chip and live preview
    const usernameInput = document.getElementById('username-input');
    if (usernameInput) {
      usernameInput.addEventListener('input', () => {
        data.username = usernameInput.value.trim();
        updateSidebarChip();
        updateProfilePreview();
      });
    }

    // Clock updater
    setInterval(() => {
      if (currentPage === 'dashboard') updateClock();
    }, 1000);
  }

  // Start the app
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
