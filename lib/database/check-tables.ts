import { db } from './config';

export async function checkExistingTables() {
  try {
    console.log('🔍 فحص الجداول الموجودة في قاعدة البيانات...\n');

    // فحص جدول المستخدمين
    try {
      const usersResult = await db.execute('SELECT * FROM users LIMIT 1');
      console.log('✅ جدول users موجود');
    } catch (error) {
      console.log('❌ جدول users غير موجود');
    }

    // فحص جدول المنتجات
    try {
      const productsResult = await db.execute('SELECT * FROM products LIMIT 1');
      console.log('✅ جدول products موجود');
    } catch (error) {
      console.log('❌ جدول products غير موجود');
    }

    // فحص جدول الطلبات
    try {
      const ordersResult = await db.execute('SELECT * FROM orders LIMIT 1');
      console.log('✅ جدول orders موجود');
    } catch (error) {
      console.log('❌ جدول orders غير موجود');
    }

    // فحص جدول العروض
    try {
      const offersResult = await db.execute('SELECT * FROM offers LIMIT 1');
      console.log('✅ جدول offers موجود');
    } catch (error) {
      console.log('❌ جدول offers غير موجود');
    }

    // فحص جدول الجلسات
    try {
      const sessionsResult = await db.execute('SELECT * FROM sessions LIMIT 1');
      console.log('✅ جدول sessions موجود');
    } catch (error) {
      console.log('❌ جدول sessions غير موجود');
    }

    // فحص جدول محاولات تسجيل الدخول
    try {
      const loginAttemptsResult = await db.execute('SELECT * FROM login_attempts LIMIT 1');
      console.log('✅ جدول login_attempts موجود');
    } catch (error) {
      console.log('❌ جدول login_attempts غير موجود');
    }

    // عرض هيكل جدول المستخدمين
    console.log('\n📋 هيكل جدول users:');
    try {
      const userColumns = await db.execute(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        ORDER BY ordinal_position
      `);
      console.log(userColumns);
    } catch (error) {
      console.log('❌ لا يمكن عرض هيكل جدول users');
    }

    // عرض هيكل جدول المنتجات
    console.log('\n📋 هيكل جدول products:');
    try {
      const productColumns = await db.execute(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'products' 
        ORDER BY ordinal_position
      `);
      console.log(productColumns);
    } catch (error) {
      console.log('❌ لا يمكن عرض هيكل جدول products');
    }

    return { success: true };
  } catch (error) {
    console.error('❌ خطأ في فحص الجداول:', error);
    return { success: false, error };
  }
}

// تشغيل الفحص إذا تم استدعاء الملف مباشرة
if (require.main === module) {
  checkExistingTables()
    .then(result => {
      if (result.success) {
        console.log('\n🎉 انتهى فحص الجداول!');
      } else {
        console.error('\n💥 فشل في فحص الجداول');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('\n💥 خطأ غير متوقع:', error);
      process.exit(1);
    });
}
