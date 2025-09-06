import { db, users } from './config';
import * as Crypto from 'expo-crypto';

const JWT_SECRET = 'your-super-secret-jwt-key-change-this-in-production';

// Simple hash function for passwords
async function hashPassword(password: string): Promise<string> {
  const hashBuffer = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, password + JWT_SECRET);
  return hashBuffer;
}

async function createTestUser() {
  try {
    // التحقق من وجود المستخدم
    const existingUser = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.username, 'testuser')
    });

    if (existingUser) {
      console.log('Test user already exists');
      return;
    }

    // تشفير كلمة المرور
    const passwordHash = await hashPassword('123456');

    // إنشاء المستخدم
    const [newUser] = await db.insert(users).values({
      username: 'testuser',
      phoneNumber: '0550123456',
      passwordHash,
      fullName: 'مستخدم تجريبي',
    }).returning();

    console.log('Test user created successfully:', newUser);
  } catch (error) {
    console.error('Error creating test user:', error);
  }
}

// تشغيل السكريبت إذا تم استدعاؤه مباشرة
if (require.main === module) {
  createTestUser();
}

export { createTestUser };
