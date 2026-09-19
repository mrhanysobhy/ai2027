// ═══════════════════════════════════════════════════════════
//                   المراجعة (أسئلة تفاعلية)
// يختار الطالب إجابته ثم يظهر له: صحيحة / خاطئة + الحل والشرح
// ═══════════════════════════════════════════════════════════

let reviewQuestions = [];

function renderReview(lesson) {
    const questions = (lesson.review && lesson.review.questions) ? lesson.review.questions : [];
    if (!questions.length) return '<div class="empty-state"><i class="fas fa-clipboard-check"></i><h3>لا توجد أسئلة مراجعة بعد</h3></div>';

    reviewQuestions = questions;

    return `<div class="review-questions">
        ${questions.map((q, i) => renderReviewQuestion(q, i)).join('')}
        <p class="review-no-score"><i class="fas fa-info-circle"></i> هذه الأسئلة للمراجعة فقط دون درجات</p>
    </div>`;
}

function renderReviewQuestion(q, i) {
    if (q.type === 'mcq') {
        return `
            <div class="review-item">
                <div class="review-question">
                    <span class="q-num">${i+1}</span>
                    <span>${q.question}</span>
                </div>
                ${renderHintBox(q.hint)}
                <div class="review-options">
                    ${q.options.map((opt, oi) => `
                        <div class="review-option" onclick="checkReviewAnswer(this, ${i}, ${oi})">
                            <span>${optionLetter(oi)}) </span>
                            <span>${opt}</span>
                        </div>
                    `).join('')}
                </div>
                <div class="review-feedback"></div>
                <div class="review-answer">
                    <i class="fas fa-lightbulb"></i>
                    <span>${q.explanation || ''}</span>
                </div>
            </div>
        `;
    }
    if (q.type === 'truefalse') {
        return `
            <div class="review-item">
                <div class="review-question">
                    <span class="q-num">${i+1}</span>
                    <span>${q.question}</span>
                </div>
                ${renderHintBox(q.hint)}
                <div class="review-options">
                    <div class="review-option" onclick="checkReviewAnswer(this, ${i}, ${q.correct ? 0 : 1})">
                        <span>صح ✓</span>
                    </div>
                    <div class="review-option" onclick="checkReviewAnswer(this, ${i}, ${q.correct ? 1 : 0})">
                        <span>خطأ ✗</span>
                    </div>
                </div>
                <div class="review-feedback"></div>
                <div class="review-answer">
                    <i class="fas fa-lightbulb"></i>
                    <span>${q.explanation || ''}</span>
                </div>
            </div>
        `;
    }
    if (q.type === 'complete') {
        return `
            <div class="review-item">
                <div class="review-question">
                    <span class="q-num">${i+1}</span>
                    <span>أكمل: ${q.question}</span>
                </div>
                ${renderHintBox(q.hint)}
                <div class="review-fill">
                    <input type="text" class="review-input" placeholder="اكتب إجابتك هنا...">
                    <button class="btn btn-primary btn-sm" onclick="checkReviewComplete(this, ${i})">
                        <i class="fas fa-check"></i> تحقق من الإجابة
                    </button>
                </div>
                <div class="review-feedback"></div>
                <div class="review-answer">
                    <i class="fas fa-check-circle"></i>
                    <span><strong>الإجابة:</strong> ${q.answer}</span>
                    ${q.explanation ? `<br><span>${q.explanation}</span>` : ''}
                </div>
            </div>
        `;
    }
    return '';
}

function checkReviewAnswer(el, qIndex, optionIndex) {
    const q = reviewQuestions[qIndex];
    if (!q || q._answered) return;
    q._answered = true;

    const item = el.closest('.review-item');
    const options = item.querySelectorAll('.review-option');
    const correctIndex = q.type === 'truefalse' ? (q.correct ? 0 : 1) : q.correct;
    const isCorrect = optionIndex === correctIndex;

    options.forEach(o => o.style.pointerEvents = 'none');

    const feedback = item.querySelector('.review-feedback');
    if (isCorrect) {
        el.classList.add('correct');
        const check = document.createElement('i');
        check.className = 'fas fa-check-circle';
        check.style.marginRight = 'auto';
        check.style.color = 'var(--success)';
        el.appendChild(check);
        feedback.className = 'review-feedback success';
        feedback.innerHTML = '<i class="fas fa-check-circle"></i> إجابة صحيحة!';
    } else {
        el.classList.add('wrong');
        const wrong = document.createElement('i');
        wrong.className = 'fas fa-times-circle';
        wrong.style.marginRight = 'auto';
        wrong.style.color = 'var(--danger)';
        el.appendChild(wrong);
        const correctEl = options[correctIndex];
        if (correctEl) {
            correctEl.classList.add('correct');
            const check = document.createElement('i');
            check.className = 'fas fa-check-circle';
            check.style.marginRight = 'auto';
            check.style.color = 'var(--success)';
            correctEl.appendChild(check);
        }
        feedback.className = 'review-feedback fail';
        feedback.innerHTML = '<i class="fas fa-times-circle"></i> إجابة خاطئة';
    }

    const answer = item.querySelector('.review-answer');
    if (answer) answer.classList.add('revealed');
}

function checkReviewComplete(btn, qIndex) {
    const q = reviewQuestions[qIndex];
    if (!q || q._answered) return;
    q._answered = true;

    const item = btn.closest('.review-item');
    const input = item.querySelector('.review-input');
    const studentAnswer = (input.value || '').trim().toLowerCase();
    const correctAnswer = (typeof q.answer === 'string' ? q.answer : '').trim().toLowerCase();
    const isCorrect = studentAnswer !== '' && studentAnswer === correctAnswer;

    const feedback = item.querySelector('.review-feedback');
    feedback.className = 'review-feedback ' + (isCorrect ? 'success' : 'fail');
    feedback.innerHTML = isCorrect
        ? '<i class="fas fa-check-circle"></i> إجابة صحيحة!'
        : '<i class="fas fa-times-circle"></i> إجابة خاطئة';

    btn.disabled = true;
    input.disabled = true;
    input.classList.add(isCorrect ? 'correct' : 'wrong');

    if (!isCorrect) {
        const correctEl = document.createElement('div');
        correctEl.className = 'review-correct-answer';
        correctEl.innerHTML = `<i class="fas fa-check-circle"></i> الإجابة الصحيحة: <strong>${q.answer}</strong>`;
        feedback.after(correctEl);
    }

    const answer = item.querySelector('.review-answer');
    if (answer) answer.classList.add('revealed');
}