import { ImprovedCalendar } from "@/components/calendar/ImprovedCalendar";
import BookingForm from "@/components/forms/BookingForm";
import EditTreatmentModal from "@/components/modals/EditTreatmentModal";
import UnifiedTreatmentModal from "@/components/modals/UnifiedTreatmentModal";
import ShopHeader from '@/components/navigation/ShopHeader';
import { useDashboard } from "@/contexts/DashboardContext";
import { Treatment } from "@/src/types";
import { BorderRadius, Colors, Shadow, Spacing, Typography } from "@/src/ui/theme";
import { formatKoreanDate, formatTodayKorean } from "@/src/utils/dateUtils";
import { useCallback, useRef, useState } from "react";
import {
  Animated,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
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

    // 예약이 없는 날짜를 선택한 경우에만 새 예약 폼 열기
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
    <View style={styles.container}>
      <ShopHeader title="예약 관리" />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Platform.OS === "ios" ? insets.bottom + 100 : 80 }
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* 헤더 섹션 */}
        <View style={styles.headerSection}>
          <Text style={styles.welcomeText}>오늘도 좋은 하루 되세요! ✨</Text>
          <Text style={styles.dateText}>
            {formatTodayKorean()}
          </Text>
        </View>

        {/* 빠른 액션 버튼들 */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>빠른 예약</Text>
          <View style={styles.quickButtonsRow}>
            <TouchableOpacity 
              style={styles.quickButton}
              onPress={() => handleNewBookingRequest()}
              activeOpacity={0.8}
            >
              <View style={[styles.quickButtonIcon, { backgroundColor: Colors.primary + '20' }]}>
                <Text style={styles.quickButtonEmoji}>➕</Text>
              </View>
              <Text style={styles.quickButtonText}>새 예약</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickButton}
              onPress={() => handleNewBookingRequest(new Date().toISOString().split('T')[0])}
              activeOpacity={0.8}
            >
              <View style={[styles.quickButtonIcon, { backgroundColor: Colors.success + '20' }]}>
                <Text style={styles.quickButtonEmoji}>📅</Text>
              </View>
              <Text style={styles.quickButtonText}>오늘 예약</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickButton}
              onPress={() => {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                handleNewBookingRequest(tomorrow.toISOString().split('T')[0]);
              }}
              activeOpacity={0.8}
            >
              <View style={[styles.quickButtonIcon, { backgroundColor: Colors.warning + '20' }]}>
                <Text style={styles.quickButtonEmoji}>⏰</Text>
              </View>
              <Text style={styles.quickButtonText}>내일 예약</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 달력 섹션 */}
        <View style={styles.calendarSection}>
          <View style={styles.calendarHeader}>
            <Text style={styles.sectionTitle}>예약 달력</Text>
            <Text style={styles.sectionSubtitle}>날짜를 터치하여 예약을 관리하세요</Text>
          </View>
          
          <Animated.View style={[styles.calendarContainer, { transform: [{ scale: scaleAnim }] }]}>
            <ImprovedCalendar 
              selectedDate={selectedDate || undefined}
              onDateSelect={handleDateSelect}
              onNewBookingRequest={handleNewBookingRequest}
              onTreatmentPress={handleTreatmentPress}
              onShowTreatmentsList={handleShowTreatmentsList}
              refreshTrigger={calendarRefreshTrigger}
            />
          </Animated.View>
        </View>

        {/* 선택된 날짜 정보 */}
        {selectedDate && (
          <View style={styles.selectedDateSection}>
            <Text style={styles.selectedDateTitle}>선택된 날짜</Text>
            <Text style={styles.selectedDateValue}>
              {formatKoreanDate(selectedDate)}
            </Text>
            <TouchableOpacity 
              style={styles.bookingButton}
              onPress={() => handleNewBookingRequest(selectedDate)}
              activeOpacity={0.8}
            >
              <Text style={styles.bookingButtonText}>이 날짜에 예약하기</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* 모달들 */}
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
          onDateChange={(newDate: string) => {
            setSelectedDate(newDate);
          }}
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
          handleCloseTreatmentModal();
          setTimeout(() => {
            const targetDate = treatmentsDate || new Date().toISOString().split('T')[0];
            handleNewBookingRequest(targetDate);
          }, 300);
        }}
      />

      {treatmentToEdit && (
        <EditTreatmentModal
          visible={showEditModal}
          treatment={treatmentToEdit}
          onClose={() => {
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
    backgroundColor: Colors.background,
  },
  
  scrollView: {
    flex: 1,
  },
  
  scrollContent: {
    paddingHorizontal: Spacing.lg,
  },

  // 헤더 섹션
  headerSection: {
    paddingVertical: Spacing.xl,
    alignItems: 'center',
  },
  
  welcomeText: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  
  dateText: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
    textAlign: 'center',
  },

  // 빠른 액션 섹션
  quickActionsSection: {
    marginBottom: Spacing.xl,
  },
  
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  
  sectionSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginBottom: Spacing.lg,
  },
  
  quickButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  
  quickButton: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    alignItems: 'center',
    ...Shadow.sm,
  },
  
  quickButtonIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  
  quickButtonEmoji: {
    fontSize: 24,
  },
  
  quickButtonText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.text.primary,
    textAlign: 'center',
  },

  // 달력 섹션
  calendarSection: {
    marginBottom: Spacing.xl,
  },
  
  calendarHeader: {
    marginBottom: Spacing.lg,
  },
  
  calendarContainer: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...Shadow.md,
  },

  // 선택된 날짜 섹션
  selectedDateSection: {
    backgroundColor: Colors.primary + '10',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    alignItems: 'center',
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.primary + '20',
  },
  
  selectedDateTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  
  selectedDateValue: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  
  bookingButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    ...Shadow.sm,
  },
  
  bookingButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.white,
    textAlign: 'center',
  },
});
