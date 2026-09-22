/* ═══════════════════════════════════════════════════════════
   AI Pioneers — لوحة الإدارة (قراءة فقط)
   ═══════════════════════════════════════════════════════════
   - دخول بكلمة مرور (تطابق ADMIN_PASSWORD في Code.gs).
   - يقرأ السجل الكامل من Google Sheets عبر doGet.
   - في حال غياب الرابط/الاتصال تُعرض بيانات هذا المتصفح محلياً.
   ═══════════════════════════════════════════════════════════ */

const ADMIN_PW = '262888';
const SESSION_KEY = 'adminAuth';
const ADM = { rows: [], note: '', q: '' };

// اللوحة للمعلم فقط — تُمنع أثناء دخول أي طالب أو زائر
function isTeacher() {
  return !!(me && String(me.code) === ADMIN_PW);
}

function adminAuthed() {
  return sessionStorage.getItem(SESSION_KEY) === '1';
}

function adminLogout() {
  sessionStorage.removeItem(SESSION_KEY);
  if (isTeacher()) { logout(); return; }
  location.hash = '#home';
  renderHeader();
  nav();
  toast('تم الخروج من لوحة الإدارة', 'ok');
}

function adminView() {
  if (!isTeacher()) return renderAdminLocked();

  ADM.note = '';
  ADM.rows = [];
  ADM.sec = ADM.sec || 'overview';
  const dash = `
    <div class="adm-app">
      <header class="adm-top">
        <div class="adm-top-in">
          <div class="adm-brand">
            <span class="adm-logo">🛠️</span>
            <div class="adm-brand-t"><b>لوحة الإدارة</b><small>${SCH.schoolName || ''} · ${SCH.academicYear || ''}</small></div>
          </div>
          <div class="adm-actions">
            <span class="adm-chip">👤 ${me.name}</span>
            <button class="adm-ico" onclick="toggleTheme()" title="تبديل الوضع الليلي">${themeIcon()}</button>
            <a class="btn sm" href="#home">↩ الموقع</a>
            <button class="btn sm toxic" onclick="adminLogout()">خروج</button>
          </div>
        </div>
      </header>
      <div class="adm-layout">
        <aside class="adm-side" id="admside">${renderSide()}</aside>
        <div class="adm-main">
          <div id="admb">${adminLoading()}</div>
        </div>
      </div>
    </div>`;
  adminFetch();
  return dash;
}

/* ─────────────── شريط جانبي + تنقل الأقسام ─────────────── */

const ADM_SECTIONS = [
  ['overview', '📊', 'نظرة عامة'],
  ['exams', '🧪', 'حالة الاختبارات'],
  ['log', '🗂️', 'السجل الكامل']
];

function renderSide() {
  const sec = ADM.sec || 'overview';
  return `
    <nav class="adm-navlist" aria-label="أقسام اللوحة">
      ${ADM_SECTIONS.map(([s, ic, lb]) => `
        <button class="adm-nav ${sec === s ? 'on' : ''}" onclick="adminSec('${s}')">
          <span>${ic}</span>${lb}
        </button>`).join('')}
    </nav>
    <div class="adm-side-tools">
      <button class="btn fl" onclick="adminFetch()">🔄 &nbsp;تحديث البيانات</button>
      <button class="btn fl pr" onclick="openScheduleEditor()">⏰ &nbsp;مواعيد الاختبارات</button>
    </div>`;
}

