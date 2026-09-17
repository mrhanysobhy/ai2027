/**
 * auth.js
 * تسجيل الدخول / الخروج / إعادة التحقق الصامت.
 *
 * ملاحظة أمنية مهمة (اقرأها قبل التعديل):
 * بيانات الطلاب أصبحت في data/students.json وهو ملف عام يمكن لأي زائر فتحه مباشرة
 * لأن المشروع Static Hosting. لذلك:
 *  - لا نعتبر "students.json" مصدر ثقة أمني — أي شخص يقرأ أكواد كل الطلاب من الملف مباشرة.
 *  - الحماية الحقيقية الوحيدة تقع في اعتماد نتائج الاختبار (submitExam)، حيث الخادم
 *    (Apps Script) هو من يقرر ويُثبّت النتيجة في شيت Results، ولا يمكن للطالب تزويرها
 *    من المتصفح مهما فعل بالكود الظاهري.
 *  - كود الدخول هنا وظيفته "تخصيص التجربة وتتبع التقدم"، وليس حماية بيانات حساسة.
 */
const Auth = (() => {
  let currentStudent = null;

  function getStoredCode() {
    return localStorage.getItem(APP_CONFIG.STUDENT_CODE_STORAGE_KEY);
  }

  function storeCode(code) {
    localStorage.setItem(APP_CONFIG.STUDENT_CODE_STORAGE_KEY, code);
  }

  function clearStoredCode() {
    localStorage.removeItem(APP_CONFIG.STUDENT_CODE_STORAGE_KEY);
  }

  /**
   * محاولة دخول صريحة من شاشة تسجيل الدخول.
   * @returns {Promise<{ok: boolean, student?: object, message?: string}>}
   */
  async function login(code) {
    const trimmed = (code || "").trim();
    if (!trimmed) {
      return { ok: false, message: "من فضلك أدخل كودك الخاص." };
    }

    const result = await Api.script.login(trimmed);

    if (result.ok) {
      currentStudent = result.student;
      storeCode(trimmed);
      return { ok: true, student: result.student };
    }

    // رسالة عامة دائماً — لا نكشف هل الكود غير موجود أم الحساب معطل
    return { ok: false, message: "الكود المدخل غير صحيح أو الحساب غير مفعّل." };
  }

  /**
   * تحقق صامت عند فتح الموقع: إن وُجد كود محفوظ، تحقق من صلاحيته دون إظهار أي شاشة دخول.
   * @returns {Promise<boolean>} true إذا نجح الدخول تلقائياً
   */
  async function silentReauth() {
    const stored = getStoredCode();
    if (!stored) return false;

    const result = await Api.script.login(stored);
    if (result.ok) {
      currentStudent = result.student;
      return true;
    }

    // الكود لم يعد صالحاً (حُذف أو عُطّل) → نظّف التخزين المحلي
    clearStoredCode();
    currentStudent = null;
    return false;
  }

  function logout() {
    clearStoredCode();
    currentStudent = null;
  }

  function getCurrentStudent() {
    return currentStudent;
  }

  function getCurrentCode() {
    return getStoredCode();
  }

  return { login, silentReauth, logout, getCurrentStudent, getCurrentCode };
})();
