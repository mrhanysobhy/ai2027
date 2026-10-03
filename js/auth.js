/* ═══════════════════════════════════════════════════════════
   AI Pioneers — تسجيل دخول الطالب / الجلسة
   ═══════════════════════════════════════════════════════════ */

let me = null;          // { code, name } أو null
let _examState = null;  // حالة محرك الاختبار (تُدار في exam.js)

function studentByCode(code) {
  return (D.students || []).find((s) => String(s.code) === String(code).trim()) || null;
}

// نية معلّقة تُنفَّذ بعد نجاح الدخول (مثلاً: بدء الاختبار النهائي بعد إدخال الكود)
let _afterLogin = null;

// فتح نافذة الدخول — أي فتح يدوي يُلغي النية المعلّقة حتى لا تُنفَّذ لاحقاً بالخطأ
function openLogin(message) {
  const m = $('mod');
  if (!m) return;
  _afterLogin = null;
  m.style.display = 'flex';
  const hint = $('loginMsg');
  if (hint) hint.textContent = message || 'الكود يُوزَّع من إدارة المدرسة أو من المعلم.';
  const inp = $('code');
  if (inp) { inp.value = ''; setTimeout(() => inp.focus(), 120); }
}

// إغلاق النافذة: نلتقط النية قبل المسح حتى لا يضيع نجاح الدخول
function closeLogin(keepPending) {
  const pending = _afterLogin;
  if (!keepPending) _afterLogin = null;
  const m = $('mod');
  if (m) m.style.display = 'none';
  return pending;
}

// طلب تسجيل الدخول مع تنفيذ action بعد النجاح (زائر يتابع التصفّح بعد كوده)
function requireLogin(action, message) {
  if (me) { if (typeof action === 'function') action(); return true; }
  openLogin(message);                       // openLogin يمسح أي نية سابقة
  _afterLogin = typeof action === 'function' ? action : null;
  return false;
}

function closeLoginAndClear() {
  closeLogin(false);
  if (typeof nav === 'function' && !me) nav();
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
  applyAdminSync();
  const next = closeLogin(true);            // نحتفظ بالنية لأنها نجحت الآن
  _afterLogin = null;
  if (next) { nav(); next(); return; }
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
  applyAdminSync();
}

// دخول المعلم (حساب أ/ هاني صبحي) يمنح صلاحية لوحة الإدارة تلقائياً
function applyAdminSync() {
  const isTeacher = !!(me && String(me.code) === ADMIN_PW);
  if (isTeacher) sessionStorage.setItem(SESSION_KEY, '1');
  else sessionStorage.removeItem(SESSION_KEY);
}

function logout() {
  me = null;
  ls.d('loggedInStudent');
  applyAdminSync();
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