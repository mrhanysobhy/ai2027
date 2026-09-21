/* ═══════════════════════════════════════════════════════════
   AI Pioneers — توليد الشهادة PDF
   ═══════════════════════════════════════════════════════════
   - نفس تصميم الشهادة الذهبية الأصلية.
   - يتم الالتقاط بـ html2canvas-pro (يجيد تشكيل الحروف العربية
     المتّصلة — حل مشكلة تقطيع الأحرف في النسخ السابقة).
   - التصدير إلى PDF أفقي A4 عبر jsPDF.
   ═══════════════════════════════════════════════════════════ */

// سياق الشهادة الحالي
let CERT = null;

// بناء محتوى الشهادة من سياق
function certHtml(ctx) {
  const g = getGrade(ctx.percentage);
  const date = ctx.dateLabel || fd(ctx.date || Date.now());
  return `
    <div class="certificate" id="certEl">
      <div class="cert-inner">
        <div class="cert-org">
          <div class="cert-org-side cert-org-right">
            <span class="cert-org-ministry">${SCH.ministry || ''}</span>
            <span class="cert-org-directorate">${SCH.directorate || ''}</span>
            <span class="cert-org-admin">${SCH.administration || ''}</span>
            <span class="cert-org-school">${SCH.schoolName || ''}</span>
          </div>
          <div class="cert-org-emblem">
            <span class="cert-emblem-ring"><i class="fas fa-graduation-cap"></i></span>
          </div>
          <div class="cert-org-side cert-org-left">
            <span class="cert-org-platform"><i class="fas fa-robot"></i> ${SCH.platformName || ''}</span>
          </div>
        </div>

        <div class="cert-divider">
          <span class="cert-divider-rule"></span>
          <span class="cert-divider-star"><i class="fas fa-star"></i></span>
          <span class="cert-divider-rule"></span>
        </div>

        <div class="cert-header">
          <h2 class="cert-title">شهادة إتمام وتفوق</h2>
          <p class="cert-subtitle">لإتمام الاختبار بنجاح في ${SCH.platformName || 'المدرسة'} — ${SCH.className || ''}</p>
        </div>

        <div class="cert-meta">
          <span class="cert-meta-chip"><i class="fas fa-book-open"></i> المادة: <strong>${ctx.subjectName}</strong></span>
          <span class="cert-meta-chip"><i class="fas fa-list-ul"></i> الدرس: <strong>${ctx.lessonTitle}</strong></span>
          <span class="cert-meta-chip"><i class="fas fa-percentage"></i> النسبة: <strong>${ctx.percentage}%</strong></span>
          <span class="cert-meta-chip"><i class="fas fa-medal"></i> التقدير: <strong>${g.name}</strong></span>
          ${ctx.examId ? `<span class="cert-meta-chip"><i class="fas fa-calendar-check"></i> الفترة: <strong>${ctx.examId}</strong></span>` : ''}
          ${ctx.attempt ? `<span class="cert-meta-chip"><i class="fas fa-redo-alt"></i> المحاولة: <strong>${ctx.attempt}</strong></span>` : ''}
        </div>

        <div class="cert-student">
          <p class="cert-student-line">تشهد إدارة المدرسة بأن الطالب/ة</p>
          <h3 class="cert-student-name">${ctx.studentName}</h3>
          <p class="cert-student-result">قد حصل على نسبة <strong>${ctx.percentage}%</strong> في الاختبار النهائي لمادة <strong>${ctx.subjectName}</strong> بمجموع <strong>${ctx.score}</strong> من <strong>${ctx.total}</strong> — تقدير <strong>${g.name}</strong></p>
        </div>

        <div class="cert-auth">
          <div class="cert-auth-block">
            <div class="sign-line"></div>
            <p>معلم المادة</p>
            <p class="cert-auth-name">${SCH.teacherName || ''}</p>
          </div>
          <div class="cert-seal">
            <span class="cert-seal-circle"><i class="fas fa-certificate"></i></span>
          </div>
          <div class="cert-auth-block">
            <div class="sign-line"></div>
            <p>مدير المدرسة</p>
            <p class="cert-auth-name">${SCH.principalName || ''}</p>
          </div>
        </div>

        <div class="cert-footer">
          <span class="cert-footer-date"><i class="fas fa-calendar-day"></i> ${date}</span>
          <span class="cert-footer-year">العام الدراسي ${SCH.academicYear || ''}</span>
        </div>

        <span class="cert-corner cert-corner-tr"></span>
        <span class="cert-corner cert-corner-bl"></span>
      </div>
    </div>
  `;
}

