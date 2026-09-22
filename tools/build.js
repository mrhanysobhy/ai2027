/* ═══════════════════════════════════════════════════════════
   AI Pioneers — باني التطبيق
   يقرأ ملفات data/*.json وينشئ js/data-bundle.js (window.APP_DATA)

   التشغيل:  node tools/build.js
   ═══════════════════════════════════════════════════════════ */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'data');
const LESSONS_DIR = path.join(DATA_DIR, 'lessons');
const OUT_FILE = path.join(ROOT, 'js', 'data-bundle.js');
const INDEX_FILE = path.join(ROOT, 'index.html');

// ختم البناء: يزيد مع كل توليد → يُستخدم الآن في:
//   1) window.APP_BUILD (يتيح للتطبيق اكتشاف "نسخة قديمة" بالجهاز)
//   2) وسوم assets المحلية في index.html (كسر ذاكرة المتصفح المؤقتة Cache)
function buildStamp() {
  const d = new Date();
  const p = (x, n) => String(x).padStart(n || 2, '0');
  return p(d.getFullYear()) + p(d.getMonth() + 1) + p(d.getDate()) +
         '-' + p(d.getHours()) + p(d.getMinutes()) + p(d.getSeconds());
}

// خريطة الأيقونات: fa-* (من subjects.json) ← إيموجي (لتتناسب مع التصميم الجديد)
const EMOJI = {
  'fa-desktop': '🖥️',
  'fa-laptop': '💻',
  'fa-code': '💻',
  'fa-robot': '🤖',
  'fa-brain': '🧠',
  'fa-microchip': '🧩',
  'fa-network-wired': '🌐',
  'fa-book': '📖',
  'fa-calculator': '🧮'
};

function readJson(rel) {
  const p = path.join(DATA_DIR, rel);
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function readLesson(subjectId, lessonId) {
  const p = path.join(LESSONS_DIR, subjectId, `lesson-${lessonId}.json`);
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

// درس تجريبي يُولَّد تلقائياً عند عدم وجود محتوى حقيقي
function makePlaceholderLesson(id, title, subjectName) {
  const finalQuestions = Array.from({ length: 5 }, (_, i) => ({
    question: `سؤال نهائي تجريبي ${i + 1} عن «${title}»؟`,
    options: ['الإجابة الصحيحة', 'إجابة خاطئة أ', 'إجابة خاطئة ب', 'إجابة خاطئة ج'],
    correct: 0
  }));
  return {
    id,
    title,
    placeholder: true,
    explanation: {
      content: `
        <h2>${title}</h2>
        <div class="info-box"><p>هذا الدرس قيد الإعداد ولم يُضف محتواه الفعلي بعد — يتم عرض محتوى تجريبي.</p></div>
        <h3>مقدمة</h3>
        <p>سيتوفر هنا شرح مفصّل عن «${title}» في مادة ${subjectName}.</p>
        <div class="tip">💡 يمكنك متابعة الدروس الأخرى ومراجعة الأسئلة التجريبية في هذه الأثناء.</div>
      `
    },
    review: {
      questions: [
        { type: 'mcq', question: `محتوى الدرس «${title}» متاح حالياً؟`, options: ['لا، قيد الإعداد', 'نعم', 'ربما', 'غير معروف'], correct: 0, explanation: 'هذا درس تجريبي بمحتوى placeholder.' },
        { type: 'truefalse', question: `«${title}» درس في مادة ${subjectName}.`, correct: true, explanation: 'الدرس مضمّن ضمن المادة.' }
      ]
    },
    practiceExam: {
      questions: Array.from({ length: 5 }, (_, i) => ({
        question: `سؤال تدريبي تجريبي ${i + 1} عن «${title}»؟`,
        options: ['الإجابة الصحيحة', 'خيار خاطئ أ', 'خيار خاطئ ب', 'خيار خاطئ ج'],
        correct: 0
      }))
    },
    finalExam: {
      examId: 'exam_' + subjectId + '_' + id,
      duration: 30,
      passScore: 60,
      questions: finalQuestions
    }
  };
}

function build() {
  const config = readJson('config.json') || {};
  const school = readJson('school.json') || {};
  const students = readJson('students.json') || [];
  const rawSubjects = readJson('subjects.json') || [];

  const subjects = rawSubjects.map((subject) => {
    const emoji = EMOJI[subject.icon] || '📚';
    const lessons = (subject.lessons || []).map((lesson) => {
      let content = readLesson(subject.id, lesson.id);
      if (!content) {
        content = makePlaceholderLesson(lesson.id, lesson.title, subject.name);
      }
      return { id: lesson.id, title: lesson.title, content };
    });
    return { ...subject, emoji, lessons };
  });

  const appData = { config, school, students, subjects };
  const stamp = buildStamp();

  const banner = `/* ═══════════════════════════════════════════════════════════
   AI Pioneers — APP_DATA (مولّد تلقائياً)
   ⚠️ لا تعدّل هذا الملف يدوياً — عدّل data/*.json ثم شغّل:
       node tools/build.js
   ═══════════════════════════════════════════════════════════ */
`;

  const js = banner +
    'window.APP_BUILD = ' + JSON.stringify(stamp) + ';\n' +
    'window.APP_DATA = ' + JSON.stringify(appData, null, 2) + ';\n';

  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, js, 'utf8');

  // كسر الكاش: إلحاق ?v=<ختم> بوسوم css/ و js/ المحلية في index.html
  try {
    let html = fs.readFileSync(INDEX_FILE, 'utf8');
    const newHtml = html.replace(
      /((?:src|href)=")((?:css|js)\/[^"?]+)(?:\?v=[^"]*)?(")/g,
      '$1$2?v=' + stamp + '$3'
    );
    if (newHtml !== html) {
      fs.writeFileSync(INDEX_FILE, newHtml, 'utf8');
      console.log(`✅ تم إلحاق ختم البناء ?v=${stamp} بوسوم الموارد في index.html`);
    }
  } catch (e) {
    console.warn('⚠ تعذر تحديث index.html:', e.message);
  }

  const totalLessons = subjects.reduce((s, x) => s + x.lessons.length, 0);
  const placeholders = subjects.reduce(
    (s, x) => s + x.lessons.filter((l) => l.content && l.content.placeholder).length,
    0
  );
  console.log(`✅ تم توليد js/data-bundle.js (build ${stamp})`);
  console.log(`   المواد: ${subjects.length} · الدروس: ${totalLessons} (منها تجريبي: ${placeholders})`);
  console.log(`   الحجم: ${(js.length / 1024).toFixed(1)} KB`);
}

build();