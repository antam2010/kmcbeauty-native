import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef } from 'react';

import { useColorScheme } from '@/hooks/useColorScheme';
import { queryClient } from '@/src/api/queryClient';
import { useAuthStore } from '@/src/stores/authStore';
import { useShopStore } from '@/src/stores/shopStore';
import { QueryClientProvider } from '@tanstack/react-query';

// Zustand 스토어 초기화 컴포넌트
// SPEC-REFACTOR-001 REQ-REF-003: 과거에는 스토어 훅을 통째로 구독(const { loadUser } = useAuthStore())하고
//   useEffect가 스토어 함수 의존성에 묶여 있어, 스토어 상태 변경 시 재구독/재실행 및 loadUser/loadSelectedShop
//   동시 로드 경쟁이 발생할 수 있었다. 이제 (1) getState()로 액션을 안정적으로 취득하여 구독을 만들지 않고,
//   (2) 빈 의존성 배열 + didInit ref 재진입 가드로 최초 마운트 1회만 실행하며,
//   (3) 인증 로드를 먼저 완료한 뒤에만 상점 로드를 수행하도록 순서를 보장한다.
function StoreInitializer() {
  const didInit = useRef(false);

  useEffect(() => {
    // StrictMode 이중 마운트/리렌더에 대한 재진입 가드
    if (didInit.current) {
      return;
    }
    didInit.current = true;

    // 구독을 만들지 않도록 getState()로 안정 참조를 취득한다.
    const loadUser = useAuthStore.getState().loadUser;
    const loadSelectedShop = useShopStore.getState().loadSelectedShop;

    // 로드 순서: 인증 로드 완료 → (인증된 경우에만) 상점 로드
    (async () => {
      await loadUser();
      // 인증 로드 이후의 최신 상태를 다시 조회한다(상점 로드는 인증에 종속).
      if (useAuthStore.getState().isAuthenticated) {
        await loadSelectedShop();
      }
    })();
  }, []);

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
    // SPEC-DATA-001 REQ-DATA-001-01: 단일 QueryClientProvider 로 전체 트리를 래핑하여
    // 모든 화면이 동일 QueryClient(서버-상태 캐시)를 공유한다. 기존 StoreInitializer/ThemeProvider
    // 트리를 그대로 감싼다(초기화 순서·zustand 클라이언트 상태 불변).
    <QueryClientProvider client={queryClient}>
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
    </QueryClientProvider>
  );
});
