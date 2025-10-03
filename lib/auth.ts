import * as Crypto from 'expo-crypto';
import jwt from 'expo-jwt';
import { db, users, sessions, loginAttempts } from './database/config';
import { eq, and, lt } from 'drizzle-orm';
import { CloudinaryService } from './cloudinary';
import { UserSettingsService, NotificationService } from './notifications';

const JWT_SECRET = 'your-super-secret-jwt-key-change-this-in-production';
const JWT_EXPIRES_IN = '7d';

// دالة للتحقق من صحة التوكن
export function verifyToken(token: string): { userId: string; username: string; role: string } | null {
  try {
    const decoded = jwt.decode(token, JWT_SECRET) as { userId: string; username: string; role: string };
    return decoded;
  } catch (error) {
    return null;
  }
}

// Simple password storage (no hashing)
function storePassword(password: string): string {
  console.log('storePassword - Input password:', password);
  return password;
}

// Simple password verification (direct comparison)
function verifyPassword(password: string, storedPassword: string): boolean {
  console.log('verifyPassword - Input password:', password);
  console.log('verifyPassword - Stored password:', storedPassword);
  
  const isValid = password === storedPassword;
  console.log('verifyPassword - Password comparison result:', isValid);
  
  return isValid;
}

export interface AuthUser {
  id: string;
  username: string;
  phoneNumber: string;
  fullName?: string;
  role: 'user' | 'admin';
}

