import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  RefreshControl,
} from 'react-native';
import { Bell, Package, Tag, MessageSquare, Check } from 'lucide-react-native';
import { NotificationService } from '../lib/notifications';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'order' | 'news' | 'offer';
  isRead: boolean;
  createdAt: string;
}

interface NotificationsListProps {
  userId: string;
  onClose: () => void;
}

export default function NotificationsList({ userId, onClose }: NotificationsListProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const result = await NotificationService.getUserNotifications(userId);
      
      if (result.success && result.notifications) {
        setNotifications(result.notifications);
      } else {
        console.error('Error loading notifications:', result.error);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  useEffect(() => {
    loadNotifications();
  }, [userId]);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const result = await NotificationService.markAsRead(notificationId);
      
      if (result.success) {
        // تحديث حالة الإشعار في القائمة
        setNotifications(prev => 
          prev.map(notification => 
            notification.id === notificationId 
              ? { ...notification, isRead: true }
              : notification
          )
        );
      } else {
        Alert.alert('خطأ', result.error || 'فشل في تحديث حالة الإشعار');
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء تحديث حالة الإشعار');
    }
  };


  const handleMarkAllAsRead = async () => {
    try {
      const result = await NotificationService.markAllAsRead(userId);
      
      if (result.success) {
        // تحديث جميع الإشعارات كمقروءة
        setNotifications(prev => 
          prev.map(notification => ({ ...notification, isRead: true }))
        );
        Alert.alert('نجح', 'تم تحديد جميع الإشعارات كمقروءة');
      } else {
        Alert.alert('خطأ', result.error || 'فشل في تحديث الإشعارات');
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء تحديث الإشعارات');
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'order':
        return <Package size={20} color="#3B82F6" />;
      case 'offer':
        return <Tag size={20} color="#10B981" />;
      case 'news':
        return <MessageSquare size={20} color="#F59E0B" />;
      default:
        return <Bell size={20} color="#6B7280" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'order':
        return '#3B82F6';
      case 'offer':
        return '#10B981';
      case 'news':
        return '#F59E0B';
      default:
        return '#6B7280';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'منذ دقائق';
    } else if (diffInHours < 24) {
      return `منذ ${diffInHours} ساعة`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `منذ ${diffInDays} يوم`;
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>الإشعارات</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>إغلاق</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>جاري تحميل الإشعارات...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>الإشعارات</Text>
        <View style={styles.headerActions}>
          {notifications.some(n => !n.isRead) && (
            <TouchableOpacity style={styles.markAllButton} onPress={handleMarkAllAsRead}>
              <Check size={16} color="#FFFFFF" />
              <Text style={styles.markAllButtonText}>تحديد الكل كمقروء</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>إغلاق</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {notifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Bell size={64} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>لا توجد إشعارات</Text>
            <Text style={styles.emptyText}>
              ستظهر هنا الإشعارات الجديدة عند وصولها
            </Text>
          </View>
        ) : (
          notifications.map((notification) => (
            <View
              key={notification.id}
              style={[
                styles.notificationItem,
                !notification.isRead && styles.unreadNotification
              ]}
            >
              <View style={styles.notificationHeader}>
                <View style={styles.notificationIcon}>
                  {getNotificationIcon(notification.type)}
                </View>
                <View style={styles.notificationInfo}>
                  <Text style={styles.notificationTitle}>{notification.title}</Text>
                  <Text style={styles.notificationTime}>
                    {formatDate(notification.createdAt)}
                  </Text>
                </View>
                <View style={styles.notificationActions}>
                  {!notification.isRead && (
                    <TouchableOpacity
                      style={styles.markAsReadButton}
                      onPress={() => handleMarkAsRead(notification.id)}
                    >
                      <Check size={16} color="#3B82F6" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
              <Text style={styles.notificationMessage}>{notification.message}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  markAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  markAllButtonText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  closeButton: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  closeButtonText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  notificationItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  unreadNotification: {
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
    backgroundColor: '#F0F9FF',
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationInfo: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 2,
  },
  notificationTime: {
    fontSize: 12,
    color: '#6B7280',
  },
  notificationActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  markAsReadButton: {
    padding: 4,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 50,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 20,
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
});
