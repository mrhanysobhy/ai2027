/* ═══════════════════════════════════════════════════════════
   AI Pioneers — المكوّن الرئيسي: الموجّه + الصفحات
   ═══════════════════════════════════════════════════════════ */

/* ─────────────────────────── الوضع الليلي/النهاري ─────────────────────────── */

function themeInit() {
  applyTheme(ls.g('theme') || 'system');
}

function applyTheme(t) {
  document.documentElement.setAttribute('data-theme', t);
  ls.s('theme', t);
  renderHeader();
}

function themeIcon() {
  const t = ls.g('theme') || 'system';
  if (t === 'dark') return '☀️';
  if (t === 'light') return '🌙';
  return '🌗';
}

function toggleTheme() {
  const t = ls.g('theme') || 'system';
  applyTheme(t === 'dark' ? 'light' : (t === 'light' ? 'system' : 'dark'));
}

/* ───────────────────────────── الهيدر ───────────────────────────── */

function renderHeader() {
  const H = $('H');
  if (!H) return;
  H.innerHTML = `
    <b>🎓 ${SCH.platformName || 'AI Pioneers'}</b>
    <button class="btn sm theme-btn" onclick="toggleTheme()" title="تبديل الوضع">${themeIcon()}</button>
    <a href="#home">الرئيسية</a>
    ${me
      ? `<a href="#results">نتائجي</a><span class="who">👤 ${me.name}</span><button class="btn" onclick="logout()">خروج</button>`
      : `<button class="btn p" onclick="openLogin()">تسجيل الدخول</button>`}
  `;
}

/* ───────────────────────────── الموجّه ───────────────────────────── */

function nav() {
  if (Ex) { if (Ex.iv) clearInterval(Ex.iv); Ex = null; } // التخلي عن اختبار قديم عند المغادرة
  renderHeader();
  const p = (location.hash || '#home').slice(1).split('/');
  const root = p[0] || 'home';

  if (root === 'admin') { main(adminView()); return; }

  if (!me && root !== '' && root !== 'home') {
    location.hash = '#home';
    openLogin();
    return;
  }

  window.scrollTo(0, 0);
  if (root === 'subject' && p[1]) return main(subjectView(p[1]));
  if (root === 'lesson' && p[1] && p[2]) return main(lessonView(p[1], +p[2], p[3] || 'explain'));
  if (root === 'results') return main(resultsView());
  if (root === 'cert' && p[1] && p[2]) return main(studentCertView(p[1], +p[2]));
  main(homeView());
}

function main(html) {
  const app = $('app');
  if (app) app.innerHTML = html;
}

/* ───────────────────────────── الصفحة الرئيسية ───────────────────────────── */

function homeView() {
  const cards = (D.subjects || []).map((s) => `
    <div class="sc" style="background:${s.gradient}" onclick="${me ? `location.hash='#subject/${s.id}'` : 'openLogin()'}">
      <div class="ic">${s.emoji}</div>
      <h3>${s.name}</h3>
      <p>${s.description}</p>
      <p style="margin-top:8px">📚 ${s.lessons.length} دروس · 📝 ${s.lessons.length} اختبارات</p>
      ${me ? '' : '<div class="lock"><span style="font-size:2rem">🔒</span>سجل دخولك أولاً</div>'}
    </div>`).join('');

  return `
    <div class="banner">
      <h1>🎓 ${SCH.platformName || 'AI Pioneers'}</h1>
      <p>${SCH.platformSlogan || 'نحو مستقبل رقمي مشرق'}</p>
    </div>
    <div class="grid">${cards}</div>
    <p class="mu" style="text-align:center;margin-top:24px"><a href="#admin">👨‍💼 لوحة الإدارة (للمعلم)</a></p>`;
}

/* ───────────────────────────── صفحة المادة ───────────────────────────── */

function subjectView(id) {
  const s = sub(id);
  if (!s) return homeView();
  const lessons = s.lessons.map((lesson, i) => `
    <div class="card">
      <h3>الدرس ${i + 1}: ${lesson.title}</h3>
      <div class="tabs lt">${lessonTabs(s.id, i + 1, 'explain')}</div>
    </div>`).join('');

  return `
    <div class="banner" style="background:${s.gradient}">
      <div style="font-size:2.4rem">${s.emoji}</div>
      <h1>${s.name}</h1>
      <p>${s.description}<br>${SCH.className || ''} · ${SCH.academicYear || ''}</p>
    </div>
    ${lessons}`;
}

