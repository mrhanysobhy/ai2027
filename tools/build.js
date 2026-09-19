#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════
   Build tool: generates js/data-bundle.js + pages/** from data JSON
   Run:  node tools/build.js
   ═══════════════════════════════════════════════════════════ */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

function readJson(rel) {
    const p = path.join(ROOT, rel);
    if (!fs.existsSync(p)) return null;
    return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function writeFile(rel, content) {
    const p = path.join(ROOT, rel);
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, content, 'utf8');
}

// ═══════════════ 1) قراءة البيانات الأساسية ═══════════════
const config   = readJson('data/config.json')   || {};
const school   = readJson('data/school.json')   || {};
const students = readJson('data/students.json') || [];
const subjects = readJson('data/subjects.json') || [];

// ═══════════════ 2) توليد js/data-bundle.js ═══════════════
// حساب عدد الدروس ذات المحتوى الفعلي (غير placeholder) لكل مادة
subjects.forEach(subject => {
    subject.contentCount = subject.lessons.filter(lesson => {
        const rel = `data/lessons/${subject.id}/lesson-${lesson.id}.json`;
        const data = readJson(rel);
        return data && data.placeholder !== true;
    }).length;

    // تسريب معلومات فترة الاختبار النهائي (examId/availableFrom/availableTo)
    // إلى كائنات الدروس داخل الحزمة حتى تتطابق مفاتيح localStorage
    // بين |index.html (نتائج/شهادة) وصفحات الدروس (اداء الاختبار).
    subject.lessons.forEach(lesson => {
        const rel = `data/lessons/${subject.id}/lesson-${lesson.id}.json`;
        const data = readJson(rel);
        if (data && data.finalExam) {
            lesson.finalExam = {
                examId: data.finalExam.examId,
                availableFrom: data.finalExam.availableFrom,
                availableTo: data.finalExam.availableTo
            };
        }
    });
});

const appData = { config, school, students, subjects };
writeFile('js/data-bundle.js',
`// ═══════════════════════════════════════════════════════════
//   حزمة البيانات (مولّدة تلقائياً من ملفات data/*.json)
//   قم بتعديل ملفات JSON ثم أعد التشغيل: node tools/build.js
// ═══════════════════════════════════════════════════════════
window.APP_DATA = ${JSON.stringify(appData, null, 2)};
`);
console.log('[build] js/data-bundle.js ✓');

// ═══════════════ 3) توليد صفحات الدروس ═══════════════
let pageCount = 0;

subjects.forEach(subject => {
    subject.lessons.forEach(lesson => {
        const subjDir = `data/lessons/${subject.id}`;
        const relJson = `${subjDir}/lesson-${lesson.id}.json`;
        let lessonData = readJson(relJson);

        // إنشاء ملف JSON تجريبي إن لم يوجد
        if (!lessonData) {
            lessonData = { id: lesson.id, title: lesson.title, placeholder: true };
            writeFile(relJson, JSON.stringify(lessonData, null, 2));
            console.log(`[build] placeholder ${relJson} ✓`);
        }

        // تضمين بيانات المادة الخاصة بالصفحة
        const pageSubject = {
            id: subject.id,
            name: subject.name,
            icon: subject.icon,
            gradient: subject.gradient,
            description: subject.description
        };

        ['lesson', 'review', 'practice', 'final'].forEach(type => {
            const meta = {
                type,
                subjectId: subject.id,
                subject: pageSubject,
                lessonId: lesson.id,
                lesson: lessonData
            };
            const html = buildPageHtml(meta);
            const relOut = `pages/${subject.id}/${type}-${lesson.id}.html`;
            writeFile(relOut, html);
            pageCount++;
        });

        console.log(`[build] pages/${subject.id}/lesson-${lesson.id}..final-${lesson.id} (4) ✓`);
    });
});

function buildPageHtml(meta) {
    const subject = meta.subject;
    const lesson = meta.lesson;
    const pageTitle = `${lesson.title} - ${subject.name}`;

    return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${pageTitle} | ${school.platformName || 'AI Pioneers'}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
    <link rel="stylesheet" href="../../css/base.css">
    <link rel="stylesheet" href="../../css/layout.css">
    <link rel="stylesheet" href="../../css/components.css">
    <link rel="stylesheet" href="../../css/content.css">
    <link rel="stylesheet" href="../../css/exam.css">
    <link rel="stylesheet" href="../../css/results.css">
    <link rel="stylesheet" href="../../css/certificate.css">
    <link rel="stylesheet" href="../../css/responsive.css">
</head>
<body>
    <header class="header">
        <div class="container header-container">
            <div class="logo" onclick="location.href='../../index.html'">
                <i class="fas fa-graduation-cap"></i>
                <span><span class="school-name">${school.schoolName || ''}</span><small>${school.platformName || ''}</small></span>
            </div>
            <div class="header-actions">
                <button id="headerLogoutBtn" class="btn btn-outline" onclick="logoutFromLessonPage()" style="display:none">
                    <i class="fas fa-sign-out-alt"></i> خروج
                </button>
                <a class="btn btn-outline" href="../../index.html#results">
                    <i class="fas fa-chart-bar"></i> نتائجي
                </a>
                <a class="btn btn-outline" href="../../index.html">
                    <i class="fas fa-home"></i> الرئيسية
                </a>
            </div>
        </div>
    </header>

    <main class="main-content">
        <div class="container">
            <div id="pageHeader"></div>
            <div id="pageTabs" class="nav-tabs"></div>
            <div id="pageContent" class="page-content-stub"></div>
        </div>
    </main>

    <footer class="footer">
        <div class="container">
            <p>${school.platformName || ''} © 2026 جميع الحقوق محفوظة | ${school.academicYear ? 'العام الدراسي ' + school.academicYear : ''}</p>
            <p><i class="fas fa-building"></i> ${school.schoolName || ''}</p>
        </div>
    </footer>

    <div class="toast" id="toast">
        <i class="fas fa-check-circle"></i>
        <span id="toastMsg"></span>
    </div>

    <div id="certificateContainer" class="cert-hidden"></div>

    <script>window.PAGE_DATA = ${JSON.stringify(meta)};</script>
    <script src="../../js/data-bundle.js"></script>
    <script src="../../js/utils.js"></script>
    <script src="../../js/data.js"></script>
    <script src="../../js/auth.js"></script>
    <script src="../../js/review.js"></script>
    <script src="../../js/practice.js"></script>
    <script src="../../js/final.js"></script>
    <script src="../../js/sheets.js"></script>
    <script src="../../js/certificate.js"></script>
    <script src="../../js/lesson-page.js"></script>
</body>
</html>
`;
}

console.log(`[build] تم توليد ${pageCount} صفحة دروس`);
console.log('[build] اكتمل البناء بنجاح');