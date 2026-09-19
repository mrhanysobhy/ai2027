// ═══════════════════════════════════════════════════════════
//                   إدارة البيانات
// ═══════════════════════════════════════════════════════════

// البيانات محمّلة من ملفات data/*.json عبر data-bundle.js
// APP_DATA = { config, school, students, subjects }

let SHEET_URL = "GOOGLE_APPS_SCRIPT_URL_HERE";
let schoolInfo = {};
let students = [];
let subjects = [];
let lessonPagesBase = "pages"; // مجلد صفحات الدروس

function initAppData() {
    if (!window.APP_DATA) return false;
    if (APP_DATA.config && APP_DATA.config.sheetUrl) SHEET_URL = APP_DATA.config.sheetUrl;
    schoolInfo = APP_DATA.school || {};
    students = APP_DATA.students || [];
    subjects = APP_DATA.subjects || [];
    return true;
}

function findSubject(subjectId) {
    return subjects.find(s => s.id === subjectId) || null;
}

function findLesson(subject, lessonId) {
    return subject.lessons.find(l => l.id === lessonId) || null;
}