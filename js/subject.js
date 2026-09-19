// ═══════════════════════════════════════════════════════════
//                   صفحة المادة (عرض الدروس)
// ═══════════════════════════════════════════════════════════

function showSubjectPage(subjectId) {
    currentSubject = findSubject(subjectId);
    if (!currentSubject) { location.hash = '#home'; return; }

    document.getElementById('page-subject').classList.add('active');
    document.getElementById('breadcrumbSubject').textContent = currentSubject.name;

    // Header المادة
    document.getElementById('subjectHeader').innerHTML = `
        <div class="subject-header-icon" style="background: ${currentSubject.gradient};">
            <i class="fas ${currentSubject.icon}"></i>
        </div>
        <div class="subject-header-info">
            <h2>${currentSubject.name}</h2>
            <p>${currentSubject.description}</p>
            <span style="color: var(--text-secondary); font-size: 0.85rem;">
                <i class="fas fa-book-open"></i> ${currentSubject.contentCount || 0} درس |
                <i class="fas fa-user-graduate"></i> ${schoolInfo.className} |
                <i class="fas fa-calendar"></i> ${schoolInfo.academicYear}
            </span>
        </div>
    `;

    // قائمة الدروس
    renderLessonsList();
}

function renderLessonsList() {
    const list = document.getElementById('lessonsList');
    if (!list) return;
    list.innerHTML = currentSubject.lessons.map(lesson => `
        <div class="lesson-item">
            <div class="lesson-header">
                <div class="lesson-header-right">
                    <div class="lesson-number" style="background: ${currentSubject.gradient};">${lesson.id}</div>
                    <span class="lesson-title">${lesson.title}</span>
                </div>
                <span class="lesson-toggle"><i class="fas fa-arrow-left"></i></span>
            </div>
            <div class="lesson-page-actions">
                <a class="btn btn-primary" href="${lessonPageUrl(currentSubject.id, lesson.id, 'lesson')}">
                    <i class="fas fa-book-reader"></i> الشرح
                </a>
                <a class="btn btn-outline-dark" href="${lessonPageUrl(currentSubject.id, lesson.id, 'review')}">
                    <i class="fas fa-clipboard-check"></i> المراجعة
                </a>
                <a class="btn btn-success" href="${lessonPageUrl(currentSubject.id, lesson.id, 'practice')}">
                    <i class="fas fa-pencil-alt"></i> اختبار تجريبي
                </a>
                <a class="btn btn-danger" href="${lessonPageUrl(currentSubject.id, lesson.id, 'final')}">
                    <i class="fas fa-file-alt"></i> اختبار نهائي
                </a>
            </div>
        </div>
    `).join('');
}