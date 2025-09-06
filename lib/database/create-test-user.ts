import { db, users } from './config';
import * as Crypto from 'expo-crypto';

const JWT_SECRET = 'your-super-secret-jwt-key-change-this-in-production';

async function hashPassword(password: string): Promise<string> {
  const hashBuffer = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, password + JWT_SECRET);
  return hashBuffer;
}

async function createTestUser() {
  try {
    console.log('Creating test user...');
    
    // تشفير كلمة المرور
    const passwordHash = await hashPassword('123456');
    console.log('Password hashed successfully');

    // إنشاء المستخدم
    const [newUser] = await db.insert(users).values({
      username: 'testuser',
      phoneNumber: '0550123456',
      passwordHash,
      fullName: 'مستخدم تجريبي',
    }).returning();

    console.log('✅ Test user created successfully:', newUser);
    return newUser;
  } catch (error) {
    console.error('❌ Error creating test user:', error);
    throw error;
  }
}

// تشغيل السكريبت
createTestUser()
  .then(() => {
    console.log('Test user creation completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Test user creation failed:', error);
    process.exit(1);
  });
