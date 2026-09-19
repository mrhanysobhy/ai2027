// ═══════════════════════════════════════════════════════════
//                   الاختبار النهائي
// ═══════════════════════════════════════════════════════════

function renderFinalExamStatus(lesson) {
    const exam = lesson.finalExam || {};
    const status = getFinalExamWindowStatus(exam);
    const count = (exam.questions || []).length;
    const subjectId = currentSubject ? currentSubject.id : '';

    // نتيجة مسجلة مسبقاً: الطالب سبق له أداء هذا الاختبار
    const saved = currentStudent
        ? JSON.parse(localStorage.getItem(`examResult_${currentStudent.code}_${subjectId}_${lesson.id}`) || 'null')
        : null;

    const badges = `
        <p><span class="feature-badge"><i class="fas fa-question-circle"></i> ${count} سؤال</span>
        <span class="feature-badge"><i class="fas fa-clock"></i> ${exam.duration || 30} دقيقة</span>
        <span class="feature-badge"><i class="fas fa-check-circle"></i> النجاح: ${exam.passScore || 60}%</span></p>
    `;

    let body;
    if (saved) {
        body = saved.passed
            ? renderFinalPassedPage(lesson, saved)
            : renderFinalFailedResultPage(lesson, saved);
    } else if (status === 'closed') {
        body = renderFinalClosedState(lesson, exam, subjectId);
    } else if (status === 'waiting') {
        const from = formatFinalExamDateTime(exam.availableFrom);
        body = `
            <div class="result-icon fail"><i class="fas fa-hourglass-half"></i></div>
            <h3 style="color:var(--danger);margin:10px 0;">الاختبار النهائي سيُفتح قريباً</h3>
            <p style="color:var(--text-secondary);">موعد فتح الاختبار: <strong>${from}</strong></p>
            <p class="final-exam-notice"><i class="fas fa-exclamation-circle"></i> لا يمكنك الدخول إلى الاختبار النهائي قبل موعد البداية</p>
        `;
    } else {
        const from = formatFinalExamDateTime(exam.availableFrom);
        const to = formatFinalExamDateTime(exam.availableTo);
        body = `
            <div class="exam-window-box">
                <div><i class="fas fa-play-circle"></i> بداية الاختبار: <strong>${from}</strong></div>
                <div><i class="fas fa-stop-circle"></i> نهاية الاختبار: <strong>${to}</strong></div>
            </div>
            <p class="final-exam-notice"><i class="fas fa-exclamation-circle"></i> اختبار نهائي لا يمكن إعادة اجتيازه - ستتم إضافة نتيجتك إلى سجلك</p>
            <button class="btn btn-danger btn-lg" onclick="confirmStartFinalExam(${lesson.id})">
                <i class="fas fa-play"></i> ابدأ الاختبار النهائي
            </button>
        `;
    }

    return `
        <div class="exam-container" id="final-container-${lesson.id}">
            <div style="text-align:center;padding:30px;">
                <i class="fas fa-file-alt" style="font-size:4rem;color:var(--danger);margin-bottom:16px;display:block;"></i>
                <h3 style="color:var(--danger);margin-bottom:8px;">الاختبار النهائي</h3>
                ${badges}
                ${body}
            </div>
        </div>
    `;
}

function renderFinalClosedState(lesson, exam, subjectId) {
    const saved = currentStudent
        ? JSON.parse(localStorage.getItem(`examResult_${currentStudent.code}_${subjectId}_${lesson.id}`) || 'null')
        : null;

    if (saved && saved.passed) {
        return `
            <div class="result-container">
                <div class="result-icon success"><i class="fas fa-trophy"></i></div>
                <h2 style="color:var(--success);margin:10px 0;">مبروك! لقد اجتزت الاختبار النهائي</h2>
                <div class="result-score">${saved.score} / ${saved.total}</div>
                <div class="result-percentage">النسبة: ${saved.percentage}%</div>
                <div class="result-grade ${getGrade(saved.percentage).class}">${getGrade(saved.percentage).name}</div>
                <p class="final-exam-notice"><i class="fas fa-check-circle"></i> انتهى موعد الاختبار، وهذه نتيجتك النهائية المسجلة</p>
                <button class="btn btn-success btn-lg" onclick="generateCertificate('${subjectId}', ${lesson.id})">
                    <i class="fas fa-certificate"></i> تحميل شهادة الاجتياز
                </button>
            </div>
        `;
    }

    const to = formatFinalExamDateTime(exam.availableTo);
    return `
        <div class="result-icon fail"><i class="fas fa-lock"></i></div>
        <h3 style="color:var(--danger);margin:10px 0;">الاختبار النهائي غير متاح</h3>
        <p style="color:var(--text-secondary);">انتهى موعد الاختبار النهائي بتاريخ <strong>${to}</strong></p>
        <p class="final-exam-notice"><i class="fas fa-exclamation-circle"></i> لا يمكنك دخول الاختبار النهائي بعد انتهاء موعده</p>
        <div class="exam-window-box"><i class="fas fa-calendar-alt"></i> فترة الاختبار: من ${formatFinalExamDateTime(exam.availableFrom)} حتى ${to}</div>
    `;
}

