import React, { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// تكوين سلوك الإشعارات
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

interface NotificationHandlerProps {
  children: React.ReactNode;
}

export default function NotificationHandler({ children }: NotificationHandlerProps) {
  const notificationListener = useRef<any>();
  const responseListener = useRef<any>();

  useEffect(() => {
    // إعداد قناة الإشعارات للأندرويد
    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF6B35',
        sound: 'default',
      });
    }

    // الاستماع للإشعارات الواردة
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
    });

    // الاستماع لاستجابة المستخدم على الإشعار
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response:', response);
      
      // يمكنك هنا إضافة منطق للتنقل إلى صفحة معينة عند الضغط على الإشعار
      const data = response.notification.request.content.data;
      if (data?.type === 'product' || data?.type === 'offer') {
        // التنقل إلى صفحة المنتجات أو العروض
        console.log('Navigate to products/offers page');
      }
    });

    return () => {
      // تنظيف المستمعين عند إزالة المكون
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  return <>{children}</>;
}
