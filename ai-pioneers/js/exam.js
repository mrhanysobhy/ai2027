/* ═══════════════════════════════════════════════════════════
   AI Pioneers — محركا الاختبار: التجريبي + النهائي
   ═══════════════════════════════════════════════════════════ */

let Ex = null; // حالة المحرك الحالية

/* ────────────────────────── أدوات عامة ────────────────────────── */

function finalWindow(lesson) {
  const ex = (lesson && lesson.finalExam) || {};
  const now = Date.now();
  let from = null, to = null;
  if (ex.availableFrom) from = parseFinalTime(ex.availableFrom, false);
  if (ex.availableTo) to = parseFinalTime(ex.availableTo, true);

  let status;
  if (from === null && to === null) status = 'open';
  else if (from !== null && now < from) status = 'waiting';
  else if (to !== null && now > to) status = 'closed';
  else status = 'open';
  return { from, to, status, exam: ex };
}

function parseFinalTime(value, isEnd) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split('-').map(Number);
    return isEnd ? new Date(y, m - 1, d, 23, 59, 59).getTime() : new Date(y, m - 1, d).getTime();
  }
  const t = Date.parse(value);
  return isNaN(t) ? null : t;
}

function renderHintBox(hint) {
  if (!hint) return '';
  return `
    <div class="hint-box">
      <button type="button" class="btn sm" onclick="toggleHint(this)">💡 تلميح</button>
      <div class="hint-content">${hint}</div>
    </div>`;
}
function toggleHint(btn) {
  btn.closest('.hint-box').classList.toggle('show');
}

/* ────────────────────────── الاختبار التجريبي ────────────────────────── */

function practiceIntro(sbj, entry, lesson, n) {
  const qs = (lesson && lesson.practiceExam && lesson.practiceExam.questions) || [];
  return `
    <div class="card" style="text-align:center">
      <h3>✏️ اختبار تجريبي</h3>
      <p class="mu">${qs.length} أسئلة اختيار من متعدد — تُخلط عشوائياً في كل محاولة.
      <br>يمكنك إعادة الاختبار عدداً غير محدود من المرات ولا تُحفظ النتائج.</p>
      <button class="btn p" onclick="startPractice('${sbj.id}',${n})">🚀 ابدأ الاختبار</button>
    </div>`;
}

function startPractice(sbjId, n) {
  const sbj = sub(sbjId);
  const lesson = lessonContent(sbj, n);
  if (!lesson || !lesson.practiceExam) return;
  Ex = {
    mode: 'practice', sbj, entry: lessonEntry(sbj, n), lesson, n,
    qs: shuffle(lesson.practiceExam.questions), ans: [], i: 0
  };
  renderExQ();
}

/* ────────────────────────── صفحة سؤال واحدة ────────────────────────── */

function renderExQ() {
  const q = Ex.qs[Ex.i];
  const len = Ex.qs.length;
  const a = Ex.ans.filter((v) => v != null).length;
  const box = $('box');
  if (!box) return;
  box.innerHTML = `
    <div class="card q">
      <div class="row">
        <b>${Ex.mode === 'final' ? 'المحاولة رقم ' + Ex.att : 'اختبار تجريبي'}</b>
        <span class="ex-cnt">✔ ${a} مجابة · ${len - a} غير مجابة</span>
        ${Ex.mode === 'final' ? '<span class="tm" id="tm">' + fmtTime(Ex.end - Date.now()) + '</span>' : ''}
      </div>
      <div class="bar"><i style="width:${((Ex.i + 1) / len) * 100}%"></i></div>
      <p class="mu">السؤال ${Ex.i + 1} من ${len}</p>
      <h3>${q.question}</h3>
      ${renderHintBox(q.hint)}
      <div class="opts">
        ${q.options.map((o, j) => `
          <button class="opt ${Ex.ans[Ex.i] === j ? 'sel' : ''}" onclick="pick(${j})">
            <span class="ol">${optionLetter(j)})</span> ${o}
          </button>`).join('')}
      </div>
      <div class="row">
        <button class="btn" onclick="go(-1)" ${Ex.i > 0 ? '' : 'disabled'}>السابق</button>
        ${Ex.i < len - 1
          ? '<button class="btn p" onclick="go(1)">التالي</button>'
          : '<button class="btn ok" onclick="doneEx()">إنهاء الاختبار</button>'}
      </div>
    </div>`;
  if (Ex.mode === 'final') tick();
}

function pick(j) { if (Ex.ans[Ex.i] === j) return; Ex.ans[Ex.i] = j; renderExQ(); }
function go(d) { Ex.i += d; renderExQ(); }

/* ────────────────────────── إنهاء الاختبار ────────────────────────── */