export class AuthService {
  // تسجيل مستخدم جديد
  static async register(userData: {
    username: string;
    phoneNumber: string;
    password: string;
    fullName: string;
  }) {
    try {
      // التحقق من وجود المستخدم
      const existingUser = await db.query.users.findFirst({
        where: eq(users.username, userData.username)
      });

      if (existingUser) {
        throw new Error('اسم المستخدم موجود مسبقاً');
      }

      const existingPhone = await db.query.users.findFirst({
        where: eq(users.phoneNumber, userData.phoneNumber)
      });

      if (existingPhone) {
        throw new Error('رقم الهاتف موجود مسبقاً');
      }

      // حفظ كلمة المرور بدون تشفير
      const passwordToStore = storePassword(userData.password);

      // إنشاء المستخدم
      const [newUser] = await db.insert(users).values({
        username: userData.username,
        phoneNumber: userData.phoneNumber,
        passwordHash: passwordToStore,
        fullName: userData.fullName,
      }).returning();

      // إنشاء إعدادات افتراضية للمستخدم الجديد
      await UserSettingsService.createDefaultSettings(newUser.id);

      // طلب إذن الإشعارات وتسجيل الجهاز
      try {
        await NotificationService.registerForPushNotifications(newUser.id);
      } catch (error) {
        console.log('Push notification registration failed:', error);
      }

      return {
        success: true,
        user: {
          id: newUser.id,
          username: newUser.username,
          phoneNumber: newUser.phoneNumber,
          fullName: newUser.fullName,
          role: newUser.role as 'user' | 'admin',
          profileImageUrl: newUser.profileImageUrl,
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'خطأ في التسجيل'
      };
    }
  }

  // تسجيل الدخول
  static async login(username: string, password: string, ipAddress?: string) {
    console.log('=== AUTH SERVICE LOGIN STARTED ===');
    console.log('Input parameters:', { username, password: '***', ipAddress });
    
    try {
      console.log('Step 1: Connecting to database...');
      
      // البحث عن المستخدم
      console.log('Step 2: Searching for user in database...');
      const user = await db.query.users.findFirst({
        where: eq(users.username, username)
      });

      console.log('Step 3: Database query result:', JSON.stringify(user, null, 2));
      console.log('Step 3a: User exists?', !!user);
      console.log('Step 3b: User is active?', user?.isActive);

      if (!user) {
        console.log('Step 3c: USER NOT FOUND - no user with username:', username);
        await this.recordLoginAttempt(username, false, ipAddress);
        throw new Error('اسم المستخدم أو كلمة المرور غير صحيحة');
      }
      
      if (!user.isActive) {
        console.log('Step 3c: USER INACTIVE - user found but inactive');
        await this.recordLoginAttempt(username, false, ipAddress);
        throw new Error('اسم المستخدم أو كلمة المرور غير صحيحة');
      }
      
      console.log('Step 3c: USER FOUND AND ACTIVE - proceeding to password verification');

      // التحقق من كلمة المرور
      console.log('Step 4: Verifying password...');
      console.log('Step 4a: Input password:', password);
      console.log('Step 4b: Stored password:', user.passwordHash);
      
      const isPasswordValid = verifyPassword(password, user.passwordHash);
      console.log('Step 4c: Password verification result:', isPasswordValid);
      
      if (!isPasswordValid) {
        console.log('Step 4d: Password verification failed');
        await this.recordLoginAttempt(username, false, ipAddress);
        throw new Error('اسم المستخدم أو كلمة المرور غير صحيحة');
      }
      
      console.log('Step 4e: Password verification successful');

      // تسجيل محاولة تسجيل الدخول الناجحة
      console.log('Step 5: Recording successful login attempt...');
      await this.recordLoginAttempt(username, true, ipAddress);

      // إنشاء جلسة جديدة
      console.log('Step 6: Creating JWT token...');
      const token = jwt.encode(
        { userId: user.id, username: user.username },
        JWT_SECRET
      );
      console.log('Step 6a: JWT token created:', token.substring(0, 50) + '...');

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 أيام
      console.log('Step 6b: Session expires at:', expiresAt);

      // حذف الجلسات القديمة للمستخدم أولاً
      console.log('Step 7a: Deleting old sessions for user...');
      await db.delete(sessions).where(eq(sessions.userId, user.id));
      
      // إنشاء جلسة جديدة
      console.log('Step 7b: Creating new session in database...');
      await db.insert(sessions).values({
        userId: user.id,
        token,
        expiresAt,
      });
      console.log('Step 7c: Session created successfully');

      // طلب إذن الإشعارات وتسجيل الجهاز
      try {
        await NotificationService.registerForPushNotifications(user.id);
      } catch (error) {
        console.log('Push notification registration failed:', error);
      }

      const result = {
        success: true,
        token,
        user: {
          id: user.id,
          username: user.username,
          phoneNumber: user.phoneNumber,
          fullName: user.fullName,
          role: user.role,
          profileImageUrl: user.profileImageUrl,
        }
      };

      console.log('Step 8: Login successful, returning result:', JSON.stringify(result, null, 2));
      console.log('=== AUTH SERVICE LOGIN COMPLETED ===');
      return result;
    } catch (error) {
      console.log('=== AUTH SERVICE LOGIN ERROR ===');
      console.log('Error occurred:', error);
      console.log('Error type:', typeof error);
      console.log('Error message:', error instanceof Error ? error.message : 'Unknown error');
      console.log('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      
      const errorResult = {
        success: false,
        error: error instanceof Error ? error.message : 'خطأ في تسجيل الدخول'
      };
      
      console.log('Returning error result:', JSON.stringify(errorResult, null, 2));
      console.log('=== AUTH SERVICE LOGIN ERROR END ===');
      return errorResult;
    }
  }

  // تسجيل الخروج
  static async logout(token: string) {
    try {
      await db.delete(sessions).where(eq(sessions.token, token));
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'خطأ في تسجيل الخروج'
      };
    }
  }

  // التحقق من صحة التوكن
  static async verifyToken(token: string): Promise<AuthUser | null> {
    try {
      const decoded = jwt.decode(token, JWT_SECRET) as { userId: string; username: string };
      
      // التحقق من وجود الجلسة في قاعدة البيانات
      const session = await db.query.sessions.findFirst({
        where: and(
          eq(sessions.token, token),
          eq(sessions.userId, decoded.userId)
        )
      });

      if (!session || session.expiresAt < new Date()) {
        return null;
      }

      // تحديث آخر نشاط
      await db.update(sessions)
        .set({ lastActivity: new Date() })
        .where(eq(sessions.id, session.id));

      // جلب بيانات المستخدم
      const user = await db.query.users.findFirst({
        where: eq(users.id, decoded.userId)
      });

      if (!user || !user.isActive) {
        return null;
      }

      return {
        id: user.id,
        username: user.username,
        phoneNumber: user.phoneNumber,
        fullName: user.fullName,
        role: user.role as 'user' | 'admin',
      };
    } catch (error) {
      return null;
    }
  }

  // تسجيل محاولات تسجيل الدخول
  private static async recordLoginAttempt(username: string, success: boolean, ipAddress?: string) {
    try {
      await db.insert(loginAttempts).values({
        username,
        ipAddress,
        success,
      });
    } catch (error) {
      console.error('Error recording login attempt:', error);
    }
  }

  // تنظيف الجلسات المنتهية
  static async cleanupExpiredSessions() {
    try {
      await db.delete(sessions).where(lt(sessions.expiresAt, new Date()));
    } catch (error) {
      console.error('Error cleaning up expired sessions:', error);
    }
  }

  // تغيير كلمة المرور
  static async changePassword(userId: string, currentPassword: string, newPassword: string) {
    try {
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId)
      });

