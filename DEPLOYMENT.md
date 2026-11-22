# دليل النشر — نُور / NOOR Store

هذا الدليل يشرح نشر المتجر على **Vercel** مع **Supabase** (قاعدة بيانات PostgreSQL + تخزين الصور).

> ملخص سريع: SQLite المحلي ممتاز للتطوير فقط. في الإنتاج استخدم PostgreSQL لأن أنظمة ملفات Vercel مؤقتة وللقراءة فقط.

---

## 1. المتطلبات

- حساب [Vercel](https://vercel.com) (خطة Hobby تكفي للبداية).
- مشروع [Supabase](https://supabase.com) (الخطة المجانية تكفي).
- مستودع GitHub يحتوي المشروع.
- Node.js 22.5+ محلياً (للتحقق قبل النشر).

---

## 2. إعداد Supabase

### 2.1 إنشاء المشروع
1. اذهب إلى Supabase → **New project**.
2. اختر الاسم، كلمة مرور قاعدة البيانات، والمنطقة الأقرب (مثلاً `eu-central-1`).
3. انتظر اكتمال التهيئة.

### 2.2 إنشاء الجداول
1. افتح **SQL Editor**.
2. الصق محتوى [`database/supabase-schema.sql`](./database/supabase-schema.sql) بالكامل.
3. اضغط **Run**.
4. تحقق من **Table Editor** بظهور 13 جدولاً (categories, products, orders, ...).

الملف يتضمن:
- كل الجداول والفهارس.
- تفعيل **Row Level Security**.
- سياسات قراءة عامة للبيانات المنشورة فقط (منتجات/تصنيفات/بانرات/آراء/شحن).
- منع الوصول المباشر بمفتاح anon إلى الطلبات، الإعدادات، المستخدمين، الرسائل، المشتركين.

### 2.3 نسخ رابط الاتصال
1. **Project Settings → Database → Connection string**.
2. اختر **URI** ووضع **Transaction pooler** (مناسب لـ Serverless).
3. انسخ الرابط، واستبدل `[YOUR-PASSWORD]` بكلمة مرور قاعدة البيانات.

```env
DATABASE_URL=postgresql://postgres.xxxxxxxx:PASSWORD@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
```

> استخدم منفذ `6543` (Pooler) على Vercel. المنفذ `5432` قد يستهلك اتصالات كثيرة مع Serverless.

> **لا تستخدم** مضيف `db.<ref>.supabase.co` المباشر: سوبابيز تخدمه على IPv6 فقط، ويفشل الاتصال على كثير من الشبكات. استخدم مضيف `aws-0-<region>.pooler.supabase.com`.

### 2.3.1 التحقق من الاتصال (قبل أي شيء آخر)
بعد وضع الرابط في `.env.local`:

```bash
npm run db:check
```

يطبع الأمر المضيف والمنفذ، ويختبر الاتصال، ثم يعرض الجداول الناقصة وعدد الصفوف وصلاحيات `anon` وعدد سياسات RLS. إذا فشل الاتصال فسيشرح السبب (مشروع محذوف، مشروع متوقف مؤقتاً، كلمة مرور خاطئة، مضيف IPv6، جدول ناقص). لا تنتقل للنشر قبل ظهور:

```
✔ Connected in ... ms
✔ All 13 tables exist
```

### 2.4 إعداد تخزين الصور
1. **Storage → New bucket**.
2. الاسم: `products`.
3. فعّل **Public bucket** (الصور تُعرض للزوار).
4. من **Project Settings → API** انسخ:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (سري جداً)

> لا تضع `service_role` في أي متغير يبدأ بـ `NEXT_PUBLIC_`. التطبيق يستخدمه فقط في `/api/admin/upload` على الخادم.

---

## 3. إعداد المشروع محلياً

```bash
git clone <repo-url> noor-store
cd noor-store
npm install
copy .env.example .env.local
```

حرّر `.env.local`:

```env
NEXT_PUBLIC_SITE_URL=https://your-domain.dz
AUTH_SECRET=<سلسلة عشوائية 64+ حرفاً>
ADMIN_EMAIL=admin@your-domain.dz
ADMIN_PASSWORD=<كلمة مرور قوية>
ADMIN_NAME=مدير المتجر

DATABASE_URL=postgresql://...

NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SUPABASE_STORAGE_BUCKET=products

AUTO_SEED=true
```

توليد `AUTH_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### زرع البيانات الأولى
مع `AUTO_SEED=true` تُزرع البيانات عند أول طلب. يمكنك أيضاً:

```bash
npm run db:seed
```

سينشئ الحساب الإداري من `ADMIN_EMAIL`/`ADMIN_PASSWORD` والكتالوج التجريبي والولايات الـ58.

### اختبار محلي
```bash
npm run build
npm start
```
ثم افتح `http://localhost:3000` و`/admin/login`.

> بعد نجاح الزرع، اضبط `AUTO_SEED=false` لمنع أي محاولة زرع في الإنتاج.

---

## 4. النشر على Vercel

### 4.1 رفع الكود إلى GitHub
```bash
git init
git add .
git commit -m "Noor store"
git branch -M main
git remote add origin https://github.com/<user>/<repo>.git
git push -u origin main
```

> `.gitignore` يستثني `node_modules`, `.next`, `.env.local`, `.data`, و`public/uploads`.

### 4.2 استيراد المشروع
1. Vercel → **Add New → Project**.
2. اختر المستودع.
3. Framework: **Next.js** (يُكتشف تلقائياً).
4. Build Command: `npm run build` — Output: `.next`.
5. لا تضف أي إعداد خاص آخر.

### 4.3 متغيرات البيئة على Vercel
أضفها في **Settings → Environment Variables** (Production + Preview):

| المتغير | القيمة |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | `https://your-domain.dz` |
| `AUTH_SECRET` | المفتاح العشوائي |
| `ADMIN_EMAIL` | بريد المدير |
| `ADMIN_PASSWORD` | كلمة المرور القوية |
| `ADMIN_NAME` | اسم المدير |
| `DATABASE_URL` | رابط Supabase Pooler (تحقق بـ `npm run db:check` قبل الاستيراد) |
| `NEXT_PUBLIC_SUPABASE_URL` | رابط المشروع |
| `SUPABASE_SERVICE_ROLE_KEY` | مفتاح service_role |
| `SUPABASE_STORAGE_BUCKET` | `products` |
| `AUTO_SEED` | `true` (أول نشر فقط) |

### 4.4 النشر
اضغط **Deploy**. بعد اكتمال البناء:

1. افتح `https://<project>.vercel.app`.
2. تحقق من ظهور المنتجات.
3. سجّل الدخول إلى `/admin/login`.
4. أنشئ طلباً تجريبياً من المتجر وتأكد من ظهوره في اللوحة.
5. اضبط `AUTO_SEED=false` ثم أعد النشر (Redeploy) لتفعيل التغيير.

### 4.5 النطاق المخصص
1. Vercel → **Settings → Domains → Add**.
2. أضف `your-domain.dz` و`www.your-domain.dz`.
3. عدّل سجلات DNS عند مزوّد النطاق كما يوضح Vercel (A / CNAME).
4. حدّث `NEXT_PUBLIC_SITE_URL` إلى النطاق النهائي وأعد النشر.

---

## 5. بعد النشر — قائمة التحقق

- [ ] تغيير كلمة مرور المدير الافتراضية.
- [ ] `AUTH_SECRET` طويل وعشوائي وفريد.
- [ ] `AUTO_SEED=false`.
- [ ] تسجيل الدخول إلى `/admin` يعمل، والخروج يعمل.
- [ ] إضافة/تعديل منتج مع رفع صورة (تأكد أنها تذهب إلى Supabase Storage).
- [ ] إنشاء طلب COD من المتجر → يظهر في `/admin/orders`.
- [ ] تحديث حالة الطلب → تنعكس في صفحة تتبع العميل.
- [ ] طباعة فاتورة من `/order/<number>`.
- [ ] تصدير CSV وفتحه في Excel (العربية سليمة).
- [ ] تعديل أسعار الشحن في `/admin/shipping` → تتغير في `/checkout`.
- [ ] اختبار الموقع على الجوال (RTL + السلة + الدفع).
- [ ] التحقق من `robots.txt` و`sitemap.xml`.
- [ ] تفعيل النسخ الاحتياطي الدوري في Supabase.

---

## 6. النسخ الاحتياطي والاستعادة

### Supabase
- **Database → Backups**: الخطة المدفوعة توفر نسخاً يومياً تلقائياً.
- للنسخ اليدوي:
```bash
pg_dump "postgresql://postgres.xxxx:PASSWORD@...:5432/postgres" > noor-backup.sql
```
- الاستعادة:
```bash
psql "postgresql://..." < noor-backup.sql
```

### الصور
- Supabase Storage → Bucket `products` → يمكن تنزيل المجلد دورياً.
- الصور المرفوعة محلياً موجودة في `public/uploads/` (لا تُرفع إلى Git).

---

## 7. التحديثات المستقبلية

```bash
git add .
git commit -m "update"
git push
```
Vercel يعيد النشر تلقائياً. إذا أضفت تغييرات على المخطط، نفّذها يدوياً في SQL Editor أو أضف ملف ترحيل جديد في `database/`.

---

## 8. استكشاف أخطاء النشر

| الخطأ | السبب / الحل |
|---|---|
| `getaddrinfo ENOTFOUND tenant/user ... not found` | الرابط يعود لمشروع سوبابيز محذوف/قديم. انسخ Connection String من المشروع الحالي ثم `npm run db:check`. |
| `getaddrinfo ENOTFOUND db.xxx.supabase.co` | مضيف مباشر قديم أو IPv6 غير مدعوم. استخدم `aws-0-<region>.pooler.supabase.com:6543`. |
| `password authentication failed` (28P01) | كلمة المرور خطأ أو غير مُرمَّزة؛ رموز مثل `@ : / #` يجب أن تصبح `%40 %3A %2F %23`. أعد ضبط كلمة المرور في سوبابيز لعبارة أبجدية رقمية. |
| `ECONNREFUSED` / `ETIMEDOUT` | المشروع متوقف مؤقتاً (الخطة المجانية) أو جدار ناري/VPN. استيقظ المشروع من لوحة سوبابيز وأعد المحاولة. |
| `relation "products" does not exist` | لم يُنفّذ `database/supabase-schema.sql`. نفّذه ثم أعد النشر. |
| `too many connections` | استخدم Pooler (منفذ 6543) بدل الاتصال المباشر. |
| الصور لا تُرفع | Bucket غير عام أو `SUPABASE_SERVICE_ROLE_KEY` خاطئ. |
| `files_too_large` / 413 عند رفع الصور | Vercel يحدّ جسم الطلب بـ~4.5MB؛ ارفع صوراً أصغر من 4MB لكل دفعة (مضبوط في الكود). |
| الصور تختفي بعد إعادة النشر | كنت تستخدم التخزين المحلي؛ فعّل Supabase Storage. |
| `AUTH_SECRET` غير صالح | عيّن قيمة 32+ حرفاً وأعد النشر. |
| 500 على كل الصفحات | شغّل `npm run db:check`: الرابط الخاطئ أو الجداول الناقصة يظهران هناك مباشرة، وسيطبع الكود سبب الفشل في سجل الخادم. |
| الدخول يفشل بعد النشر | الحساب أُنشئ بكلمة مرور مختلفة؛ أعد تعيينه عبر SQL أو `npm run db:reset` محلياً على نفس القاعدة. |
| العربية مشوّهة | تأكد من `charset=utf-8` (مضبوط في CSV وHTML). |
| 500 عند `/api/orders` | تحقق من سجلات Vercel؛ غالباً `DATABASE_URL` أو مخطط ناقص. |

---

## 9. ملاحظات الإنتاج

- **الدفع:** COD يعمل مباشرة. CIB/الذهبية في الوضع اليدوي. لربط SATIM فعلياً، استكمل حقول البوابة في `/admin/settings` وأضف تكامل الـ API (البنية الحالية تسجّل الطلب بحالة دفع معلّقة).
- **البريد:** لا يوجد مزوّد بريد مُهيأ؛ رسائل التواصل تُحفظ في قاعدة البيانات وتظهر في `/admin/messages`.
- **النسخ الاحتياطي:** فعّله قبل أي حملة تسويقية.
- **المراقبة:** استخدم Vercel Analytics/Sentry اختيارياً.
