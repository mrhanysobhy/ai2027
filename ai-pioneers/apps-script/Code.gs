/**
 * AI Pioneers - تسجيل نتائج الاختبارات النهائية في Google Sheets
 *
 * الوظائف:
 * 1. استقبال نتيجة الاختبار النهائي عبر POST (doPost) من js/sheets.js
 * 2. إنشاء ورقة "النتائج" تلقائياً عند أول استقبال (أو من القائمة)
 * 3. تسجيل كل نتيجة في صف جديد (سجل تراكمي طويل)
 *
 * التركيب:
 * 1. افتح Google Sheet جديد (أو موجود) سيكون مستودع النتائج
 * 2. من القائمة: Extensions > Apps Script
 * 3. احذف الكود الموجود والصق هذا الكود كاملاً ثم احفظ
 * 4. حدد التابع وتشغيل doPost لنطبق؟ لا - شغّل setupSheet مرة للتجربة من القائمة
 * 5. انشر كتطبيق ويب: Deploy > New deployment > Web app
 *      - Execute as: Me
 *      - Who has access: Anyone
 *      - انسخ الرابط /exec وضعه في data/config.json داخل "sheetUrl"
 *      - (اختياري) أضف ?key=SECRET إلى الرابط وتطابق مع TOKEN أدناه
 *
 * ملاحظة: الترخيص الأول سيتطلب الضغط على Advanced > Go to (unsafe) > Allow
 */

// ═══════════════════════════ التهيئة ═══════════════════════════

// اسم الورقة التي ستحتوي النتائج
const SHEET_NAME = 'النتائج';

// رؤوس الأعمدة (سجل تراكمي طويل - يُسجَّل كل أداء حتى غير الناجحين)
const HEADERS = [
  'التاريخ',
  'كود الطالب',
  'اسم الطالب',
  'المادة',
  'الدرس',
  'نوع الاختبار',
  'معرف الاختبار',
  'رقم المحاولة',
  'النتيجة',
  'الدرجة',
  'المجموع',
  'النسبة المئوية'
];

// رمز حماية اختياري: اتركه '' لتعطيل التحقق.
// إن ملأته، أضفه لرابط النشر هكذا: https://script.google.com/macros/s/.../exec?key=SECRET
const TOKEN = '';

// كلمة مرور الوصول للقراءة من صفحة الادمن (admin/AdminHany.html):
// تُرسَل كمعامل في الرابط هكذا: https://.../exec?password=XXXX
const ADMIN_PASSWORD = '262888';

// ═══════════════════════════ القائمة ═══════════════════════════

function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('AI Pioneers')
    .addItem('إنشاء/تهيئة ورقة النتائج', 'setupSheet')
    .addSeparator()
    .addItem('تعليمات النشر', 'showInstructions')
    .addToUi();
}

function showInstructions() {
  const ui = SpreadsheetApp.getUi();
  ui.alert(
    'تعليمات النشر',
    '1) Deploy > New deployment > Web app\n' +
    '2) Execute as: Me\n' +
    '3) Who has access: Anyone\n' +
    '4) انسخ رابط /exec الناتج\n' +
    '5) ضعه في data/config.json@sleetUrl ثم أعد تشغيل node tools/build.js',
    ui.ButtonSet.OK
  );
}

// ═══════════════════════════ الاستقبال ═══════════════════════════

/**
 * نقطة الاستقبال من الموقع: doPost يلتقط POST من js/sheets.js
 */
function doPost(e) {
  let payload;
  try {
    payload = JSON.parse(e.postData.contents);
  } catch (err) {
    return jsonResponse({ ok: false, error: 'بيانات غير صالحة: ' + err.message }, 400);
  }

  if (TOKEN && (e.parameter.key || '') !== TOKEN) {
    return jsonResponse({ ok: false, error: 'رمز غير صحيح' }, 403);
  }

  for (const required of ['studentCode', 'studentName', 'score', 'total']) {
    if (payload[required] === undefined || payload[required] === null || payload[required] === '') {
      return jsonResponse({ ok: false, error: 'حقل مطلوب ناقص: ' + required }, 400);
    }
  }

  try {
    const saved = appendResult(payload);
    if (saved === false) {
      return jsonResponse({ ok: false, error: 'مكرر: نتيجة هذه المحاولة مسجلة مسبقاً', duplicate: true });
    }
    return jsonResponse({ ok: true });
  } catch (err) {
    Logger.log('خطأ في الحفظ: ' + err.message);
    return jsonResponse({ ok: false, error: 'تعذر الحفظ: ' + err.message }, 500);
  }
}

// ═══════════════════════════════ القراءة ═══════════════════════════════

/**
 * نقطة القراءة لصفحة الادمن admin/AdminHany.html (قراءة فقط — لا تعديل للشيت).
 * تُرجع كل الصفوف المسجلة في ورقة النتائج كنص JSON.
 * الاستخدام: GET /exec?password=262888
 * لا تؤثر هذه الوظيفة إطلاقاً على doPost/تسجيل الطلاب.
 */
