// UI Widgets — streak, pace, timer, recap, daily note, backup, filter, search
"use strict";

/* ── Streak (считается только по выполненному плану) ──────────── */
// Ключ: 'rdm-goal-YYYY-MM-DD' = '1' если цель выполнена в этот день
// Ключ: 'rdm-skip-weekends' = '1' если выходные не считаются пропуском
function updateStreak() {
  if (!localStorage.getItem('rdm-start')) return; // роадмап не начат

  const GOAL_MINS = 150;
  const today = new Date().toISOString().slice(0,10);
  const skipWeekends = localStorage.getItem('rdm-skip-weekends') === '1';

  // Считаем минуты за сегодня
  let todayMins = 0;
  SPRINTS.forEach(sp => {
    const v = parseInt(localStorage.getItem('sp-pomo-day-' + sp.id + '-' + today) || '0');
    todayMins += v * 25;
  });

  // Если сегодня цель выполнена — записываем
  const goalKey = 'rdm-goal-' + today;
  if (todayMins >= GOAL_MINS) {
    localStorage.setItem(goalKey, '1');
  }

  // Считаем текущий стрик: идём назад по дням пока есть выполненные
  // Если skipWeekends=true — суббота/воскресенье не прерывают стрик
  let streak = 0;
  for (let d = 0; d < 365; d++) {
    const dt = new Date(Date.now() - d * 86400000);
    const dtKey = dt.toISOString().slice(0,10);
    const isWeekend = dt.getDay() === 0 || dt.getDay() === 6;
    if (localStorage.getItem('rdm-goal-' + dtKey) === '1') {
      streak++;
    } else if (skipWeekends && isWeekend) {
      continue; // выходной без активности — не прерывает стрик
    } else {
      break; // пропуск рабочего дня — стрик обрывается
    }
  }

  // Показываем только если стрик >= 2
  if (streak >= 2) {
    const badge = document.getElementById('streak-badge');
    badge.classList.add('visible');
    document.getElementById('streak-n').textContent = streak;
  } else {
    document.getElementById('streak-badge').classList.remove('visible');
  }
}
updateStreak();
// Init skip-weekends button state immediately
(function() {
  const btn = document.getElementById('streak-skip-btn');
  if (btn && localStorage.getItem('rdm-skip-weekends') === '1') btn.classList.add('on');
})();

window.toggleSkipWeekends = function() {
  const skip = localStorage.getItem('rdm-skip-weekends') === '1';
  localStorage.setItem('rdm-skip-weekends', skip ? '0' : '1');
  document.getElementById('streak-skip-btn').classList.toggle('on', !skip);
  updateStreak();
};

/* ── Pace indicator ─────────────────────────────────────────── */
function buildPace() {
  const saved = localStorage.getItem('rdm-start');
  const row = document.getElementById('pace-row');
  if (!saved) {
    row.innerHTML = '<span class="pace-chip pace-nostart">📅 Установи дату старта в Календаре</span>';
    return;
  }
  const base = new Date(saved);
  const now = new Date(); now.setHours(0,0,0,0);
  const days = Math.floor((now - base) / 86400000);
  if (days < 0) { row.innerHTML = '<span class="pace-chip pace-nostart">⏳ Старт ещё впереди</span>'; return; }
  const expectedIdx = Math.floor(days / 14);
  const expectedSprint = Math.min(expectedIdx + 1, SPRINTS.length);
  // find actual last done sprint
  let lastDone = 0;
  SPRINTS.forEach(sp => {
    const done = JSON.parse(localStorage.getItem('sp-done-'+sp.id)||'[]');
    const tops = JSON.parse(localStorage.getItem('sp-top-'+sp.id)||'[]');
    if (done.length > 0 || tops.length > 0) lastDone = sp.id;
  });
  const diff = lastDone - expectedSprint;
  let cls, txt;
  if (lastDone === 0) {
    cls = 'pace-nostart'; txt = '🚦 Активность не зафиксирована';
  } else if (diff >= 1) {
    cls = 'pace-ahead'; txt = `🚀 Опережение на ${diff} спр.`;
  } else if (diff === 0) {
    cls = 'pace-ok'; txt = '✅ По плану';
  } else if (diff === -1) {
    cls = 'pace-behind'; txt = `⚠️ Отставание на 1 спринт`;
  } else {
    cls = 'pace-way-behind'; txt = `🔴 Отставание на ${Math.abs(diff)} спринта`;
  }
  // Next exam countdown
  const today = new Date(); today.setHours(0,0,0,0);
  const nextExamSprint = SPRINTS.find(sp => sp.exam && !sp.exam.includes('опц') && sp.id >= currentId);
  let examHtml = '';
  if (nextExamSprint) {
    const examDate = new Date(base.getTime() + nextExamSprint.id * 14 * 86400000);
    const daysLeft = Math.ceil((examDate - today) / 86400000);
    if (daysLeft > 0) {
      examHtml = `<span class="exam-countdown">🏆 До <strong>${nextExamSprint.exam.replace('🏆 ','')}</strong>: ${daysLeft} дн.</span>`;
    }
  }
  // Priority rule: show when behind schedule
  let priorityHint = '';
  if (diff <= -1) {
    priorityHint = `<span class="pace-priority-hint">💡 Пропусти экзамен — сохрани проект</span>`;
  }
  row.innerHTML = `<span class="pace-chip ${cls}">${txt}</span>${examHtml}${priorityHint}`;
}
buildPace();

