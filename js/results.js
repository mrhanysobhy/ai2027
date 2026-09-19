// ═══════════════════════════════════════════════════════════
//                   صفحة النتائج
// ═══════════════════════════════════════════════════════════

function showResultsPage() {
    if (!currentStudent) return;

    const code = currentStudent.code;
    const container = document.getElementById('resultsContent');
    if (!container) return;

    const results = [];
    subjects.forEach(subject => {
        subject.lessons.forEach(lesson => {
            const saved = JSON.parse(localStorage.getItem(`examResult_${code}_${subject.id}_${lesson.id}`) || 'null');
            if (saved) {
                results.push({
                    subject: subject.name,
                    subjectIcon: subject.icon,
                    subjectGradient: subject.gradient,
                    lessonTitle: lesson.title,
                    lessonId: lesson.id,
                    percentage: saved.percentage,
                    score: saved.score,
                    total: saved.total,
                    passed: saved.passed,
                    t: saved.t || 0,
                    subjectId: subject.id
                });
            }
        });
    });

    // خريطة تقدم الطالب
    renderStudentProgress();

    if (!results.length) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-inbox"></i>
                <h3>لا توجد نتائج بعد</h3>
                <p>أكمل الاختبارات النهائية للدروس لتظهر نتائجك هنا</p>
                <button class="btn btn-primary" onclick="navigateTo('home')">
                    <i class="fas fa-book-open"></i> ابدأ التعلم
                </button>
            </div>
        `;
        return;
    }

    results.sort((a, b) => b.t - a.t);

    container.innerHTML = `
        <div class="results-stats">
            <div class="stat-card">
                <div class="stat-icon blue"><i class="fas fa-book-open"></i></div>
                <div class="stat-info"><span class="stat-number">${results.length}</span><span>الامتحانات المكتملة</span></div>
            </div>
            <div class="stat-card">
                <div class="stat-icon green"><i class="fas fa-check-circle"></i></div>
                <div class="stat-info"><span class="stat-number">${results.filter(r => r.passed).length}</span><span>اجتزت بنجاح</span></div>
            </div>
            <div class="stat-card">
                <div class="stat-icon orange"><i class="fas fa-percentage"></i></div>
                <div class="stat-info"><span class="stat-number">${Math.round(results.reduce((s, r) => s + r.percentage, 0) / results.length)}%</span><span>متوسط النتائج</span></div>
            </div>
            <div class="stat-card">
                <div class="stat-icon red"><i class="fas fa-trophy"></i></div>
                <div class="stat-info"><span class="stat-number">${results.filter(r => r.percentage >= 90).length}</span><span>تقدير ممتاز</span></div>
            </div>
        </div>
        <div class="results-list">
            ${results.map(r => `
                <div class="result-item ${r.passed ? 'passed' : 'failed'}">
                    <div class="result-subject-icon" style="background: ${r.subjectGradient};">
                        <i class="fas ${r.subjectIcon}"></i>
                    </div>
                    <div class="result-details">
                        <h4>${r.subject} - ${r.lessonTitle}</h4>
                        <p>الدرجة: ${r.score} من ${r.total} | التاريخ: ${new Date(r.t).toLocaleDateString('ar-EG')}</p>
                        <div class="result-bar">
                            <div style="width:${r.percentage}%;background:${r.passed ? 'var(--gradient-success)' : 'var(--danger)'};"></div>
                        </div>
                    </div>
                    <div class="result-info">
                        <span class="result-percent">${r.percentage}%</span>
                        <span class="result-status ${r.passed ? 'passed' : 'failed'}">${r.passed ? 'ناجح ✓' : 'راسب ✗'}</span>
                    </div>
                    <button class="btn ${r.passed ? 'btn-success' : 'btn-outline-dark'} btn-sm" onclick="generateCertificate('${r.subjectId}', ${r.lessonId})">
                        <i class="fas fa-certificate"></i> شهادة
                    </button>
                </div>
            `).join('')}
        </div>
    `;
}

function renderStudentProgress() {
    const progressContainer = document.getElementById('studentProgress');
    if (!progressContainer) return;

    let completed = 0;
    let passed = 0;
    subjects.forEach(subject => {
        subject.lessons.forEach(lesson => {
            const saved = JSON.parse(localStorage.getItem(`examResult_${currentStudent.code}_${subject.id}_${lesson.id}`) || 'null');
            if (saved) {
                completed++;
                if (saved.passed) passed++;
            }
        });
    });

    progressContainer.innerHTML = `
        <div class="progress-header">
            <h3>التقدم الدراسي</h3>
            <span class="progress-count">${completed}/${subjects.reduce((s, x) => s + x.lessons.length, 0)} اختبار مكتمل</span>
        </div>
        <div class="progress-bar-container">
            <div class="progress-bar" style="width: ${subjects.reduce((s, x) => s + x.lessons.length, 0) ? (passed / subjects.reduce((s, x) => s + x.lessons.length, 0)) * 100 : 0}%"></div>
        </div>
        <p class="progress-note"><i class="fas fa-check-circle"></i> تم اجتياز ${passed} اختباراً بنجاح</p>
    `;
}