function getFinalExamWindowStatus(exam) {
    const now = Date.now();
    let from = null, to = null;
    if (exam && exam.availableFrom) from = getFinalExamTime(exam.availableFrom, false);
    if (exam && exam.availableTo) to = getFinalExamTime(exam.availableTo, true);

    if (from === null && to === null) return 'open';
    if (from !== null && now < from) return 'waiting';
    if (to !== null && now > to) return 'closed';
    return 'open';
}

function getFinalExamTime(value, isEnd) {
    if (!value) return null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        const [y, m, d] = value.split('-').map(Number);
        return isEnd ? new Date(y, m - 1, d, 23, 59, 59).getTime() : new Date(y, m - 1, d).getTime();
    }
    const t = Date.parse(value);
    return isNaN(t) ? null : t;
}

function formatFinalExamDateTime(value) {
    if (!value) return '';
    let s = value;
    const hasTime = /T/.test(s);
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) s += 'T00:00:00';
    const d = new Date(s);
    if (isNaN(d.getTime())) return value;
    const opts = { year: 'numeric', month: 'long', day: 'numeric' };
    if (hasTime) { opts.hour = '2-digit'; opts.minute = '2-digit'; }
    return d.toLocaleString('ar-EG', opts);
}

function confirmStartFinalExam(lessonId) {
    const lesson = getActiveLesson(currentSubject.id, lessonId);
    const code = currentStudent ? currentStudent.code : '';
    const saved = code
        ? JSON.parse(localStorage.getItem(`examTaken_${code}_${currentSubject.id}_${lessonId}`) || 'null')
        : null;
    if (saved) {
        const container = document.getElementById(`final-container-${lessonId}`);
        showToast('سبق لك أداء هذا الاختبار، تظهر لك نتيجتك المسجلة', 'warning');
        if (container) container.innerHTML = saved.passed ? renderFinalPassedPage(lesson, saved) : renderFinalFailedResultPage(lesson, saved);
        return;
    }
    if (lesson && lesson.finalExam) {
        const status = getFinalExamWindowStatus(lesson.finalExam);
        if (status === 'waiting') {
            showToast(`الاختبار النهائي سيُفتح في ${formatFinalExamDateTime(lesson.finalExam.availableFrom)}`, 'warning');
            return;
        }
        if (status === 'closed') {
            showToast('انتهى موعد الاختبار النهائي، لا يمكنك الدخول الآن', 'error');
            return;
        }
    }
    showToast('تأكد من جاهزيتك للاختبار النهائي، لا يمكنك إعادة الاختبار بعد البدء!', 'warning');
    startFinalExam(currentSubject.id, lessonId);
}

