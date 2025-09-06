import { ProductService } from './products';
import { OrderService } from './orders';
import { AuthService } from './auth';

export async function testAllServices() {
  console.log('🧪 بدء اختبار الخدمات...\n');

  // اختبار خدمات المنتجات
  console.log('📦 اختبار خدمات المنتجات:');
  try {
    const products = await ProductService.getAllProducts();
    console.log(`✅ جلب المنتجات: ${products.success ? 'نجح' : 'فشل'}`);
    if (products.success) {
      console.log(`   عدد المنتجات: ${products.total}`);
    }

    const categories = await ProductService.getCategories();
    console.log(`✅ جلب الفئات: ${categories.success ? 'نجح' : 'فشل'}`);
    if (categories.success) {
      console.log(`   الفئات المتاحة: ${categories.categories.join(', ')}`);
    }

    const discounted = await ProductService.getDiscountedProducts();
    console.log(`✅ المنتجات المخصومة: ${discounted.success ? 'نجح' : 'فشل'}`);
    if (discounted.success) {
      console.log(`   عدد المنتجات المخصومة: ${discounted.total}`);
    }
  } catch (error) {
    console.log(`❌ خطأ في خدمات المنتجات: ${error}`);
  }

  console.log('');

  // اختبار خدمات الطلبات
  console.log('📋 اختبار خدمات الطلبات:');
  try {
    const orders = await OrderService.getAllOrders();
    console.log(`✅ جلب الطلبات: ${orders.success ? 'نجح' : 'فشل'}`);
    if (orders.success) {
      console.log(`   عدد الطلبات: ${orders.total}`);
    }

    const stats = await OrderService.getOrderStats();
    console.log(`✅ إحصائيات الطلبات: ${stats.success ? 'نجح' : 'فشل'}`);
    if (stats.success) {
      console.log(`   إجمالي الطلبات: ${stats.stats.total}`);
      console.log(`   إجمالي الإيرادات: $${stats.stats.totalRevenue}`);
    }
  } catch (error) {
    console.log(`❌ خطأ في خدمات الطلبات: ${error}`);
  }

  console.log('');

  // اختبار خدمات المصادقة
  console.log('🔐 اختبار خدمات المصادقة:');
  try {
    // تسجيل مستخدم تجريبي
    const registerResult = await AuthService.register({
      username: 'testuser',
      phoneNumber: '+213123456789',
      password: 'testpassword123',
      email: 'test@example.com',
      fullName: 'مستخدم تجريبي'
    });
    console.log(`✅ تسجيل مستخدم: ${registerResult.success ? 'نجح' : 'فشل'}`);
    if (!registerResult.success) {
      console.log(`   السبب: ${registerResult.error}`);
    }

    // تسجيل الدخول
    const loginResult = await AuthService.login('testuser', 'testpassword123');
    console.log(`✅ تسجيل الدخول: ${loginResult.success ? 'نجح' : 'فشل'}`);
    if (loginResult.success) {
      console.log(`   تم إنشاء توكن الجلسة`);
    }
  } catch (error) {
    console.log(`❌ خطأ في خدمات المصادقة: ${error}`);
  }

  console.log('\n🎉 انتهى اختبار الخدمات!');
}

// تشغيل الاختبار إذا تم استدعاء الملف مباشرة
if (require.main === module) {
  testAllServices()
    .then(() => {
      console.log('\n✅ جميع الاختبارات مكتملة');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 خطأ في الاختبارات:', error);
      process.exit(1);
    });
}
