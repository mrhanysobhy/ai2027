// ═══════════════════════════════════════════════════════════
//                   إرسال النتائج إلى Google Sheets
// ═══════════════════════════════════════════════════════════

async function sendToGoogleSheets(student, subjectId, lessonId, score, total, percentage, examType, examId, attempt, passed) {
    if (!SHEET_URL || SHEET_URL === "GOOGLE_APPS_SCRIPT_URL_HERE") {
        console.log('تم حفظ النتيجة محلياً (لم يتم تعيين رابط Google Sheets بعد)');
        return;
    }

    const subject = findSubject(subjectId);
    const lesson = findLesson(subject, lessonId);

    const payload = {
        studentCode: student.code,
        studentName: student.name,
        subject: subject ? subject.name : subjectId,
        lesson: lesson ? lesson.title : ('درس ' + lessonId),
        examType: examType,
        examId: examId || '',
        attempt: attempt || 1,
        passed: !!passed,
        score: score,
        total: total,
        percentage: percentage,
        date: new Date().toLocaleDateString('ar-EG')
    };

    try {
        const response = await fetch(SHEET_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify(payload)
        });
        console.log('تم إرسال النتيجة إلى Google Sheets:', payload);
        return response;
    } catch (e) {
        console.error('فشل إرسال النتيجة إلى Google Sheets:', e);
    }
}