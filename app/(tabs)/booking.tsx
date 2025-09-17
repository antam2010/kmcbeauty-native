import { ImprovedCalendar } from "@/components/calendar/ImprovedCalendar";
import BookingForm from "@/components/forms/BookingForm";
import EditTreatmentModal from "@/components/modals/EditTreatmentModal";
import UnifiedTreatmentModal from "@/components/modals/UnifiedTreatmentModal";
import ShopHeader from '@/components/navigation/ShopHeader';
import { useDashboard } from "@/contexts/DashboardContext";
import { Treatment } from "@/src/types";
import { useCallback, useRef, useState } from "react";
import { Animated, Modal, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function BookingScreen() {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [isModalClosing, setIsModalClosing] = useState(false);
  const [reservedTimes, setReservedTimes] = useState<string[]>([]);
  const [showTreatmentModal, setShowTreatmentModal] = useState(false);
  const [treatmentsList, setTreatmentsList] = useState<Treatment[]>([]);
  const [treatmentsDate, setTreatmentsDate] = useState<string>('');
  const [selectedTreatment, setSelectedTreatment] = useState<Treatment | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [treatmentToEdit, setTreatmentToEdit] = useState<Treatment | null>(null);
  const [calendarRefreshTrigger, setCalendarRefreshTrigger] = useState(0);
  const insets = useSafeAreaInsets();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const { triggerRefresh } = useDashboard();

  const handleDateSelect = useCallback(async (dateString: string) => {
    // 이미 모달이 열려있거나 닫히는 중이면 무시
    if (showBookingForm || isModalClosing || showTreatmentModal) {
      return;
    }

    // 애니메이션 효과
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    setSelectedDate(dateString);
    setReservedTimes([]); // 새로운 날짜 선택 시 예약된 시간 초기화
    setTimeout(() => {
      setShowBookingForm(true);
    }, 200);
  }, [showBookingForm, isModalClosing, showTreatmentModal, scaleAnim]);

    const handleEditRequest = useCallback((treatment: Treatment) => {
    console.log('handleEditRequest 호출됨, treatment:', treatment.id);
    // 현재 모달들을 먼저 닫고
    setShowTreatmentModal(false);
    setSelectedTreatment(null);
    
    // 수정할 예약 설정하고 수정 모달 열기
    setTimeout(() => {
      setTreatmentToEdit(treatment);
      setShowEditModal(true);
      console.log('수정 모달 열기 완료');
    }, 300); // 모달 닫기 애니메이션 대기
  }, []);

  const handleNewBookingRequest = useCallback((date?: string) => {
    // 예약 폼이 이미 열려있거나 닫히는 중이면 무시
    if (showBookingForm || isModalClosing) {
      return;
    }

    const targetDate = date || new Date().toISOString().split('T')[0];
    setSelectedDate(targetDate);
    setReservedTimes([]); // 빈 배열로 초기화
    setTimeout(() => {
      setShowBookingForm(true);
    }, 200);
  }, [showBookingForm, isModalClosing]);

  const handleCloseBookingForm = useCallback(() => {
    setIsModalClosing(true);
    setShowBookingForm(false);
    
    // 모달이 완전히 닫힌 후 상태 리셋
    setTimeout(() => {
      setSelectedDate(null);
      setReservedTimes([]);
      setIsModalClosing(false);
    }, 500);
  }, []);

  const handleBookingComplete = useCallback(() => {
    setIsModalClosing(true);
    setShowBookingForm(false);
    
    // 대시보드와 달력 새로고침 트리거
    triggerRefresh();
    setCalendarRefreshTrigger(prev => prev + 1);
    
    setTimeout(() => {
      setSelectedDate(null);
      setReservedTimes([]);
      setIsModalClosing(false);
    }, 500);
  }, [triggerRefresh]);

  const handleTreatmentPress = useCallback((treatment: Treatment) => {
    // 직접 상세로 이동하는 경우 (Calendar에서 직접 호출)
    if (showBookingForm || isModalClosing || showTreatmentModal) {
      return;
    }
    
    setSelectedTreatment(treatment);
    setTreatmentsList([]);
    setTreatmentsDate('');
    setTimeout(() => {
      setShowTreatmentModal(true);
    }, 100);
  }, [showBookingForm, isModalClosing, showTreatmentModal]);

  const handleShowTreatmentsList = useCallback((treatments: Treatment[], date: string) => {
    // 목록 모달 표시
    if (showBookingForm || isModalClosing || showTreatmentModal) {
      return;
    }
    
    setTreatmentsList(treatments);
    setTreatmentsDate(date);
    setSelectedTreatment(null); // 목록 표시 시에는 선택된 treatment 없음
    setTimeout(() => {
      setShowTreatmentModal(true);
    }, 100);
  }, [showBookingForm, isModalClosing, showTreatmentModal]);

  const handleEditComplete = useCallback(() => {
    // 수정 모달 닫기
    setShowEditModal(false);
    setTreatmentToEdit(null);
    
    // 대시보드와 달력 새로고침
    triggerRefresh();
    setCalendarRefreshTrigger(prev => prev + 1);
    
  }, [triggerRefresh]);

  const handleCloseTreatmentModal = useCallback(() => {
    setShowTreatmentModal(false);
    setTimeout(() => {
      setTreatmentsList([]);
      setTreatmentsDate('');
      setSelectedTreatment(null);
    }, 300);
  }, []);

  return (
    <View style={[styles.container, { paddingTop: 0 }]}>
      <ShopHeader title="예약 관리" />
      {/* 그라데이션 배경 */}
      <View style={styles.backgroundGradient} />
      
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={[
          styles.scrollContent, 
          { paddingBottom: Platform.OS === "ios" ? insets.bottom + 100 : 80 }
        ]} 
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.headerSubtitle}>원하는 날짜를 선택해보세요</Text>
          <Text style={styles.headerDate}>
            {new Date().toLocaleDateString("ko-KR", { 
              year: "numeric", 
              month: "long", 
              day: "numeric", 
              weekday: "long" 
            })}
          </Text>
        </View>
        
        <Animated.View style={[styles.calendarContainer, { transform: [{ scale: scaleAnim }] }]}>
          <View style={styles.calendarHeader}>
            <View style={styles.iconContainer}>
              <Text style={styles.calendarIcon}>📅</Text>
            </View>
            <Text style={styles.sectionTitle}>예약 달력</Text>
          </View>
          <ImprovedCalendar 
            selectedDate={selectedDate || undefined} 
            onDateSelect={handleDateSelect}
            onNewBookingRequest={handleNewBookingRequest}
            onTreatmentPress={handleTreatmentPress}
            onShowTreatmentsList={handleShowTreatmentsList}
            refreshTrigger={calendarRefreshTrigger}
          />
        </Animated.View>
      </ScrollView>
      
      <Modal 
        visible={showBookingForm && !isModalClosing} 
        animationType="slide" 
        presentationStyle="fullScreen"
        onRequestClose={handleCloseBookingForm}
      >
        <BookingForm 
          selectedDate={selectedDate || undefined}
          reservedTimes={reservedTimes}
          onClose={handleCloseBookingForm} 
          onBookingComplete={handleBookingComplete} 
        />
      </Modal>

      <UnifiedTreatmentModal
        visible={showTreatmentModal}
        treatments={treatmentsList}
        selectedTreatment={selectedTreatment}
        date={treatmentsDate}
        onClose={handleCloseTreatmentModal}
        onEditRequest={handleEditRequest}
        onNewBooking={() => {
          console.log('새 예약 버튼 클릭됨', { treatmentsDate, showTreatmentModal });
          // 트리트먼트 모달을 닫고 새 예약 폼 열기
          handleCloseTreatmentModal();
          setTimeout(() => {
            // treatmentsDate가 있으면 그 날짜로, 없으면 오늘 날짜로
            const targetDate = treatmentsDate || new Date().toISOString().split('T')[0];
            console.log('새 예약 요청:', targetDate);
            handleNewBookingRequest(targetDate);
          }, 300);
        }}
      />

      {/* 수정 모달 */}
      {treatmentToEdit && (
        <EditTreatmentModal
          visible={showEditModal}
          treatment={treatmentToEdit}
          onClose={() => {
            console.log('EditTreatmentModal 닫기');
            setShowEditModal(false);
            setTreatmentToEdit(null);
          }}
          onUpdateSuccess={handleEditComplete}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#f0f4f8" 
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 200,
    backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    ...Platform.select({
      ios: {
        backgroundColor: '#667eea',
      },
      android: {
        backgroundColor: '#667eea',
      }
    })
  },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20 },
  header: { 
    paddingVertical: 30, 
    paddingHorizontal: 4,
    alignItems: 'center',
    zIndex: 1,
  },
  headerTitle: { 
    fontSize: 32, 
    fontWeight: "bold", 
    color: "#ffffff", 
    marginBottom: 8,
    textAlign: 'center',
    ...Platform.select({
      ios: {
        fontFamily: 'System',
        shadowColor: 'rgba(0,0,0,0.3)',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      }
    })
  },
  headerSubtitle: {
    fontSize: 16,
    color: "rgba(255,255,255,0.9)",
    marginBottom: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
  headerDate: { 
    fontSize: 14, 
    color: "rgba(255,255,255,0.8)",
    textAlign: 'center',
    fontWeight: '400',
  },
  calendarContainer: {
    backgroundColor: "#ffffff", 
    borderRadius: 20, 
    padding: 20, 
    marginBottom: 24,
    ...Platform.select({
      ios: {
        shadowColor: "#000", 
        shadowOffset: { width: 0, height: 8 }, 
        shadowOpacity: 0.15, 
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      }
    })
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  calendarIcon: {
    fontSize: 20,
  },
  sectionTitle: { 
    fontSize: 20, 
    fontWeight: "600", 
    color: "#1a1a1a",
    flex: 1,
  }
});
