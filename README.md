# vermax - تطبيق تسوق إلكتروني

تطبيق تسوق إلكتروني متكامل مبني بـ React Native و Expo مع قاعدة بيانات PostgreSQL.

## المميزات

- 🛍️ **تسوق إلكتروني كامل** - منتجات، عروض، طلبات
- 🔐 **نظام مصادقة آمن** - تسجيل دخول، جلسات محمية
- 📱 **واجهة مستخدم جميلة** - تصميم عصري باللونين البرتقالي والأزرق
- 🗄️ **قاعدة بيانات قوية** - PostgreSQL مع Neon Tech
- 🔍 **بحث وتصفية** - بحث في المنتجات، تصفية حسب الفئة
- 📊 **إحصائيات متقدمة** - تتبع الطلبات والإيرادات

## التقنيات المستخدمة

- **Frontend**: React Native, Expo, TypeScript
- **Backend**: Node.js, Drizzle ORM
- **Database**: PostgreSQL (Neon Tech)
- **Authentication**: JWT, bcrypt
- **Styling**: React Native StyleSheet, LinearGradient

## التثبيت والتشغيل

### المتطلبات

- Node.js 18+
- npm أو yarn
- Expo CLI

### الخطوات

1. **استنساخ المشروع**
```bash
git clone <repository-url>
cd vermax
```

2. **تثبيت التبعيات**
```bash
npm install
```

3. **إعداد قاعدة البيانات**
```bash
# اتبع التعليمات في SETUP_DATABASE.md
```

4. **تشغيل التطبيق**
```bash
npm run dev
```

## هيكل المشروع

```
vermax/
├── app/                    # صفحات التطبيق
│   ├── (tabs)/            # صفحات التبويب
│   └── _layout.tsx        # تخطيط التطبيق
├── lib/                   # المكتبات والخدمات
│   ├── database/          # إعداد قاعدة البيانات
│   ├── auth.ts           # خدمات المصادقة
│   ├── products.ts       # خدمات المنتجات
│   └── orders.ts         # خدمات الطلبات
├── assets/               # الصور والموارد
└── package.json          # تبعيات المشروع
```

## الأوامر المتاحة

```bash
# تشغيل التطبيق
npm run dev

# بناء نسخة الويب
npm run build:web

# فحص الكود
npm run lint

# إدارة قاعدة البيانات
npm run db:generate    # توليد ملفات الهجرة
npm run db:push        # تطبيق التغييرات
npm run db:studio      # فتح Drizzle Studio
```

## المساهمة

1. Fork المشروع
2. أنشئ فرع جديد (`git checkout -b feature/amazing-feature`)
3. اكتب التغييرات (`git commit -m 'Add amazing feature'`)
4. ادفع للفرع (`git push origin feature/amazing-feature`)
5. أنشئ Pull Request

## الترخيص

هذا المشروع مرخص تحت رخصة MIT.

## الدعم

إذا واجهت أي مشاكل، يرجى فتح issue في GitHub.
