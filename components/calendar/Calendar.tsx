import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { treatmentAPI } from '@/src/features/booking/api';
import { Treatment } from '@/src/types/treatment';
import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface CalendarDate {
  date: string;
  isToday: boolean;
  isSelected: boolean;
  hasBookings: boolean;
  bookingCount: number;
  isCurrentMonth: boolean;
}

interface CalendarProps {
  selectedDate?: string;
  onDateSelect: (date: string) => void;
  onTreatmentsLoad?: (treatments: Treatment[]) => void;
  minDate?: string;
  maxDate?: string;
}

export default function Calendar({ 
  selectedDate, 
  onDateSelect, 
  onTreatmentsLoad,
  minDate,
  maxDate 
}: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [selectedDateTreatments, setSelectedDateTreatments] = useState<Treatment[]>([]);
  const [showTreatmentsModal, setShowTreatmentsModal] = useState(false);

  // 월별 시술 예약 데이터 로드
  const loadMonthlyTreatments = useCallback(async (year: number, month: number) => {
    try {
      const monthlyTreatments = await treatmentAPI.getMonthlyTreatments(year, month);
      setTreatments(monthlyTreatments);
      onTreatmentsLoad?.(monthlyTreatments);
    } catch (error) {
      console.error('월별 시술 예약 로드 실패:', error);
      setTreatments([]);
    }
  }, [onTreatmentsLoad]);

  // 현재 월이 변경될 때마다 데이터 로드
  useEffect(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth() + 1; // getMonth()는 0부터 시작
    loadMonthlyTreatments(year, month);
  }, [currentMonth, loadMonthlyTreatments]);

  // 날짜별 예약 건수 계산
  const getBookingCountByDate = (date: string): number => {
    return treatments.filter(treatment => {
      const treatmentDate = treatment.reserved_at.split('T')[0];
      return treatmentDate === date;
    }).length;
  };

  // 달력 데이터 생성 함수
  const generateCalendarDates = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startWeekday = firstDay.getDay();
    
    const dates: CalendarDate[] = [];
    const today = new Date().toISOString().split('T')[0];
    
    // 이전 달 날짜들 (빈 칸 채우기)
    for (let i = startWeekday - 1; i >= 0; i--) {
      const date = new Date(year, month, -i);
      const dateString = date.toISOString().split('T')[0];
      dates.push({
        date: dateString,
        isToday: false,
        isSelected: false,
        hasBookings: false,
        bookingCount: 0,
        isCurrentMonth: false,
      });
    }
    
    // 현재 달 날짜들
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month, day);
      const dateString = date.toISOString().split('T')[0];
      const bookingCount = getBookingCountByDate(dateString);
      
      dates.push({
        date: dateString,
        isToday: dateString === today,
        isSelected: dateString === selectedDate,
        hasBookings: bookingCount > 0,
        bookingCount: bookingCount,
        isCurrentMonth: true,
      });
    }
    
    // 다음 달 날짜들 (6주 완성)
    const remainingCells = 42 - dates.length;
    for (let day = 1; day <= remainingCells; day++) {
      const date = new Date(year, month + 1, day);
      const dateString = date.toISOString().split('T')[0];
      dates.push({
        date: dateString,
        isToday: false,
        isSelected: false,
        hasBookings: false,
        bookingCount: 0,
        isCurrentMonth: false,
      });
    }
    
    return {
      year,
      month,
      dates,
    };
  };

  const calendarData = generateCalendarDates();

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const handleDatePress = (date: CalendarDate) => {
    if (isDateDisabled(date.date)) return;
    
    // 예약이 있는 날짜를 클릭한 경우 모달 표시
    if (date.hasBookings && date.bookingCount > 0) {
      const dateTreatments = treatments.filter(treatment => {
        const treatmentDate = treatment.reserved_at.split('T')[0];
        return treatmentDate === date.date;
      });
      setSelectedDateTreatments(dateTreatments);
      setShowTreatmentsModal(true);
    }
    
    onDateSelect(date.date);
  };

  const isDateDisabled = (date: string) => {
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    return false;
  };

  const getDateItemStyle = (date: CalendarDate) => {
    const styles = [calendarStyles.dateItem];
    
    if (date.isToday) styles.push(calendarStyles.today as any);
    if (date.isSelected) styles.push(calendarStyles.selected as any);
    if (date.hasBookings) styles.push(calendarStyles.hasBookings as any);
    if (isDateDisabled(date.date)) styles.push(calendarStyles.disabled as any);
    
    return styles;
  };

  const renderDateItem = ({ item: date }: { item: CalendarDate }) => (
    <TouchableOpacity
      style={getDateItemStyle(date)}
      onPress={() => handleDatePress(date)}
      disabled={isDateDisabled(date.date)}
    >
      <ThemedText style={[
        calendarStyles.dateText,
        date.isSelected && calendarStyles.selectedText,
        isDateDisabled(date.date) && calendarStyles.disabledText
      ]}>
        {new Date(date.date).getDate()}
      </ThemedText>
      {date.hasBookings && (
        <View style={calendarStyles.bookingIndicator}>
          <Text style={calendarStyles.bookingCount}>
            {date.bookingCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const monthNames = [
    '1월', '2월', '3월', '4월', '5월', '6월',
    '7월', '8월', '9월', '10월', '11월', '12월'
  ];
  
  const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ko-KR', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const formatCustomerName = (treatment: Treatment) => {
    return treatment.phonebook?.name || '고객명 없음';
  };

  const formatServiceName = (treatment: Treatment) => {
    const serviceNames = treatment.treatment_items?.map(item => item.menu_detail?.name).filter(Boolean) || [];
    return serviceNames.length > 0 ? serviceNames.join(', ') : '서비스명 없음';
  };

  const closeTreatmentsModal = () => {
    setShowTreatmentsModal(false);
    setSelectedDateTreatments([]);
  };

  return (
    <ThemedView style={calendarStyles.container}>
      {/* 예약 목록 모달 */}
      <Modal
        visible={showTreatmentsModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeTreatmentsModal}
      >
        <ThemedView style={calendarStyles.modalContainer}>
          <ThemedView style={calendarStyles.modalHeader}>
            <ThemedText style={calendarStyles.modalTitle}>
              {selectedDateTreatments.length > 0 && 
                new Date(selectedDateTreatments[0].reserved_at).toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })
              } 예약 목록
            </ThemedText>
            <TouchableOpacity onPress={closeTreatmentsModal} style={calendarStyles.closeButton}>
              <ThemedText style={calendarStyles.closeButtonText}>닫기</ThemedText>
            </TouchableOpacity>
          </ThemedView>
          
          <ScrollView style={calendarStyles.modalContent}>
            {selectedDateTreatments.map((treatment, index) => (
              <ThemedView key={treatment.id || index} style={calendarStyles.treatmentItem}>
                <ThemedView style={calendarStyles.treatmentHeader}>
                  <ThemedText style={calendarStyles.treatmentTime}>
                    {formatTime(treatment.reserved_at)}
                  </ThemedText>
                  <ThemedText style={calendarStyles.treatmentStatus}>
                    {treatment.status || '예약'}
                  </ThemedText>
                </ThemedView>
                
                <ThemedText style={calendarStyles.customerName}>
                  {formatCustomerName(treatment)}
                </ThemedText>
                
                <ThemedText style={calendarStyles.serviceName}>
                  {formatServiceName(treatment)}
                </ThemedText>
                
                {treatment.memo && (
                  <ThemedText style={calendarStyles.treatmentNotes}>
                    메모: {treatment.memo}
                  </ThemedText>
                )}
              </ThemedView>
            ))}
            
            {selectedDateTreatments.length === 0 && (
              <ThemedView style={calendarStyles.emptyContainer}>
                <ThemedText style={calendarStyles.emptyText}>예약이 없습니다.</ThemedText>
              </ThemedView>
            )}
          </ScrollView>
        </ThemedView>
      </Modal>
      {/* 월 네비게이션 */}
      <ThemedView style={calendarStyles.header}>
        <TouchableOpacity onPress={goToPreviousMonth} style={calendarStyles.navButton}>
          <ThemedText style={calendarStyles.navText}>‹</ThemedText>
        </TouchableOpacity>
        
        <ThemedText style={calendarStyles.monthTitle}>
          {calendarData.year}년 {monthNames[calendarData.month]}
        </ThemedText>
        
        <TouchableOpacity onPress={goToNextMonth} style={calendarStyles.navButton}>
          <ThemedText style={calendarStyles.navText}>›</ThemedText>
        </TouchableOpacity>
      </ThemedView>

      {/* 요일 헤더 */}
      <ThemedView style={calendarStyles.weekHeader}>
        {weekDays.map((day, index) => (
          <ThemedView key={index} style={calendarStyles.weekDayItem}>
            <ThemedText style={calendarStyles.weekDayText}>{day}</ThemedText>
          </ThemedView>
        ))}
      </ThemedView>

      {/* 날짜 그리드 */}
      <FlatList
        data={calendarData.dates}
        renderItem={renderDateItem}
        numColumns={7}
        keyExtractor={(item) => item.date}
        scrollEnabled={false}
        style={calendarStyles.datesGrid}
      />
    </ThemedView>
  );
}

const calendarStyles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    ...(Platform.OS === 'web' ? {
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    } : {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    }),
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  navButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  navText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  weekHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekDayItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  weekDayText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  datesGrid: {
    flex: 1,
  },
  dateItem: {
    flex: 1,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 2,
    borderRadius: 8,
    position: 'relative',
  },
  dateText: {
    fontSize: 16,
    fontWeight: '500',
  },
  today: {
    backgroundColor: '#e3f2fd',
  },
  selected: {
    backgroundColor: '#007AFF',
  },
  selectedText: {
    color: 'white',
    fontWeight: 'bold',
  },
  hasBookings: {
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  disabled: {
    opacity: 0.3,
  },
  disabledText: {
    color: '#ccc',
  },
  bookingIndicator: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#FF5722',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookingCount: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  // 모달 관련 스타일
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  closeButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  closeButtonText: {
    fontSize: 16,
    color: '#333',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  treatmentItem: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  treatmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  treatmentTime: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  treatmentStatus: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  serviceName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  treatmentNotes: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
  },
});