function doGet(e) {
  const pass = (e.parameter && e.parameter.password) || '';
  if (pass !== ADMIN_PASSWORD) {
    return jsonResponse({ ok: false, error: 'كلمة المرور غير صحيحة' });
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME);
  const rows = [];

  if (sheet) {
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      const r = data[i];
      let dateStr = String(r[0] || '');
      // إن كانت الخلية تاريخاً فعلياً (وليست نصاً) عرّفه بصيغة موحدة
      if (r[0] instanceof Date) {
        dateStr = Utilities.formatDate(r[0], Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
      }
      rows.push({
        date: dateStr,
        studentCode: String(r[1] || ''),
        studentName: String(r[2] || ''),
        subject: String(r[3] || ''),
        lesson: String(r[4] || ''),
        examType: String(r[5] || ''),
        examId: String(r[6] || ''),
        attempt: Number(r[7]) || 0,
        result: String(r[8] || ''),
        score: Number(r[9]) || 0,
        total: Number(r[10]) || 0,
        percentage: Number(r[11]) || 0
      });
    }
  }

  return jsonResponse({ ok: true, count: rows.length, rows: rows });
}

// ═══════════════════════════ الكتابة ═══════════════════════════

/**
 * يُلحق صف النتيجة بعد التحقق من التكرار.
 * قواعد المنع:
 * 1) تسجيل سابق ناجح لنفس (الطالب + المادة + الدرس + معرف الاختبار) يمنع أي إرسال لاحق
 * 2) نفس (الطالب + المادة + الدرس + معرف الاختبار + رقم المحاولة) مسجلة مسبقاً → مكرر
 * تعيد false إن كان مكرراً، و true عند الإلحاق.
 */
function appendResult(p) {
  const sheet = getOrCreateResultSheet();
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const data = sheet.getDataRange().getValues();
    const code = String(p.studentCode);
    const subject = String(p.subject || '');
    const lesson = String(p.lesson || '');
    const examId = String(p.examId || '');
    const attempt = Number(p.attempt) || 1;
    const newPassed = !!p.passed;

    if (data.length > 1) {
      for (let i = 1; i < data.length; i++) {
        const r = data[i];
        const sameStudent = String(r[1]) === code;
        const sameSubject = String(r[3]) === subject;
        const sameLesson = String(r[4]) === lesson;
        const sameExamId = String(r[6]) === examId;

        // اجتياز سابق لنفس الفترة يمنع أي إرسال لاحق (حماية من مسح localStorage)
        if (sameStudent && sameSubject && sameLesson && sameExamId && String(r[8]) === 'ناجح') {
          return false;
        }
        // نفس المحاولة مسجلة مسبقاً (منع التكرار/الضغط المزدوج)
        if (sameStudent && sameSubject && sameLesson && sameExamId && Number(r[7]) === attempt) {
          return false;
        }
      }
    }

    const row = [
      Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss'),
      p.studentCode,
      p.studentName,
      subject,
      lesson,
      p.examType || 'final',
      examId,
      attempt,
      newPassed ? 'ناجح' : 'راسب',
      Number(p.score),
      Number(p.total),
      Math.round((Number(p.score) / Number(p.total)) * 100)
    ];
    sheet.appendRow(row);
    SpreadsheetApp.flush();
    return true;
  } finally {
    lock.releaseLock();
  }
}

function getOrCreateResultSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    formatSheet_(sheet);
  }
  return sheet;
}

/**
 * قائمة > AI Pioneers > إنشاء/تهيئة ورقة النتائج
 * يُنشئ الورقة مع التنسيق مرة واحدة.
 */
function setupSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  } else {
    const clear = SpreadsheetApp.getUi().alert(
      'الورقة موجودة',
      'هل تريد مسح محتواها وإعادة التهيئة؟',
      SpreadsheetApp.getUi().ButtonSet.YES_NO
    );
    if (clear === SpreadsheetApp.getUi().Button.NO) return;
    sheet.clear();
  }
  formatSheet_(sheet);
  SpreadsheetApp.getUi().alert('تم تهيئة ورقة النتائج بنجاح ✓');
}

function formatSheet_(sheet) {
  sheet.clear();
  sheet.getRange(1, 1, 1, HEADERS.length)
    .setValues([HEADERS])
    .setFontWeight('bold')
    .setBackground('#1565c0')
    .setFontColor('#ffffff')
    .setHorizontalAlignment('center');
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, HEADERS.length);
  sheet.getRange('A2:A').setNumberFormat('dd/mm/yyyy');
  sheet.getRange('H2:H').setNumberFormat('0');
  sheet.getRange('J2:L').setNumberFormat('0');
}

// ═══════════════════════════ أدوات مساعدة ═══════════════════════════

function jsonResponse(obj, code) {
  // ملاحظة: ContentService لا يدعم setStatusCode؛ يستخدم العميل mode:no-cors
  // فلا يقرأ الرد أصلاً، لذا نكتفي بإرجاع JSON فقط ونتتبع الأخطاء عبر Logger.
  var out = ContentService.createTextOutput(JSON.stringify(obj));
  return out.setMimeType(ContentService.MimeType.JSON);
}