// صفحة الشهادة كاملة (تُعرض داخل #app) مع أزرار التنزيل/الطباعة/الرجوع
function certPageHtml(ctx, backHash) {
  return `
    ${certHtml(ctx)}
    <div class="certificate-actions noprint">
      <button class="btn ok" onclick="downloadCertificate()"><i class="fas fa-download"></i> تحميل الشهادة PDF</button>
      <button class="btn" onclick="window.print()"><i class="fas fa-print"></i> طباعة</button>
      <a class="btn" href="${backHash || '#results'}"><i class="fas fa-arrow-right"></i> رجوع</a>
    </div>
  `;
}

// فتح شهادة طالب (من نتيجة ناجحة محفوظة)
function studentCertView(sid, lid) {
  if (!me) { location.hash = '#home'; return ''; }
  const sbj = sub(sid);
  const entry = lessonEntry(sbj, lid);
  const lesson = lessonContent(sbj, lid);
  const r = getStoredResult(me.code, sid, lid, lesson);
  if (!r || !r.passed || !entry) {
    toast('الشهادة متاحة للناجحين فقط', 'err');
    location.hash = '#results';
    return '';
  }
  CERT = {
    studentName: me.name,
    subjectName: sbj.name,
    lessonTitle: entry.title,
    percentage: r.percentage,
    score: r.score,
    total: r.total,
    attempt: r.attempt,
    examId: r.examId,
    date: r.t || Date.now()
  };
  return certPageHtml(CERT, '#results');
}

// فتح شهادة من سجل (لوحة الإدارة)
function recordCertView(row) {
  CERT = {
    studentName: row.studentName || '',
    subjectName: row.subject || '',
    lessonTitle: row.lesson || '',
    percentage: row.percentage || 0,
    score: row.score || 0,
    total: row.total || 0,
    attempt: row.attempt || 1,
    examId: row.examId || '',
    date: row.date || Date.now()
  };
  return certPageHtml(CERT, '#admin');
}

// تنزيل الشهادة PDF عبر html2canvas-pro + jsPDF
async function downloadCertificate() {
  const el = $('certEl');
  if (!el) return;
  const h2c = window.html2canvas;      // html2canvas-pro يُصدّر بنفس الاسم
  if (typeof h2c !== 'function' || typeof window.jspdf === 'undefined') {
    toast('مكتبة توليد PDF غير متاحة — تحقق من اتصال الإنترنت', 'err');
    return;
  }
  toast('جاري توليد الشهادة...', 'ok');
  try {
    // ارتفاع ثابت (أفقي A4) يضمن عدم قصّ التذييل
    const width = 1056; // ~ 11 in × 96
    const scale = 2;
    const canvas = await h2c(el, {
      scale,
      width,
      windowWidth: width,
      backgroundColor: '#ffffff',
      useCORS: true,
      logging: false
    });
    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    pdf.addImage(imgData, 'JPEG', 0, 0, pageW, pageH);
    const name = (CERT && CERT.studentName ? CERT.studentName : 'الطالب') || 'الطالب';
    pdf.save('شهادة_' + name + '.pdf');
  } catch (e) {
    console.error('خطأ في توليد الشهادة:', e);
    toast('تعذّر توليد الشهادة، حاول مرة أخرى', 'err');
  }
}