function startFinalExam(subjectId, lessonId) {
    const lesson = getActiveLesson(subjectId, lessonId);
    if (!lesson || !lesson.finalExam) return;

    const code = currentStudent ? currentStudent.code : '';
    const saved = code
        ? JSON.parse(localStorage.getItem(`examTaken_${code}_${subjectId}_${lessonId}`) || 'null')
        : null;
    if (saved) {
        const container = document.getElementById(`final-container-${lessonId}`);
        showToast('سبق لك أداء هذا الاختبار، تظهر لك نتيجتك المسجلة', 'warning');
        if (container) container.innerHTML = saved.passed ? renderFinalPassedPage(lesson, saved) : renderFinalFailedResultPage(lesson, saved);
        return;
    }

    const questions = lesson.finalExam.questions;
    const duration = lesson.finalExam.duration || 30;

    const container = document.getElementById(`final-container-${lessonId}`);
    if (!container) return;

    currentExamData = { index: 0, answers: new Array(questions.length).fill(null) };

    const endTime = Date.now() + duration * 60000;

    function renderQuestionPage() {
        const qi = currentExamData.index;
        const q = questions[qi];
        const answeredCount = currentExamData.answers.filter(a => a !== null).length;
        const unansweredCount = questions.length - answeredCount;

        container.innerHTML = `
            <div class="exam-header">
                <div class="exam-progress">
                    <span>سؤال ${qi + 1} من ${questions.length}</span>
                    <div class="progress-bar-container">
                        <div class="progress-bar" style="width: ${((qi + 1) / questions.length) * 100}%"></div>
                    </div>
                    <span class="exam-timer" id="finalTimer">${formatTime(endTime - Date.now())}</span>
                </div>
            </div>
            <div class="exam-stats">
                <span class="exam-stat stat-answered"><i class="fas fa-check-circle"></i> أسئلة مجابة: <strong id="finalAnsweredCount">${answeredCount}</strong></span>
                <span class="exam-stat stat-unanswered"><i class="fas fa-question-circle"></i> أسئلة غير مجابة: <strong id="finalUnansweredCount">${unansweredCount}</strong></span>
            </div>
            <div class="question-card">
                <div class="question-text">
                    <span class="q-num">${qi + 1}</span>
                    <span>${q.question}</span>
                </div>
                ${renderHintBox(q.hint)}
                <div class="options-list">
                    ${q.options.map((opt, oi) => `
                        <div class="option-item ${currentExamData.answers[qi] === oi ? 'selected' : ''}" onclick="selectFinalOption(this, ${qi}, ${oi})">
                            <span class="option-letter">${optionLetter(oi)}</span>
                            <span>${opt}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
            <div class="exam-actions">
                ${qi > 0 ? `<button class="btn btn-outline-dark btn-lg" onclick="prevFinalQuestion()"><i class="fas fa-arrow-right"></i> السابق</button>` : ''}
                <button class="btn btn-primary btn-lg" onclick="nextFinalQuestion()">
                    ${qi < questions.length - 1 ? '<i class="fas fa-arrow-left"></i> التالي' : '<i class="fas fa-check-double"></i> إنهاء الاختبار'}
                </button>
            </div>
        `;
        if (!window.finalTimerStarted) {
            window.finalTimerStarted = setInterval(() => {
                const el = document.getElementById('finalTimer');
                if (!el) return;
                const left = endTime - Date.now();
                if (left <= 0) { clearInterval(window.finalTimerStarted); window.finalTimerStarted = null; submitFinalExam(true); return; }
                el.textContent = formatTime(left);
            }, 1000);
        }
    }

    window.selectFinalOption = function(el, qIndex, optionIndex) {
        if (currentExamData.answers[qIndex] === optionIndex) return;
        currentExamData.answers[qIndex] = optionIndex;
        renderQuestionPage();
    };

    window.prevFinalQuestion = function() {
        if (currentExamData.index > 0) {
            currentExamData.index--;
            renderQuestionPage();
        }
    };

    window.nextFinalQuestion = function() {
        if (currentExamData.index < questions.length - 1) {
            currentExamData.index++;
            renderQuestionPage();
        } else {
            submitFinalExam(false);
        }
    };

    window.submitFinalExam = async function(auto) {
        if (!auto && !window.confirmingSubmit) {
            window.confirmingSubmit = true;
            const ok = confirm('هل أنت متأكد من إنهاء الاختبار؟');
            window.confirmingSubmit = false;
            if (!ok) return;
        }
        clearInterval(window.finalTimerStarted);
        window.finalTimerStarted = null;

        let score = 0;
        questions.forEach((q, i) => {
            if (currentExamData.answers[i] === q.correct) score++;
        });

        const percentage = Math.round((score / questions.length) * 100);
        const passed = percentage >= (lesson.finalExam.passScore || 60);
        const t = Date.now();

        const saved = JSON.parse(localStorage.getItem(`examTaken_${currentStudent.code}_${subjectId}_${lessonId}`) || 'null');
        if (saved) {
            showToast('سبق لك أداء هذا الاختبار، تظهر لك نتيجتك المسجلة', 'warning');
            container.innerHTML = saved.passed ? renderFinalPassedPage(lesson, saved) : renderFinalFailedResultPage(lesson, saved);
            return;
        }
        localStorage.setItem(`examTaken_${currentStudent.code}_${subjectId}_${lessonId}`, JSON.stringify({
            passed, score, total: questions.length, percentage, t
        }));
        localStorage.setItem(`examResult_${currentStudent.code}_${subjectId}_${lessonId}`, JSON.stringify({
            passed, score, total: questions.length, percentage, t, subjectId, lessonId
        }));

        await sendToGoogleSheets(currentStudent, subjectId, lessonId, score, questions.length, percentage, 'final');

        if (passed) {
            container.innerHTML = renderFinalPassedPage(lesson, { score, total: questions.length, percentage, t });
        } else {
            container.innerHTML = renderFinalFailedPage(lesson, percentage);
        }
    };

    renderQuestionPage();
}

function formatTime(ms) {
    const total = Math.max(0, Math.floor(ms / 1000));
    const s = total % 60, m = Math.floor(total / 60);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function renderFinalPassedPage(lesson, data) {
    const grade = getGrade(data.percentage);
    return `
        <div class="result-container">
            <div class="result-icon success"><i class="fas fa-trophy"></i></div>
            <h2 style="color:var(--success);margin:10px 0;">مبروك! لقد اجتزت الاختبار</h2>
            <div class="result-score">${data.score} / ${data.total}</div>
            <div class="result-percentage">النسبة: ${data.percentage}%</div>
            <div class="result-grade ${grade.class}">${grade.name}</div>
            <div style="width:100%;background:#e0e0e0;border-radius:10px;height:20px;margin:20px 0;overflow:hidden;">
                <div style="width:${data.percentage}%;height:100%;background:var(--gradient-success);border-radius:10px;transition:width 1s ease;"></div>
            </div>
            <button class="btn btn-success btn-lg" onclick="generateCertificate('${currentSubject.id}', ${lesson.id})">
                <i class="fas fa-certificate"></i> تحميل الشهادة
            </button>
            <p style="color:var(--text-secondary);font-size:0.85rem;margin-top:8px;">
                <i class="fas fa-check-circle"></i> نتيجتك النهائية مسجلة في سجلك
            </p>
        </div>
    `;
}

function renderFinalFailedPage(lesson, percentage) {
    return `
        <div class="result-container">
            <div class="result-icon fail"><i class="fas fa-times-circle"></i></div>
            <h2 style="color:var(--danger);margin:10px 0;">لم تجتز الاختبار</h2>
            <p style="color:var(--text-secondary);">حصلت على ${percentage}% - نسبة النجاح المطلوبة ${lesson.finalExam.passScore || 60}%</p>
            <p style="color:var(--text-secondary);">يرجى مراجعة الدرس في المرة القادمة، وإعادة المحاولة لاحقاً</p>
            <button class="btn btn-primary btn-lg" onclick="location.href='${lessonPageUrl(currentSubject.id, lesson.id, 'lesson')}'">
                <i class="fas fa-book-reader"></i> العودة إلى شرح الدرس
            </button>
        </div>
    `;
}

function renderFinalFailedResultPage(lesson, data) {
    const grade = getGrade(data.percentage);
    return `
        <div class="result-container">
            <div class="result-icon fail"><i class="fas fa-times-circle"></i></div>
            <h2 style="color:var(--danger);margin:10px 0;">نتيجة الاختبار النهائي</h2>
            <div class="result-score">${data.score} / ${data.total}</div>
            <div class="result-percentage">النسبة: ${data.percentage}%</div>
            <div class="result-grade ${grade.class}">${grade.name}</div>
            <p class="final-exam-notice"><i class="fas fa-exclamation-circle"></i> لم تصل إلى نسبة النجاح المطلوبة (${(lesson.finalExam && lesson.finalExam.passScore) || 60}%)، لذا لا تتوفر شهادة اجتياز</p>
        </div>
    `;
}