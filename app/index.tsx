import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useUser } from '../lib/userContext';

export default function IndexScreen() {
  const router = useRouter();
  const { user, isLoading } = useUser();
  const fadeAnim = new Animated.Value(0);
  const logoScaleAnim = new Animated.Value(0.3);
  const textFadeAnim = new Animated.Value(0);

  useEffect(() => {
    // تسلسل التأثيرات الحركية
    Animated.sequence([
      // ظهور اللوجو مع تكبير تدريجي
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(logoScaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
      // ظهور النص بعد اللوجو
      Animated.timing(textFadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      // التحقق من حالة تسجيل الدخول
      if (!isLoading) {
        if (user) {
          // المستخدم مسجل، توجه للصفحة الرئيسية
          if (user.role === 'admin') {
            router.replace('/admin');
          } else {
            router.replace('/(tabs)');
          }
        } else {
          // المستخدم غير مسجل، توجه لصفحة الترحيب
          router.replace('/welcome');
        }
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, [user, isLoading]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* اللوجو مع تأثير حركي */}
        <Animated.View 
          style={[
            styles.logoContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: logoScaleAnim }]
            }
          ]}
        >
          <View style={styles.logoBackground}>
            <Image
              source={{
                uri: 'https://res.cloudinary.com/deh3ejeph/image/upload/v1757597539/VERMAX-removebg-preview_ss3uld.png'
              }}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
        </Animated.View>

        {/* النص مع تأثير ظهور تدريجي */}
        <Animated.View 
          style={[
            styles.textContainer,
            {
              opacity: textFadeAnim,
            }
          ]}
        >
          <Text style={styles.appName}>VERMAX</Text>
          <Text style={styles.appSlogan}>منصة إعادة البيع الأولى</Text>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FF6B35', // لون البرتقالي من اللوجو
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  logoContainer: {
    marginBottom: 40,
    alignItems: 'center',
  },
  logoBackground: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  logoImage: {
    width: 100,
    height: 100,
  },
  textContainer: {
    alignItems: 'center',
  },
  appName: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 2,
  },
  appSlogan: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    fontWeight: '500',
  },
});