/* ═══════════════════════════════════════════════════════════
   AI Pioneers — تسجيل دخول الطالب / الجلسة
   ═══════════════════════════════════════════════════════════ */

let me = null;          // { code, name } أو null
let _examState = null;  // حالة محرك الاختبار (تُدار في exam.js)

function studentByCode(code) {
  return (D.students || []).find((s) => String(s.code) === String(code).trim()) || null;
}

// فتح نافذة الدخول
function openLogin() {
  const m = $('mod');
  if (!m) return;
  m.style.display = 'flex';
  const inp = $('code');
  if (inp) { inp.value = ''; setTimeout(() => inp.focus(), 120); }
}

function closeLogin() {
  const m = $('mod');
  if (m) m.style.display = 'none';
}

// محاولة الدخول
function doLogin() {
  const inp = $('code');
  const c = inp ? inp.value.trim() : '';
  if (c.length !== 6) { shake(inp); toast('⚠ الكود يجب أن يكون 6 أرقام', 'warn'); return; }
  const s = studentByCode(c);
  if (!s) {
    toast('✖ كود غير صحيح، حاول مرة أخرى', 'err');
    if (inp) { inp.value = ''; shake(inp); inp.focus(); }
    return;
  }
  me = { code: String(s.code), name: s.name };
  ls.s('loggedInStudent', btoa(unescape(encodeURIComponent(JSON.stringify(me)))));
  closeLogin();
  toast('أهلاً بك ' + me.name + ' 🎉', 'ok');
  nav();
}

// استعادة الجلسة عند تحميل الصفحة
function restoreSession() {
  const saved = ls.g('loggedInStudent');
  if (!saved) return;
  try {
    const obj = JSON.parse(decodeURIComponent(escape(atob(saved))));
    const s = studentByCode(obj && obj.code);
    if (s) { me = { code: String(s.code), name: s.name }; }
    else { me = null; ls.d('loggedInStudent'); }
  } catch (e) { me = null; ls.d('loggedInStudent'); }
}

function logout() {
  me = null;
  ls.d('loggedInStudent');
  location.hash = '#home';
  toast('تم تسجيل الخروج 👋', 'ok');
  if (location.hash === '#home') nav();
}

// اهتزاز بسيط لحقل خاطئ
function shake(el) {
  if (!el) return;
  el.classList.remove('shk');
  void el.offsetWidth;
  el.classList.add('shk');
  setTimeout(() => el.classList.remove('shk'), 500);
}