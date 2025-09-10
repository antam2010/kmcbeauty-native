import React, { useState } from 'react';
import {
    Alert,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface BookingFormProps {
  service?: {
    id: string;
    name: string;
    price: number;
    duration: number;
    description: string;
  };
  selectedDate?: string;
  onClose: () => void;
  onBookingComplete: () => void;
}

export default function BookingForm({ 
  service, 
  selectedDate, 
  onClose, 
  onBookingComplete 
}: BookingFormProps) {
  const [customerName, setCustomerName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [memo, setMemo] = useState('');
  const insets = useSafeAreaInsets();

  // 50대 여성 사용자를 위한 큰 시간 슬롯들
  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
    '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
    '18:00', '18:30'
  ];

  const handleBooking = () => {
    if (!customerName.trim()) {
      Alert.alert('알림', '고객님 성함을 입력해주세요.');
      return;
    }
    if (!phoneNumber.trim()) {
      Alert.alert('알림', '연락처를 입력해주세요.');
      return;
    }
    if (!selectedTime) {
      Alert.alert('알림', '시간을 선택해주세요.');
      return;
    }

    // 예약 확인
    Alert.alert(
      '예약 확인',
      `다음 내용으로 예약하시겠습니까?\n\n` +
      `서비스: ${service?.name}\n` +
      `날짜: ${selectedDate}\n` +
      `시간: ${selectedTime}\n` +
      `고객명: ${customerName}\n` +
      `연락처: ${phoneNumber}`,
      [
        { text: '취소', style: 'cancel' },
        { 
          text: '예약하기', 
          onPress: () => {
            Alert.alert('예약 완료', '예약이 성공적으로 완료되었습니다!', [
              { text: '확인', onPress: onBookingComplete }
            ]);
          }
        }
      ]
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={{
          paddingBottom: Platform.OS === 'ios' ? insets.bottom + 30 : 20
        }}
      >
        {/* 헤더 */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>예약하기</Text>
          <View style={styles.placeholder} />
        </View>

        {/* 서비스 정보 */}
        {service && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>선택한 서비스</Text>
            <View style={styles.serviceCard}>
              <Text style={styles.serviceName}>{service.name}</Text>
              <Text style={styles.serviceInfo}>
                {service.price.toLocaleString()}원 • {service.duration}분
              </Text>
              <Text style={styles.serviceDescription}>{service.description}</Text>
            </View>
          </View>
        )}

        {/* 날짜 정보 */}
        {selectedDate && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>선택한 날짜</Text>
            <View style={styles.dateCard}>
              <Text style={styles.dateText}>
                {new Date(selectedDate).toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  weekday: 'long'
                })}
              </Text>
            </View>
          </View>
        )}

        {/* 시간 선택 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>시간 선택</Text>
          <View style={styles.timeGrid}>
            {timeSlots.map((time) => (
              <TouchableOpacity
                key={time}
                style={[
                  styles.timeSlot,
                  selectedTime === time && styles.selectedTimeSlot
                ]}
                onPress={() => setSelectedTime(time)}
              >
                <Text style={[
                  styles.timeText,
                  selectedTime === time && styles.selectedTimeText
                ]}>
                  {time}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 고객 정보 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>고객 정보</Text>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>고객명 *</Text>
            <TextInput
              style={styles.textInput}
              value={customerName}
              onChangeText={setCustomerName}
              placeholder="성함을 입력해주세요"
              placeholderTextColor="#999"
              autoCapitalize="words"
            />
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>연락처 *</Text>
            <TextInput
              style={styles.textInput}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              placeholder="010-0000-0000"
              placeholderTextColor="#999"
              keyboardType="phone-pad"
            />
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>메모 (선택사항)</Text>
            <TextInput
              style={[styles.textInput, styles.memoInput]}
              value={memo}
              onChangeText={setMemo}
              placeholder="특별한 요청사항이나 메모를 입력해주세요"
              placeholderTextColor="#999"
              multiline
              numberOfLines={3}
            />
          </View>
        </View>
      </ScrollView>

      {/* 하단 예약 버튼 */}
      <View style={[styles.bottomContainer, { paddingBottom: insets.bottom + 10 }]}>
        <TouchableOpacity style={styles.bookingButton} onPress={handleBooking}>
          <Text style={styles.bookingButtonText}>예약하기</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#666',
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  placeholder: {
    width: 40,
  },
  section: {
    margin: 20,
    marginBottom: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  serviceCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  serviceName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  serviceInfo: {
    fontSize: 16,
    color: '#007bff',
    fontWeight: '600',
    marginBottom: 8,
  },
  serviceDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  dateCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    textAlign: 'center',
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  timeSlot: {
    width: '22%',
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  selectedTimeSlot: {
    backgroundColor: '#007bff',
  },
  timeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  selectedTimeText: {
    color: '#ffffff',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  memoInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  bottomContainer: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  bookingButton: {
    backgroundColor: '#28a745',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  bookingButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
