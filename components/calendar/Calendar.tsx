import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { treatmentAPI } from '@/src/features/booking/api';
import { Treatment } from '@/src/types/treatment';
import React, { useCallback, useEffect, useState } from 'react';
import { Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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
  onNewBookingRequest?: (date: string, reservedTimes: string[]) => void;
  onTreatmentPress?: (treatment: Treatment) => void;
  minDate?: string;
  maxDate?: string;
}

export default function Calendar({ 
  selectedDate, 
  onDateSelect, 
  onTreatmentsLoad,
  onNewBookingRequest,
  onTreatmentPress,
  minDate,
  maxDate 
}: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [selectedDateTreatments, setSelectedDateTreatments] = useState<Treatment[]>([]);
  const [showTreatmentsModal, setShowTreatmentsModal] = useState(false);
  const [isInteracting, setIsInteracting] = useState(false);

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
    if (isDateDisabled(date.date) || isInteracting || showTreatmentsModal) return;
    
    setIsInteracting(true);
    
    // 예약이 있는 날짜를 클릭한 경우 모달 표시
    if (date.hasBookings && date.bookingCount > 0) {
      const dateTreatments = treatments.filter(treatment => {
        const treatmentDate = treatment.reserved_at.split('T')[0];
        return treatmentDate === date.date;
      });
      setSelectedDateTreatments(dateTreatments);
      
      // 안전한 모달 열기를 위한 지연
      setTimeout(() => {
        setShowTreatmentsModal(true);
        setIsInteracting(false);
      }, 150);
    } else {
      // 모든 날짜에서 새 예약 생성 가능 (과거 날짜 포함)
      onDateSelect(date.date);
      
      // 선택 후 인터랙션 상태 해제
      setTimeout(() => {
        setIsInteracting(false);
      }, 100);
    }
  };

  const isDateDisabled = (date: string) => {
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    return false;
  };

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
    if (isInteracting) return; // 이미 처리 중이면 무시
    
    setIsInteracting(true);
    setShowTreatmentsModal(false);
    
    setTimeout(() => {
      setSelectedDateTreatments([]);
      setIsInteracting(false);
    }, 300);
  };

  const handleNewBookingRequest = () => {
    if (selectedDateTreatments.length > 0) {
      const selectedDateString = selectedDateTreatments[0].reserved_at.split('T')[0];
      
      // 해당 날짜의 예약된 시간들을 추출
      const reservedTimes = selectedDateTreatments.map(treatment => {
        const date = new Date(treatment.reserved_at);
        return date.toLocaleTimeString('ko-KR', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        });
      });
      
      closeTreatmentsModal();
      setTimeout(() => {
        onNewBookingRequest?.(selectedDateString, reservedTimes);
      }, 300);
    }
  };

  return (
    <View style={calendarStyles.container}>
      {/* 사용 안내 메시지 */}
      <View style={calendarStyles.infoContainer}>
        <Text style={calendarStyles.infoText}>
          💡 모든 날짜에서 예약이 가능합니다. 과거 예약도 추가하실 수 있어요!
        </Text>
      </View>
      
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
              <TouchableOpacity 
                key={treatment.id || index} 
                style={calendarStyles.treatmentItem}
                onPress={() => {
                  // 모바일에서 안전한 처리를 위해 모달을 먼저 닫고 콜백 호출
                  setShowTreatmentsModal(false);
                  setTimeout(() => {
                    onTreatmentPress?.(treatment);
                  }, 300);
                }}
                activeOpacity={0.7}
                delayPressIn={0}
                delayPressOut={0}
              >
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
              </TouchableOpacity>
            ))}
            
            {selectedDateTreatments.length === 0 && (
              <ThemedView style={calendarStyles.emptyContainer}>
                <ThemedText style={calendarStyles.emptyText}>예약이 없습니다.</ThemedText>
              </ThemedView>
            )}
            
            {/* 새 예약하기 버튼 - 모든 날짜에서 가능 */}
            {selectedDateTreatments.length > 0 && onNewBookingRequest && (
              <ThemedView style={calendarStyles.newBookingContainer}>
                <TouchableOpacity 
                  style={calendarStyles.newBookingButton} 
                  onPress={handleNewBookingRequest}
                >
                  <ThemedText style={calendarStyles.newBookingButtonText}>
                    ➕ 이 날에 새 예약하기
                  </ThemedText>
                </TouchableOpacity>
              </ThemedView>
            )}
          </ScrollView>
        </ThemedView>
      </Modal>
      {/* 월 네비게이션 */}
      <View style={calendarStyles.header}>
        <TouchableOpacity onPress={goToPreviousMonth} style={calendarStyles.navButton}>
          <Text style={calendarStyles.navText}>‹</Text>
        </TouchableOpacity>
        
        <Text style={calendarStyles.monthTitle}>
          {calendarData.year}년 {monthNames[calendarData.month]}
        </Text>
        
        <TouchableOpacity onPress={goToNextMonth} style={calendarStyles.navButton}>
          <Text style={calendarStyles.navText}>›</Text>
        </TouchableOpacity>
      </View>

      {/* 요일 헤더 */}
      <View style={calendarStyles.weekHeader}>
        {weekDays.map((day, index) => (
          <View key={index} style={calendarStyles.weekDayItem}>
            <Text style={calendarStyles.weekDayText}>{day}</Text>
          </View>
        ))}
      </View>

      {/* 실제 달력 그리드 - 현대적인 디자인 */}
      <View style={calendarStyles.calendarGrid}>
        {calendarData.dates.map((date, index) => {
          const dateNumber = new Date(date.date).getDate();
          const today = new Date().toISOString().split('T')[0];
          const isPastDate = date.date < today;
          
          return (
            <TouchableOpacity
              key={date.date}
              style={[
                calendarStyles.dateItem,
                date.isToday && calendarStyles.today,
                date.isSelected && calendarStyles.selected,
                date.hasBookings && calendarStyles.hasBookings,
                !date.isCurrentMonth && calendarStyles.otherMonth,
                isDateDisabled(date.date) && calendarStyles.disabled,
                isPastDate && calendarStyles.pastDate,
              ]}
              onPress={() => handleDatePress(date)}
              disabled={isDateDisabled(date.date) || isInteracting}
              activeOpacity={0.7}
            >
              <Text style={[
                calendarStyles.dateText,
                date.isSelected && calendarStyles.selectedText,
                date.isToday && calendarStyles.todayText,
                !date.isCurrentMonth && calendarStyles.otherMonthText,
                isDateDisabled(date.date) && calendarStyles.disabledText,
                isPastDate && calendarStyles.pastDateText,
              ]}>
                {dateNumber}
              </Text>
              {date.hasBookings && (
                <View style={calendarStyles.bookingIndicator}>
                  <Text style={calendarStyles.bookingCount}>
                    {date.bookingCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const calendarStyles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    margin: 4,
    ...(Platform.OS === 'web' ? {
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    } : {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
    }),
    elevation: 6,
  },
  // 안내 메시지 스타일
  infoContainer: {
    backgroundColor: '#e3f2fd',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2196f3',
  },
  infoText: {
    color: '#1976d2',
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 18,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  navButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f8f9ff',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#667eea',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      }
    })
  },
  navText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#667eea',
  },
  monthTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    letterSpacing: 0.5,
  },
  weekHeader: {
    flexDirection: 'row',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  weekDayItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  weekDayText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#fafbfc',
    padding: 8,
    borderRadius: 12,
    gap: 4,
  },
  datesGrid: {
    flex: 1,
  },
  dateItem: {
    width: '13.5%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 1,
    borderRadius: 10,
    position: 'relative',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'transparent',
    ...Platform.select({
      ios: {
        minHeight: 48,
        minWidth: 48,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        minHeight: 44,
        elevation: 1,
      },
    }),
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    textAlign: 'center',
    includeFontPadding: false,
    ...Platform.select({
      ios: {
        lineHeight: 20,
        fontFamily: 'System',
      },
      android: {
        textAlignVertical: 'center',
      },
    }),
  },
  today: {
    backgroundColor: '#e8f0fe',
    borderColor: '#4285f4',
    borderWidth: 2,
    ...Platform.select({
      ios: {
        shadowColor: '#4285f4',
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      }
    })
  },
  todayText: {
    color: '#4285f4',
    fontWeight: 'bold',
  },
  selected: {
    backgroundColor: '#667eea',
    borderWidth: 0,
    transform: [{ scale: 1.05 }],
    ...Platform.select({
      ios: {
        shadowColor: '#667eea',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      }
    })
  },
  selectedText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    ...Platform.select({
      ios: {
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
        fontFamily: 'System',
      },
    }),
  },
  disabled: {
    opacity: 0.3,
  },
  disabledText: {
    color: '#ccc',
  },
  hasBookings: {
    borderColor: '#34a853',
    borderWidth: 2,
    backgroundColor: '#f0fdf4',
  },
  pastDate: {
    backgroundColor: '#f5f5f5',
    borderColor: '#e0e0e0',
  },
  pastDateText: {
    color: '#999',
    fontWeight: '400',
  },
  otherMonth: {
    opacity: 0.3,
  },
  otherMonthText: {
    color: '#bbb',
  },
  bookingIndicator: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#ea4335',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
    ...Platform.select({
      ios: {
        shadowColor: '#ea4335',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
      },
      android: {
        elevation: 4,
      }
    })
  },
  bookingCount: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
    lineHeight: 12,
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
    backgroundColor: '#fafbfc',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  closeButton: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    backgroundColor: '#667eea',
    borderRadius: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#667eea',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      }
    })
  },
  closeButtonText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  treatmentItem: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginVertical: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#34a853',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      }
    })
  },
  treatmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  treatmentTime: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  treatmentStatus: {
    fontSize: 12,
    fontWeight: '600',
    color: '#667eea',
    backgroundColor: '#f0f2ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    overflow: 'hidden',
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 6,
  },
  serviceName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
    lineHeight: 20,
  },
  treatmentNotes: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
    backgroundColor: '#f8f9fa',
    padding: 8,
    borderRadius: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
  },
  // 새 예약하기 버튼 스타일
  newBookingContainer: {
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  newBookingButton: {
    backgroundColor: '#667eea',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#667eea',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      }
    })
  },
  newBookingButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  // 과거 날짜 정보 스타일
  pastDateInfo: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    margin: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  pastDateInfoText: {
    color: '#6c757d',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
});
