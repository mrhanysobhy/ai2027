/**
 * exam.js
 * دورة حياة الاختبار الكاملة وفق القاعدة الإلزامية:
 *   محاولة واحدة نهائية فقط لكل (طالب + اختبار)، ولا تظهر النتيجة إلا بعد اعتمادها من الخادم.
 *
 * كل قرار "هل يمكن بدء الاختبار؟" و"ما هي النتيجة؟" يأتي من الخادم (Apps Script) حصراً.
 * أي استخدام لـ localStorage هنا هو لتحسين تجربة المستخدم فقط (مثل تذكر أنه بدأ الاختبار
 * لعرض رسالة مناسبة أثناء انتظار الشبكة) ولا يُستخدم أبداً لمنع أو السماح بالإعادة.
 */
const ExamFlow = (() => {

  const STATUS = {
    NOT_OPEN: "NOT_OPEN",
    OPEN: "OPEN",
    CLOSED: "CLOSED",
    ALREADY_COMPLETED: "ALREADY_COMPLETED",
    ERROR: "ERROR",
  };

  let state = {
    examId: null,
    questions: [],   // بدون الإجابات الصحيحة أبداً
    answers: {},     // { questionId: answerGiven }
    timerHandle: null,
    remainingSeconds: 0,
  };

  /**
   * الخطوة الأولى دائماً: التحقق من حالة الاختبار قبل عرض أي شيء.
   * يغطي: NOT_OPEN / OPEN / CLOSED / ALREADY_COMPLETED
   */
  async function start(examId, studentCode, callbacks) {
    state = { examId, questions: [], answers: {}, timerHandle: null, remainingSeconds: 0 };

    const status = await Api.script.checkExamStatus(examId, studentCode);

    if (!status.ok) {
      callbacks.onError?.(status.message || "تعذر التحقق من حالة الاختبار.");
      return;
    }

    switch (status.status) {
      case STATUS.ALREADY_COMPLETED:
        // لا تُعرض الأسئلة أبداً — تُعرض النتيجة المعتمدة السابقة فقط
        callbacks.onAlreadyCompleted?.(status.result);
        return;

      case STATUS.NOT_OPEN:
        callbacks.onNotOpen?.(status.opensAt);
        return;

      case STATUS.CLOSED:
        callbacks.onClosed?.(status.closedAt, status.result || null);
        return;

      case STATUS.OPEN:
        await loadQuestionsAndBegin(examId, studentCode, status.durationMinutes, callbacks);
        return;

      default:
        callbacks.onError?.("حالة اختبار غير معروفة.");
    }
  }

  async function loadQuestionsAndBegin(examId, studentCode, durationMinutes, callbacks) {
    const qResult = await Api.script.getExamQuestions(examId, studentCode);

    if (!qResult.ok) {
      // الخادم قد يرفض الجلب هنا أيضاً إذا تغيّرت الحالة بين الطلبين (Race)
      if (qResult.status === STATUS.ALREADY_COMPLETED) {
        callbacks.onAlreadyCompleted?.(qResult.result);
      } else {
        callbacks.onError?.(qResult.message || "تعذر تحميل أسئلة الاختبار.");
      }
      return;
    }

    state.questions = qResult.questions; // كل سؤال يحمل questionId ثابت، بدون correctAnswer
    state.remainingSeconds = (durationMinutes || qResult.durationMinutes || 30) * 60;

    callbacks.onExamStarted?.(state.questions, state.remainingSeconds);
    startTimer(callbacks);
  }

  function startTimer(callbacks) {
    clearInterval(state.timerHandle);
    state.timerHandle = setInterval(() => {
      state.remainingSeconds -= 1;
      callbacks.onTick?.(state.remainingSeconds);
      if (state.remainingSeconds <= 0) {
        clearInterval(state.timerHandle);
        callbacks.onTimeUp?.();
        // التسليم التلقائي عند انتهاء الوقت يمر بنفس مسار submit() تماماً
        submit(state.examId, Auth.getCurrentCode(), callbacks);
      }
    }, 1000);
  }

  function setAnswer(questionId, value) {
    state.answers[questionId] = value;
  }

  /**
   * التسليم — لا يعرض أي نتيجة بنفسه؛ فقط يستدعي submitExam وينتظر اعتماد الخادم.
   * الخادم هو المسؤول عن: التحقق من الطالب/الاختبار/عدم وجود نتيجة سابقة/التصحيح/
   * الحفظ الآمن (LockService)/التوثيق كـ finalized، قبل إرجاع أي درجة.
   */
  async function submit(examId, studentCode, callbacks) {
    clearInterval(state.timerHandle);
    callbacks.onSubmitting?.();

    const result = await Api.script.submitExam(examId, studentCode, state.answers);

    if (!result.ok) {
      // فشل الاعتماد: لا نعرض أي درجة ولا نعتبر المحاولة منتهية بنجاح.
      // يُسمح بإعادة إرسال submit بأمان لاحقاً لأن الخادم يتحقق من عدم التكرار بنفسه.
      if (result.status === STATUS.ALREADY_COMPLETED) {
        // شخص/تبويب آخر أنهى المحاولة بالفعل بين طلبين متزامنين
        callbacks.onAlreadyCompleted?.(result.result);
      } else {
        callbacks.onSubmitFailed?.(result.message || "تعذر اعتماد نتيجة الاختبار حالياً. يرجى المحاولة مرة أخرى.");
      }
      return;
    }

    // النتيجة هنا فقط لأنها finalized ومحفوظة بنجاح في الخادم
    callbacks.onResult?.(result.result);
  }

  function getState() {
    return state;
  }

  return { start, setAnswer, submit, getState, STATUS };
})();
