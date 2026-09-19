// ═══════════════════════════════════════════════════════════
//                تهيئة التطبيق (index.html)
// ═══════════════════════════════════════════════════════════

(function() {
    // تهيئة البيانات
    if (!initAppData()) {
        console.error('فشل تحميل البيانات: تأكد من وجود js/data-bundle.js');
    }

    // تعبئة اسم المدرسة في الهيدر والفوتر
    document.querySelectorAll('.school-name, #schoolName, #schoolNameFooter').forEach(el => {
        if (el && schoolInfo.schoolName) el.textContent = schoolInfo.schoolName;
    });
    document.querySelectorAll('#platformName, #platformNameFooter').forEach(el => {
        if (el && schoolInfo.platformName) el.textContent = schoolInfo.platformName;
    });
    document.querySelectorAll('#administrationFooter').forEach(el => {
        if (el && schoolInfo.administration) el.textContent = schoolInfo.administration;
    });
    document.querySelectorAll('#teacherNameFooter').forEach(el => {
        if (el && schoolInfo.teacherName) el.textContent = schoolInfo.teacherName;
    });
    document.querySelectorAll('#academicYearFooter').forEach(el => {
        if (el && schoolInfo.academicYear) el.textContent = schoolInfo.academicYear;
    });

    // إحصائيات الصفحة الرئيسية (الدروس ذات المحتوى الفعلي فقط)
    const totalContentLessons = subjects.reduce((s, x) => s + (x.contentCount || 0), 0);
    document.getElementById('heroSubjectCount').textContent = subjects.length;
    document.getElementById('heroLessonCount').textContent = totalContentLessons;
    document.getElementById('heroExamCount').textContent = totalContentLessons;

    // فحص حالة تسجيل الدخول
    checkLoginState();

    // عرض المواد
    renderSubjectsGrid();

    // التحكم بالتنقل (hash routing)
    window.addEventListener('hashchange', handleHashChange);
    if (location.hash) handleHashChange();
    else document.getElementById('page-home').classList.add('active');
})();