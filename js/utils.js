// ═══════════════════════════════════════════════════════════
//                   دوال مساعدة عامة
// ═══════════════════════════════════════════════════════════

function getGrade(percentage) {
    if (percentage >= 90) return { name: 'ممتاز', class: 'grade-excellent' };
    if (percentage >= 80) return { name: 'جيد جداً', class: 'grade-vgood' };
    if (percentage >= 70) return { name: 'جيد', class: 'grade-good' };
    if (percentage >= 60) return { name: 'مقبول', class: 'grade-pass' };
    return { name: 'راسب', class: 'grade-fail' };
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const msg = document.getElementById('toastMsg');
    if (!toast || !msg) return;
    toast.className = `toast show toast-${type}`;
    toast.querySelector('i').className = `fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}`;
    msg.textContent = message;
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// دالة لإنشاء محتوى placeholder للدروس
function createPlaceholderLesson(id, title, subjectName) {
    return {
        id: id,
        title: title,
        explanation: {
            content: `
                <h2>${title}</h2>
                <div class="info-box"><p>هذا المحتوى تجريبي للدرس ${id} - ${title}. سيتم إضافة المحتوى الفعلي لاحقاً.</p></div>
                <h3>مقدمة</h3>
                <p>محتوى تجريبي للشرح. يتم هنا عرض شرح مفصل عن ${title} في مادة ${subjectName}.</p>
                <h3>النقاط الرئيسية</h3>
                <ul>
                    <li>النقطة الأولى - سيتم إضافة المحتوى</li>
                    <li>النقطة الثانية - سيتم إضافة المحتوى</li>
                    <li>النقطة الثالثة - سيتم إضافة المحتوى</li>
                </ul>
                <div class="warning-box"><strong>ملاحظة:</strong> هذا محتوى تجريبي وسيتم تحديثه.</div>
            `
        },
        review: {
            questions: [
                { type: "mcq", question: `سؤال مراجعة تجريبي 1 عن ${title}؟`, options: ["الإجابة الصحيحة", "إجابة خاطئة 1", "إجابة خاطئة 2", "إجابة خاطئة 3"], correct: 0, explanation: "شرح الإجابة التجريبي." },
                { type: "truefalse", question: `عبارة تجريبية عن ${title} صحيحة.`, correct: true, explanation: "شرح تجريبي." },
                { type: "complete", question: `________  هو موضوع الدرس ${id}.`, answer: title }
            ]
        },
        practiceExam: {
            questions: Array.from({length: 10}, (_, i) => ({
                question: `سؤال تجريبي ${i+1} في درس ${title}؟`,
                options: ["الخيار الصحيح", "خيار خاطئ أ", "خيار خاطئ ب", "خيار خاطئ ج"],
                correct: 0
            }))
        },
        finalExam: {
            availableFrom: "2025-07-01",
            availableTo: "2025-07-30",
            duration: 30,
            questions: Array.from({length: 20}, (_, i) => ({
                question: `سؤال نهائي ${i+1} في درس ${title}؟`,
                options: ["الإجابة الصحيحة", "إجابة خاطئة 1", "إجابة خاطئة 2", "إجابة خاطئة 3"],
                correct: 0
            }))
        }
    };
}

// دالة فرز/خلط عشوائي
function shuffleArray(array) {
    return [...array].sort(() => Math.random() - 0.5);
}

// حرف الخيار في الأسئلة (أ، ب، ج، د...)
function optionLetter(i) {
    const letters = ['أ', 'ب', 'ج', 'د', 'هـ', 'و', 'ز', 'ح'];
    return letters[i] !== undefined ? letters[i] : ('خيار ' + (i + 1));
}

// صندوق التلميح (يظهر عند الضغط على زر "تلميح")
function renderHintBox(hint) {
    if (!hint) return '';
    return `
        <div class="hint-box">
            <button type="button" class="hint-toggle" onclick="toggleHint(this)">
                <i class="fas fa-lightbulb"></i> تلميح
            </button>
            <div class="hint-content">${hint}</div>
        </div>
    `;
}

function toggleHint(btn) {
    btn.closest('.hint-box').classList.toggle('show');
}