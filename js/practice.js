// ═══════════════════════════════════════════════════════════
//                   الاختبار التجريبي
// ═══════════════════════════════════════════════════════════

// يعمل مع window.currentLesson إن وُجد، أو حسب subject/lessonId
function getActiveLesson(subjectId, lessonId) {
    if (window.currentLesson && window.currentLesson.id === lessonId) return window.currentLesson;
    const subject = findSubject(subjectId);
    return subject ? findLesson(subject, lessonId) : null;
}

function renderPracticeExamStart(lesson) {
    return `
        <div class="exam-container" id="practice-container-${lesson.id}">
            <div style="text-align:center;padding:30px;">
                <i class="fas fa-pencil-alt" style="font-size:4rem;color:var(--primary-light);margin-bottom:16px;display:block;"></i>
                <h3 style="color:var(--primary);margin-bottom:8px;">الاختبار التجريبي</h3>
                <p style="color:var(--text-secondary);margin-bottom:20px;">
                    ${(lesson.practiceExam.questions || []).length} أسئلة اختيار من متعدد - يمكنك إعادة الاختبار عدد غير محدود من المرات
                </p>
                <button class="btn btn-success btn-lg" onclick="startPracticeExam('${currentSubject.id}', ${lesson.id})">
                    <i class="fas fa-play"></i> ابدأ الاختبار التجريبي
                </button>
            </div>
        </div>
    `;
}

function startPracticeExam(subjectId, lessonId) {
    const lesson = getActiveLesson(subjectId, lessonId);
    if (!lesson || !lesson.practiceExam || !lesson.practiceExam.questions) return;

    // خلط الأسئلة
    const shuffled = shuffleArray(lesson.practiceExam.questions);

    const container = document.getElementById(`practice-container-${lessonId}`);
    if (!container) return;
    let currentQ = 0;
    const answers = new Array(shuffled.length).fill(null);
    let score = 0;

    function getStats() {
        const answered = answers.filter(a => a !== null).length;
        return { answered, unanswered: shuffled.length - answered };
    }

    function showQuestion() {
        const q = shuffled[currentQ];
        const stats = getStats();
        container.innerHTML = `
            <div class="exam-header">
                <div class="exam-progress">
                    <span>السؤال ${currentQ + 1} من ${shuffled.length}</span>
                    <div class="progress-bar-container">
                        <div class="progress-bar" style="width: ${((currentQ + 1) / shuffled.length) * 100}%"></div>
                    </div>
                </div>
            </div>
            <div class="exam-stats">
                <span class="exam-stat stat-answered"><i class="fas fa-check-circle"></i> أسئلة مجابة: <strong>${stats.answered}</strong></span>
                <span class="exam-stat stat-unanswered"><i class="fas fa-question-circle"></i> أسئلة غير مجابة: <strong>${stats.unanswered}</strong></span>
            </div>
            <div class="question-card">
                <div class="question-text">
                    <span class="q-num">${currentQ + 1}</span>
                    <span>${q.question}</span>
                </div>
                ${renderHintBox(q.hint)}
                <div class="options-list">
                    ${q.options.map((opt, i) => `
                        <div class="option-item ${answers[currentQ] === i ? 'selected' : ''}" onclick="selectPracticeOption(this, ${i})">
                            <span class="option-letter">${optionLetter(i)}</span>
                            <span>${opt}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
            <div class="exam-actions">
                ${currentQ > 0 ? `<button class="btn btn-outline-dark btn-lg" onclick="prevPracticeQuestion()"><i class="fas fa-arrow-right"></i> السابق</button>` : ''}
                <button class="btn btn-primary btn-lg" onclick="nextPracticeQuestion()">
                    ${currentQ < shuffled.length - 1 ? '<i class="fas fa-arrow-left"></i> التالي' : '<i class="fas fa-check-double"></i> إنهاء الاختبار'}
                </button>
            </div>
        `;
    }

    window.selectPracticeOption = function(el, optionIndex) {
        if (answers[currentQ] === optionIndex) return;
        answers[currentQ] = optionIndex;
        showQuestion();
    };

    window.prevPracticeQuestion = function() {
        if (currentQ > 0) {
            currentQ--;
            showQuestion();
        }
    };

    window.nextPracticeQuestion = function() {
        if (currentQ < shuffled.length - 1) {
            currentQ++;
            showQuestion();
        } else {
            showPracticeResult();
        }
    };

    function showPracticeResult() {
        score = 0;
        answers.forEach((ans, i) => {
            if (ans === shuffled[i].correct) score++;
        });

        const percentage = Math.round((score / shuffled.length) * 100);
        const grade = getGrade(percentage);

        container.innerHTML = `
            <div class="result-container">
                <div class="result-icon ${percentage >= 60 ? 'success' : 'fail'}">
                    <i class="fas ${percentage >= 60 ? 'fa-check-circle' : 'fa-times-circle'}"></i>
                </div>
                <div class="result-score">${score} / ${shuffled.length}</div>
                <div class="result-percentage">النسبة: ${percentage}%</div>
                <div class="result-grade ${grade.class}">${grade.name}</div>

                <div style="width:100%;background:#e0e0e0;border-radius:10px;height:20px;margin:20px 0;overflow:hidden;">
                    <div style="width:${percentage}%;height:100%;background:${percentage >= 60 ? 'var(--gradient-success)' : 'var(--danger)'};border-radius:10px;transition:width 1s ease;"></div>
                </div>

                <h3 style="margin:20px 0 10px;color:var(--primary);">مراجعة الإجابات:</h3>
                <div style="text-align:right;">
                    ${shuffled.map((q, i) => `
                        <div style="padding:12px;margin-bottom:8px;border-radius:8px;background:${answers[i] === q.correct ? '#e8f5e9' : '#ffebee'};">
                            <strong>س${i+1}:</strong> ${q.question}<br>
                            <span style="color:${answers[i] === q.correct ? 'var(--success)' : 'var(--danger)'};">
                                إجابتك: ${q.options[answers[i]] || 'لم تُجب'}
                                ${answers[i] === q.correct ? '✓' : `✗ (الصحيحة: ${q.options[q.correct]})`}
                            </span>
                        </div>
                    `).join('')}
                </div>

                <button class="btn btn-success btn-lg" style="margin-top:20px;" onclick="startPracticeExam('${subjectId}', ${lessonId})">
                    <i class="fas fa-redo"></i> إعادة الاختبار
                </button>
            </div>
        `;
    }

    showQuestion();
}