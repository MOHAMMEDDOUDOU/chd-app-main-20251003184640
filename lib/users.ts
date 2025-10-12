import { db } from './database/config';
import { users, orders, sessions, notifications, conversations, messages, resellLinks } from './database/config';
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

// حذف حساب المستخدم نهائياً (مع الاعتماد على onDelete: 'cascade' في العلاقات)
export async function deleteUserAccount(userId: string) {
  try {
    // فك أي مراجع قد تمنع الحذف (أعمدة ليست عليها onDelete:cascade)
    await db.update(orders).set({ sellerId: null }).where(eq(orders.sellerId, userId));
    await db.update(orders).set({ resellerUserId: null }).where(eq(orders.resellerUserId, userId));

    // حذف الجلسات والتنبيهات والروابط - معظمها مفعّل عليها cascade لكن لا ضرر من محاولة التنظيف المسبق
    await db.delete(sessions).where(eq(sessions.userId, userId));
    await db.delete(notifications).where(eq(notifications.userId, userId));
    await db.delete(resellLinks).where(eq(resellLinks.userId, userId));
    await db.delete(messages).where(eq(messages.senderId, userId));
    await db.delete(messages).where(eq(messages.receiverId, userId));
    await db.delete(conversations).where(eq(conversations.userId, userId));

    const deleted = await db.delete(users).where(eq(users.id, userId)).returning();
    if (!deleted || deleted.length === 0) {
      return { success: false, error: 'المستخدم غير موجود' };
    }
    return { success: true };
  } catch (error) {
    console.error('Error deleting user account:', error);
    // Fallback: إخفاء/إبطال الحساب ومسح البيانات الشخصية (امتثال 5.1.1(v))
    try {
      await db.update(users)
        .set({
          isActive: false,
          fullName: 'Deleted User',
          username: `deleted_${userId.substring(0, 6)}`,
          phoneNumber: 'deleted',
          profileImageUrl: null,
          pushToken: null,
        })
        .where(eq(users.id, userId));
      await db.delete(sessions).where(eq(sessions.userId, userId));
      return { success: true };
    } catch (scrubError) {
      console.error('Error scrubbing user data:', scrubError);
      return { success: false, error: 'فشل في حذف/تعطيل الحساب' };
    }
  }
}

// جلب جميع المستخدمين (لا تُرجع كلمات سر)
export async function listUsers() {
  try {
    const rows = await db.select({
      id: users.id,
      username: users.username,
      fullName: users.fullName,
      phoneNumber: users.phoneNumber,
      role: users.role,
      isActive: users.isActive,
      createdAt: users.createdAt,
      profileImageUrl: users.profileImageUrl,
    }).from(users);
    return { success: true, users: rows };
  } catch (error) {
    console.error('Error listing users:', error);
    return { success: false, error: 'فشل في جلب المستخدمين' };
  }
}
