import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { I18nManager, Linking, Platform, TouchableOpacity, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { UserProvider } from '../lib/userContext';
import { AdminProvider } from '../lib/adminContext';
import NotificationHandler from '../components/NotificationHandler';
import { Ionicons } from '@expo/vector-icons';

export default function RootLayout() {
  useFrameworkReady();

  // Ensure RTL is enforced consistently across dev and production builds
  useEffect(() => {
    try {
      if (!I18nManager.isRTL) {
        I18nManager.allowRTL(true);
        I18nManager.forceRTL(true);
        // Note: A full app reload is typically required after changing RTL.
        // In production builds this will apply on next launch; in dev it may hot-reload.
      }
    } catch (error) {
      // No-op: avoid crashing layout on init
    }
  }, []);

  const openWhatsApp = async () => {
    const phone = '213562163035';
    const waUrl = `whatsapp://send?phone=${phone}`;
    const webUrl = `https://wa.me/${phone}`;
    try {
      const canOpen = await Linking.canOpenURL(waUrl);
      if (canOpen) await Linking.openURL(waUrl);
      else await Linking.openURL(webUrl);
    } catch (e) {
      await Linking.openURL(webUrl);
    }
  };

  return (
    <NotificationHandler>
      <UserProvider>
        <AdminProvider>
          <Stack screenOptions={{ headerShown: false, contentStyle: { direction: 'rtl' } }}>
            <Stack.Screen name="welcome" />
            <Stack.Screen name="login" />
            <Stack.Screen name="register" />
            <Stack.Screen name="profile" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="admin" />
            <Stack.Screen name="create-order" />
            <Stack.Screen name="+not-found" />
          </Stack>
          {/* WhatsApp Floating Action Button */}
          <View
            pointerEvents="box-none"
            style={{ position: 'absolute', right: 16, bottom: 24 }}
          >
            <TouchableOpacity
              onPress={openWhatsApp}
              activeOpacity={0.8}
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: '#25D366',
                justifyContent: 'center',
                alignItems: 'center',
                shadowColor: '#000',
                shadowOpacity: 0.25,
                shadowRadius: 6,
                shadowOffset: { width: 0, height: 2 },
                elevation: 6,
              }}
            >
              <Ionicons name="logo-whatsapp" size={28} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <StatusBar style="auto" />
        </AdminProvider>
      </UserProvider>
    </NotificationHandler>
  );
}