      if (!user) {
        throw new Error('المستخدم غير موجود');
      }

      // التحقق من كلمة المرور الحالية
      const isCurrentPasswordValid = verifyPassword(currentPassword, user.passwordHash);
      if (!isCurrentPasswordValid) {
        throw new Error('كلمة المرور الحالية غير صحيحة');
      }

      // حفظ كلمة المرور الجديدة بدون تشفير
      const newPasswordToStore = storePassword(newPassword);

      // تحديث كلمة المرور
      await db.update(users)
        .set({ passwordHash: newPasswordToStore })
        .where(eq(users.id, userId));

      // حذف جميع الجلسات الحالية
      await db.delete(sessions).where(eq(sessions.userId, userId));

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'خطأ في تغيير كلمة المرور'
      };
    }
  }

  // تحديث صورة البروفايل
  static async updateProfileImage(userId: string, imageUri: string) {
    try {
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId)
      });

      if (!user) {
        throw new Error('المستخدم غير موجود');
      }

      // رفع الصورة إلى Cloudinary
      console.log('Uploading image to Cloudinary...');
      const cloudinaryUrl = await CloudinaryService.uploadImage(imageUri);
      console.log('Image uploaded successfully:', cloudinaryUrl);

      // حذف الصورة القديمة من Cloudinary إذا وجدت
      if (user.profileImageUrl) {
        const oldPublicId = CloudinaryService.getPublicIdFromUrl(user.profileImageUrl);
        if (oldPublicId) {
          await CloudinaryService.deleteImage(oldPublicId);
        }
      }

      // تحديث صورة البروفايل في قاعدة البيانات
      await db.update(users)
        .set({ profileImageUrl: cloudinaryUrl })
        .where(eq(users.id, userId));

      return { 
        success: true,
        profileImageUrl: cloudinaryUrl
      };
    } catch (error) {
      console.error('Error updating profile image:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'خطأ في تحديث صورة البروفايل'
      };
    }
  }

  // تحديث بيانات البروفايل
  static async updateProfile(userId: string, updates: {
    fullName?: string;
    username?: string;
    phoneNumber?: string;
  }) {
    try {
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId)
      });

      if (!user) {
        throw new Error('المستخدم غير موجود');
      }

      // التحقق من عدم تكرار اسم المستخدم إذا تم تغييره
      if (updates.username && updates.username !== user.username) {
        const existingUser = await db.query.users.findFirst({
          where: eq(users.username, updates.username)
        });

        if (existingUser) {
          throw new Error('اسم المستخدم موجود مسبقاً');
        }
      }

      // التحقق من عدم تكرار رقم الهاتف إذا تم تغييره
      if (updates.phoneNumber && updates.phoneNumber !== user.phoneNumber) {
        const existingPhone = await db.query.users.findFirst({
          where: eq(users.phoneNumber, updates.phoneNumber)
        });

        if (existingPhone) {
          throw new Error('رقم الهاتف موجود مسبقاً');
        }
      }

      // تحديث البيانات
      await db.update(users)
        .set(updates)
        .where(eq(users.id, userId));

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'خطأ في تحديث البيانات'
      };
    }
  }
}