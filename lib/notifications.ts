import { db, notifications, userSettings, users } from './database/config';
import { eq, and, desc } from 'drizzle-orm';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface NotificationData {
  title: string;
  message: string;
  type: 'order' | 'news' | 'offer';
}

export class NotificationService {
  // Register for push notifications
  static async registerForPushNotifications(userId?: string) {
    let token;
    
    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return null;
      }
      
      token = (await Notifications.getExpoPushTokenAsync({
        projectId: 'your-expo-project-id', // Replace with your Expo project ID
      })).data;

      // حفظ رمز الإشعارات في قاعدة البيانات إذا تم تمرير معرف المستخدم
      if (token && userId) {
        try {
          await db.update(users)
            .set({ pushToken: token })
            .where(eq(users.id, userId));
          console.log('Push token saved to database for user:', userId);
        } catch (error) {
          console.error('Error saving push token:', error);
        }
      }
    } else {
      console.log('Must use physical device for Push Notifications');
    }

    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF6B35',
      });
    }

    return token;
  }

  // Send local notification
  static async sendLocalNotification(title: string, body: string, data?: any) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
      },
      trigger: null, // Send immediately
    });
  }

  // Send push notification to specific user
  static async sendPushNotification(userId: string, title: string, body: string, data?: any) {
    try {
      // Get user's push token from database (you'll need to store this)
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
      });

      if (!user?.pushToken) {
        console.log('User has no push token');
        return { success: false, error: 'User has no push token' };
      }

      // Send via Expo push service
      const message = {
        to: user.pushToken,
        sound: 'default',
        title,
        body,
        data,
      };

      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      return { success: true };
    } catch (error) {
      console.error('Error sending push notification:', error);
      return { success: false, error: 'Failed to send push notification' };
    }
  }

  // Create notification and send push
  static async createNotificationWithPush(userId: string, data: NotificationData) {
    try {
      // Check user settings
      const settingsResult = await UserSettingsService.getUserSettings(userId);
      if (!settingsResult.success || !settingsResult.settings?.notificationsEnabled) {
        return { success: false, error: 'الإشعارات معطلة للمستخدم' };
      }

      // Create notification in database
      const [newNotification] = await db.insert(notifications).values({
        userId,
        title: data.title,
        message: data.message,
        type: data.type,
      }).returning();

      // Send push notification
      await this.sendPushNotification(userId, data.title, data.message, {
        notificationId: newNotification.id,
        type: data.type,
      });

      return { success: true, notification: newNotification };
    } catch (error) {
      console.error('Error creating notification with push:', error);
      return { success: false, error: 'فشل في إنشاء الإشعار' };
    }
  }

  // إنشاء إشعار جديد
  static async createNotification(userId: string, data: NotificationData) {
    try {
      // التحقق من إعدادات المستخدم
      const settingsResult = await UserSettingsService.getUserSettings(userId);
      if (!settingsResult.success || !settingsResult.settings?.notificationsEnabled) {
        return { success: false, error: 'الإشعارات معطلة للمستخدم' };
      }

      const [newNotification] = await db.insert(notifications).values({
        userId,
        title: data.title,
        message: data.message,
        type: data.type,
      }).returning();

      return { success: true, notification: newNotification };
    } catch (error) {
      console.error('Error creating notification:', error);
      return { success: false, error: 'فشل في إنشاء الإشعار' };
    }
  }

  // جلب إشعارات المستخدم
  static async getUserNotifications(userId: string, limit: number = 20) {
    try {
      const userNotifications = await db.query.notifications.findMany({
        where: eq(notifications.userId, userId),
        orderBy: [desc(notifications.createdAt)],
        limit,
      });

      return { success: true, notifications: userNotifications };
    } catch (error) {
      console.error('Error getting user notifications:', error);
      return { success: false, error: 'فشل في جلب الإشعارات' };
    }
  }

  // تحديد الإشعار كمقروء
  static async markAsRead(notificationId: string) {
    try {
      await db.update(notifications)
        .set({ isRead: true })
        .where(eq(notifications.id, notificationId));

      return { success: true };
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return { success: false, error: 'فشل في تحديث حالة الإشعار' };
    }
  }

  // تحديد جميع إشعارات المستخدم كمقروءة
  static async markAllAsRead(userId: string) {
    try {
      await db.update(notifications)
        .set({ isRead: true })
        .where(eq(notifications.userId, userId));

      return { success: true };
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return { success: false, error: 'فشل في تحديث حالة الإشعارات' };
    }
  }

  // حذف إشعار
  static async deleteNotification(notificationId: string) {
    try {
      await db.delete(notifications)
        .where(eq(notifications.id, notificationId));

      return { success: true };
    } catch (error) {
      console.error('Error deleting notification:', error);
      return { success: false, error: 'فشل في حذف الإشعار' };
    }
  }

  // جلب عدد الإشعارات غير المقروءة
  static async getUnreadCount(userId: string) {
    try {
      const result = await db.select({ count: notifications.id })
        .from(notifications)
        .where(and(
          eq(notifications.userId, userId),
          eq(notifications.isRead, false)
        ));

      return { success: true, count: result.length };
    } catch (error) {
      console.error('Error getting unread count:', error);
      return { success: false, error: 'فشل في جلب عدد الإشعارات' };
    }
  }

  // إنشاء إشعارات للطلبات الجديدة (للأدمن والبائع)
  static async notifyAdminAndSellerForNewOrder(orderData: any) {
    try {
      // جلب جميع المستخدمين الأدمن
      const adminUsers = await db.query.users.findMany({
        where: eq(users.role, 'admin'),
      });

      // إنشاء إشعار لكل أدمن
      const adminNotifications = adminUsers.map(admin =>
        this.createNotification(admin.id, {
          title: 'طلبية جديدة',
          message: `طلبية جديدة: ${orderData.itemName} من ${orderData.customerName} - البائع: ${orderData.sellerName || 'غير محدد'}`,
          type: 'order',
        })
      );

      // إنشاء إشعار للبائع (إذا كان موجود)
      let sellerNotifications = [];
      if (orderData.sellerId) {
        sellerNotifications.push(
          this.createNotification(orderData.sellerId, {
            title: 'طلبية جديدة',
            message: `طلبية جديدة: ${orderData.itemName} من ${orderData.customerName}`,
            type: 'order',
          })
        );
      }

      // إرسال جميع الإشعارات
      await Promise.all([...adminNotifications, ...sellerNotifications]);
      return { success: true };
    } catch (error) {
      console.error('Error notifying admin and seller for new order:', error);
      return { success: false, error: 'فشل في إرسال إشعار للأدمن والبائع' };
    }
  }

  // إنشاء إشعارات فورية للعروض الجديدة (للمستخدمين العاديين فقط)
  static async notifyUsersForNewOffer(offerData: any) {
    try {
      // جلب جميع المستخدمين العاديين النشطين (غير الأدمن)
      const regularUsers = await db.query.users.findMany({
        where: and(
          eq(users.isActive, true),
          eq(users.role, 'user')
        ),
      });

      // إنشاء إشعار فوري لكل مستخدم عادي
      const notificationPromises = regularUsers.map(user =>
        this.createNotificationWithPush(user.id, {
          title: 'عرض جديد! 🎯',
          message: `عرض جديد: ${offerData.name} - ${offerData.price} دج`,
          type: 'offer',
        })
      );

      await Promise.all(notificationPromises);
      return { success: true };
    } catch (error) {
      console.error('Error notifying users for new offer:', error);
      return { success: false, error: 'فشل في إرسال إشعارات للعروض الجديدة' };
    }
  }

  // إنشاء إشعارات فورية للمنتجات الجديدة (للمستخدمين العاديين فقط)
  static async notifyUsersForNewProduct(productData: any) {
    try {
      // جلب جميع المستخدمين العاديين النشطين (غير الأدمن)
      const regularUsers = await db.query.users.findMany({
        where: and(
          eq(users.isActive, true),
          eq(users.role, 'user')
        ),
      });

      // إنشاء إشعار فوري لكل مستخدم عادي
      const notificationPromises = regularUsers.map(user =>
        this.createNotificationWithPush(user.id, {
          title: 'منتج جديد! 🎉',
          message: `منتج جديد: ${productData.name} - ${productData.price} دج`,
          type: 'product',
        })
      );

      await Promise.all(notificationPromises);
      return { success: true };
    } catch (error) {
      console.error('Error notifying users for new product:', error);
      return { success: false, error: 'فشل في إرسال إشعارات للمنتجات الجديدة' };
    }
  }

  // إنشاء إشعار لجميع المستخدمين
  static async createNotificationForAllUsers(notificationData: NotificationData) {
    try {
      // جلب جميع المستخدمين العاديين النشطين (غير الأدمن)
      const regularUsers = await db.query.users.findMany({
        where: and(
          eq(users.isActive, true),
          eq(users.role, 'user')
        ),
      });

      // إنشاء إشعار لكل مستخدم عادي
      const notificationPromises = regularUsers.map(user =>
        this.createNotification(user.id, notificationData)
      );

      await Promise.all(notificationPromises);
      return { success: true };
    } catch (error) {
      console.error('Error creating notifications for all users:', error);
      return { success: false, error: 'فشل في إرسال الإشعارات' };
    }
  }
}

