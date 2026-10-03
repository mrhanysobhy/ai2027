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
  const isAdmin = typeof adminAuthed === 'function' &&
    (adminAuthed() || (me && String(me.code) === ADMIN_PW));
  H.innerHTML = `
    <b>🎓 ${SCH.platformName || 'AI Pioneers'}</b>
    <button class="btn sm theme-btn" onclick="toggleTheme()" title="تبديل الوضع">${themeIcon()}</button>
    <a href="#home">الرئيسية</a>
    ${me
      ? `<a href="#results">نتائجي</a><span class="who">👤 ${me.name}</span><button class="btn" onclick="logout()">خروج</button>`
      : `<span class="who guest">👤 زائر — تصفّح بلا كود</span><button class="btn p" onclick="openLogin()">تسجيل الدخول</button>`}
    ${isAdmin ? `<a class="admlink" href="#admin">👨‍💼 لوحة الإدارة</a>` : ''}
  `;
}

/* ───────────────────────────── الموجّه ───────────────────────────── */

function nav() {
  if (Ex) { if (Ex.iv) clearInterval(Ex.iv); Ex = null; } // التخلي عن اختبار قديم عند المغادرة
  renderHeader();
  const p = (location.hash || '#home').slice(1).split('/');
  const root = p[0] || 'home';

  if (root === 'admin') {
    if (typeof isTeacher === 'function' && isTeacher()) {
      document.body.classList.add('bd-admin');
      window.scrollTo(0, 0);
    } else {
      document.body.classList.remove('bd-admin'); // شاشة للمعلم فقط تُعرض ضمن قالب الموقع
    }
    main(adminView());
    return;
  }
  document.body.classList.remove('bd-admin');

  // النتائج والشهادة بيانات شخصية → تحتاج تسجيل. أما الشرح والمراجعة والاختبار التجريبي
  // والجزء العملي فهي مفتوحة للزائر بلا تحقق.
  const needsAuth = (root === 'results') || (root === 'cert');
  if (!me && needsAuth) {
    requireLogin(null, 'هذه الصفحة تعرض بياناتك أنت — أدخل كود الدخول للمتابعة.');
    return;
  }

  window.scrollTo(0, 0);
  if (root === 'subject' && p[1]) return main(subjectView(p[1], p[2] || ''));
  if (root === 'lesson' && p[1] && p[2]) return main(lessonView(p[1], +p[2], p[3] || 'explain', p[4] || ''));
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
  const cards = (D.subjects || []).map((s) => {
    const parts = subjectParts(s);
    const theory = parts.reduce((t, p) => t + ((p.lessons || []).length), 0);
    const tools = parts.filter((p) => p.type === 'tool').length;
    const counts = [
      `📚 ${theory} درس`,
      tools ? `⌨️ ${tools} تمرين عملي` : '',
      `📝 ${theory} اختبار نهائي`
    ].filter(Boolean).join(' · ');
    return `
    <div class="sc" style="background:${s.gradient}" onclick="location.hash='#subject/${s.id}'">
      <div class="ic">${s.emoji}</div>
      <h3>${s.name}</h3>
      <p>${s.description}</p>
      <p style="margin-top:8px">${counts}</p>
    </div>`;
  }).join('');

  return `
    <div class="banner">
      <h1>🎓 ${SCH.platformName || 'AI Pioneers'}</h1>
      <p>${SCH.platformSlogan || 'نحو مستقبل رقمي مشرق'}</p>
    </div>
    <div class="grid">${cards}</div>`;
}

/* ───────────────────────────── صفحة المادة ───────────────────────────── */

