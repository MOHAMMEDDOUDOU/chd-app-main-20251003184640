# قاعدة البيانات - taziri

## نظرة عامة

تم إعداد قاعدة البيانات باستخدام **Neon Tech** (PostgreSQL) مع **Drizzle ORM** لإدارة البيانات بشكل آمن وفعال.

## الجداول

### 1. المستخدمين (users)
- **id**: معرف فريد للمستخدم
- **username**: اسم المستخدم (فريد)
- **phoneNumber**: رقم الهاتف (فريد)
- **passwordHash**: كلمة المرور مشفرة
- **email**: البريد الإلكتروني (اختياري)
- **fullName**: الاسم الكامل (اختياري)
- **isActive**: حالة الحساب
- **createdAt**: تاريخ الإنشاء
- **updatedAt**: تاريخ آخر تحديث

### 2. الجلسات (sessions)
- **id**: معرف فريد للجلسة
- **userId**: معرف المستخدم
- **token**: توكن الجلسة
- **expiresAt**: تاريخ انتهاء الجلسة
- **createdAt**: تاريخ إنشاء الجلسة
- **lastActivity**: آخر نشاط

### 3. المنتجات (products)
- **id**: معرف فريد للمنتج
- **name**: اسم المنتج
- **description**: وصف المنتج
- **price**: السعر الأصلي
- **discountPrice**: السعر بعد الخصم
- **discountPercentage**: نسبة الخصم
- **imageUrl**: رابط الصورة الرئيسية
- **stockQuantity**: الكمية المتوفرة
- **sizes**: الأحجام المتوفرة (JSON)
- **images**: الصور الإضافية (JSON)
- **category**: فئة المنتج
- **isActive**: حالة المنتج
- **createdAt**: تاريخ الإنشاء
- **updatedAt**: تاريخ آخر تحديث

### 4. العروض (offers)
- **id**: معرف فريد للعرض
- **name**: اسم العرض
- **description**: وصف العرض
- **price**: السعر الأصلي
- **discountPrice**: السعر بعد الخصم
- **imageUrl**: رابط الصورة
- **stockQuantity**: الكمية المتوفرة
- **sizes**: الأحجام المتوفرة (JSON)
- **images**: الصور الإضافية (JSON)
- **category**: فئة العرض
- **createdAt**: تاريخ الإنشاء
- **updatedAt**: تاريخ آخر تحديث

### 5. الطلبات (orders)
- **id**: معرف فريد للطلب
- **itemType**: نوع العنصر (product/offer)
- **itemId**: معرف العنصر
- **itemName**: اسم العنصر
- **quantity**: الكمية
- **unitPrice**: سعر الوحدة
- **subtotal**: المجموع الفرعي
- **shippingCost**: تكلفة الشحن
- **totalAmount**: المجموع الكلي
- **customerName**: اسم العميل
- **phoneNumber**: رقم هاتف العميل
- **wilaya**: الولاية
- **commune**: البلدية
- **deliveryType**: نوع التوصيل (home/stopDesk)
- **status**: حالة الطلب
- **resellerPrice**: سعر إعادة البيع
- **createdAt**: تاريخ إنشاء الطلب

### 6. محاولات تسجيل الدخول (login_attempts)
- **id**: معرف فريد للمحاولة
- **username**: اسم المستخدم
- **ipAddress**: عنوان IP
- **attemptedAt**: تاريخ المحاولة
- **success**: نجح أم لا

## الخدمات المتاحة

### 1. خدمات المصادقة (AuthService)
- `register()` - تسجيل مستخدم جديد
- `login()` - تسجيل الدخول
- `logout()` - تسجيل الخروج
- `verifyToken()` - التحقق من صحة التوكن
- `changePassword()` - تغيير كلمة المرور

### 2. خدمات المنتجات (ProductService)
- `getAllProducts()` - جلب جميع المنتجات
- `getProductsByCategory()` - جلب المنتجات حسب الفئة
- `searchProducts()` - البحث في المنتجات
- `getProductById()` - جلب منتج واحد
- `getDiscountedProducts()` - جلب المنتجات المخصومة
- `createProduct()` - إنشاء منتج جديد
- `updateProduct()` - تحديث منتج
- `deleteProduct()` - حذف منتج

### 3. خدمات الطلبات (OrderService)
- `createOrder()` - إنشاء طلب جديد
- `getAllOrders()` - جلب جميع الطلبات
- `getOrderById()` - جلب طلب واحد
- `getOrdersByStatus()` - جلب الطلبات حسب الحالة
- `updateOrderStatus()` - تحديث حالة الطلب
- `getOrderStats()` - إحصائيات الطلبات

## الأوامر المتاحة

```bash
# توليد ملفات الهجرة
npm run db:generate

# تطبيق الهجرات
npm run db:migrate

# فتح Drizzle Studio
npm run db:studio

# دفع التغييرات مباشرة
npm run db:push
```

## متغيرات البيئة

أضف هذه المتغيرات إلى ملف `.env`:

```env
NEON_DATABASE_URL=postgresql://neondb_owner:npg_lWDH8R6uOiFN@ep-aged-water-a2koqhuu-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
NODE_ENV=development
```

## اختبار الاتصال

```bash
# اختبار الاتصال بقاعدة البيانات
npx tsx lib/database/test-connection.ts
```

## الأمان

- كلمات المرور مشفرة باستخدام bcrypt
- الجلسات محمية بـ JWT
- تسجيل محاولات تسجيل الدخول
- تنظيف تلقائي للجلسات المنتهية
- فهارس محسنة للأداء

## الأداء

- فهارس على الحقول المهمة
- استعلامات محسنة
- اتصال فعال مع Neon Tech
- تنظيف تلقائي للبيانات القديمة
