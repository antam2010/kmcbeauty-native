import LoginScreen from '@/app/login';
import { useAuthStore } from '@/stores/authContext';
import { Stack } from 'expo-router';
import React from 'react';

const AuthNavigator: React.FC = () => {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
};

export default AuthNavigator;
