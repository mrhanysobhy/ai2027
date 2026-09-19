# منصة التعلم الذكي — الصف الأول الثانوي

موقع تعليمي تفاعلي باللغة العربية (RTL) لتدريس **مبادئ الحاسب الآلي**، **الذكاء الاصطناعي**، و**البرمجة والذكاء الاصطناعي**، إعداد: **أ/ هاني صبحي**.

يتيح للطلاب: مشاهدة شرح الدروس، المراجعة، الاختبار التجريبي، والاختبار النهائي مع توليد شهادة PDF وإرسال النتائج إلى Google Sheets.

## مزايا المنصة

- تسجيل دخول للطلاب برمز مكوّن من 6 أرقام (يُخزَّن محلياً).
- شرح كامل لكل درس + أسئلة مراجعة مجابة.
- اختبار تجريبي بأسئلة مُخلَّطة مع إمكانية إعادة المحاولة.
- اختبار نهائي مُقيَّد بموعد (فترة `availableFrom` → `availableTo`)، يُؤدَّى **مرة واحدة فقط** لكل طالب، ونتيجته تُرسَل للشيت مرة واحدة.
- شهادة اجتياز PDF قابلة للتحميل لمن اجتاز بنسبة ≥ النسبة المطلوبة.
- صفحة نتائج تعرض تقدم كل طالب عبر مواد المنصة.

## التشغيل المحلي

```bash
# من مجلد المشروع
python -m http.server 8000
```

ثم افتح: http://localhost:8000

> ملاحظة: عند تعديل ملفات `data/**` أعد توليد الصفحات عبر:
> ```bash
> node tools/build.js
> ```

## النشر على GitHub Pages

1. أنشئ مستودعاً جديداً على GitHub (يمكن جعله خاصاً أو عاماً).
2. انسخ محتويات هذا المجلد إلى المستودع.
3. من إعدادات المستودع: **Settings → Pages**، اختر المصدر `Deploy from a branch` والفروع `main` / (root).
4. الموقع متاح مباشرة — هذا المجلد يحتوي الملفات المولّدة (`pages/**` و`js/data-bundle.js`) فلا يحتاج خطوة بناء عند النشر.

## ربط النتائج بـ Google Sheets (اختياري)

1. لصق محتوى `apps-script/Code.gs` في Google Apps Script (Extensions → Apps Script) داخل Google Sheet جديد.
2. تشغيل `setupSheet` من القائمة مرة واحدة.
3. Deploy → New deployment → Web app (Execute as: Me، Anyone access) ثم نسخ رابط `/exec`.
4. وضع الرابط في `data/config.json` بدل `GOOGLE_APPS_SCRIPT_URL_HERE` ثم إعادة `node tools/build.js`.

> ⚠️ **تنبيه أمني:** رفع رابط `/exec` الحقيقي في مستودع عام يكشف نقطة كتابة الشيت لأي شخص. إن لم ترد كشفه، أبقِ القيمة الافتراضية — في هذه الحالة تُحفظ النتائج محلياً فقط (console) ولا تُرسَل للشيت، وهذا لا يمنع عمل الاختبار أو الشهادة.

## بنية المجلد

```
├── index.html              # الصفحة الرئيسية
├── css/                    # الأنماط (base/layout/components/content/exam/results/certificate/responsive)
├── js/                     # javascript (data-bundle المولّد + data/utils/auth/navigation/home/subject/review/practice/final/sheets/certificate/results/lesson-page/app)
├── data/                   # مصدر البيانات (config/school/students/subjects + محتوى الدروس)
├── pages/{subjectId}/      # صفحات الدروس المولّدة (شرح/مراجعة/تجريبي/نهائي)
├── tools/build.js          # سكربت البناء (Node)
└── apps-script/Code.gs     # سكربت Google Apps Script
```

## تقنيات

HTML + CSS + JavaScript خام (بدون إطار عمل)، Cordova-less، Typed إضافة fonts Cairo، FontAwesome 6.5.1، html2canvas + jsPDF لإنشاء الشهادة، وGoogle Apps Script للشيت. البيانات مدمجة في `js/data-bundle.js` (تعمل مع `file://` وHTTP وGitHub Pages بدون خادم).

---

© وزارة التربية والتعليم — مديرية التربية والتعليم بالجيزة — مدرسة الباويطي الثانوية التجارية