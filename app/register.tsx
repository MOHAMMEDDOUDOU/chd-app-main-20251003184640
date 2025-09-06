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
import { ArrowLeft, User, Phone, Lock, Eye, EyeOff } from 'lucide-react-native';
import { AuthService } from '../lib/auth';
import { useUser } from '../lib/userContext';

export default function RegisterScreen() {
  const router = useRouter();
  const { login } = useUser();
  const [formData, setFormData] = useState({
    username: '',
    phoneNumber: '',
    fullName: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleRegister = async () => {
    // التحقق من صحة البيانات
    if (!formData.username || !formData.phoneNumber || !formData.fullName || !formData.password) {
      Alert.alert('خطأ', 'يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert('خطأ', 'كلمات المرور غير متطابقة');
      return;
    }

    if (formData.password.length < 6) {
      Alert.alert('خطأ', 'كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }

    setLoading(true);
    try {
      console.log('=== REGISTER ATTEMPT STARTED ===');
      console.log('Form data:', { ...formData, password: '***' });
      
      // Step 1: Register the user
      console.log('Step 1: Calling AuthService.register...');
      const registerResult = await AuthService.register({
        username: formData.username,
        phoneNumber: formData.phoneNumber,
        fullName: formData.fullName,
        password: formData.password,
      });

      if (registerResult.success) {
        console.log('Step 2: Registration successful, proceeding to auto-login...');
        
        // Step 2: Auto-login after successful registration
        console.log('Step 3: Calling AuthService.login...');
        const loginResult = await AuthService.login(
          formData.username,
          formData.password
        );

        if (loginResult.success) {
          console.log('Step 4: Auto-login successful, saving user data...');
          console.log('Login result:', JSON.stringify(loginResult, null, 2));
          
          // Step 3: Save user data to context
          console.log('Step 5: Saving user data to context...');
          await login({
            ...loginResult.user,
            token: loginResult.token,
          });
          console.log('Step 6: User data saved to context successfully');
          
          // Step 4: Navigate to main app
          console.log('Step 7: Navigating to main app...');
          setTimeout(() => {
            // المستخدمين الجدد دائماً يكونون regular users
            router.replace('/(tabs)');
          }, 500);
          console.log('Step 8: Navigation command sent');
          console.log('=== REGISTER ATTEMPT COMPLETED ===');
        } else {
          console.log('Step 4: Auto-login failed:', loginResult.error);
          Alert.alert(
            'نجح التسجيل',
            'تم إنشاء حسابك بنجاح! يمكنك الآن تسجيل الدخول.',
            [
              {
                text: 'حسناً',
                onPress: () => router.push('/login'),
              },
            ]
          );
        }
      } else {
        console.log('Step 2: Registration failed:', registerResult.error);
        Alert.alert('خطأ في التسجيل', registerResult.error || 'حدث خطأ أثناء التسجيل');
      }
    } catch (error) {
      console.log('=== REGISTER ATTEMPT ERROR ===');
      console.log('Error occurred:', error);
      Alert.alert('خطأ', 'حدث خطأ في الاتصال بالخادم');
    } finally {
      setLoading(false);
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
              <Text style={styles.headerTitle}>إنشاء حساب جديد</Text>
            </View>
            <View style={styles.placeholder} />
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>انضم إلى taziri</Text>
            <Text style={styles.formSubtitle}>
              ابدأ رحلتك في عالم إعادة البيع واربح من كل عملية بيع
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

            {/* Phone Number */}
            <View style={styles.inputContainer}>
              <Phone size={20} color="#9CA3AF" />
              <TextInput
                style={styles.input}
                placeholder="رقم الهاتف"
                placeholderTextColor="#9CA3AF"
                value={formData.phoneNumber}
                onChangeText={(value) => handleInputChange('phoneNumber', value)}
                keyboardType="phone-pad"
              />
            </View>

            {/* Full Name */}
            <View style={styles.inputContainer}>
              <User size={20} color="#9CA3AF" />
              <TextInput
                style={styles.input}
                placeholder="الاسم الكامل"
                placeholderTextColor="#9CA3AF"
                value={formData.fullName}
                onChangeText={(value) => handleInputChange('fullName', value)}
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

            {/* Confirm Password */}
            <View style={styles.inputContainer}>
              <Lock size={20} color="#9CA3AF" />
              <TextInput
                style={styles.input}
                placeholder="تأكيد كلمة المرور"
                placeholderTextColor="#9CA3AF"
                value={formData.confirmPassword}
                onChangeText={(value) => handleInputChange('confirmPassword', value)}
                secureTextEntry={!showConfirmPassword}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOff size={20} color="#9CA3AF" />
                ) : (
                  <Eye size={20} color="#9CA3AF" />
                )}
              </TouchableOpacity>
            </View>

            {/* Register Button */}
            <TouchableOpacity
              style={[styles.registerButton, loading && styles.disabledButton]}
              onPress={handleRegister}
              disabled={loading}
            >
              <Text style={styles.registerButtonText}>
                {loading ? 'جاري التسجيل...' : 'إنشاء الحساب'}
              </Text>
            </TouchableOpacity>

            {/* Login Link */}
            <View style={styles.loginLinkContainer}>
              <Text style={styles.loginLinkText}>لديك حساب بالفعل؟ </Text>
              <TouchableOpacity onPress={() => router.push('/login')}>
                <Text style={styles.loginLink}>تسجيل الدخول</Text>
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
  registerButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  registerButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  disabledButton: {
    opacity: 0.6,
  },
  loginLinkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingBottom: 30,
  },
  loginLinkText: {
    fontSize: 14,
    color: '#6B7280',
  },
  loginLink: {
    fontSize: 14,
    color: '#FF6B35',
    fontWeight: '600',
  },
});
