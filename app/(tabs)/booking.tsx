import Calendar from '@/components/calendar/Calendar';
import { Collapsible } from '@/components/Collapsible';
import BookingForm from '@/components/forms/BookingForm';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Service, serviceService } from '@/services/mockServices';
import React, { useEffect, useState } from 'react';
import { Alert, Modal, Platform, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function BookingScreen() {
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      const servicesData = await serviceService.getActiveServices();
      setServices(servicesData);
    } catch (error) {
      console.error('서비스 로딩 중 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = () => {
    if (!selectedService || !selectedDate) {
      Alert.alert('알림', '서비스와 날짜를 모두 선택해주세요.', [
        { text: '확인', style: 'default' }
      ]);
      return;
    }
    setShowBookingForm(true);
  };

  const handleBookingComplete = () => {
    setShowBookingForm(false);
    setSelectedService(null);
    setSelectedDate(null);
    Alert.alert('완료', '예약이 완료되었습니다!');
  };

  const handleDateSelect = (dateString: string) => {
    setSelectedDate(dateString);
  };

  if (loading) {
    return (
      <ThemedView style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom + 20 }]}>
        <ThemedText type="title" style={styles.title}>
          뷰티 서비스 예약
        </ThemedText>
        <ThemedView style={styles.loadingContainer}>
          <ThemedText>서비스 정보를 불러오는 중...</ThemedText>
        </ThemedView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <ThemedText type="title" style={styles.title}>
        뷰티 서비스 예약
      </ThemedText>
      
      <ScrollView 
        style={styles.content}
        contentContainerStyle={{
          paddingBottom: Platform.OS === 'ios' ? insets.bottom + 100 : 80
        }}
      >
        <Collapsible title="서비스 선택">
          <ThemedView style={styles.serviceContainer}>
            {services.map((service) => (
              <TouchableOpacity
                key={service.id}
                onPress={() => setSelectedService(service.id)}
              >
                <ThemedView
                  style={[
                    styles.serviceItem,
                    selectedService === service.id && styles.selectedService
                  ]}
                >
                  <ThemedText type="subtitle">{service.name}</ThemedText>
                  <ThemedText>{service.price.toLocaleString()}원 • {service.duration}분</ThemedText>
                  <ThemedText style={styles.serviceDescription}>{service.description}</ThemedText>
                </ThemedView>
              </TouchableOpacity>
            ))}
          </ThemedView>
        </Collapsible>

        <Collapsible title="날짜 및 시간 선택">
          <ThemedView style={styles.dateContainer}>
            <Calendar 
              onDateSelect={handleDateSelect}
              selectedDate={selectedDate || undefined}
            />
            <ThemedText type="defaultSemiBold" style={styles.selectedDateInfo}>
              선택된 날짜: {selectedDate ? new Date(selectedDate).toLocaleDateString('ko-KR') : '날짜를 선택해주세요'}
            </ThemedText>
          </ThemedView>
        </Collapsible>

        <TouchableOpacity style={styles.bookingButton} onPress={handleBooking}>
          <ThemedText 
            type="defaultSemiBold" 
            style={styles.bookingButtonText}
          >
            🌸 예약하기 🌸
          </ThemedText>
        </TouchableOpacity>
      </ScrollView>

      {/* 예약 폼 모달 */}
      <Modal
        visible={showBookingForm}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <BookingForm
          service={services.find(s => s.id === selectedService)}
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
  content: {
    flex: 1,
  },
  serviceContainer: {
    gap: 15, // 간격 증가
  },
  serviceItem: {
    padding: 20, // 더 큰 패딩
    borderRadius: 12, // 둥근 모서리
    borderWidth: 2,
    borderColor: '#d4b996',
    backgroundColor: '#fff8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedService: {
    borderColor: '#ff69b4', // 핑크 계열
    backgroundColor: '#ffe4e8',
    shadowOpacity: 0.2,
  },
  dateContainer: {
    padding: 20, // 더 큰 패딩
    gap: 15,
  },
  bookingButton: {
    backgroundColor: '#ff69b4', // 핑크 계열
    padding: 20, // 더 큰 패딩
    borderRadius: 15, // 더 둥글게
    marginTop: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  bookingButtonText: {
    color: 'white',
    fontSize: 18, // 더 큰 폰트
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  serviceDescription: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 5,
  },
  selectedDateInfo: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
    textAlign: 'center',
    color: '#007AFF',
  },
});
