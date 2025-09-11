import Calendar from "@/components/calendar/Calendar";
import BookingForm from "@/components/forms/BookingForm";
import TreatmentDetailModal from "@/components/modals/TreatmentDetailModal";
import TreatmentListModal from "@/components/modals/TreatmentListModal";
import { useDashboard } from "@/contexts/DashboardContext";
import { Treatment } from "@/src/types/treatment";
import React, { useCallback, useRef, useState } from "react";
import { Alert, Animated, Modal, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function BookingScreen() {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [isModalClosing, setIsModalClosing] = useState(false);
  const [reservedTimes, setReservedTimes] = useState<string[]>([]);
  const [selectedTreatment, setSelectedTreatment] = useState<Treatment | null>(null);
  const [showTreatmentDetail, setShowTreatmentDetail] = useState(false);
  const [showTreatmentsList, setShowTreatmentsList] = useState(false);
  const [treatmentsList, setTreatmentsList] = useState<Treatment[]>([]);
  const [treatmentsDate, setTreatmentsDate] = useState<string>('');
  const insets = useSafeAreaInsets();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const { triggerRefresh } = useDashboard();

  const handleDateSelect = useCallback(async (dateString: string) => {
    // 이미 모달이 열려있거나 닫히는 중이면 무시
    if (showBookingForm || isModalClosing || showTreatmentDetail || showTreatmentsList) {
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
  }, [showBookingForm, isModalClosing, showTreatmentDetail, showTreatmentsList, scaleAnim]);

  const handleNewBookingRequest = useCallback(async (dateString: string, reservedTimesForDate: string[]) => {
    // 이미 모달이 열려있거나 닫히는 중이면 무시
    if (showBookingForm || isModalClosing || showTreatmentDetail || showTreatmentsList) {
      return;
    }

    setSelectedDate(dateString);
    setReservedTimes(reservedTimesForDate); // 해당 날짜의 예약된 시간들 설정
    setTimeout(() => {
      setShowBookingForm(true);
    }, 200);
  }, [showBookingForm, isModalClosing, showTreatmentDetail, showTreatmentsList]);

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
    
    // 대시보드 새로고침 트리거
    triggerRefresh();
    
    setTimeout(() => {
      setSelectedDate(null);
      setReservedTimes([]);
      setIsModalClosing(false);
      Alert.alert("완료", "예약이 완료되었습니다!", [
        { text: "확인", style: "default" }
      ]);
    }, 500);
  }, [triggerRefresh]);

  const handleTreatmentPress = useCallback((treatment: Treatment) => {
    // 다른 모달이 열려있으면 무시
    if (showBookingForm || isModalClosing || showTreatmentDetail || showTreatmentsList) {
      return;
    }
    
    setSelectedTreatment(treatment);
    // 모바일에서 안전한 처리를 위해 약간의 지연
    setTimeout(() => {
      setShowTreatmentDetail(true);
    }, 100);
  }, [showBookingForm, isModalClosing, showTreatmentDetail, showTreatmentsList]);

  const handleCloseTreatmentDetail = useCallback(() => {
    setShowTreatmentDetail(false);
    // 상태 리셋을 위한 지연
    setTimeout(() => {
      setSelectedTreatment(null);
    }, 300);
  }, []);

  const handleShowTreatmentsList = useCallback((treatments: Treatment[], date: string) => {
    // 다른 모달이 열려있으면 무시
    if (showBookingForm || isModalClosing || showTreatmentDetail || showTreatmentsList) {
      return;
    }
    
    setTreatmentsList(treatments);
    setTreatmentsDate(date);
    setTimeout(() => {
      setShowTreatmentsList(true);
    }, 100);
  }, [showBookingForm, isModalClosing, showTreatmentDetail, showTreatmentsList]);

  const handleCloseTreatmentsList = useCallback(() => {
    setShowTreatmentsList(false);
    setTimeout(() => {
      setTreatmentsList([]);
      setTreatmentsDate('');
    }, 300);
  }, []);

  const handleTreatmentSelectFromList = useCallback((treatment: Treatment) => {
    // 목록 모달을 먼저 닫고 상세 모달 열기
    setShowTreatmentsList(false);
    setSelectedTreatment(treatment);
    
    setTimeout(() => {
      setTreatmentsList([]);
      setTreatmentsDate('');
      setShowTreatmentDetail(true);
    }, 300);
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
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
          <Text style={styles.headerTitle}>예약 관리</Text>
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
          <Calendar 
            selectedDate={selectedDate || undefined} 
            onDateSelect={handleDateSelect}
            onNewBookingRequest={handleNewBookingRequest}
            onTreatmentPress={handleTreatmentPress}
            onShowTreatmentsList={handleShowTreatmentsList}
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

      <TreatmentDetailModal
        visible={showTreatmentDetail}
        treatment={selectedTreatment}
        onClose={handleCloseTreatmentDetail}
      />

      <TreatmentListModal
        visible={showTreatmentsList}
        treatments={treatmentsList}
        date={treatmentsDate}
        onClose={handleCloseTreatmentsList}
        onTreatmentSelect={handleTreatmentSelectFromList}
        onNewBooking={() => {
          handleCloseTreatmentsList();
          setTimeout(() => {
            handleNewBookingRequest(treatmentsDate, []);
          }, 300);
        }}
      />
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