/* ── Today timer ─────────────────────────────────────────── */
(function() {
  const today = new Date().toISOString().slice(0,10);
  const GOAL_MINS = 150; // 2.5h
  let totalMins = 0;
  SPRINTS.forEach(sp => {
    const dayKey = 'sp-pomo-day-' + sp.id + '-' + today;
    const allKey = 'sp-pomo-' + sp.id;
    // count sessions recorded today for this sprint
    const todaySess = parseInt(localStorage.getItem(dayKey) || '0');
    totalMins += todaySess * 25;
  });
  const h = Math.floor(totalMins / 60), m = totalMins % 60;
  const pct = Math.min(100, Math.round(totalMins / GOAL_MINS * 100));
  const el = document.getElementById('tt-val');
  el.textContent = `${h} ч ${m} мин`;
  if (pct >= 100) el.classList.add('tt-over');
  document.getElementById('tt-bar').style.width = pct + '%';
  document.getElementById('tt-goal').textContent = pct >= 100 ? '✅ цель достигнута!' : `/ цель 3 ч (${pct}%)`;
})();

/* ── Has-notes dots on sprint cards ─────────────────────── */
allCards.forEach(card => {
  const sid = parseInt(card.dataset.id);
  const hasNotes = (localStorage.getItem('sp-notes-' + sid) || '').trim().length > 0;
  if (hasNotes) {
    const dot = document.createElement('div');
    dot.className = 'sc-notes-dot';
    dot.title = 'Есть конспект';
    card.querySelector('.sc-badges').appendChild(dot);
  }
  // apply skip visual
  const skipped = localStorage.getItem('sp-skip-' + sid) === '1';
  if (skipped) card.classList.add('is-skipped');
});

