import MonthlyDashboard from '@/components/dashboard/MonthlyDashboard';
import { Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';

export default function MonthlyDashboardScreen() {
  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: '월별 현황',
          headerShown: true,
          headerBackTitle: '뒤로',
        }}
      />
      <MonthlyDashboard />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
});
