/**
 * app.js
 * تحكم الـ SPA: التنقل بين شاشة الدخول ولوحة المواد وشاشة الاختبار،
 * باستخدام Auth وApi وExamFlow. لا يحتوي أي منطق أمني — كل قرار حاسم
 * (الاعتماد النهائي للنتيجة، منع إعادة الاختبار) مصدره الخادم فقط.
 */
(async function () {
  const loginScreen = document.getElementById("login-screen");
  const appScreen = document.getElementById("app-screen");
  const codeInput = document.getElementById("code-input");
  const loginBtn = document.getElementById("login-btn");
  const loginError = document.getElementById("login-error");
  const welcomeName = document.getElementById("welcome-name");
  const logoutBtn = document.getElementById("logout-btn");
  const subjectsGrid = document.getElementById("subjects-grid");
  const examView = document.getElementById("exam-view");
  const dashboardView = document.getElementById("dashboard-view");

  let courses = null;

  function showApp(student) {
    loginScreen.classList.add("hidden");
    appScreen.classList.remove("hidden");
    welcomeName.textContent = student.name;
    renderDashboard();
  }

  function showLogin() {
    appScreen.classList.add("hidden");
    loginScreen.classList.remove("hidden");
  }

  async function renderDashboard() {
    dashboardView.classList.remove("hidden");
    examView.classList.add("hidden");
    examView.innerHTML = "";

    if (!courses) {
      try {
        courses = await Api.data.courses();
      } catch (e) {
        subjectsGrid.innerHTML = `<p>تعذر تحميل المواد الدراسية.</p>`;
        return;
      }
    }

    subjectsGrid.innerHTML = "";
    courses.subjects.forEach((subject) => {
      const card = document.createElement("div");
      card.className = "subject-card";
      const lessonCount = subject.units.reduce((sum, u) => sum + u.lessons.length, 0);
      card.innerHTML = `<h3>${subject.name}</h3><p>${lessonCount} درس</p>`;
      card.addEventListener("click", () => renderSubjectLessons(subject));
      subjectsGrid.appendChild(card);
    });
  }

  function renderSubjectLessons(subject) {
    subjectsGrid.innerHTML = `<button class="btn secondary" id="back-btn" style="width:auto;margin-bottom:12px;">◀ رجوع</button>`;
    document.getElementById("back-btn").addEventListener("click", renderDashboard);

    subject.units.forEach((unit) => {
      const unitBlock = document.createElement("div");
      unitBlock.innerHTML = `<h4>${unit.name}</h4>`;
      unit.lessons.forEach((lesson) => {
        const row = document.createElement("div");
        row.className = "lesson-row";
        row.innerHTML = `<span>${lesson.name}</span>`;
        const btn = document.createElement("button");
        btn.className = "btn";
        btn.style.width = "auto";
        btn.textContent = lesson.examId ? "الاختبار" : "لا يوجد اختبار";
        btn.disabled = !lesson.examId;
        btn.addEventListener("click", () => openExam(lesson.examId));
        row.appendChild(btn);
        unitBlock.appendChild(row);
      });
      subjectsGrid.appendChild(unitBlock);
    });
  }

  function openExam(examId) {
    dashboardView.classList.add("hidden");
    examView.classList.remove("hidden");
    examView.innerHTML = `<p>جارِ التحقق من حالة الاختبار...</p>`;

    ExamFlow.start(examId, Auth.getCurrentCode(), {
      onAlreadyCompleted: (result) => renderLockedResult(result, "لقد سبق لك أداء هذا الاختبار وتم اعتماد نتيجتك."),
      onNotOpen: (opensAt) => {
        examView.innerHTML = `<div class="locked-message">الاختبار سيفتح يوم ${formatDateTime(opensAt)}.</div>` + backButton();
        bindBack();
      },
      onClosed: (closedAt, result) => {
        const msg = result
          ? renderResultHtml(result, "انتهى وقت هذا الاختبار.")
          : `<div class="locked-message">انتهى وقت هذا الاختبار ولم تقم بأدائه.</div>`;
        examView.innerHTML = msg + backButton();
        bindBack();
      },
      onError: (message) => {
        examView.innerHTML = `<div class="locked-message">${message}</div>` + backButton();
        bindBack();
      },
      onExamStarted: (questions, remainingSeconds) => renderExamForm(examId, questions, remainingSeconds),
      onTick: (remaining) => updateTimerDisplay(remaining),
      onTimeUp: () => { /* submit() يُستدعى تلقائياً من exam.js */ },
      onSubmitting: () => {
        const submitBtn = document.getElementById("submit-exam-btn");
        if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = "جارِ اعتماد النتيجة..."; }
      },
      onSubmitFailed: (message) => {
        const submitBtn = document.getElementById("submit-exam-btn");
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = "تسليم الاختبار"; }
        alert(message);
      },
      onResult: (result) => renderLockedResult(result, "تم اعتماد نتيجتك بنجاح."),
    });
  }

  function renderExamForm(examId, questions, remainingSeconds) {
    const html = [`<div class="exam-timer" id="exam-timer">${formatSeconds(remainingSeconds)}</div>`];
    questions.forEach((q, idx) => {
      html.push(`<div class="question-card" data-qid="${q.questionId}">
        <strong>${idx + 1}. ${q.question}</strong>`);
      if (q.type === "MCQ" || q.type === "TRUE_FALSE") {
        q.options.forEach((opt) => {
          html.push(`<label class="option-label">
            <input type="radio" name="q_${q.questionId}" value="${escapeHtml(opt)}"> ${opt}
          </label>`);
        });
      } else if (q.type === "FILL_BLANK") {
        html.push(`<input type="text" class="fill-blank-input" data-qid="${q.questionId}" style="width:100%;padding:10px;border:1px solid var(--border);border-radius:8px;">`);
      }
      html.push(`</div>`);
    });
    html.push(`<button class="btn" id="submit-exam-btn">تسليم الاختبار</button>`);
    examView.innerHTML = html.join("");

    examView.querySelectorAll('input[type="radio"]').forEach((input) => {
      input.addEventListener("change", (e) => {
        const qid = e.target.closest(".question-card").dataset.qid;
        ExamFlow.setAnswer(qid, e.target.value);
      });
    });
    examView.querySelectorAll(".fill-blank-input").forEach((input) => {
      input.addEventListener("input", (e) => {
        ExamFlow.setAnswer(e.target.dataset.qid, e.target.value);
      });
    });
    document.getElementById("submit-exam-btn").addEventListener("click", () => {
      if (!confirm("هل أنت متأكد من تسليم الاختبار؟ لا يمكن التراجع بعد التسليم.")) return;
      ExamFlow.submit(examId, Auth.getCurrentCode(), currentCallbacks());
    });
  }

  // نمرر نفس الـ callbacks عند التسليم اليدوي وعند انتهاء الوقت
  function currentCallbacks() {
    return {
      onAlreadyCompleted: (result) => renderLockedResult(result, "تم اعتماد نتيجتك بالفعل من طلب سابق."),
      onSubmitFailed: (message) => alert(message),
      onResult: (result) => renderLockedResult(result, "تم اعتماد نتيجتك بنجاح."),
    };
  }

  function updateTimerDisplay(remaining) {
    const el = document.getElementById("exam-timer");
    if (!el) return;
    el.textContent = formatSeconds(remaining);
    el.classList.toggle("low-time", remaining <= 60);
  }

  function renderLockedResult(result, headline) {
    examView.innerHTML = renderResultHtml(result, headline) + backButton();
    bindBack();
  }

  function renderResultHtml(result, headline) {
    return `<div class="result-box">
      <p>${headline}</p>
      <div class="grade">${result.grade} (${result.percentage}%)</div>
      <p>الدرجة: ${result.score} / ${result.totalScore}</p>
      <p style="color:var(--text-muted);font-size:13px;">رقم المرجع: ${result.referenceCode}</p>
      <p style="color:var(--text-muted);font-size:13px;">لا يمكن إعادة هذا الاختبار.</p>
    </div>`;
  }

  function backButton() {
    return `<button class="btn secondary" id="exam-back-btn" style="margin-top:16px;">◀ العودة للدروس</button>`;
  }
  function bindBack() {
    const btn = document.getElementById("exam-back-btn");
    if (btn) btn.addEventListener("click", renderDashboard);
  }

  function formatSeconds(total) {
    const m = Math.floor(total / 60).toString().padStart(2, "0");
    const s = Math.floor(total % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }
  function formatDateTime(iso) {
    try {
      return new Date(iso).toLocaleString("ar-EG", { timeZone: APP_CONFIG.TIMEZONE });
    } catch (e) { return iso; }
  }
  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  // ---- تسجيل الدخول ----
  loginBtn.addEventListener("click", async () => {
    loginError.textContent = "";
    loginBtn.disabled = true;
    const res = await Auth.login(codeInput.value);
    loginBtn.disabled = false;
    if (res.ok) {
      showApp(res.student);
    } else {
      loginError.textContent = res.message;
    }
  });
  codeInput.addEventListener("keydown", (e) => { if (e.key === "Enter") loginBtn.click(); });

  logoutBtn.addEventListener("click", () => {
    Auth.logout();
    showLogin();
  });

  // ---- تحقق صامت عند فتح الموقع ----
  const reauthed = await Auth.silentReauth();
  if (reauthed) {
    showApp(Auth.getCurrentStudent());
  } else {
    showLogin();
  }
})();
