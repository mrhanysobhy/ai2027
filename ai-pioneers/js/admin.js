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

function adminAuthed() {
  return sessionStorage.getItem(SESSION_KEY) === '1';
}

function adminLogin(pw) {
  const val = (pw || '').trim();
  if (val === ADMIN_PW) {
    sessionStorage.setItem(SESSION_KEY, '1');
    main(adminView());
    toast('مرحباً بك في لوحة الإدارة 👨‍💼', 'ok');
  } else {
    toast('كلمة مرور خاطئة', 'err');
  }
}

function adminLogout() {
  sessionStorage.removeItem(SESSION_KEY);
  location.hash = '#home';
  main(homeView());
  toast('تم الخروج من لوحة الإدارة', 'ok');
}

function adminView() {
  if (!adminAuthed()) {
    return `
      <div class="card" style="max-width:400px;margin:40px auto;text-align:center">
        <h3>🔐 لوحة الإدارة (قراءة فقط)</h3>
        <p class="mu">هذه اللوحة تُظهر نتائج الطلاب المسجلة في Google Sheets وليست للتعديل.</p>
        <input id="pw" type="password" class="inp" style="width:100%" placeholder="كلمة المرور"
               onkeydown="if(event.key=='Enter')adminLogin($('pw').value)">
        <div class="row" style="justify-content:center">
          <button class="btn p" onclick="adminLogin($('pw').value)">دخول</button>
          <a class="btn" href="#home">رجوع</a>
        </div>
      </div>`;
  }

  ADM.note = '';
  ADM.rows = [];
  const dash = `
    <div class="row">
      <h2 style="margin:0">🛠️ لوحة الإدارة</h2>
      <span><button class="btn sm" onclick="adminFetch()">🔄 تحديث</button>
      <button class="btn sm" onclick="adminLogout()">خروج</button></span>
    </div>
    <div id="adm"><div class="card" style="text-align:center">⏳ جاري تحميل السجل...</div></div>`;
  adminFetch();
  return dash;
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

async function adminFetch() {
  ADM.rows = [];
  ADM.note = '';
  const loading = '<div class="card" style="text-align:center">⏳ جاري التحميل...</div>';
  if ($('adm')) $('adm').innerHTML = loading;

  const res = await fetchSheetRows(ADMIN_PW);
  if (res.ok) {
    ADM.rows = res.rows || [];
    ADM.note = `<div class="note">✔ مصدر البيانات: Google Sheets — ${res.count || ADM.rows.length} سجل.</div>`;
  } else {
    ADM.rows = localRows();
    ADM.note = `<div class="note">⚠ ${res.error || 'تعذر الاتصال بالشيت'} — عرض بيانات هذا المتصفح (${ADM.rows.length} سجل).</div>`;
  }

  // إعادة البحث عن الحاوية بعد اكتمال الطلب (قد تكون أُدخلت في DOM لاحقاً)
  const box = $('adm');
  if (box) box.innerHTML = renderAdminDash();
  else if (!$('pw')) main(renderAdminDash()); // خُطأ نظري: الحاوية مفقودة
}

function renderAdminDash() {
  const rows = ADM.rows;
  const pass = rows.filter((r) => r.result === 'ناجح');
  const fail = rows.filter((r) => r.result !== 'ناجح');
  const avg = rows.length ? Math.round(rows.reduce((s, r) => s + (r.percentage || 0), 0) / rows.length) : 0;

  const subjects = D.subjects || [];
  const students = STUDENT_LIST;
  const subjByName = {};
  subjects.forEach((s) => { subjByName[s.name] = s; });

  // مصفوفة الطلاب × المواد
  const matrixRows = students.map((st) => {
    const code = String(st.code);
    const cells = subjects.map((s) => {
      const mine = rows.filter((r) => String(r.studentCode) === code && r.subject === s.name);
      return mine.some((r) => r.result === 'ناجح') ? '🏆 ناجح' : (mine.length ? '❌ راسب' : '—');
    });
    return `<tr><td>${st.name} <small class="mu">${code}</small></td>${cells.map((c) => `<td>${c}</td>`).join('')}</tr>`;
  }).join('');

  // حالة الاختبارات (مادة × درس)
  const examStatus = [];
  subjects.forEach((s) => {
    s.lessons.forEach((entry) => {
      const mine = rows.filter((r) => r.subject === s.name && r.lesson === entry.title);
      examStatus.push(`
        <tr>
          <td>${s.emoji} ${s.name}</td>
          <td>${entry.title}</td>
          <td><b>${mine.length}</b></td>
          <td>${mine.filter((r) => r.result === 'ناجح').length}</td>
          <td>${mine.filter((r) => r.result !== 'ناجح').length}</td>
        </tr>`);
    });
  });

  return ADM.note + `
    <div class="stats">
      <div class="card"><b>${students.length}</b>الطلاب</div>
      <div class="card"><b>${rows.length}</b>اختبارات مسجلة</div>
      <div class="card"><b>${pass.length}</b>ناجحون</div>
      <div class="card"><b>${fail.length}</b>راسبون</div>
      <div class="card"><b>${avg}%</b>متوسط النسب</div>
    </div>

    <div class="card tw">
      <b>حالة الطلاب × المواد</b>
      <table class="t">
        <tr><th>الطالب</th>${subjects.map((s) => `<th>${s.name}</th>`).join('')}</tr>
        ${matrixRows}
      </table>
    </div>

    <div class="card tw">
      <b>حالة الاختبارات (مادة × درس)</b>
      <table class="t">
        <tr><th>المادة</th><th>الدرس</th><th>الإجمالي</th><th>ناجح</th><th>راسب</th></tr>
        ${examStatus.join('')}
      </table>
    </div>

    <div class="card">
      <b>السجل الكامل</b>
      <div class="row">
        <input class="inp" placeholder="🔍 بحث في السجل..."
               value="${ADM.q}" oninput="ADM.q=this.value;alog()">
        <button class="btn sm" onclick="alog()">بحث</button>
      </div>
      <div class="tw">
        <table class="t">
          <thead><tr>
            <th>التاريخ</th><th>الكود</th><th>الاسم</th><th>المادة</th><th>الدرس</th>
            <th>الدرجة</th><th>النسبة</th><th>محاولة</th><th>النتيجة</th><th></th>
          </tr></thead>
          <tbody id="lg"></tbody>
        </table>
      </div>
    </div>`;
}

function alog() {
  const box = $('lg');
  if (!box) return;
  ADM.q = ADM.q || '';
  const q = ADM.q.trim().toLowerCase();
  const rows = ADM.rows.filter((r) => {
    if (!q) return true;
    return [r.studentCode, r.studentName, r.subject, r.lesson, r.result]
      .join(' ').toLowerCase().includes(q);
  });
  box.innerHTML = rows.map((r, idx) => `
    <tr>
      <td>${r.date}</td>
      <td>${r.studentCode}</td>
      <td>${r.studentName}</td>
      <td>${r.subject}</td>
      <td>${r.lesson}</td>
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
  const r = ADM.rows[idx];
  if (!r) return;
  if (r.result !== 'ناجح') { toast('الشهادة للناجحين فقط', 'warn'); return; }
  main(recordCertView(r));
}