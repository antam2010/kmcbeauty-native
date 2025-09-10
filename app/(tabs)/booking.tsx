import Calendar from '@/components/calendar/Calendar';
import BookingForm from '@/components/forms/BookingForm';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import React, { useState } from 'react';
import { Alert, Modal, Platform, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function BookingScreen() {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const insets = useSafeAreaInsets();

  const handleDateSelect = (dateString: string) => {
    setSelectedDate(dateString);
    // 날짜 선택하면 바로 예약 폼으로 이동
    setShowBookingForm(true);
  };

  const handleBookingComplete = () => {
    setShowBookingForm(false);
    setSelectedDate(null);
    Alert.alert('완료', '예약이 완료되었습니다!');
  };

  return (
    <ThemedView style={[styles.container, { 
      paddingTop: insets.top,
      paddingBottom: Platform.OS === 'ios' ? insets.bottom + 20 : 20
    }]}>
      <ThemedText type="title" style={styles.title}>
        🌸 예약 달력 🌸
      </ThemedText>
      
      <Calendar
        selectedDate={selectedDate || undefined}
        onDateSelect={handleDateSelect}
        minDate={new Date().toISOString().split('T')[0]} // 오늘부터 선택 가능
      />

      {/* 예약 폼 모달 */}
      <Modal
        visible={showBookingForm}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <BookingForm
          selectedDate={selectedDate || undefined}
          onClose={() => setShowBookingForm(false)}
          onBookingComplete={handleBookingComplete}
        />
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fdf7f0', // 따뜻한 베이지 톤
  },
  title: {
    marginBottom: 20,
    textAlign: 'center',
    fontSize: 24, // 더 큰 폰트
    color: '#8b4513', // 갈색 계열
  },
});
