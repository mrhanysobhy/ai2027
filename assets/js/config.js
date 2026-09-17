/**
 * config.js
 * إعدادات عامة للمشروع.
 * كل الثوابت المشتركة بين ملفات JS المختلفة توضع هنا فقط.
 */
const APP_CONFIG = {
  // رابط الـ Apps Script Web App المنشور (doPost). يُستبدل بالرابط الحقيقي بعد النشر.
  APPS_SCRIPT_URL: "https://script.google.com/macros/s/AKfycbym77wVjDOonHomRbdcYhuibj9h7Tau1qTG90e35VqOBsrbpZzOAXx7UsPrSpQePx7v/exec",

  // القاعدة الأساسية لملفات البيانات على GitHub Pages (نفس مصدر الواجهة).
  // يُستخدم من الفرونت إند لجلب courses.json / exams.json / ملفات الشرح والمراجعة.
  DATA_BASE_URL: "./data/",

  // منطقة زمنية موحدة تُستخدم في كل مقارنات الوقت (الفرونت والباك إند).
  TIMEZONE: "Africa/Cairo",

  // مفتاح تخزين كود الطالب في localStorage (خاصية "تذكرني").
  STUDENT_CODE_STORAGE_KEY: "student_code",

  // مفاتيح localStorage لأغراض تجربة المستخدم فقط (لا تُستخدم أبداً لاتخاذ قرار نهائي)
  UX_EXAM_STARTED_PREFIX: "ux_exam_started_", // ux_exam_started_<examId>
};
