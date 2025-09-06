import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, User, Phone, LogOut, Camera, Edit3, Save, X } from 'lucide-react-native';
import { useUser } from '../lib/userContext';
import UserAvatar from '../components/UserAvatar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { AuthService } from '../lib/auth';
import { CloudinaryService } from '../lib/cloudinary';
import { updateUserProfile } from '../lib/users';
import { UserSettingsService } from '../lib/notifications';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, isLoading } = useUser();
  
  // State for editing profile
  const [showEditModal, setShowEditModal] = React.useState(false);
  const [editData, setEditData] = React.useState({
    fullName: user?.fullName || '',
    username: user?.username || '',
    phoneNumber: user?.phoneNumber || '',
    profileImageUrl: user?.profileImageUrl || '',
  });
  const [isUpdating, setIsUpdating] = React.useState(false);
  const [localUser, setLocalUser] = React.useState(user);

  // State for notifications
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const [isLoadingSettings, setIsLoadingSettings] = React.useState(false);

  // إضافة useEffect لمراقبة تغييرات المستخدم
  React.useEffect(() => {
    if (user) {
      setLocalUser(user);
      setEditData({
        fullName: user.fullName || '',
        username: user.username || '',
        phoneNumber: user.phoneNumber || '',
        profileImageUrl: user.profileImageUrl || '',
      });
      
      // تحميل إعدادات المستخدم
      loadUserSettings();
    }
  }, [user]);

  // تحميل إعدادات المستخدم
  const loadUserSettings = async () => {
    if (!user?.id) return;
    
    try {
      setIsLoadingSettings(true);
      const result = await UserSettingsService.getUserSettings(user.id);
      
      if (result.success && result.settings) {
        setNotificationsEnabled(result.settings.notificationsEnabled);
      }
    } catch (error) {
      console.error('Error loading user settings:', error);
    } finally {
      setIsLoadingSettings(false);
    }
  };

  // تحديث إعدادات الإشعارات
  const updateNotificationSettings = async (enabled: boolean) => {
    if (!user?.id) return;
    
    try {
      setIsLoadingSettings(true);
      const result = await UserSettingsService.updateUserSettings(user.id, enabled);
      
      if (result.success) {
        setNotificationsEnabled(enabled);
        Alert.alert('نجح', enabled ? 'تم تفعيل الإشعارات' : 'تم إيقاف الإشعارات');
      } else {
        Alert.alert('خطأ', result.error || 'فشل في تحديث الإعدادات');
      }
    } catch (error) {
      console.error('Error updating notification settings:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء تحديث الإعدادات');
    } finally {
      setIsLoadingSettings(false);
    }
  };

  // إضافة useEffect لتحميل البيانات عند فتح الشاشة
  React.useEffect(() => {
    const checkFakeData = async () => {
      try {
        const userData = await AsyncStorage.getItem('user');
        
        if (userData) {
          const parsedUser = JSON.parse(userData);
          
          // حذف البيانات المزيفة فقط
          if (parsedUser.username === 'testuser' || parsedUser.fullName === 'مستخدم تجريبي') {
            await AsyncStorage.removeItem('user');
            router.replace('/login');
          }
        }
      } catch (error) {
        console.log('Error checking fake data:', error);
      }
    };
    
    checkFakeData();
  }, []);

  // إعادة تحميل البيانات إذا كانت فارغة
  React.useEffect(() => {
    if (!isLoading && !user) {
      const reloadUserData = async () => {
        try {
          const userData = await AsyncStorage.getItem('user');
          if (userData) {
            const parsedUser = JSON.parse(userData);
            if (parsedUser.username !== 'testuser' && parsedUser.fullName !== 'مستخدم تجريبي') {
              // إعادة تحميل البيانات الصحيحة
              console.log('Reloading valid user data');
            }
          }
        } catch (error) {
          console.log('Error reloading user data:', error);
        }
      };
      
      reloadUserData();
    }
  }, [isLoading, user]);

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        
        // إظهار رسالة التحميل
        Alert.alert('جاري التحميل', 'يرجى الانتظار...', [], { cancelable: false });
        
        // رفع الصورة إلى Cloudinary
        const cloudinaryUrl = await CloudinaryService.uploadImage(imageUri);
        
        // إغلاق رسالة التحميل
        Alert.alert('تم التحميل', 'تم رفع الصورة بنجاح');
        
        if (cloudinaryUrl) {
          setEditData(prev => ({ ...prev, profileImageUrl: cloudinaryUrl }));
        } else {
          Alert.alert('خطأ', 'فشل في رفع الصورة');
        }
      }
    } catch (error) {
      console.log('Error picking image:', error);
      Alert.alert('خطأ', 'فشل في اختيار الصورة');
    }
  };



  const updateProfileData = async () => {
    if (!editData.fullName.trim() || !editData.username.trim() || !editData.phoneNumber.trim()) {
      Alert.alert('خطأ', 'يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    if (!user?.id) {
      Alert.alert('خطأ', 'معرف المستخدم غير متوفر');
      return;
    }

    try {
      setIsUpdating(true);
      
      // استخدام الدالة الجديدة لتحديث الملف الشخصي
      const result = await updateUserProfile(user.id, {
        fullName: editData.fullName.trim(),
        username: editData.username.trim(),
        phoneNumber: editData.phoneNumber.trim(),
        profileImageUrl: editData.profileImageUrl,
      });

      if (result.success && result.user) {
        console.log('Profile update successful:', result.user);
        
        // تحديث البيانات في AsyncStorage
        const updatedUserData = { ...user, ...result.user };
        await AsyncStorage.setItem('user', JSON.stringify(updatedUserData));
        
        // إغلاق نافذة التعديل مباشرة
        setShowEditModal(false);
        
        // تحديث البيانات المحلية مباشرة
        setLocalUser(updatedUserData as any);
        
        Alert.alert('نجح', 'تم تحديث البيانات بنجاح');
      } else {
        console.log('Profile update failed:', result.error);
        Alert.alert('خطأ', result.error || 'فشل في تحديث البيانات');
      }
    } catch (error) {
      console.log('Error updating profile:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء تحديث البيانات');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'تسجيل الخروج',
      'هل أنت متأكد من تسجيل الخروج؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'تسجيل الخروج',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              router.replace('/login');
            } catch (error) {
              console.log('Error during logout:', error);
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>جاري تحميل البيانات...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>جاري تحميل البيانات...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/(tabs)');
              }
            }}
          >
            <ArrowLeft size={24} color="#666" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>الملف الشخصي</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Profile Info */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
                      <UserAvatar 
            username={localUser?.username || user?.username} 
            fullName={localUser?.fullName || user?.fullName}
            profileImageUrl={localUser?.profileImageUrl || user?.profileImageUrl}
            size={120}
            fontSize={48}
          />
        </View>
        <Text style={styles.userName}>{localUser?.fullName || user?.fullName || 'غير محدد'}</Text>
        <Text style={styles.userUsername}>@{localUser?.username || user?.username || 'غير محدد'}</Text>
        <Text style={styles.userPhone}>{localUser?.phoneNumber || user?.phoneNumber || 'غير محدد'}</Text>
          
          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => setShowEditModal(true)}
            activeOpacity={0.7}
          >
            <Edit3 size={20} color="#FFFFFF" />
            <Text style={styles.editButtonText}>تعديل</Text>
          </TouchableOpacity>
        </View>

        {/* User Details Section */}
        <View style={styles.detailsSection}>
          <Text style={styles.sectionTitle}>المعلومات الشخصية</Text>
          
          <View style={styles.detailItem}>
            <User size={20} color="#9CA3AF" />
            <View style={styles.detailField}>
              <Text style={styles.detailLabel}>الاسم الكامل</Text>
              <Text style={styles.detailValue}>{localUser?.fullName || user?.fullName || 'غير محدد'}</Text>
            </View>
          </View>

          <View style={styles.detailItem}>
            <User size={20} color="#9CA3AF" />
            <View style={styles.detailField}>
              <Text style={styles.detailLabel}>اسم المستخدم</Text>
              <Text style={styles.detailValue}>@{localUser?.username || user?.username || 'غير محدد'}</Text>
            </View>
          </View>

          <View style={styles.detailItem}>
            <Phone size={20} color="#9CA3AF" />
            <View style={styles.detailField}>
              <Text style={styles.detailLabel}>رقم الهاتف</Text>
              <Text style={styles.detailValue}>{localUser?.phoneNumber || user?.phoneNumber || 'غير محدد'}</Text>
            </View>
          </View>
        </View>

        {/* Notifications Section */}
        <View style={styles.notificationsSection}>
          <Text style={styles.sectionTitle}>إعدادات الإشعارات</Text>
          
          <View style={styles.notificationItem}>
            <View style={styles.notificationInfo}>
              <Text style={styles.notificationLabel}>الإشعارات</Text>
              <Text style={styles.notificationDescription}>استلام إشعارات للأخبار والطلبات والعروض الجديدة</Text>
            </View>
            <TouchableOpacity
              style={[styles.toggleButton, notificationsEnabled && styles.toggleButtonActive]}
              onPress={() => updateNotificationSettings(!notificationsEnabled)}
              disabled={isLoadingSettings}
            >
              <View style={[styles.toggleCircle, notificationsEnabled && styles.toggleCircleActive]} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogOut size={20} color="#EF4444" />
          <Text style={styles.logoutText}>تسجيل الخروج</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal visible={showEditModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>تعديل الملف الشخصي</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowEditModal(false)}
              >
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              {/* Profile Image */}
              <View style={styles.imageSection}>
                <UserAvatar 
                  username={editData.username} 
                  fullName={editData.fullName}
                  profileImageUrl={editData.profileImageUrl}
                  size={100}
                  fontSize={40}
                />
                                 <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
                   <Camera size={16} color="#FF6B35" />
                   <Text style={styles.imageButtonText}>اختيار صورة</Text>
                 </TouchableOpacity>
              </View>

              {/* Form Fields */}
              <View style={styles.formSection}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>الاسم الكامل</Text>
                  <TextInput
                    style={styles.textInput}
                    value={editData.fullName}
                    placeholder="أدخل الاسم الكامل"
                    placeholderTextColor="#9CA3AF"
                    onChangeText={(text) => setEditData(prev => ({ ...prev, fullName: text }))}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>اسم المستخدم</Text>
                  <TextInput
                    style={styles.textInput}
                    value={editData.username}
                    placeholder="أدخل اسم المستخدم"
                    placeholderTextColor="#9CA3AF"
                    onChangeText={(text) => setEditData(prev => ({ ...prev, username: text }))}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>رقم الهاتف</Text>
                  <TextInput
                    style={styles.textInput}
                    value={editData.phoneNumber}
                    placeholder="أدخل رقم الهاتف"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="phone-pad"
                    onChangeText={(text) => setEditData(prev => ({ ...prev, phoneNumber: text }))}
                  />
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setShowEditModal(false)}
              >
                <Text style={styles.cancelButtonText}>إلغاء</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.saveButton, isUpdating && styles.saveButtonDisabled]}
                onPress={updateProfileData}
                disabled={isUpdating}
              >
                <Save size={20} color="#FFFFFF" />
                <Text style={styles.saveButtonText}>
                  {isUpdating ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  placeholder: {
    width: 40,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  avatarContainer: {
    marginBottom: 16,
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginHorizontal: 20,
    marginBottom: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  userUsername: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 4,
  },
  userPhone: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  notificationsSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 20,
    textAlign: 'center',
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  notificationInfo: {
    flex: 1,
  },
  notificationLabel: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
    marginBottom: 4,
  },
  notificationDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  toggleButton: {
    width: 50,
    height: 28,
    backgroundColor: '#E5E7EB',
    borderRadius: 14,
    padding: 2,
    justifyContent: 'center',
  },
  toggleButtonActive: {
    backgroundColor: '#FF6B35',
  },
  toggleCircle: {
    width: 24,
    height: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleCircleActive: {
    transform: [{ translateX: 22 }],
  },
  logoutButton: {
    backgroundColor: '#EF4444',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    marginBottom: 30,
    gap: 12,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '90%',
    maxWidth: 400,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  closeButton: {
    padding: 8,
  },
  modalContent: {
    padding: 20,
  },
  imageSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  imageButton: {
    alignItems: 'center',
    paddingVertical: 10,
    marginTop: 10,
  },
  imageButtonText: {
    fontSize: 12,
    color: '#FF6B35',
    marginTop: 5,
  },
  formSection: {
    marginTop: 20,
  },
  inputGroup: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginRight: 10,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#FF6B35',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginLeft: 10,
  },
  saveButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  saveButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
    marginLeft: 8,
  },
  detailsSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  detailField: {
    flex: 1,
    marginLeft: 12,
  },
  detailLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
});
