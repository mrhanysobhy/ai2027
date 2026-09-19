// ═══════════════════════════════════════════════════════════
//                   توليد الشهادة (PDF)
// ═══════════════════════════════════════════════════════════

function generateCertificate(subjectId, lessonId) {
    if (!currentStudent) return;

    const subject = findSubject(subjectId);
    const lesson = getActiveLesson(subjectId, lessonId);
    const code = currentStudent.code;

    const result = getStoredFinalResult(code, subjectId, lessonId, lesson);
    // الشهادة تُنشأ فقط من نتيجة اجتياز مسجلة
    if (!result || !result.passed) return;

    const date = new Date(result.t || Date.now()).toLocaleDateString('ar-EG', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

    const certificate = document.getElementById('certificateContainer');
    if (!certificate) return;

    certificate.classList.remove('cert-hidden');
    certificate.innerHTML = `
        <div class="certificate" id="certificateElement">
            <div class="cert-inner">
                <div class="cert-org">
                    <div class="cert-org-side cert-org-right">
                        <span class="cert-org-ministry">${schoolInfo.ministry || ''}</span>
                        <span class="cert-org-directorate">${schoolInfo.directorate || ''}</span>
                        <span class="cert-org-admin">${schoolInfo.administration || ''}</span>
                        <span class="cert-org-school">${schoolInfo.schoolName || ''}</span>
                    </div>
                    <div class="cert-org-emblem">
                        <span class="cert-emblem-ring"><i class="fas fa-graduation-cap"></i></span>
                    </div>
                    <div class="cert-org-side cert-org-left">
                        <span class="cert-org-platform"><i class="fas fa-robot"></i> ${schoolInfo.platformName || ''}</span>
                    </div>
                </div>

                <div class="cert-divider">
                    <span class="cert-divider-rule"></span>
                    <span class="cert-divider-star"><i class="fas fa-star"></i></span>
                    <span class="cert-divider-rule"></span>
                </div>

                <div class="cert-header">
                    <h2 class="cert-title">شهادة إتمام وتفوق</h2>
                    <p class="cert-subtitle">لإتمام الاختبار بنجاح في ${schoolInfo.platformName || 'المدرسة'} — ${schoolInfo.className || ''}</p>
                </div>

                <div class="cert-meta">
                    <span class="cert-meta-chip"><i class="fas fa-book-open"></i> المادة: <strong>${subject.name}</strong></span>
                    <span class="cert-meta-chip"><i class="fas fa-list-ul"></i> الدرس: <strong>${lesson.title}</strong></span>
                    <span class="cert-meta-chip"><i class="fas fa-percentage"></i> النسبة: <strong>${result.percentage}%</strong></span>
                    <span class="cert-meta-chip"><i class="fas fa-medal"></i> التقدير: <strong>${getGrade(result.percentage).name}</strong></span>
                    ${result.examId ? `<span class="cert-meta-chip"><i class="fas fa-calendar-check"></i> الفترة: <strong>${result.examId}</strong></span>` : ''}
                    ${result.attempt ? `<span class="cert-meta-chip"><i class="fas fa-redo-alt"></i> المحاولة: <strong>${result.attempt}</strong></span>` : ''}
                </div>

                <div class="cert-student">
                    <p class="cert-student-line">تشهد إدارة المدرسة بأن الطالب/ة</p>
                    <h3 class="cert-student-name">${currentStudent.name}</h3>
                    <p class="cert-student-result">قد حصل على نسبة <strong>${result.percentage}%</strong> في الاختبار النهائي لمادة <strong>${subject.name}</strong> بمجموع <strong>${result.score}</strong> من <strong>${result.total}</strong> — تقدير <strong>${getGrade(result.percentage).name}</strong></p>
                </div>

                <div class="cert-auth">
                    <div class="cert-auth-block">
                        <div class="sign-line"></div>
                        <p>معلم المادة</p>
                        <p class="cert-auth-name">${schoolInfo.teacherName || ''}</p>
                    </div>
                    <div class="cert-seal">
                        <span class="cert-seal-circle"><i class="fas fa-certificate"></i></span>
                    </div>
                    <div class="cert-auth-block">
                        <div class="sign-line"></div>
                        <p>مدير المدرسة</p>
                        <p class="cert-auth-name">${schoolInfo.principalName || ''}</p>
                    </div>
                </div>

                <div class="cert-footer">
                    <span class="cert-footer-date"><i class="fas fa-calendar-day"></i> ${date}</span>
                    <span class="cert-footer-year">العام الدراسي ${schoolInfo.academicYear || ''}</span>
                </div>

                <span class="cert-corner cert-corner-tr"></span>
                <span class="cert-corner cert-corner-bl"></span>
            </div>
        </div>
        <div class="certificate-actions">
            <button class="btn btn-success" onclick="downloadCertificate()">
                <i class="fas fa-download"></i> تحميل الشهادة PDF
            </button>
            <button class="btn btn-outline-dark" onclick="closeCertificate()">
                <i class="fas fa-times"></i> إغلاق
            </button>
        </div>
    `;

    certificate.scrollIntoView({ behavior: 'smooth' });
}

async function downloadCertificate() {
    const element = document.getElementById('certificateElement');
    if (!element) return;
    if (typeof html2canvas !== 'function' || typeof window.jspdf === 'undefined') {
        showToast('مكتبة تحميل PDF غير متاحة، تأكد من الاتصال بالإنترنت', 'error');
        return;
    }
    showToast('جاري تحميل الشهادة...', 'success');
    try {
        const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
        const imgData = canvas.toDataURL('image/jpeg', 0.98);
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
        const pageW = pdf.internal.pageSize.getWidth();
        const pageH = pdf.internal.pageSize.getHeight();
        const ratio = Math.min(pageW / canvas.width, pageH / canvas.height);
        const w = canvas.width * ratio;
        const h = canvas.height * ratio;
        const x = (pageW - w) / 2;
        const y = (pageH - h) / 2;
        pdf.addImage(imgData, 'JPEG', x, y, w, h);
        pdf.save(`شهادة_${currentStudent.name}_${findSubject(currentSubject?.id || '')?.name || ''}.pdf`);
    } catch (e) {
        console.error('خطأ في توليد الشهادة:', e);
        showToast('تعذّر توليد الشهادة، حاول مرة أخرى', 'error');
    }
}

function closeCertificate() {
    const certificate = document.getElementById('certificateContainer');
    if (certificate) certificate.classList.add('cert-hidden');
}