function lessonTabs(sid, n, active) {
  const items = [
    ['explain', 'الشرح'],
    ['review', 'المراجعة'],
    ['practice', 'اختبار تجريبي'],
    ['final', 'اختبار نهائي']
  ];
  return items.map(([k, label]) => `
    <a class="tb ${k} ${k === active ? 'on' : ''}" href="#lesson/${sid}/${n}/${k}">${label}</a>`).join('');
}

/* ───────────────────────────── صفحة الدرس ───────────────────────────── */

function lessonView(id, n, tab) {
  const s = sub(id);
  const entry = lessonEntry(s, n);
  if (!s || !entry) return homeView();
  const lesson = lessonContent(s, n);

  const valid = ['explain', 'review', 'practice', 'final'];
  if (valid.indexOf(tab) < 0) tab = 'explain';

  let box = '';
  if (tab === 'explain') box = explainView(lesson, entry);
  else if (tab === 'review') box = lesson ? reviewView(lesson) : '<div class="card" style="text-align:center">لا توجد مراجعة بعد.</div>';
  else if (tab === 'practice') box = practiceIntro(s, entry, lesson, n);
  else if (tab === 'final') box = finalView(s, entry, lesson, n);

  return `
    <p><a href="#subject/${s.id}">← ${s.name}</a></p>
    <h2 style="margin:0">${entry.title}</h2>
    <small class="mu">${s.name} | ${SCH.platformName || ''}</small>
    <div class="tabs lt">${lessonTabs(s.id, n, tab)}</div>
    ${lesson && lesson.placeholder ? '<p class="note">📝 هذا الدرس قيد الإعداد ويُعرض بمحتوى تجريبي.</p>' : ''}
    <div id="box">${box}</div>`;
}

/* ───────────────────────────── الشرح ───────────────────────────── */

function explainView(lesson, entry) {
  const content = (lesson && lesson.explanation && lesson.explanation.content);
  if (!content) return '<div class="card" style="text-align:center">📝 الدرس قيد التحضير.</div>';
  return `<div class="card prose">${content}</div>`;
}

/* ───────────────────────────── المراجعة ───────────────────────────── */

let RQ = [];

function reviewView(lesson) {
  const qs = (lesson.review && lesson.review.questions) || [];
  if (!qs.length) return '<div class="card" style="text-align:center">لا توجد أسئلة مراجعة بعد.</div>';
  RQ = qs;
  return `
    <div class="note">📖 هذه الأسئلة للمراجعة فقط دون درجات — محاولة واحدة لكل سؤال.</div>
    ${qs.map((q, i) => reviewCard(q, i)).join('')}`;
}

function reviewCard(q, i) {
  if (q.type === 'mcq') {
    return `
      <div class="card" id="rq${i}">
        <h3>${i + 1}. ${q.question}</h3>
        <div class="opts">${q.options.map((o, j) => `<button class="opt" data-v="${j}" onclick="rv(${i},${j})">${optionLetter(j)}) ${o}</button>`).join('')}</div>
        <div class="fb"></div>
        <div class="expl" hidden></div>
      </div>`;
  }
  if (q.type === 'truefalse') {
    return `
      <div class="card" id="rq${i}">
        <h3>${i + 1}. ${q.question}</h3>
        <div class="row">
          <button class="opt" data-v="true" onclick="rv(${i},true)">✔ صح</button>
          <button class="opt" data-v="false" onclick="rv(${i},false)">✖ خطأ</button>
        </div>
        <div class="fb"></div>
        <div class="expl" hidden></div>
      </div>`;
  }
  if (q.type === 'complete') {
    return `
      <div class="card" id="rq${i}">
        <h3>${i + 1}. أكمل: ${q.question}</h3>
        <div class="row">
          <input id="c${i}" class="inp" placeholder="اكتب إجابتك...">
          <button class="btn p" onclick="rvc(${i})">تحقق</button>
        </div>
        <div class="fb"></div>
        <div class="expl" hidden></div>
      </div>`;
  }
  return '';
}

function rv(i, v) {
  const q = RQ[i];
  if (!q || q._done) return;
  q._done = true;
  const card = $('rq' + i);
  if (!card) return;

  let correct;
  if (q.type === 'mcq') correct = v === q.correct;
  else correct = (v === true) === !!q.correct;

  card.querySelectorAll('.opt').forEach((b) => {
    b.disabled = true;
    if (String(b.dataset.v) === String(q.correct)) b.classList.add('ok');
    else if (String(b.dataset.v) === String(v)) b.classList.add('bad');
  });
  showReviewFeedback(card, correct, q.explanation);
}

