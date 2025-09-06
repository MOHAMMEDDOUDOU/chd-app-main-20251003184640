# إعداد قاعدة البيانات - taziri

## الخطوات المطلوبة

### 1. إعداد قاعدة البيانات في Neon Tech

1. اذهب إلى [Neon Tech Console](https://console.neon.tech)
2. افتح مشروعك `neondb`
3. اذهب إلى **SQL Editor**
4. انسخ محتوى ملف `setup-database.sql` والصقه في المحرر
5. اضغط **Run** لتشغيل الأوامر

### 2. متغيرات البيئة

تأكد من وجود ملف `.env.local` في مجلد المشروع مع المحتوى التالي:

```env
NEON_DATABASE_URL=postgresql://neondb_owner:npg_lWDH8R6uOiFN@ep-aged-water-a2koqhuu-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
NODE_ENV=development
```

### 3. اختبار الاتصال

```bash
# اختبار الاتصال بقاعدة البيانات
npx tsx lib/database/test-connection.ts

# اختبار جميع الخدمات
npx tsx lib/test-services.ts
```

### 4. تشغيل التطبيق

```bash
# تشغيل التطبيق
npm run dev
```

## الجداول المنشأة

✅ **users** - جدول المستخدمين
✅ **sessions** - جدول الجلسات  
✅ **products** - جدول المنتجات
✅ **offers** - جدول العروض
✅ **orders** - جدول الطلبات
✅ **login_attempts** - جدول محاولات تسجيل الدخول

## البيانات التجريبية

تم إضافة بيانات تجريبية للمنتجات والعروض لتجربة التطبيق.

## الأمان

- كلمات المرور مشفرة بـ bcrypt
- الجلسات محمية بـ JWT
- فهارس محسنة للأداء
- تنظيف تلقائي للجلسات المنتهية

## استكشاف الأخطاء

إذا واجهت مشاكل:

1. تأكد من صحة رابط قاعدة البيانات
2. تحقق من وجود جميع الجداول
3. اختبر الاتصال باستخدام `test-connection.ts`
4. راجع سجلات الأخطاء في التطبيق
