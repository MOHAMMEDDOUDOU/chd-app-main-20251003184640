import { useEffect } from 'react';
import { Stack, Slot } from 'expo-router';
import { I18nManager, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { UserProvider } from '../lib/userContext';
import { AdminProvider } from '../lib/adminContext';
import NotificationHandler from '../components/NotificationHandler';

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
          <StatusBar style="auto" />
        </AdminProvider>
      </UserProvider>
    </NotificationHandler>
  );
}