// دالة مساعدة لإنشاء إشعار لجميع المستخدمين
export async function createNotificationForAllUsers(notificationData: NotificationData) {
  return await NotificationService.createNotificationForAllUsers(notificationData);
}

// خدمات إعدادات المستخدم
export class UserSettingsService {
  // جلب إعدادات المستخدم
  static async getUserSettings(userId: string) {
    try {
      const settings = await db.query.userSettings.findFirst({
        where: eq(userSettings.userId, userId),
      });

      return { success: true, settings };
    } catch (error) {
      console.error('Error getting user settings:', error);
      return { success: false, error: 'فشل في جلب إعدادات المستخدم' };
    }
  }

  // إنشاء أو تحديث إعدادات المستخدم
  static async updateUserSettings(userId: string, notificationsEnabled: boolean) {
    try {
      const existingSettings = await db.query.userSettings.findFirst({
        where: eq(userSettings.userId, userId),
      });

      if (existingSettings) {
        // تحديث الإعدادات الموجودة
        const [updatedSettings] = await db.update(userSettings)
          .set({ 
            notificationsEnabled,
            updatedAt: new Date(),
          })
          .where(eq(userSettings.userId, userId))
          .returning();

        return { success: true, settings: updatedSettings };
      } else {
        // إنشاء إعدادات جديدة
        const [newSettings] = await db.insert(userSettings)
          .values({
            userId,
            notificationsEnabled,
          })
          .returning();

        return { success: true, settings: newSettings };
      }
    } catch (error) {
      console.error('Error updating user settings:', error);
      return { success: false, error: 'فشل في تحديث إعدادات المستخدم' };
    }
  }

  // إنشاء إعدادات افتراضية للمستخدم الجديد
  static async createDefaultSettings(userId: string) {
    try {
      const [settings] = await db.insert(userSettings)
        .values({
          userId,
          notificationsEnabled: true, // الإشعارات مفعلة افتراضياً
        })
        .returning();

      return { success: true, settings };
    } catch (error) {
      console.error('Error creating default settings:', error);
      return { success: false, error: 'فشل في إنشاء الإعدادات الافتراضية' };
    }
  }
}
