// Sprint cards & dashboard — depends on data.js (SPRINTS, PHASE_META)
"use strict";

/* ── Colours ──────────────────────────────────────────────────── */
const PC = {linux:'#38BDF8',docker:'#60A5FA',cicd:'#34D399',cloud:'#FB923C',
            k8s:'#F87171',buffer:'#A3E635',exam:'#FFC443',phase2:'#C084FC'};
const LBADGE = {
  High:  '<span class="badge badge-high">⚡ High</span>',
  Medium:'<span class="badge badge-medium">▸ Medium</span>',
  Buffer:'<span class="badge badge-buffer">~ Buffer</span>'
};

/* ── Current sprint from start date ──────────────────────────── */
function getCurrentSprintId() {
  const saved = localStorage.getItem('rdm-start');
  if (!saved) return null;
  const base = new Date(saved);
  const now  = new Date(); now.setHours(0,0,0,0);
  const days = Math.floor((now - base) / 86400000);
  if (days < 0) return null;
  const idx = Math.floor(days / 14);
  return idx >= SPRINTS.length ? SPRINTS[SPRINTS.length-1].id : SPRINTS[idx].id;
}
const currentId = getCurrentSprintId();

/* ── Build sprint cards ───────────────────────────────────────── */
const CAPSTONE_SPRINTS = new Set([8, 10, 13, 16, 19, 21]);
const allCards = [];

SPRINTS.forEach(sp => {
  const ph    = PHASE_META[sp.phase] || {label:'—', color:'#888'};
  const color = PC[sp.phase] || ph.color;
  const g     = document.getElementById(sp.stage === 1 ? 'grid1' : 'grid2');
  const topicCount = 3 + (sp.exam ? 1 : 0);
  const topicDone  = JSON.parse(localStorage.getItem('sp-top-'+sp.id)||'[]').length;
  const pct        = Math.round(Math.min(topicDone, topicCount) / topicCount * 100);

  const a = document.createElement('a');
  a.className   = `scard ph-${sp.phase}${sp.id === currentId ? ' is-current' : ''}`;
  a.href        = `sprints/s${String(sp.id).padStart(2,'0')}.html`;
  a.dataset.search = [sp.title, sp.goal, sp.core, sp.skill,
                       sp.deliverable, sp.instructions.join(' ')].join(' ').toLowerCase();
  a.dataset.phase  = sp.phase;
  a.dataset.id     = sp.id;

  const currentTag = sp.id === currentId
    ? `<span class="scard-current-tag">▶ сейчас</span>` : '';
  const examBadge  = sp.exam ? `<span class="badge badge-exam">${sp.exam}</span>` : '';
  const loadBadge  = LBADGE[sp.load] || '';
  const capstoneBadge = CAPSTONE_SPRINTS.has(sp.id) ? `<span class="badge badge-capstone">🚀 Capstone</span>` : '';
  const minOfferBadge = sp.id === 16 ? `<span class="badge badge-min-offer">🎯 Минимум для оффера</span>` : '';
  const pctLabel   = pct > 0 ? `<span style="color:${color};font-family:var(--fm);font-size:10px;margin-left:auto">${pct}%</span>` : '';

  a.innerHTML = `
    <div class="sc-top">
      <span class="sc-num">S${String(sp.id).padStart(2,'0')}</span>
      <span class="sc-phase">${ph.label}</span>
      <span class="sc-wk">Нед.&nbsp;${sp.weeks}</span>
      ${currentTag}
    </div>
    <div class="sc-title">${sp.title}</div>
    <div class="sc-goal">${sp.goal}</div>
    <div class="sc-badges">${examBadge}${loadBadge}${capstoneBadge}${minOfferBadge}${pctLabel}</div>
    <div class="sc-mini-bar">
      <div class="sc-mini-fill" style="width:${pct}%"></div>
    </div>`;
  g.appendChild(a);
  allCards.push(a);
});

/* ── Dashboard ────────────────────────────────────────────────── */
function buildDashboard() {
  let totalTopics=0, doneTopics=0, totalTasks=0, doneTasks=0, notesCount=0;
  const phaseData = {};
  Object.keys(PHASE_META).forEach(k => { phaseData[k] = {total:0, done:0}; });

  SPRINTS.forEach(sp => {
    const tc  = 3 + (sp.exam ? 1 : 0);
    const td  = Math.min(JSON.parse(localStorage.getItem('sp-top-'+sp.id)||'[]').length, tc);
    const tkc = sp.instructions.length;
    const tkd = Math.min(JSON.parse(localStorage.getItem('sp-done-'+sp.id)||'[]').length, tkc);
    totalTopics += tc; doneTopics += td;
    totalTasks  += tkc; doneTasks += tkd;
    if ((localStorage.getItem('sp-notes-'+sp.id)||'').trim()) notesCount++;
    if (phaseData[sp.phase]) { phaseData[sp.phase].total += tc; phaseData[sp.phase].done += td; }
  });

  const pct = totalTopics > 0 ? Math.round(doneTopics / totalTopics * 100) : 0;
  document.getElementById('gp-pct').textContent    = pct + '%';
  document.getElementById('gp-topics').innerHTML   = `<span>${doneTopics}</span> / ${totalTopics}`;
  document.getElementById('gp-tasks').innerHTML    = `<span>${doneTasks}</span> / ${totalTasks}`;
  document.getElementById('gp-notes').innerHTML    = `<span>${notesCount}</span>`;

  if (currentId) {
    const csp = SPRINTS.find(s => s.id === currentId);
    if (csp) {
      const btn = document.getElementById('current-sprint-btn');
      btn.classList.add('visible');
      btn.href = `sprints/s${String(currentId).padStart(2,'0')}.html`;
      document.getElementById('csb-title').textContent =
        `S${String(currentId).padStart(2,'0')} · ${csp.title.substring(0,30)}${csp.title.length>30?'…':''}`;
    }
  }

  const container = document.getElementById('phase-bars');
  container.innerHTML = '';
  Object.entries(phaseData).forEach(([key, {total, done}]) => {
    if (!total) return;
    const p = Math.round(done / total * 100);
    const c = PC[key] || PHASE_META[key].color;
    const row = document.createElement('div');
    row.className = 'ph-bar-row';
    row.innerHTML = `
      <div class="ph-bar-lbl">${PHASE_META[key].label}</div>
      <div class="ph-bar-track">
        <div class="ph-bar-fill" style="width:${p}%;background:${c}"></div>
      </div>
      <div class="ph-bar-pct">${p}%</div>`;
    container.appendChild(row);
  });
}
buildDashboard();

