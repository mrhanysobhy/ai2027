/**
 * api.js
 * طبقة موحدة لكل الاتصالات:
 *  - Api.script.*  → نداءات لـ Google Apps Script (login, checkExamStatus, getExamQuestions, submitExam...)
 *  - Api.data.*    → قراءة ملفات JSON الثابتة من مجلد data/ على GitHub Pages
 *
 * مبدأ مهم: الأسئلة والمواعيد الرسمية لا تُقرأ مباشرة من data/ لأغراض الاختبار؛
 * تُقرأ من الـ Script فقط، لأن الـ Script هو من يتحقق من الوقت الحقيقي ومن وجود نتيجة سابقة.
 * data/exams.json و data/exams/<id>.json لا تزالان موجودتين كمصدر بيانات، لكن الـ Script
 * هو من يقرأهما (عبر UrlFetchApp) لأغراض الاختبار الرسمي — وليس المتصفح مباشرة.
 */
const Api = (() => {

  async function callScript(action, payload = {}) {
    const body = JSON.stringify({ action, ...payload });
    let response;
    try {
      response = await fetch(APP_CONFIG.APPS_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" }, // يتفادى preflight CORS مع Apps Script
        body,
      });
    } catch (networkError) {
      return { ok: false, code: "NETWORK_ERROR", message: "تعذر الاتصال بالخادم. تحقق من اتصالك بالإنترنت." };
    }

    if (!response.ok) {
      return { ok: false, code: "SERVER_ERROR", message: "حدث خطأ من طرف الخادم. حاول لاحقاً." };
    }

    try {
      return await response.json();
    } catch (parseError) {
      return { ok: false, code: "BAD_RESPONSE", message: "استجابة غير متوقعة من الخادم." };
    }
  }

  async function getJson(relativePath) {
    const res = await fetch(APP_CONFIG.DATA_BASE_URL + relativePath, { cache: "no-store" });
    if (!res.ok) throw new Error(`تعذر تحميل الملف: ${relativePath}`);
    return res.json();
  }

  return {
    script: {
      /** تسجيل الدخول بكود الطالب. */
      login: (code) => callScript("login", { code }),

      /** التحقق من حالة اختبار قبل عرض أي سؤال. */
      checkExamStatus: (examId, studentCode) =>
        callScript("checkExamStatus", { examId, studentCode }),

      /** جلب أسئلة اختبار مفتوح (بدون إجابات صحيحة). */
      getExamQuestions: (examId, studentCode) =>
        callScript("getExamQuestions", { examId, studentCode }),

      /** تسليم إجابات الاختبار — نقطة الاعتماد النهائية للنتيجة. */
      submitExam: (examId, studentCode, answers, clientAttemptToken) =>
        callScript("submitExam", { examId, studentCode, answers, clientAttemptToken }),

      /** جلب النتيجة المعتمدة (إن وجدت) لطالب في اختبار معين. */
      getResult: (examId, studentCode) =>
        callScript("getResult", { examId, studentCode }),
    },
    data: {
      courses: () => getJson("courses.json"),
      lessonExplain: (subject, lessonId) => getJson(`${subject}/${lessonId}-explain.json`),
      lessonReview: (subject, lessonId) => getJson(`${subject}/${lessonId}-review.json`),
    },
  };
})();
