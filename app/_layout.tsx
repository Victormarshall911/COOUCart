import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { WalletProvider } from '@/contexts/WalletContext';

function RootLayoutNav() {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === 'auth';
    const inSplash = segments[0] === 'splash';

    if (!session && !inAuthGroup && !inSplash) {
      router.replace('/splash');
    } else if (session && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [session, loading, segments]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="splash" />
      <Stack.Screen name="auth/login" />
      <Stack.Screen name="auth/signup" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="add-product" />
      <Stack.Screen name="chat/[id]" />
      <Stack.Screen name="product/[id]" />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

export default function RootLayout() {
  useFrameworkReady();

  return (
    <AuthProvider>
      <WalletProvider>
        <RootLayoutNav />
        <StatusBar style="auto" />
      </WalletProvider>
    </AuthProvider>
  );
}