/* ── Weekly recap ────────────────────────────────────────── */
window.openRecap = function() {
  const modal = document.getElementById('recap-modal');
  modal.classList.remove('hidden');

  // Week bounds: Mon–Sun
  const now = new Date();
  const day = now.getDay(); // 0=Sun
  const mon = new Date(now); mon.setDate(now.getDate() - (day === 0 ? 6 : day - 1)); mon.setHours(0,0,0,0);
  const sun = new Date(mon); sun.setDate(mon.getDate() + 6);

  const fmtD = d => d.toLocaleDateString('ru-RU', {day:'numeric', month:'short'});
  document.getElementById('recap-subtitle').textContent =
    `${fmtD(mon)} — ${fmtD(sun)} · ${now.toLocaleDateString('ru-RU',{weekday:'long'})}`;

  // Collect daily notes for this week
  const hist = JSON.parse(localStorage.getItem('rdm-daily-history') || '{}');
  let weekDailies = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(mon); d.setDate(mon.getDate() + i);
    const key = d.toISOString().slice(0,10);
    weekDailies.push({ date: d, text: hist[key] || '' });
  }

  // Collect pomodoro sessions this week (from day-keys)
  let weekPomo = 0;
  SPRINTS.forEach(sp => {
    for (let i = 0; i < 7; i++) {
      const d = new Date(mon); d.setDate(mon.getDate() + i);
      const key = 'sp-pomo-day-' + sp.id + '-' + d.toISOString().slice(0,10);
      weekPomo += parseInt(localStorage.getItem(key) || '0');
    }
  });

  // Sprints with activity this week
  // Use per-day pomo keys to detect week activity (tasks have no timestamps)
  let weekTasks = 0;
  const activeSprints = [];
  SPRINTS.forEach(sp => {
    const done = JSON.parse(localStorage.getItem('sp-done-' + sp.id) || '[]');
    const rating = parseInt(localStorage.getItem('sp-rating-' + sp.id) || '0');
    // Check if any pomo sessions happened this week for this sprint
    let weekPomoForSprint = 0;
    for (let i = 0; i < 7; i++) {
      const d = new Date(mon); d.setDate(mon.getDate() + i);
      const key = 'sp-pomo-day-' + sp.id + '-' + d.toISOString().slice(0,10);
      weekPomoForSprint += parseInt(localStorage.getItem(key) || '0');
    }
    const activeThisWeek = weekPomoForSprint > 0 || rating > 0;
    if (activeThisWeek) {
      weekTasks += done.length;
      activeSprints.push({ sp, done: done.length, total: sp.instructions.length, rating, weekPomo: weekPomoForSprint });
    }
  });

  const weekMins = weekPomo * 25;
  const wh = Math.floor(weekMins / 60), wm = weekMins % 60;

  // Stats
  document.getElementById('recap-stats').innerHTML = `
    <div class="recap-stat">
      <div class="recap-stat-n">${weekPomo}</div>
      <div class="recap-stat-l">помодоро</div>
    </div>
    <div class="recap-stat">
      <div class="recap-stat-n">${wh}ч ${wm}м</div>
      <div class="recap-stat-l">времени</div>
    </div>
    <div class="recap-stat">
      <div class="recap-stat-n">${weekTasks}</div>
      <div class="recap-stat-l">задач сделано</div>
    </div>`;

  // Daily notes
  const withNotes = weekDailies.filter(d => d.text.trim());
  document.getElementById('recap-dailies').innerHTML = withNotes.length
    ? withNotes.map(({date, text}) => `
        <div class="recap-day-row">
          <div class="recap-day-lbl">${date.toLocaleDateString('ru-RU',{weekday:'short',day:'numeric',month:'short'})}</div>
          <div class="recap-day-val">${text}</div>
        </div>`).join('')
    : '<div class="recap-empty">Дейли-заметок за неделю нет</div>';

  // Active sprints
  const SR_LABELS = ['','😐','🙂','😊','💪','🔥'];
  document.getElementById('recap-sprints').innerHTML = activeSprints.length
    ? activeSprints.map(({sp, done, total, rating}) => `
        <div class="recap-sprint-row">
          <span class="recap-sprint-num">S${String(sp.id).padStart(2,'0')}</span>
          <span class="recap-sprint-title">${sp.title.substring(0,42)}${sp.title.length>42?'…':''}</span>
          <span style="font-family:var(--fm);font-size:10px;color:var(--t3)">${done}/${total}</span>
          ${rating ? `<span class="recap-sprint-rating">${SR_LABELS[rating]}</span>` : ''}
        </div>`).join('')
    : '<div class="recap-empty">Активности в спринтах не зафиксировано</div>';
};
window.closeRecap = function() {
  document.getElementById('recap-modal').classList.add('hidden');
};
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeRecap();
});

/* ── Daily note ─────────────────────────────────────────────── */
(function() {
  const today = new Date().toISOString().slice(0,10); // shared with outer scope via rdm-today
  const KEY = 'rdm-daily-' + today;
  const HIST_KEY = 'rdm-daily-history';
  const ta = document.getElementById('daily-ta');
  const hint = document.getElementById('daily-hint');
  document.getElementById('daily-date').textContent = new Date().toLocaleDateString('ru-RU',{weekday:'long',day:'numeric',month:'long'});
  ta.value = localStorage.getItem(KEY) || '';
  let t;
  ta.addEventListener('input', () => {
    clearTimeout(t);
    hint.textContent = 'сохранение...';
    t = setTimeout(() => {
      const v = ta.value.trim();
      if (v) localStorage.setItem(KEY, v);
      // save to history
      const hist = JSON.parse(localStorage.getItem(HIST_KEY) || '{}');
      hist[today] = v;
      localStorage.setItem(HIST_KEY, JSON.stringify(hist));
      hint.textContent = '✓ сохранено';
    }, 600);
  });
  window.toggleDailyHist = function() {
    const hist = JSON.parse(localStorage.getItem(HIST_KEY) || '{}');
    const el = document.getElementById('daily-hist');
    el.classList.toggle('open');
    if (!el.classList.contains('open')) return;
    const sorted = Object.entries(hist).sort((a,b) => b[0].localeCompare(a[0])).slice(0,30);
    if (!sorted.length) { el.innerHTML = '<div class="ns-empty" style="padding:12px 0">Пока нет записей</div>'; return; }
    el.innerHTML = sorted.map(([d,t]) => {
      const dd = new Date(d).toLocaleDateString('ru-RU',{day:'numeric',month:'short',weekday:'short'});
      return `<div class="dh-row"><div class="dh-date">${dd}</div><div class="dh-text">${t||'—'}</div></div>`;
    }).join('');
  };
})();

