import { AuthService } from '../auth';

async function testLogin() {
  try {
    console.log('Testing login...');
    
    // محاولة تسجيل الدخول
    const result = await AuthService.login('testuser', '123456');
    
    console.log('Login test result:', result);
    
    if (result.success) {
      console.log('✅ Login successful!');
      console.log('User data:', result.user);
      console.log('Token:', result.token);
    } else {
      console.log('❌ Login failed:', result.error);
    }
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

// تشغيل الاختبار
testLogin();
