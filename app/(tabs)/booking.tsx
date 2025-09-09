import Calendar from '@/components/calendar/Calendar';
import { Collapsible } from '@/components/Collapsible';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Service, serviceService } from '@/services/mockServices';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';

export default function BookingScreen() {
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

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
      Alert.alert('알림', '서비스와 날짜를 선택해주세요.');
      return;
    }
    Alert.alert('예약 완료', '예약이 성공적으로 완료되었습니다.');
  };

  const handleDateSelect = (dateString: string) => {
    setSelectedDate(dateString);
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
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
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        뷰티 서비스 예약
      </ThemedText>
      
      <ScrollView style={styles.content}>
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
            예약하기
          </ThemedText>
        </TouchableOpacity>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    marginBottom: 20,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  serviceContainer: {
    gap: 10,
  },
  serviceItem: {
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  selectedService: {
    borderColor: '#007AFF',
    backgroundColor: '#f0f8ff',
  },
  dateContainer: {
    padding: 15,
    gap: 10,
  },
  bookingButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
    alignItems: 'center',
  },
  bookingButtonText: {
    color: 'white',
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
