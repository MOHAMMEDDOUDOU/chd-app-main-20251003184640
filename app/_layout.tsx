import { useEffect } from 'react';
import { Stack, Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { UserProvider } from '../lib/userContext';
import { AdminProvider } from '../lib/adminContext';
import NotificationHandler from '../components/NotificationHandler';

export default function RootLayout() {
  useFrameworkReady();

  return (
    <NotificationHandler>
      <UserProvider>
        <AdminProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="welcome" />
            <Stack.Screen name="login" />
            <Stack.Screen name="register" />
            <Stack.Screen name="profile" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="buy/[...params]" />
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
