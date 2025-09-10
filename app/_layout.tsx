import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import 'react-native-reanimated';

import AuthNavigator from '@/components/navigation/AuthNavigator';
import { useColorScheme } from '@/hooks/useColorScheme';
import { AuthProvider } from '@/stores/authContext';

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
    <AuthProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AuthNavigator />
        <StatusBar style="auto" />
      </ThemeProvider>
    </AuthProvider>
  );
});
