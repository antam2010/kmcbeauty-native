import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';

import { useColorScheme } from '@/hooks/useColorScheme';
import { useAuthStore } from '@/src/stores/authStore';
import { useShopStore } from '@/src/stores/shopStore';

// Zustand 스토어 초기화 컴포넌트
function StoreInitializer() {
  const { loadUser } = useAuthStore();
  const { loadSelectedShop } = useShopStore();

  useEffect(() => {
    // 앱 시작시 저장된 인증 정보 로드
    loadUser();
    // 인증 상태와 관계없이 상점 정보도 로드 시도
    loadSelectedShop();
  }, [loadUser, loadSelectedShop]);

  return null;
}

export default React.memo(function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <>
      <StoreInitializer />
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" />
          <Stack.Screen name="shop-selection" options={{ headerShown: false }} />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </>
  );
});
