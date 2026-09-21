/* ═══════════════════════════════════════════════════════════
   AI Pioneers — دوال مساعدة عامة
   ═══════════════════════════════════════════════════════════ */

const $ = (id) => document.getElementById(id);

// تخزين آمن مع محاولة/خطأ
const ls = {
  g: (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } },
  s: (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} },
  d: (k) => { try { localStorage.removeItem(k); } catch (e) {} }
};

// بيانات التطبيق المدمجة (من js/data-bundle.js)
const D = (window.APP_DATA || {});
const CONFIG = D.config || {};
const SCH = D.school || {};
const SHEET_URL = CONFIG.sheetUrl || '';

// فهرسة الطلاب بالكود + القائمة المعروضة (بدون سجل المعلم)
const ST = {};
(D.students || []).forEach((s) => { ST[String(s.code)] = s.name; });
const TEACHER_CODE = '262888';
const STUDENT_LIST = (D.students || []).filter((s) => String(s.code) !== TEACHER_CODE);

// التقدير
function getGrade(p) {
  if (p >= 90) return { name: 'ممتاز', cls: 'ex' };
  if (p >= 80) return { name: 'جيد جداً', cls: 'vg' };
  if (p >= 70) return { name: 'جيد', cls: 'gd' };
  if (p >= 60) return { name: 'مقبول', cls: 'ps' };
  return { name: 'راسب', cls: 'fl' };
}

// إشعار خفيف
let _toastT = null;
function toast(msg, type) {
  const t = $('toast');
  if (!t) return;
  t.textContent = msg;
  t.dataset.type = type || 'ok';
  t.style.display = 'block';
  clearTimeout(_toastT);
  _toastT = setTimeout(() => { t.style.display = 'none'; }, 2800);
}

// الإيموجي حسب نوع الرسالة (يُزين التوست)
const TOAST_ICON = { ok: '✔', err: '✖', warn: '⚠' };

// استرجاع المادة والخلفية
function sub(id) { return (D.subjects || []).find((s) => s.id === id); }

// الدرس المؤشر ضمن المادة (رقم الدرس = ترتيبه في القائمة)
function lessonEntry(subject, n) {
  if (!subject || !subject.lessons || !n) return null;
  return subject.lessons[n - 1] || null;
}

// محتوى الدرس (التفاصيل المادية من data/lessons) أو null
function lessonContent(subject, n) {
  const e = lessonEntry(subject, n);
  return e ? (e.content || null) : null;
}

// تنسيق التاريخ بالعربية
function fd(d) {
  return new Date(d).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' });
}

function fdt(value) {
  if (!value) return '';
  const hasTime = /T/.test(String(value));
  let s = value;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) s += 'T00:00:00';
  const d = new Date(s);
  if (isNaN(d.getTime())) return value;
  const opts = { year: 'numeric', month: 'long', day: 'numeric' };
  if (hasTime) { opts.hour = '2-digit'; opts.minute = '2-digit'; }
  return d.toLocaleString('ar-EG', opts);
}

// معرف فترة الاختبار النهائي (يدخل في مفاتيح التخزين لتمييز فترة عن أخرى)
function examIdOf(lesson) {
  const examining = lesson && lesson.finalExam;
  if (examining && examining.examId) return examining.examId;
  if (examining && examining.availableFrom) return 'exam_' + String(examining.availableFrom).replace(/[^\w-]/g, '_');
  return 'exam_default';
}

function finalResultKey(code, sid, lid, lesson) {
  return `examResult_${code}_${sid}_${lid}_${examIdOf(lesson)}`;
}
function finalTakenKey(code, sid, lid, lesson) {
  return `examTaken_${code}_${sid}_${lid}_${examIdOf(lesson)}`;
}
function finalAttemptKey(code, sid, lid, lesson) {
  return `finalAttempt_${code}_${sid}_${lid}_${examIdOf(lesson)}`;
}

function getStoredResult(code, sid, lid, lesson) {
  try { return JSON.parse(ls.g(finalResultKey(code, sid, lid, lesson)) || 'null'); }
  catch (e) { return null; }
}
function getStoredAttempt(code, sid, lid, lesson) {
  return parseInt(ls.g(finalAttemptKey(code, sid, lid, lesson)) || '0', 10) || 0;
}

// خلط عشوائي
function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5); }

// حرف الخيار
function optionLetter(i) {
  const letters = ['أ', 'ب', 'ج', 'د', 'هـ', 'و', 'ز', 'ح'];
  return letters[i] !== undefined ? letters[i] : ('خيار ' + (i + 1));
}

// صيغة المؤقت
function fmtTime(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const s = total % 60, m = Math.floor(total / 60);
  return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
}

// اطّلاع على مصدر الرحلة الحالية (إدارة حالة محرك الاختبار تُدار في exam.js)
function currentUser() { return window.me || null; }