// التنقل بين الأقسام يعيد رسم الشريط + محتوى القسم
function adminSec(sec) {
  ADM.sec = sec;
  const s = $('admside');
  if (s) s.innerHTML = renderSide();
  const b = $('admb');
  if (b) b.innerHTML = renderAdminBody();
  if (sec === 'log') alog();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderAdminBody() {
  const sec = ADM.sec || 'overview';
  if (!ADM.loaded) return adminLoading();
  if (sec === 'exams') return `${ADM.note || ''}${renderExamsSec()}`;
  if (sec === 'log') return `${ADM.note || ''}${renderLogSec()}`;
  return `${ADM.note || ''}${renderOverviewSec()}`;
}

/* ترويسة القسم + مصدر البيانات */
function renderPgHead(title, sub) {
  return `
    <div class="adm-phead">
      <div>
        <h2>${title}</h2>
        <p>${sub}</p>
      </div>
      <span class="adm-src">💾 ${ADM.rows.length ? `Google Sheets · ${ADM.rows.length} سجل` : 'لا توجد بيانات بعد'}</span>
    </div>`;
}

/* هيكل عظمي + حالات فارغة */
function adminLoading() {
  return `<div class="adm-load">
    <div class="skel" style="width:34%"></div>
    <div class="skel card"></div>
    <div class="skel" style="width:82%"></div>
    <div class="skel" style="width:58%"></div>
  </div>`;
}

function admEmpty(msg) {
  return `
    <div class="adm-empty">
      📭 <b>${msg || 'لا توجد بيانات لعرضها'}</b>
      <div class="mu" style="font-size:.85rem">عند توفر نتائج اختبارات ستظهر هنا تلقائياً.</div>
      <button class="btn sm" onclick="adminFetch()">🔄 إعادة المحاولة</button>
    </div>`;
}

/* ─────────────── قسم نظرة عامة ─────────────── */

function renderOverviewSec() {
  const rows = ADM.rows;
  const pass = rows.filter((r) => r.result === 'ناجح');
  const fail = rows.filter((r) => r.result !== 'ناجح');
  const avg = rows.length ? Math.round(rows.reduce((s, r) => s + (r.percentage || 0), 0) / rows.length) : 0;
  const acc = rows.length ? Math.round((pass.length / rows.length) * 100) : 0;

  return `
    ${renderPgHead('نظرة عامة', 'ملخص أداء الطلاب ونتائج الاختبارات النهائية')}
    <div class="kps">
      <div class="kp" style="--ac:21,101,192">
        <span class="kp-ic">🎓</span>
        <b>${STUDENT_LIST.length}</b><span class="kp-l">طالباً مسجلاً</span>
      </div>
      <div class="kp" style="--ac:38,166,154">
        <span class="kp-ic">📝</span>
        <b>${rows.length}</b><span class="kp-l">إرسال اختبار</span>
      </div>
      <div class="kp" style="--ac:46,125,50">
        <span class="kp-ic">✅</span>
        <b>${pass.length}</b><span class="kp-l">اجتياز ناجح · ${acc}%</span>
      </div>
      <div class="kp" style="--ac:198,40,40">
        <span class="kp-ic">❌</span>
        <b>${fail.length}</b><span class="kp-l">محاولات راسبة</span>
      </div>
      <div class="kp" style="--ac:123,31,162">
        <span class="kp-ic">📈</span>
        <b>${avg}%</b><span class="kp-l">متوسط النسبة</span>
      </div>
    </div>
    <div class="card mtx-card">
      <div class="mtx-head">
        <div class="sec-h"><span>📊</span> تقدم الطلاب × المواد</div>
        <div class="mtx-tools">
          <div class="mtx-search">
            <span class="ico">🔍</span>
            <input class="inp" placeholder="بحث بالاسم أو الكود..." value="${ADM.mQ || ''}"
                   oninput="ADM.mQ=this.value;admMtx()">
          </div>
          <select class="inp" title="عدد الصفوف في الصفحة"
                  onchange="ADM.mSz=this.value;ADM.mPg=1;admMtx()">
            ${[5, 10, 20, 50].map((sz) =>
              `<option value="${sz}" ${String(ADM.mSz || 10) === String(sz) ? 'selected' : ''}>${sz} / صفحة</option>`).join('')}
          </select>
        </div>
      </div>
      <div id="adm-mtxb">${admMatrixBody()}</div>
    </div>
    ${rows.length ? '' : admEmpty('لا توجد نتائج اختبارات بعد')}`;
}

function admMtx() {
  const b = $('adm-mtxb');
  if (b) b.innerHTML = admMatrixBody();
}

function admMatrixBody() {
  const rows = ADM.rows;
  const subjects = D.subjects || [];
  const q = (ADM.mQ || '').trim().toLowerCase();
  let list = STUDENT_LIST.filter((st) => !q || (st.name + ' ' + String(st.code)).toLowerCase().includes(q));
  const sz = +(ADM.mSz) || 10;
  const pages = Math.max(1, Math.ceil(list.length / sz));
  if (!ADM.mPg || ADM.mPg > pages) ADM.mPg = 1;
  const p = ADM.mPg;
  const slice = list.slice((p - 1) * sz, p * sz);

  if (!list.length) {
    return `<div class="adm-empty" style="padding:22px 14px">🔎 لا توجد نتائج مطابقة للبحث — جرّب اسم أو كوداً آخر.</div>`;
  }

  const head = `<tr><th>الطالب</th>${subjects.map((s) => `<th>${s.emoji} ${s.name}</th>`).join('')}</tr>`;
  const rowsHtml = slice.map((st) => {
    const code = String(st.code);
    const cells = subjects.map((s) => {
      const mine = rows.filter((r) => String(r.studentCode) === code && r.subject === s.name);
      return mine.some((r) => r.result === 'ناجح')
        ? '<span class="tag ok">🏆 ناجح</span>'
        : (mine.length ? '<span class="tag bad">❌ راسب</span>' : '<span class="tag muted">—</span>');
    }).join('');
    return `<tr><td class="st">${st.name}<small>${code}</small></td>${cells}</tr>`;
  }).join('');

  return `
    <div class="tw"><table class="t mtx">
      ${head}${rowsHtml}
    </table></div>
    <div class="pgr">
      <span class="chip mu">${(p - 1) * sz + 1}–${Math.min(p * sz, list.length)} من ${list.length} طالب</span>
      <nav>${pgrNav(p, pages)}</nav>
    </div>`;
}

function pgrNav(cur, pages) {
  if (pages <= 1) return '';
  const btns = [];
  const add = (n, label, cls) => btns.push(
    `<button class="${cls || ''}" ${cls === 'off' ? 'disabled' : ''} onclick="ADM.mPg=${n};admMtx()">${label}</button>`);
  add(cur - 1, '‹', cur === 1 ? 'off' : '');
  add(1, 1, cur === 1 ? 'on' : '');
  const from = Math.max(2, cur - 1), to = Math.min(pages - 1, cur + 1);
  if (from > 2) btns.push('<span class="gap">…</span>');
  for (let n = from; n <= to; n++) add(n, n, cur === n ? 'on' : '');
  if (to < pages - 1) btns.push('<span class="gap">…</span>');
  add(pages, pages, cur === pages ? 'on' : '');
  add(cur + 1, '›', cur === pages ? 'off' : '');
  return btns.join('');
}

/* ─────────────── قسم حالة الاختبارات ─────────────── */

function renderExamsSec() {
  const rows = ADM.rows;
  const subjects = D.subjects || [];
  const rowsHtml = [];
  let grandPass = 0, grandAll = 0;
  subjects.forEach((s) => {
    s.lessons.forEach((entry) => {
      const mine = rows.filter((r) => r.subject === s.name && r.lesson === entry.title);
      const pass = mine.filter((r) => r.result === 'ناجح').length;
      grandPass += pass; grandAll += mine.length;
      rowsHtml.push(`
        <tr>
          <td><span class="subj-dot" style="background:${s.color || s.gradient || 'var(--pr)'}"></span> ${s.name}</td>
          <td>${entry.title}</td>
          <td><b>${mine.length || '—'}</b></td>
          <td><span class="tag ok">${pass} ناجح</span></td>
          <td><span class="tag ${mine.length - pass ? 'bad' : 'muted'}">${mine.length - pass} راسب</span></td>
          <td><div class="bar mini"><i style="width:${mine.length ? Math.round(pass / mine.length * 100) : 0}%;background:var(--ok)"></i></div></td>
        </tr>`);
    });
  });
  const gr = grandAll ? Math.round((grandPass / grandAll) * 100) : 0;

  return `
    ${renderPgHead('حالة الاختبارات', `نتائج كل مادة ودرس على حدة — الإجمالي ${grandAll} سجل`)}
    <div class="kps kps-sm">
      <div class="kp" style="--ac:21,101,192"><span class="kp-ic">🧪</span><b>${subjects.reduce((s, x) => s + x.lessons.length, 0)}</b><span class="kp-l">درس باختبار نهائي</span></div>
      <div class="kp" style="--ac:46,125,50"><span class="kp-ic">✅</span><b>${grandPass}</b><span class="kp-l">اجتياز ناجح</span></div>
      <div class="kp" style="--ac:198,40,40"><span class="kp-ic">❌</span><b>${grandAll - grandPass}</b><span class="kp-l">محاولات راسبة</span></div>
      <div class="kp" style="--ac:123,31,162"><span class="kp-ic">📈</span><b>${gr}%</b><span class="kp-l">نسبة الاجتياز الإجمالية</span></div>
    </div>
    <div class="card">
      ${rowsHtml.length
        ? `<div class="tw"><table class="t mtx">
            <tr><th>المادة</th><th>الدرس</th><th>الإجمالي</th><th>ناجح</th><th>راسب</th><th>نسبة الاجتياز</th></tr>
            ${rowsHtml.join('')}
          </table></div>`
        : admEmpty('لا توجد نتائج اختبارات بعد')}
    </div>`;
}

/* ─────────────── قسم السجل الكامل ─────────────── */

function renderLogSec() {
  const has = !!ADM.rows.length;
  return `
    ${renderPgHead('السجل الكامل', 'كل محاولات الاختبارات المرسلة للشيت مع تفاصيلها')}
    <div class="card">
      ${adminFilterBar()}
      <div class="logbar">
        <span class="lb-ic">🔍</span>
        <input class="inp" placeholder="ابحث بالاسم، الكود، المادة، الدرس، الفترة..."
               value="${ADM.q}" oninput="ADM.q=this.value;alog()">
        <span id="lgn" class="chip mu"></span>
      </div>
      <div class="tw">
        <table class="t mtx">
          <thead><tr>
            <th>التاريخ</th><th>الكود</th><th>الاسم</th><th>المادة</th><th>الدرس</th>
            <th>الفترة</th><th>الدرجة</th><th>النسبة</th><th>محاولة</th><th>النتيجة</th><th></th>
          </tr></thead>
          <tbody id="lg"></tbody>
        </table>
      </div>
      ${has ? '' : admEmpty('لا توجد سجلات بعد')}
    </div>`;
}

/* ─────────── شاشة "اللوحة للمعلم فقط" (لا يُسمح للطلاب/الزوار) ─────────── */

function renderAdminLocked() {
  const studentMsg = me
    ? `<p class="mu">أنت مسجّل الدخول حالياً باسم <b>${me.name}</b> (مستخدم طالب).<br>لوحة الإدارة مخصصة للمعلم فقط — سجّل الخروج ثم ادخل بكود المعلم.</p>`
    : `<p class="mu">لوحة الإدارة مخصصة للمعلم فقط — سجّل الدخول بكود المعلم للمتابعة.</p>`;
  return `
    <div class="card admin-locked">
      <div class="lock-ic">🔐</div>
      <h3>لوحة الإدارة — للمعلم فقط</h3>
      ${studentMsg}
      <div class="row" style="justify-content:center;flex-wrap:wrap">
        <button class="btn ok" onclick="openTeacherGate()">🔑 تسجيل دخول المعلم</button>
        ${me ? `<button class="btn" onclick="logout()">🚪 خروج من حساب الطالب</button>` : ''}
        <a class="btn" href="#home">🏠 الرئيسية</a>
      </div>
    </div>
    <div id="tgate"></div>`;
}

function openTeacherGate() {
  const t = $('tgate');
  if (!t) return;
  t.innerHTML = `
    <div class="card admin-locked">
      <h3>دخول المعلم</h3>
      <p class="mu">أدخل كود المعلم (6 أرقام).</p>
      <input id="tgate-code" class="inp" style="width:100%" inputmode="numeric" maxlength="6"
             placeholder="كود المعلم" onkeydown="if(event.key=='Enter')teacherLogin()">
      <div class="row" style="justify-content:center">
        <button class="btn ok" onclick="teacherLogin()">دخول اللوحة</button>
        <button class="btn" onclick="$('tgate').innerHTML=''">إلغاء</button>
      </div>
    </div>`;
  const i = $('tgate-code');
  if (i) setTimeout(() => i.focus(), 120);
}

// تسجيل دخول المعلم عبر نافذة الدخول العامة (يطبّق applyAdminSync صلاحية اللوحة تلقائياً)
function teacherLogin() {
  const i = $('tgate-code');
  if (!i) return;
  const c = i.value.trim();
  if (String(c) !== ADMIN_PW) {
    toast('هذا الكود ليس بكود المعلم — لا يُفتح بهذه اللوحة', 'err');
    shake(i); i.value = '';
    return;
  }
  const code = $('code');
  if (code) code.value = c;
  doLogin();
}

// جمع سجلات هذا المتصفح محلياً (احتياطي لغياب الشيت)
function localRows() {
  const out = [];
  if (!me) return out;
  (D.subjects || []).forEach((s) => {
    s.lessons.forEach((entry, i) => {
      const n = i + 1;
      const lesson = lessonContent(s, n);
      const r = getStoredResult(me.code, s.id, n, lesson);
      if (r) {
        out.push({
          date: fd(r.t || Date.now()),
          studentCode: me.code,
          studentName: me.name,
          subject: s.name,
          lesson: entry.title,
          examType: 'final',
          examId: r.examId || '',
          attempt: r.attempt || 1,
          result: r.passed ? 'ناجح' : 'راسب',
          score: r.score,
          total: r.total,
          percentage: r.percentage,
          _local: true
        });
      }
    });
  });
  return out;
}

/* ═══════════════════ محرر مواعيد الاختبارات (ورقة "التوقيتات") ═══════════════════ */

// تحضير صفوف الجدول: من الدروس الحالية + تجاوز مواعيد الشيت (إن وُجدت)
function buildScheduleRows() {
  const rows = [];
  (D.subjects || []).forEach((s) => {
    s.lessons.forEach((entry, i) => {
      const n = i + 1;
      const lesson = lessonContent(s, n);
      const fe = lesson && lesson.finalExam;
      const r = schedRow(s, n) || {};
      rows.push({
        subjectId: s.id,
        subjectName: s.name,
        lessonNo: n,
        lessonTitle: entry.title,
        examId: fe ? examIdOf(lesson) : '',
        availableFrom: (r.availableFrom || (fe && fe.availableFrom) || ''),
        availableTo: (r.availableTo || (fe && fe.availableTo) || '')
      });
    });
  });
  return rows;
}

// تحويل أي صيغة وقت إلى قيمة حقل datetime-local (yyyy-MM-ddTHH:mm)
function toDateTimeLocal(v) {
  const s = String(v || '').trim();
  if (!s) return '';
  const m = s.match(/^(\d{4}-\d{2}-\d{2})[T ]?(\d{2}:\d{2})?/);
  if (!m) return '';
  return m[1] + 'T' + (m[2] || '00:00');
}

// نافذة تعديل مواعيد الاختبار (تُرسل الحفظ إلى الشيت)
function openScheduleEditor() {
  if (!SHEET_URL || SHEET_URL === 'GOOGLE_APPS_SCRIPT_URL_HERE') {
    toast('رابط Google Sheets غير مُعيّن', 'err');
    return;
  }
  const rows = buildScheduleRows();
  const rowsHtml = rows.map((r, idx) => `
    <tr>
      <td>${r.subjectName}<br><span class="mu" style="font-size:.75rem">${r.lessonTitle}</span></td>
      <td style="white-space:nowrap">الدرس ${r.lessonNo}</td>
      <td><code style="font-size:.75rem">${r.examId || '—'}</code></td>
      <td><input type="datetime-local" class="inp" style="width:100%"
                 onchange="schedEdit(${idx},'from',this.value)"
                 value="${toDateTimeLocal(r.availableFrom)}"></td>
      <td><input type="datetime-local" class="inp" style="width:100%"
                 onchange="schedEdit(${idx},'to',this.value)"
                 value="${toDateTimeLocal(r.availableTo)}"></td>
      <td><button type="button" class="btn sm" onclick="schedEdit(${idx},'clear',null)">✖</button></td>
    </tr>`).join('');

  window._schedRows = rows;
  const mod = $('schedmod') || document.createElement('div');
  mod.id = 'schedmod';
  mod.className = 'modal';
  mod.style.display = 'flex';
  mod.innerHTML = `
    <div class="card" style="max-width:760px;width:94%;max-height:88vh;overflow:auto">
      <h3>⏰ مواعيد الاختبار النهائي</h3>
      <p class="mu">حدّد بداية ونهاية كل اختبار ثم اضغط "حفظ إلى الشيت" — تُطبق المواعيد فوراً على الطلاب
         عند دخولهم (لوحة الإدارة ← التعديل هنا فقط، لا حاجة للنشر).</p>
      <div style="overflow-x:auto">
        <table class="sched">
          <thead><tr><th>المادة / الدرس</th><th>رقم</th><th>معرف الفترة</th><th>البداية</th><th>النهاية</th><th></th></tr></thead>
          <tbody>${rowsHtml}</tbody>
        </table>
      </div>
      <div class="row" style="justify-content:center">
        <button class="btn ok" onclick="saveSchedule()">💾 حفظ المواعيد إلى الشيت</button>
        <button class="btn" onclick="closeScheduleEditor()">إغلاق</button>
      </div>
    </div>`;
  document.body.appendChild(mod);
}

function schedEdit(idx, field, value) {
  const r = window._schedRows[idx];
  if (!r) return;
  if (field === 'from') r.availableFrom = value;
  else if (field === 'to') r.availableTo = value;
  else { r.availableFrom = ''; r.availableTo = ''; }
}

function closeScheduleEditor() {
  const m = $('schedmod');
  if (m) m.remove();
}

// حفظ جدول المواعيد إلى ورقة "التوقيتات" بالشيت
async function saveSchedule() {
  const rows = window._schedRows || [];
  if (!rows.length) return;
  const btn = document.querySelector('#schedmod .btn.ok');
  if (btn) { btn.disabled = true; btn.textContent = '⏳ جاري الحفظ...'; }
  const res = await pushSchedule(rows);
  if (btn) { btn.disabled = false; btn.textContent = '💾 حفظ المواعيد إلى الشيت'; }
  if (res.ok) {
    toast('تم حفظ المواعيد في الشيت — سُتطبَّق على الطلاب عند دخولهم', 'ok');
    closeScheduleEditor();
    ls.d(SCHED_CACHE_KEY);          // إبطال كاش جهازك الحالي
    await loadSchedule();           // إعادة تحميل المواعيد فوراً
    applyScheduleUi();              // تحديث صفحة الاختبار المفتوحة إن وُجدت
  } else {
    toast(res.error || 'فشل حفظ المواعيد', 'err');
  }
}

async function adminFetch() {
  ADM.rows = [];
  ADM.note = '';
  ADM.loaded = false;
  if ($('admb')) $('admb').innerHTML = adminLoading();

  const res = await fetchSheetRows(ADMIN_PW);
  if (res.ok) {
    ADM.rows = res.rows || [];
    ADM.note = '';
  } else {
    ADM.rows = localRows();
    ADM.note = `
      <div class="adm-alert warn">
        <span style="font-size:1.15rem">⚠️</span>
        <div>
          <b>تعذر جلب البيانات من Google Sheets</b>
          <small>${res.error || 'انتهت مهلة الاتصال'}<br>${ADM.rows.length ? 'تم عرض بيانات هذا المتصفح مؤقتاً.' : 'جرّب مرة أخرى بعد التأكد من الاتصال والرابط.'}</small>
        </div>
        <button class="btn sm" onclick="adminFetch()">🔄 إعادة المحاولة</button>
      </div>`;
  }
  ADM.loaded = true;

  const box = $('admb');
  if (box) box.innerHTML = renderAdminBody();
  if ((ADM.sec || 'overview') === 'log') alog();
  const s = $('admside');
  if (s) s.innerHTML = renderSide();
}

// حالة فلاتر السجل (مرتبة مادة/درس، اختبار/فترة، حالة)
ADM.f = ADM.f || { sl: '', ex: '', st: '' };

function adminFilterBar() {
  const rows = ADM.rows || [];
  const lessons = [...new Set(rows.map((r) => (r.subject || '') + ' ⏐ ' + (r.lesson || '')))];
  const exams = [...new Set(rows.map((r) => r.examId || '').filter(Boolean).sort())];
  return `
    <div class="row wrap" style="gap:8px;margin:12px 0">
      <select class="inp" style="flex:1;min-width:170px" onchange="ADM.f.sl=this.value;alog()">
        <option value="">📚 كل الدروس</option>
        ${lessons.map((s) => `<option value="${s}" ${ADM.f.sl === s ? 'selected' : ''}>${s}</option>`).join('')}
      </select>
      <select class="inp" style="flex:1;min-width:150px" onchange="ADM.f.ex=this.value;alog()">
        <option value="">🗓️ كل الاختبارات</option>
        ${exams.map((e) => `<option value="${e}" ${ADM.f.ex === e ? 'selected' : ''}>${e}</option>`).join('')}
      </select>
      <select class="inp" style="flex:1;min-width:120px" onchange="ADM.f.st=this.value;alog()">
        <option value="">كل الحالات</option>
        <option ${ADM.f.st === 'ناجح' ? 'selected' : ''}>ناجح</option>
        <option ${ADM.f.st === 'راسب' ? 'selected' : ''}>راسب</option>
      </select>
    </div>`;
}

function alog() {
  const box = $('lg');
  if (!box) return;
  ADM.f = ADM.f || { sl: '', ex: '', st: '' };
  ADM.q = ADM.q || '';
  const q = ADM.q.trim().toLowerCase();
  const rows = ADM.rows.filter((r) => {
    if (ADM.f.sl && (r.subject + ' ⏐ ' + r.lesson) !== ADM.f.sl) return false;
    if (ADM.f.ex && r.examId !== ADM.f.ex) return false;
    if (ADM.f.st && r.result !== ADM.f.st) return false;
    if (q && [r.studentCode, r.studentName, r.subject, r.lesson, r.examId, r.result]
      .join(' ').toLowerCase().includes(q) === false) return false;
    return true;
  });
  ADM.view = rows; // صفوف العرض (لفهرس زر الشهادة)
  const cnt = $('lgn');
  if (cnt) cnt.textContent = rows.length + ' سجل';
  const subjNames = {};
  (D.subjects || []).forEach((s) => (subjNames[s.name] = s.emoji || '📚'));
  box.innerHTML = rows.map((r, idx) => `
    <tr>
      <td>${r.date}</td>
      <td>${r.studentCode}</td>
      <td>${r.studentName}</td>
      <td>${subjNames[r.subject] || '📚'} ${r.subject}</td>
      <td>${r.lesson}</td>
      <td class="exid">${r.examId || '—'}</td>
      <td>${r.score}/${r.total}</td>
      <td>${r.percentage || 0}%</td>
      <td>${r.attempt}</td>
      <td><span class="tag ${r.result === 'ناجح' ? 'ok' : 'bad'}">${r.result}</span></td>
      <td>${r.result === 'ناجح'
        ? `<button class="btn ok sm" onclick="adminCert(${idx})">🏅 شهادة</button>`
        : ''}</td>
    </tr>`).join('');
}

function adminCert(idx) {
  const r = ADM.view && ADM.view[idx];
  if (!r) return;
  if (r.result !== 'ناجح') { toast('الشهادة للناجحين فقط', 'warn'); return; }
  main(recordCertView(r));
}