/* ── Backup / Restore ───────────────────────────────────────── */
window.exportBackup = function() {
  const data = {};
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k.startsWith('rdm-') || k.startsWith('sp-')) data[k] = localStorage.getItem(k);
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const d = new Date().toISOString().slice(0,10);
  a.href = url; a.download = `devops-roadmap-backup-${d}.json`; a.click();
  URL.revokeObjectURL(url);
  const msg = document.getElementById('backup-msg');
  msg.textContent = `✓ Экспортировано ${Object.keys(data).length} ключей`; msg.className = 'backup-msg ok';
};
window.importBackup = function(input) {
  const file = input.files[0]; if (!file) return;
  const msg = document.getElementById('backup-msg');
  const r = new FileReader();
  r.onload = e => {
    try {
      const data = JSON.parse(e.target.result);
      if (typeof data !== 'object') throw new Error('Неверный формат');
      let count = 0;
      Object.entries(data).forEach(([k,v]) => {
        if (k.startsWith('rdm-') || k.startsWith('sp-')) { localStorage.setItem(k,v); count++; }
      });
      msg.textContent = `✓ Восстановлено ${count} ключей — перезагружаю...`; msg.className = 'backup-msg ok';
      setTimeout(() => location.reload(), 1200);
    } catch(err) {
      msg.textContent = '✗ Ошибка: ' + err.message; msg.className = 'backup-msg err';
    }
  };
  r.readAsText(file);
};

/* ── Phase filter ─────────────────────────────────────────────── */
const filterWrap = document.getElementById('phase-filter');
let activePhase = 'all';

const allChip = document.createElement('div');
allChip.className = 'pf-chip all on';
allChip.dataset.phase = 'all';
allChip.style.background = 'var(--grn)';
allChip.textContent = 'Все';
filterWrap.appendChild(allChip);

Object.entries(PHASE_META).forEach(([key, meta]) => {
  const chip = document.createElement('div');
  chip.className  = 'pf-chip';
  chip.dataset.phase = key;
  chip.textContent   = meta.label;
  chip.style.setProperty('--chip-c', PC[key] || meta.color);
  filterWrap.appendChild(chip);
});

filterWrap.addEventListener('click', e => {
  const chip = e.target.closest('.pf-chip');
  if (!chip) return;
  activePhase = chip.dataset.phase;
  document.querySelectorAll('.pf-chip').forEach(c => {
    const isOn = c.dataset.phase === activePhase;
    c.classList.toggle('on', isOn);
    if (isOn && c.dataset.phase !== 'all') {
      c.style.background = PC[c.dataset.phase] || '#888';
      c.style.color = 'var(--bg0)';
    } else if (!isOn) {
      c.style.background = '';
      c.style.color = '';
    } else {
      c.style.background = 'var(--grn)';
      c.style.color = 'var(--bg0)';
    }
  });
  applyFilters();
});

/* ── Search ───────────────────────────────────────────────────── */
const searchInput = document.getElementById('search-input');
const searchClear = document.getElementById('search-clear');
const searchCount = document.getElementById('search-count');

function applyFilters() {
  const q = searchInput.value.trim().toLowerCase();
  searchClear.classList.toggle('visible', !!q);

  let visible = 0;
  allCards.forEach(card => {
    const matchQ     = !q || card.dataset.search.includes(q);
    const matchPhase = activePhase === 'all' || card.dataset.phase === activePhase;
    const show = matchQ && matchPhase;
    card.classList.toggle('is-hidden', !show);
    if (show) visible++;
  });

  const filtering = q || activePhase !== 'all';
  searchCount.classList.toggle('visible', filtering);
  if (filtering) {
    searchCount.textContent = `Показано: ${visible} из ${SPRINTS.length} спринтов`;
  }

  const visStage2 = [...document.querySelectorAll('#grid2 .scard:not(.is-hidden)')].length;
  document.getElementById('stage2-divider').classList.toggle('hidden-divider', visStage2 === 0);
}

searchInput.addEventListener('input', applyFilters);
searchClear.addEventListener('click', () => {
  searchInput.value = '';
  applyFilters();
  searchInput.focus();
});

document.addEventListener('keydown', e => {
  if (e.key === '/' && document.activeElement !== searchInput) {
    e.preventDefault(); searchInput.focus(); searchInput.select();
  }
  if (e.key === 'Escape' && document.activeElement === searchInput) {
    searchInput.value = ''; applyFilters(); searchInput.blur();
  }
});