function subjectView(id, partId) {
  const s = sub(id);
  if (!s) return homeView();
  const parts = subjectParts(s);
  const active = subjectPart(s, partId) || parts[0];
  const hasTabs = parts.length > 1;

  // شريط الأجزاء (نظري / عملي) — يظهر فقط إن كانت المادة مقسّمة
  const partBar = hasTabs ? `
    <div class="tabs parts">${parts.map((p) => `
      <a class="tb part ${p.id === active.id ? 'on' : ''}" href="#subject/${s.id}/${p.id}">
        ${p.icon || '📚'} ${p.name || p.id}
        ${(p.lessons || []).length ? ` <small>(${(p.lessons || []).length})</small>` : ''}
      </a>`).join('')}</div>` : '';

  // جزء عملي: يفتح الأداة كصفحة مستقلة — بلا دروس وبلا اختبارات
  let body;
  if (active.type === 'tool') {
    body = toolPartView(s, active);
  } else {
    body = (active.lessons || []).map((lesson, i) => `
      <div class="card">
        <h3>الدرس ${i + 1}: ${lesson.title}</h3>
        <div class="tabs lt">${lessonTabs(s.id, i + 1, 'explain', active.id)}</div>
      </div>`).join('') || '<div class="card" style="text-align:center">لا توجد دروس في هذا الجزء بعد.</div>';
  }

  return `
    <div class="banner" style="background:${s.gradient}">
      <div style="font-size:2.4rem">${s.emoji}</div>
      <h1>${s.name}</h1>
      <p>${s.description}<br>${SCH.className || ''} · ${SCH.academicYear || ''}</p>
    </div>
    ${partBar}
    ${active.name ? `<h2 class="part-title">${active.icon || ''} ${active.name}${hasTabs ? '' : ''}</h2>` : ''}
    ${active.description ? `<p class="mu part-desc">${active.description}</p>` : ''}
    ${body}`;
}

// الجزء العملي: زر يفتح الأداة في صفحة مستقلة (العنوان والوصف يُعرضان في subjectView)
function toolPartView(subject, part) {
  const t = part.tool || {};
  const page = t.page || 'codeeditor.html';
  const title = t.title || 'ساحة الأكواد';
  return `
    <p style="margin-top:16px">
      <a class="btn ok" href="${page}" target="_blank" rel="noopener">🚀 ادخل ${title}</a>
      <span class="mu" style="font-size:.85rem;margin-inline-start:8px">يفتح في تبويب جديد</span>
    </p>`;
}

function lessonTabs(sid, n, active, partId) {
  const items = [
    ['explain', 'الشرح'],
    ['review', 'المراجعة'],
    ['practice', 'اختبار تجريبي'],
    ['final', 'اختبار نهائي']
  ];
  const p = partId ? '/' + partId : '';
  return items.map(([k, label]) => `
    <a class="tb ${k} ${k === active ? 'on' : ''}" href="#lesson/${sid}/${n}/${k}${p}">${label}</a>`).join('');
}

/* ───────────────────────────── صفحة الدرس ───────────────────────────── */

function lessonView(id, n, tab, partId) {
  const s = sub(id);
  if (!s) return homeView();
  const part = subjectPart(s, partId || '');
  const pid = part ? part.id : '';

  // جزء عملي (ساحة الأكواد): لا دروس ولا اختبارات — نعرض بطاقته
  if (part && part.type === 'tool') return subjectView(s.id, pid);

  const entry = lessonEntry(s, n, pid);
  if (!entry) return subjectView(s.id, pid);
  const lesson = lessonContent(s, n, pid);

  const valid = ['explain', 'review', 'practice', 'final'];
  if (valid.indexOf(tab) < 0) tab = 'explain';

  let box = '';
  if (tab === 'explain') box = explainView(lesson, entry);
  else if (tab === 'review') box = lesson ? reviewView(lesson) : '<div class="card" style="text-align:center">لا توجد مراجعة بعد.</div>';
  else if (tab === 'practice') box = practiceIntro(s, entry, lesson, n, pid);
  else if (tab === 'final') box = finalView(s, entry, lesson, n, pid);

  return `
    <p><a href="#subject/${s.id}${pid ? '/' + pid : ''}">← ${part && part.name && subjectParts(s).length > 1 ? part.name : s.name}</a></p>
    <h2 style="margin:0">${entry.title}</h2>
    <small class="mu">${s.name}${part && part.name && subjectParts(s).length > 1 ? ' · ' + part.name : ''} | ${SCH.platformName || ''}</small>
    <div class="tabs lt">${lessonTabs(s.id, n, tab, pid)}</div>
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
  sanitizeLocalStorage(); // إزالة مفاتيح النتائج/المحاولات القديمة من نسخ سابقة
  addEventListener('hashchange', nav);
  nav();
  loadSchedule(); // تحميل مواعيد الاختبارات من الشيت مرة واحدة عند دخول الطالب
}

init();