function doneEx(auto) {
  if (!Ex) return;
  if (!auto && !confirm('هل أنت متأكد من إنهاء الاختبار؟')) return;

  if (Ex.mode === 'final' && Ex.iv) clearInterval(Ex.iv);
  const x = Ex;
  const score = x.qs.filter((q, i) => x.ans[i] === q.correct).length;
  const pct = Math.round((score / x.qs.length) * 100);

  if (x.mode === 'practice') {
    Ex = null;
    renderPracticeResult(x, score, pct);
    return;
  }

  // نهائي
  const passScore = (x.lesson.finalExam.passScore || 60);
  const passed = pct >= passScore;

  // حماية: اجتياز سابق لا يُستبدل ولا يُعاد إرساله
  if (me) {
    const prev = getStoredResult(me.code, x.sbj.id, x.n, x.lesson);
    if (prev && prev.passed) {
      toast('عُرضت نتيجتك المسجلة — اجتزت هذا الاختبار بالفعل', 'warn');
      renderFinalPassed(x, prev);
      return;
    }
  }
  Ex = null;

  const result = {
    passed, score, total: x.qs.length, percentage: pct, t: Date.now(),
    subjectId: x.sbj.id, lessonId: x.n,
    examId: examIdOf(x.lesson), attempt: x.att
  };

  // تخزين محلي (حسب الفترة)
  if (me) {
    ls.s(finalTakenKey(me.code, x.sbj.id, x.n, x.lesson), JSON.stringify(result));
    ls.s(finalResultKey(me.code, x.sbj.id, x.n, x.lesson), JSON.stringify(result));
    ls.s(finalAttemptKey(me.code, x.sbj.id, x.n, x.lesson), String(x.att));
  }

  // سجل تاريخي في الشيت (يُرسل حتى عند الرسوب)
  if (me) {
    sendToSheets(me, x.sbj.name, x.entry.title, score, x.qs.length, pct, 'final', result.examId, x.att, passed);
  }

  const rbox = $('box');
  if (rbox) rbox.innerHTML = passed ? renderFinalPassed(x, result) : renderFinalFailed(x, result, true);
  else main(passed ? renderFinalPassed(x, result) : renderFinalFailed(x, result, true));
}

function renderPracticeResult(x, score, pct) {
  const g = getGrade(pct);
  const box = $('box');
  box.innerHTML = `
    <div class="card" style="text-align:center">
      <h2>نتيجة الاختبار التجريبي</h2>
      <p>الدرجة: <b>${score} / ${x.qs.length}</b> · النسبة: <b>${pct}%</b> · التقدير: <b>${g.name}</b></p>
      <div class="bar"><i style="width:${pct}%;background:var(${pct >= 60 ? '--ok' : '--bad'})"></i></div>
    </div>
    ${x.qs.map((q, i) => {
      const ok = x.ans[i] === q.correct;
      return `
        <div class="card ${ok ? 'ok' : 'bad'}">
          <b>${i + 1}. ${q.question}</b>
          <p class="${ok ? '' : 'mu'}">${ok ? '✔' : '✖'} إجابتك: ${x.ans[i] == null ? 'لم تُجب' : q.options[x.ans[i]]}${ok ? '' : ' — الصحيحة: ' + q.options[q.correct]}</p>
        </div>`;
    }).join('')}
    <div style="text-align:center">
      <button class="btn p" onclick="startPractice('${x.sbj.id}',${x.n})">🔁 إعادة الاختبار</button>
    </div>`;
}

/* ────────────────────────── الاختبار النهائي ────────────────────────── */

function finalView(sbj, entry, lesson, n) {
  if (!lesson || !lesson.finalExam) {
    return '<div class="card" style="text-align:center">🏁 الاختبار النهائي غير متاح حالياً.</div>';
  }
  const w = finalWindow(lesson);
  const ex = w.exam;
  const count = (ex.questions || []).length;
  const dur = ex.duration || 30;
  const passScore = ex.passScore || 60;
  const saved = me ? getStoredResult(me.code, sbj.id, n, lesson) : null;

  if (saved && saved.passed) return renderFinalPassed({ sbj, entry, lesson, n, att: saved.attempt || 1 }, saved);
  if (saved && !saved.passed && w.status === 'closed') return renderFinalFailed({ sbj, entry, lesson, n, att: saved.attempt || 1 }, saved, false);

  if (w.status === 'waiting') {
    return `
      <div class="card" style="text-align:center">
        <h3>⏳ الاختبار النهائي سيُفتح قريباً</h3>
        <p class="mu">موعد البدء: <b>${fdt(ex.availableFrom)}</b></p>
        <p class="note">لا يمكنك دخول الاختبار النهائي قبل موعد البداية.</p>
      </div>`;
  }

  if (w.status === 'closed') {
    return `
      <div class="card" style="text-align:center">
        <h3>🔒 الاختبار النهائي غير متاح</h3>
        <p class="mu">انتهى موعد الاختبار (${fdt(ex.availableTo)}).</p>
      </div>`;
  }

  // مفتوح
  const lastFail = saved && !saved.passed ? renderFinalResultCard(saved, true) : '';
  return lastFail + `
    <div class="card exam-window" style="text-align:center">
      <h3>🏁 الاختبار النهائي</h3>
      <div class="exam-window-row">
        <span>▶️ البداية: <b>${fdt(ex.availableFrom)}</b></span>
        <span>⏹️ النهاية: <b>${fdt(ex.availableTo)}</b></span>
      </div>
      <p class="mu">${count} سؤال · المدة ${dur} دقيقة · النجاح ≥ ${passScore}%</p>
      <p class="note">أداء موثّق لكل فترة اختبار — تُسجَّل كل المحاولات في سجلك.</p>
      <button class="btn ok" onclick="startFinal('${sbj.id}',${n})">
        ${saved ? '🔁 إعادة المحاولة' : '🚀 ابدأ الاختبار النهائي'}
      </button>
    </div>`;
}

