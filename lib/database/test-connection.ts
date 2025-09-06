import { db } from './config';

export async function testDatabaseConnection() {
  try {
    // اختبار الاتصال البسيط
    const result = await db.execute('SELECT NOW() as current_time');
    console.log('✅ تم الاتصال بقاعدة البيانات بنجاح');
    console.log('الوقت الحالي:', result);
    return { success: true, message: 'تم الاتصال بقاعدة البيانات بنجاح' };
  } catch (error) {
    console.error('❌ خطأ في الاتصال بقاعدة البيانات:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'خطأ غير معروف' 
    };
  }
}

// For React Native/Expo environment
if (typeof require !== 'undefined' && require.main === module) {
  testDatabaseConnection()
    .then(result => {
      if (result.success) {
        console.log('🎉 قاعدة البيانات جاهزة للاستخدام!');
      } else {
        console.error('💥 فشل في الاتصال بقاعدة البيانات');
      }
    })
    .catch(error => {
      console.error('💥 خطأ غير متوقع:', error);
    });
}
