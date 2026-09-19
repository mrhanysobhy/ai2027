// ═══════════════════════════════════════════════════════════
//           تهيئة صفحات الدروس المستقلة (pages/...)
// ═══════════════════════════════════════════════════════════

(function() {
    if (!window.PAGE_DATA) return;

    const { type, subjectId, lessonId } = PAGE_DATA;
    let subject = PAGE_DATA.subject;
    let lesson = PAGE_DATA.lesson;

    initAppData();
    currentSubject = subject;

    // داخل صفحة الدرس: الروابط بين الدروس تكون نسبية (ملفات مجاورة)
    window.lessonPageUrl = function(subjectId, lessonId, type) {
        return type + '-' + lessonId + '.html';
    };

    // تمديد الدرس التجريبي بمحتوى placeholder إن لزم
    if (lesson && lesson.placeholder) {
        lesson = createPlaceholderLesson(lesson.id, lesson.title, subject.name);
    }
    window.currentLesson = lesson;

    // تعبئة الهيدر
    document.querySelectorAll('.school-name').forEach(el => {
        if (schoolInfo.schoolName) el.textContent = schoolInfo.schoolName;
    });

    // فحص تسجيل الدخول
    checkLoginState();
    if (!currentStudent) {
        location.replace('../../index.html');
        return;
    }
    document.getElementById('headerLogoutBtn').style.display = 'inline-flex';

    // عنوان الصفحة
    document.title = `${lesson.title} - ${subject.name} | ${schoolInfo.platformName || 'AI Pioneers'}`;

    // ترويسة الدرس
    const headerEl = document.getElementById('pageHeader');
    if (headerEl) {
        headerEl.innerHTML = `
            <div class="subject-header">
                <div class="subject-header-icon" style="background: ${subject.gradient}">
                    <i class="fas ${subject.icon}"></i>
                </div>
                <div class="subject-header-info">
                    <h2>${subject.name} - الدرس ${lessonId}</h2>
                    <p>${lesson.title}</p>
                </div>
            </div>
        `;
    }

    // التبويبات (روابط لصفحات الدرس الأخرى)
    const tabsEl = document.getElementById('pageTabs');
    if (tabsEl) {
        const tabTypes = [
            { key: 'lesson', label: 'الشرح', icon: 'fa-book-reader' },
            { key: 'review', label: 'المراجعة', icon: 'fa-clipboard-check' },
            { key: 'practice', label: 'اختبار تجريبي', icon: 'fa-pencil-alt' },
            { key: 'final', label: 'اختبار نهائي', icon: 'fa-file-alt' }
        ];
        tabsEl.innerHTML = tabTypes.map(t => `
            <span class="nav-tab ${t.key === type ? 'active' : ''}" ${t.key !== type ? `onclick="location.href='${t.key}-${lessonId}.html'"` : ''}>
                <i class="fas ${t.icon}"></i> ${t.label}
            </span>
        `).join('');
    }

    // المحتوى
    const contentEl = document.getElementById('pageContent');
    if (!contentEl) return;

    if (type === 'lesson') {
        const content = (lesson.explanation && lesson.explanation.content) ||
            `<div class="empty-state"><i class="fas fa-book"></i><h3>الدرس قيد التحضير</h3></div>`;
        contentEl.innerHTML = `<div class="explanation-content">${content}</div>`;
    } else if (type === 'review') {
        contentEl.innerHTML = renderReview(lesson);
    } else if (type === 'practice') {
        contentEl.innerHTML = renderPracticeExamStart(lesson);
    } else if (type === 'final') {
        contentEl.innerHTML = renderFinalExamStatus(lesson);
    }
})();

function logoutFromLessonPage() {
    logout();
    location.href = '../../index.html';
}