function startFinal(sbjId, n) {
  const sbj = sub(sbjId);
  const lesson = lessonContent(sbj, n);
  if (!lesson || !lesson.finalExam || !me) return;
  const w = finalWindow(lesson);
  if (w.status !== 'open') { toast('الاختبار غير متاح في هذا الوقت', 'warn'); return; }

  const prev = getStoredResult(me.code, sbjId, n, lesson);
  if (prev && prev.passed) { toast('لقد اجتزت هذا الاختبار بالفعل', 'warn'); finalView(sbj, lessonEntry(sbj, n), lesson, n); return; }

  const att = getStoredAttempt(me.code, sbjId, n, lesson) + 1;
  const dur = (lesson.finalExam.duration || 30);

  Ex = {
    mode: 'final', sbj, entry: lessonEntry(sbj, n), lesson, n, att,
    qs: lesson.finalExam.questions, ans: [], i: 0,
    end: Date.now() + dur * 60000
  };
  Ex.iv = setInterval(tick, 1000);
  renderExQ();
}

function tick() {
  if (!Ex || Ex.mode !== 'final') return;
  const left = Math.max(0, Ex.end - Date.now());
  const el = $('tm');
  if (el) el.textContent = '⏱ ' + fmtTime(left);
  if (left <= 0) { toast('انتهى الوقت — تم التسليم تلقائياً', 'warn'); doneEx(true); }
}

/* ─────────────── صفحات النتيجة (نهائي) ─────────────── */

function scoreBar(pct, ok) {
  return `<div class="bar"><i style="width:${pct}%;background:var(${ok ? '--ok' : '--bad'})"></i></div>`;
}

function renderFinalResultCard(r, allowRetry) {
  const g = getGrade(r.percentage);
  return `
    <div class="card ${r.passed ? 'ok' : 'bad'}" style="text-align:center">
      <h2>${r.passed ? '🎉 مبروك! لقد اجتزت الاختبار' : 'لم تجتز الاختبار بعد'}</h2>
      <p>الدرجة: <b>${r.score} / ${r.total}</b> · النسبة: <b>${r.percentage}%</b> · التقدير: <b>${g.name}</b> · المحاولة ${r.attempt || 1}</p>
      ${scoreBar(r.percentage, r.passed)}
      ${r.passed
        ? `<p><a class="btn ok" href="#cert/${r.subjectId}/${r.lessonId}">🏅 تحميل الشهادة</a></p>`
        : (allowRetry ? '<p class="mu">يمكنك إعادة المحاولة طالما الاختبار مفتوح.</p>' : '<p class="note">انتهت فترة الاختبار ولا تتاح إعادة المحاولة.</p>')}
    </div>`;
}

function renderFinalPassed(x, r) {
  return renderFinalResultCard(r, false) + `
    <div class="card noprint" style="text-align:center">
      <p class="note">نتيجتك النهائية مسجلة في سجلك ولا يمكنك إعادة أداء هذا الاختبار.</p>
      <a class="btn" href="#results">📊 عرض نتائجي</a>
    </div>`;
}

function renderFinalFailed(x, r, allowRetry) {
  const retry = allowRetry && me ? (finalWindow(x.lesson).status === 'open') : false;
  return renderFinalResultCard(r, true) + `
    <div style="text-align:center" class="noprint">
      ${retry ? `<button class="btn p" onclick="startFinal('${x.sbj.id}',${x.n})">🔁 إعادة المحاولة</button>` : ''}
      <a class="btn" href="#lesson/${x.sbj.id}/${x.n}/review">📖 راجع الدرس</a>
    </div>`;
}