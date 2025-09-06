import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, User, Lock, Eye, EyeOff } from 'lucide-react-native';
import { AuthService } from '../lib/auth';
import { useUser } from '../lib/userContext';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useUser();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleLogin = async () => {
    console.log('=== LOGIN ATTEMPT STARTED ===');
    
    if (!formData.username || !formData.password) {
      console.log('Validation failed: empty fields');
      Alert.alert('خطأ', 'يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    console.log('Form data:', formData);
    setLoading(true);
    
    try {
      console.log('Step 1: Calling AuthService.login...');
      const result = await AuthService.login(formData.username, formData.password);
      console.log('Step 2: AuthService.login result:', JSON.stringify(result, null, 2));
      
      if (result.success && result.user) {
        console.log('Step 3: Login successful, user data:', JSON.stringify(result.user, null, 2));
        
        try {
          await login({
            id: result.user.id,
            username: result.user.username,
            fullName: result.user.fullName || '',
            phoneNumber: result.user.phoneNumber,
            token: result.token,
            role: result.user.role,
            profileImageUrl: result.user.profileImageUrl,
          });
          
          setTimeout(() => {
            try {
              // التحقق من دور المستخدم والتوجيه المناسب
              if (result.user.role === 'admin') {
                router.replace('/admin');
              } else {
                router.replace('/(tabs)');
              }
            } catch (navError) {
              console.error('Navigation error:', navError);
              Alert.alert('خطأ في التوجيه', 'حدث خطأ أثناء الانتقال للصفحة الرئيسية');
            }
          }, 1000);
        } catch (contextError) {
          console.error('Context error:', contextError);
          Alert.alert('خطأ في حفظ البيانات', 'حدث خطأ أثناء حفظ بيانات المستخدم');
        }
      } else {
        console.log('Step 3: Login failed:', result.error);
        Alert.alert('خطأ في تسجيل الدخول', result.error || 'اسم المستخدم أو كلمة المرور غير صحيحة');
      }
    } catch (error) {
      console.error('Step 2: Login error:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace'
      });
      Alert.alert('خطأ', 'حدث خطأ في الاتصال بالخادم');
    } finally {
      setLoading(false);
      console.log('=== LOGIN ATTEMPT ENDED ===');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <ArrowLeft size={24} color="#666" />
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <Image
                source={{
                  uri: 'https://res.cloudinary.com/deh3ejeph/image/upload/v1756463555/logo-removebg-preview_p22obg.png'
                }}
                style={styles.headerLogo}
                resizeMode="contain"
              />
              <Text style={styles.headerTitle}>تسجيل الدخول</Text>
            </View>
            <View style={styles.placeholder} />
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>مرحباً بك في taziri</Text>
            <Text style={styles.formSubtitle}>
              سجل دخولك لبدء رحلتك في عالم إعادة البيع
            </Text>

            {/* Username */}
            <View style={styles.inputContainer}>
              <User size={20} color="#9CA3AF" />
              <TextInput
                style={styles.input}
                placeholder="اسم المستخدم"
                placeholderTextColor="#9CA3AF"
                value={formData.username}
                onChangeText={(value) => handleInputChange('username', value)}
                autoCapitalize="none"
              />
            </View>

            {/* Password */}
            <View style={styles.inputContainer}>
              <Lock size={20} color="#9CA3AF" />
              <TextInput
                style={styles.input}
                placeholder="كلمة المرور"
                placeholderTextColor="#9CA3AF"
                value={formData.password}
                onChangeText={(value) => handleInputChange('password', value)}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff size={20} color="#9CA3AF" />
                ) : (
                  <Eye size={20} color="#9CA3AF" />
                )}
              </TouchableOpacity>
            </View>



            {/* Login Button */}
            <TouchableOpacity
              style={[styles.loginButton, loading && styles.disabledButton]}
              onPress={handleLogin}
              disabled={loading}
            >
              <Text style={styles.loginButtonText}>
                {loading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
              </Text>
            </TouchableOpacity>







            {/* Register Link */}
            <View style={styles.registerLinkContainer}>
              <Text style={styles.registerLinkText}>ليس لديك حساب؟ </Text>
              <TouchableOpacity onPress={() => router.push('/register')}>
                <Text style={styles.registerLink}>إنشاء حساب جديد</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
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
  headerCenter: {
    alignItems: 'center',
  },
  headerLogo: {
    width: 30,
    height: 30,
    marginBottom: 5,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  placeholder: {
    width: 40,
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  formSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    paddingVertical: 16,
    marginLeft: 12,
  },
  eyeButton: {
    padding: 8,
  },

  loginButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  disabledButton: {
    opacity: 0.6,
  },

  registerLinkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingBottom: 30,
  },
  registerLinkText: {
    fontSize: 14,
    color: '#6B7280',
  },
  registerLink: {
    fontSize: 14,
    color: '#FF6B35',
    fontWeight: '600',
  },
});
