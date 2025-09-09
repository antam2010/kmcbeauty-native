import LoginScreen from '@/app/login';
import { useAuth } from '@/contexts/AuthContext';
import { Stack } from 'expo-router';
import React from 'react';

const AuthNavigator: React.FC = () => {
  const { isAuthenticated } = useAuth();

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
