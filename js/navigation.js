// ═══════════════════════════════════════════════════════════
//                   التنقل بين الصفحات
// ═══════════════════════════════════════════════════════════

function navigateTo(page, params) {
    if (page === 'home') {
        location.hash = '#home';
    } else if (page === 'subject') {
        if (!currentStudent) { showLoginModal(); return; }
        location.hash = '#subject/' + params;
    } else if (page === 'results') {
        if (!currentStudent) { showLoginModal(); return; }
        location.hash = '#results';
    }
}

function handleHashChange() {
    const hash = location.hash || '#home';
    const parts = hash.substring(1).split('/');

    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

    if (parts[0] === 'subject' && parts[1]) {
        if (!currentStudent) { showLoginModal(); location.hash = '#home'; return; }
        showSubjectPage(parts[1]);
    } else if (parts[0] === 'results') {
        if (!currentStudent) { showLoginModal(); location.hash = '#home'; return; }
        document.getElementById('page-results').classList.add('active');
        showResultsPage();
    } else {
        document.getElementById('page-home').classList.add('active');
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// روابط صفحات الدروس المستقلة
function lessonPageUrl(subjectId, lessonId, type) {
    const prefix = lessonPagesBase + '/' + subjectId + '/';
    switch (type) {
        case 'review':   return prefix + 'review-' + lessonId + '.html';
        case 'practice': return prefix + 'practice-' + lessonId + '.html';
        case 'final':    return prefix + 'final-' + lessonId + '.html';
        default:         return prefix + 'lesson-' + lessonId + '.html';
    }
}