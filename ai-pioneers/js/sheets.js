/* ═══════════════════════════════════════════════════════════
   AI Pioneers — إرسال النتائج إلى Google Sheets (Apps Script)
   ═══════════════════════════════════════════════════════════ */

async function sendToSheets(student, subjectName, lessonTitle, score, total, percentage, examType, examId, attempt, passed) {
  // حارس التطوير: عند التشغيل محلياً (localhost) لا تُرسل أي نتيجة للشيت الحقيقي
  // حتى لا تصل بيانات اختبار/تجربة إلى السجل الرسمي. يعمل الإرسال على النشر الفعلي فقط.
  const IS_DEV = /^(localhost|127\.0\.0\.1)$/.test(String(location.hostname));
  if (IS_DEV) {
    console.log('[dev] تم تخطي الإرسال إلى Google Sheets لأن التطبيق يعمل محلياً (localhost).');
    return;
  }
  if (!SHEET_URL || SHEET_URL === 'GOOGLE_APPS_SCRIPT_URL_HERE') {
    console.log('نتيجة محفوظة محلياً فقط (لم يُعيّن رابط Google Sheets)');
    return;
  }

  const payload = {
    studentCode: student.code,
    studentName: student.name,
    subject: subjectName,
    lesson: lessonTitle,
    examType: examType,
    examId: examId || '',
    attempt: attempt || 1,
    passed: !!passed,
    score: score,
    total: total,
    percentage: percentage
  };

  try {
    await fetch(SHEET_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(payload)
    });
    console.log('تم إرسال النتيجة إلى Google Sheets:', payload);
  } catch (e) {
    console.error('فشل إرسال النتيجة إلى Google Sheets:', e);
  }
}

// قراءة سجل النتائج الكامل من الشيت (للوحة الإدارة) عبر doGet
async function fetchSheetRows(password) {
  if (!SHEET_URL || SHEET_URL === 'GOOGLE_APPS_SCRIPT_URL_HERE') {
    return { ok: false, error: 'رابط Google Sheets غير مُعيّن', configured: false };
  }
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 12000);
  try {
    const sep = SHEET_URL.includes('?') ? '&' : '?';
    const res = await fetch(SHEET_URL + sep + 'password=' + encodeURIComponent(password || ''), { signal: ctrl.signal });
    if (!res.ok) return { ok: false, error: 'فشل الجلب (' + res.status + ')' };
    const data = await res.json();
    return { ok: !!data.ok, rows: data.rows || [], count: data.count || 0, error: data.error };
  } catch (e) {
    return { ok: false, error: e.name === 'AbortError' ? 'انتهت مهلة الاستجابة من الشيت' : 'تعذّر الاتصال بالشيت' };
  } finally {
    clearTimeout(timer);
  }
}