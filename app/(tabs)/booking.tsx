import BookingListScreen from "@/components/booking/BookingListScreen";
import { ImprovedCalendar } from "@/components/calendar/ImprovedCalendar";
import BookingForm from "@/components/forms/BookingForm";
import UnifiedTreatmentModal from "@/components/modals/UnifiedTreatmentModal";
import ShopHeader from '@/components/navigation/ShopHeader';
import { useDashboard } from "@/contexts/DashboardContext";
import { Treatment } from "@/src/types";
import { BorderRadius, Colors, Shadow, Spacing, Typography } from "@/src/ui/theme";
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
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [isModalClosing, setIsModalClosing] = useState(false);
  const [showTreatmentModal, setShowTreatmentModal] = useState(false);
  const [treatmentsList, setTreatmentsList] = useState<Treatment[]>([]);
  const [treatmentsDate, setTreatmentsDate] = useState<string>('');
  const [selectedTreatment, setSelectedTreatment] = useState<Treatment | null>(null);
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
    setTimeout(() => {
      setShowBookingForm(true);
    }, 200);
  }, [showBookingForm, isModalClosing, showTreatmentModal, scaleAnim]);

  const handleNewBookingRequest = useCallback((date?: string) => {
    // 예약 폼이 이미 열려있거나 닫히는 중이면 무시
    if (showBookingForm || isModalClosing) {
      return;
    }

    const targetDate = date || new Date().toISOString().split('T')[0];
    setSelectedDate(targetDate);
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
      setIsModalClosing(false);
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

  const handleCloseTreatmentModal = useCallback(() => {
    setShowTreatmentModal(false);
    setTimeout(() => {
      setTreatmentsList([]);
      setTreatmentsDate('');
      setSelectedTreatment(null);
    }, 300);
  }, []);

  const handleTreatmentUpdated = useCallback(() => {
    // 예약 수정 완료 후 데이터 새로고침
    triggerRefresh();
    setCalendarRefreshTrigger(prev => prev + 1);
  }, [triggerRefresh]);

  return (
    <View style={styles.container}>
      <ShopHeader title="예약 관리" />
      
      {viewMode === 'list' ? (
        // 리스트 모드일 때는 ScrollView 없이 직접 렌더링
        <View style={styles.listModeContainer}>
          {/* 뷰 모드 탭만 표시 */}
          <View style={styles.listModeHeader}>
            <View style={styles.viewModeSelector}>
              <TouchableOpacity
                style={[
                  styles.viewModeTab,
                  (viewMode as 'calendar' | 'list') === 'calendar' && styles.viewModeTabActive
                ]}
                onPress={() => setViewMode('calendar')}
              >
                <Text style={[
                  styles.viewModeTabText,
                  (viewMode as 'calendar' | 'list') === 'calendar' && styles.viewModeTabTextActive
                ]}>
                  📅 달력
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.viewModeTab,
                  (viewMode as 'calendar' | 'list') === 'list' && styles.viewModeTabActive
                ]}
                onPress={() => setViewMode('list')}
              >
                <Text style={[
                  styles.viewModeTabText,
                  (viewMode as 'calendar' | 'list') === 'list' && styles.viewModeTabTextActive
                ]}>
                  📋 리스트
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {/* 리스트 화면 */}
          <BookingListScreen
            onBookingPress={handleTreatmentPress}
            onNewBooking={() => handleNewBookingRequest()}
          />
        </View>
      ) : (
        // 달력 모드일 때는 기존 ScrollView 사용
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Platform.OS === "ios" ? insets.bottom + 100 : 80 }
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* 달력/리스트 전환 섹션 */}
          <View style={styles.calendarSection}>
            {/* 뷰 모드 탭 */}
            <View style={styles.viewModeSelector}>
              <TouchableOpacity
                style={[
                  styles.viewModeTab,
                  (viewMode as 'calendar' | 'list') === 'calendar' && styles.viewModeTabActive
                ]}
                onPress={() => setViewMode('calendar')}
              >
                <Text style={[
                  styles.viewModeTabText,
                  (viewMode as 'calendar' | 'list') === 'calendar' && styles.viewModeTabTextActive
                ]}>
                  📅 달력
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.viewModeTab,
                  (viewMode as 'calendar' | 'list') === 'list' && styles.viewModeTabActive
                ]}
                onPress={() => setViewMode('list')}
              >
                <Text style={[
                  styles.viewModeTabText,
                  (viewMode as 'calendar' | 'list') === 'list' && styles.viewModeTabTextActive
                ]}>
                  📋 리스트
                </Text>
              </TouchableOpacity>
            </View>
            
            {/* 달력 표시 */}
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
        </ScrollView>
      )}

      {/* 모달들 */}
      <Modal 
        visible={showBookingForm && !isModalClosing}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={handleCloseBookingForm}
      >
        <BookingForm 
          selectedDate={selectedDate || undefined}
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
        onTreatmentUpdated={handleTreatmentUpdated}
        onNewBooking={() => {
          handleCloseTreatmentModal();
          setTimeout(() => {
            const targetDate = treatmentsDate || new Date().toISOString().split('T')[0];
            handleNewBookingRequest(targetDate);
          }, 300);
        }}
      />
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

  // 달력 섹션
  calendarSection: {
    marginBottom: Spacing.xl,
    paddingTop: Spacing.lg,
  },
  
  calendarContainer: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...Shadow.md,
  },
  
  // 뷰 모드 선택기 스타일
  viewModeSelector: {
    flexDirection: 'row',
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    padding: 4,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  
  viewModeTab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  
  viewModeTabActive: {
    backgroundColor: Colors.primary,
    ...Shadow.sm,
  },
  
  viewModeTabText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.text.secondary,
  },
  
  viewModeTabTextActive: {
    color: Colors.white,
    fontWeight: Typography.fontWeight.semibold,
  },
  
  // 리스트 컨테이너
  listContainer: {
    flex: 1,
    minHeight: 400,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...Shadow.sm,
  },
  
  // 리스트 모드 스타일
  listModeContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  
  listModeHeader: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.background,
  },
});