function rvc(i) {
  const q = RQ[i];
  if (!q || q._done) return;
  q._done = true;
  const card = $('rq' + i);
  const inp = $('c' + i);
  if (!card || !inp) return;

  const norm = (s) => String(s || '').trim().toLowerCase()
    .replace(/[()؟?،,.;:!]/g, '').replace(/\s+/g, ' ').trim();
  const v = norm(inp.value);
  const ans = norm(q.answer);
  const correct = v !== '' && v === ans;

  inp.disabled = true;
  inp.classList.add(correct ? 'ok' : 'bad');
  if (!correct) {
    const hint = document.createElement('div');
    hint.className = 'bx-note';
    hint.innerHTML = 'الإجابة الصحيحة: <b>' + q.answer + '</b>';
    card.querySelector('.opts, .row') ? inp.closest('.row').insertAdjacentElement('afterend', hint) : card.appendChild(hint);
  }
  showReviewFeedback(card, correct, q.explanation);
}

function showReviewFeedback(card, correct, explanation) {
  const fb = card.querySelector('.fb');
  const ex = card.querySelector('.expl');
  if (fb) {
    fb.className = 'fb ' + (correct ? 'ok' : 'bad');
    fb.textContent = correct ? '✔ إجابة صحيحة' : '✖ إجابة خاطئة';
  }
  if (ex) {
    ex.hidden = false;
    ex.textContent = explanation || '';
  }
}

/* ───────────────────────────── صفحة النتائج ───────────────────────────── */

function resultsView() {
  if (!me) return homeView();
  const code = me.code;
  const list = [];

  (D.subjects || []).forEach((s) => {
    s.lessons.forEach((entry, i) => {
      const n = i + 1;
      const lesson = lessonContent(s, n);
      const r = getStoredResult(code, s.id, n, lesson);
      if (r) list.push({ ...r, subject: s, entry });
    });
  });

  if (!list.length) {
    return `<div class="card" style="text-align:center"><h2>📭 لا توجد نتائج بعد</h2><p class="mu">أكمل الاختبارات النهائية للدروس لتظهر نتائجك هنا.</p><a class="btn p" href="#home">ابدأ التعلم</a></div>`;
  }

  list.sort((a, b) => (b.t || 0) - (a.t || 0));
  const ok = list.filter((r) => r.passed);
  const avg = Math.round(list.reduce((s, r) => s + r.percentage, 0) / list.length);
  const exl = list.filter((r) => r.percentage >= 90).length;

  const totalExams = (D.subjects || []).reduce((s, x) => s + x.lessons.length, 0);
  const passedSet = new Set(ok.map((r) => r.subject.id));
  const progressPct = totalExams ? Math.round((passedSet.size / totalExams) * 100) : 0;

  return `
    <h2>📊 نتائجي</h2>
    <div class="stats">
      <div class="card"><b>${list.length}</b>اختبارات مكتملة</div>
      <div class="card"><b>${ok.length}</b>ناجحة</div>
      <div class="card"><b>${avg}%</b>متوسط النسب</div>
      <div class="card"><b>${exl}</b>تقدير ممتاز</div>
    </div>
    <div class="card">
      <b>التقدم الدراسي</b>
      <p class="mu">${passedSet.size} / ${totalExams} اختبارات نهائية مجتازة</p>
      <div class="bar"><i style="width:${progressPct}%;background:var(--ok)"></i></div>
    </div>
    ${list.map((r) => {
      const g = getGrade(r.percentage);
      return `
      <div class="card ${r.passed ? 'ok' : 'bad'}">
        <div class="row">
          <b>${r.subject.emoji} ${r.subject.name} — ${r.entry.title}</b>
          <span class="tag ${r.passed ? 'ok' : 'bad'}">${r.passed ? 'ناجح' : 'راسب'}</span>
        </div>
        <div class="row mu">
          <span>الدرجة ${r.score}/${r.total} (${r.percentage}% — ${g.name})</span>
          <span>محاولة ${r.attempt || 1} · ${fd(r.t || Date.now())}</span>
        </div>
        <div class="bar"><i style="width:${r.percentage}%;background:var(${r.passed ? '--ok' : '--bad'})"></i></div>
        ${r.passed ? `<p style="margin:10px 0 0"><a class="btn ok" href="#cert/${r.subject.id}/${r.lessonId}">🏅 شهادة</a></p>` : ''}
      </div>`;
    }).join('')}`;
}

/* ───────────────────────────── التشغيل ───────────────────────────── */

function init() {
  restoreSession();
  themeInit();
  addEventListener('hashchange', nav);
  nav();
}

init();