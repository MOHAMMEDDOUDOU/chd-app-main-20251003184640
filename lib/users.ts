import { db } from './database/config';
import { users } from './database/config';
import { eq } from 'drizzle-orm';

export interface UpdateUserData {
  fullName: string;
  username: string;
  phoneNumber: string;
  profileImageUrl?: string;
}

// تحديث بيانات المستخدم
export async function updateUserProfile(userId: string, data: UpdateUserData) {
  try {
    console.log('=== UPDATE USER PROFILE STARTED ===');
    console.log('User ID:', userId);
    console.log('Update data:', data);

    // التحقق من وجود البيانات المطلوبة
    if (!data.fullName || !data.username || !data.phoneNumber) {
      console.log('Validation failed: missing required fields');
      return {
        success: false,
        error: 'جميع الحقول مطلوبة'
      };
    }

    // البحث عن المستخدم
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    console.log('Found user:', existingUser);

    if (existingUser.length === 0) {
      console.log('User not found');
      return {
        success: false,
        error: 'المستخدم غير موجود'
      };
    }

    // تحديث بيانات المستخدم
    const updateData = {
      fullName: data.fullName,
      username: data.username,
      phoneNumber: data.phoneNumber,
      profileImageUrl: data.profileImageUrl || null,
      updatedAt: new Date(),
    };

    console.log('Update data:', updateData);

    const updatedUser = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning();

    console.log('Updated user result:', updatedUser);

    if (updatedUser.length === 0) {
      console.log('Update failed');
      return {
        success: false,
        error: 'فشل في تحديث البيانات'
      };
    }

    console.log('Update successful, returning:', updatedUser[0]);
    return {
      success: true,
      user: updatedUser[0]
    };

  } catch (error) {
    console.error('Error updating user profile:', error);
    return {
      success: false,
      error: 'حدث خطأ في الخادم'
    };
  }
}

// الحصول على بيانات المستخدم بواسطة ID
export async function getUserById(userId: string) {
  try {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (result.length === 0) {
      return {
        success: false,
        error: 'المستخدم غير موجود'
      };
    }

    return {
      success: true,
      user: result[0]
    };
  } catch (error) {
    console.error('Error fetching user:', error);
    return {
      success: false,
      error: 'فشل في جلب بيانات المستخدم'
    };
  }
}

// Update user's push notification token
export async function updateUserPushToken(userId: string, pushToken: string) {
  try {
    const [updatedUser] = await db.update(users)
      .set({ 
        pushToken,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    
    if (!updatedUser) {
      return {
        success: false,
        error: 'المستخدم غير موجود'
      };
    }
    
    return {
      success: true,
      user: updatedUser
    };
  } catch (error) {
    console.error('Error updating push token:', error);
    return {
      success: false,
      error: 'فشل في تحديث رمز الإشعارات'
    };
  }
}
