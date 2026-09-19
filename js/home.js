// ═══════════════════════════════════════════════════════════
//                   عرض كروت المواد (الصفحة الرئيسية)
// ═══════════════════════════════════════════════════════════

function renderSubjectsGrid() {
    const grid = document.getElementById('subjectsGrid');
    if (!grid) return;
    grid.innerHTML = subjects.map(subject => `
        <div class="subject-card" onclick="${currentStudent ? `navigateTo('subject','${subject.id}')` : 'showLoginModal()'}">
            ${!currentStudent ? `
                <div class="locked-overlay">
                    <i class="fas fa-lock"></i>
                    <p>سجل دخولك أولاً للوصول للمحتوى</p>
                </div>
            ` : ''}
            <div class="subject-card-header" style="background: ${subject.gradient};">
                <i class="fas ${subject.icon}"></i>
                <h3>${subject.name}</h3>
            </div>
            <div class="subject-card-body">
                <p>${subject.description}</p>
                <div class="subject-meta">
                    <span><i class="fas fa-book"></i> ${subject.contentCount || 0} درس</span>
                    <span><i class="fas fa-tasks"></i> ${subject.contentCount || 0} اختبار</span>
                    <span><i class="fas fa-arrow-left"></i> ابدأ التعلم</span>
                </div>
            </div>
        </div>
    `).join('');
}