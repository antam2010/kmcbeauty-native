import { Colors, Spacing, Typography } from '@/src/ui/theme';
import { StyleSheet } from 'react-native';

export const bookingFormStyles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: Colors.gray[50]
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: Typography.fontSize.base,
    color: Colors.gray[600],
  },
  scrollView: { 
    flex: 1 
  },
  
  // 헤더 스타일
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.gray[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: Typography.fontSize.lg,
    color: Colors.gray[500],
    fontWeight: Typography.fontWeight.semibold,
  },
  headerTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.gray[900],
  },
  placeholder: {
    width: 40,
  },

  // 섹션 공통 스타일
  section: {
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.gray[900],
    marginBottom: Spacing.sm,
  },
  sectionSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[500],
    marginBottom: Spacing.sm,
    fontStyle: 'italic',
    lineHeight: 18,
  },

  // 날짜 카드 스타일
  dateCard: {
    backgroundColor: Colors.white,
    padding: Spacing.md,
    borderRadius: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.gray[200],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateContent: {
    flex: 1,
  },
  dateText: {
    fontSize: Typography.fontSize.base,
    color: Colors.gray[700],
    fontWeight: Typography.fontWeight.medium,
  },
  dateChangeText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary,
    marginTop: 2,
  },
  dateChangeIcon: {
    fontSize: 24,
    marginLeft: Spacing.sm,
  },

  // 고객 검색 스타일
  searchInput: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.gray[200],
    borderRadius: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    fontSize: Typography.fontSize.base,
    marginBottom: Spacing.sm,
    elevation: 1, // 안드로이드 그림자
    shadowColor: Colors.black, // iOS 그림자
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    minHeight: 48, // 안드로이드 접근성을 위한 최소 높이
  },
  selectedCustomer: {
    backgroundColor: Colors.primaryLight,
    padding: Spacing.sm,
    borderRadius: Spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.primary,
  },
  customerPhone: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[600],
    marginTop: 2,
  },

  // 검색 결과 스타일
  searchResults: {
    backgroundColor: Colors.white,
    borderRadius: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.gray[200],
    maxHeight: 300,
    marginTop: Spacing.xs,
    elevation: 2, // 안드로이드 그림자
    shadowColor: Colors.black, // iOS 그림자
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  searchResultsTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.gray[700],
    padding: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    backgroundColor: '#f8f9fa',
  },
  customerItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa',
    backgroundColor: '#ffffff',
    minHeight: 60, // 최소 높이 보장
  },
  customerItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  customerItemName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#212529',
  },
  customerItemPhone: {
    fontSize: 13,
    color: '#6c757d',
    marginTop: 2,
  },
  customerItemDate: {
    fontSize: 12,
    color: '#28a745',
    fontWeight: '500',
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },

  // 시간 선택 스타일
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'space-between',
  },
  timeSlot: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 8,
    minWidth: '22%',
    maxWidth: '23%',
    alignItems: 'center',
    marginBottom: 6,
  },
  selectedTimeSlot: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  reservedTimeSlot: {
    backgroundColor: '#f8f9fa',
    borderColor: '#dee2e6',
  },
  timeSlotText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#495057',
  },
  selectedTimeSlotText: {
    color: '#ffffff',
  },
  reservedTimeSlotText: {
    color: '#adb5bd',
  },
  reservedIndicator: {
    fontSize: 10,
    color: '#dc3545',
    marginTop: 2,
  },

  // 시술 메뉴 스타일
  menuGroup: {
    marginBottom: 16,
  },
  menuGroupTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 8,
    paddingLeft: 8,
  },
  treatmentOption: {
    backgroundColor: '#ffffff',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  treatmentInfo: {
    flex: 1,
  },
  treatmentName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#212529',
  },
  treatmentDetails: {
    fontSize: 13,
    color: '#6c757d',
    marginTop: 2,
  },
  addButton: {
    fontSize: 20,
    color: '#28a745',
    fontWeight: 'bold',
    paddingHorizontal: 8,
  },

  // 선택된 시술 옵션 스타일
  treatmentOptionSelected: {
    backgroundColor: '#e3f2fd',
    borderColor: '#2196f3',
    borderWidth: 1.5,
  },
  treatmentNameSelected: {
    color: '#1976d2',
  },
  treatmentDetailsSelected: {
    color: '#1976d2',
  },
  addButtonSelected: {
    color: '#2196f3',
    fontSize: 18,
  },

  // 선택된 시술 스타일
  selectedTreatment: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#28a745',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  treatmentHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  treatmentBasicInfo: {
    flex: 1,
    marginRight: 8,
    minWidth: '60%',
  },
  treatmentBaseInfo: {
    fontSize: 12,
    color: '#6c757d',
    marginTop: 2,
  },

  // 회차 컨트롤 스타일
  sessionControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  sessionLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#495057',
    marginRight: 8,
  },
  sessionButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  sessionButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#495057',
  },
  sessionNo: {
    fontSize: 14,
    fontWeight: '500',
    color: '#495057',
    marginHorizontal: 8,
    minWidth: 30,
    textAlign: 'center',
  },

  // 커스텀 컨트롤 스타일
  customControls: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  customControlRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  customControlItem: {
    flex: 1,
  },
  customControlLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#495057',
    marginBottom: 8,
  },
  customInputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 2,
  },
  customInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    paddingVertical: 8,
    color: '#212529',
  },
  customUnit: {
    fontSize: 14,
    color: '#6c757d',
    fontWeight: '500',
    marginLeft: 4,
  },

  // 퀵 액션 스타일
  quickActionsRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
  },
  quickButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  quickButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#495057',
  },

  // 삭제 버튼 스타일
  removeButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#dc3545',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: 'bold',
  },

  // 요약 스타일
  totalSummary: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  totalText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#495057',
    textAlign: 'center',
  },
  itemSummary: {
    backgroundColor: '#e8f5e8',
    padding: 8,
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#28a745',
  },
  itemSummaryText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#155724',
    textAlign: 'center',
  },

  // 직원 선택 스타일
  staffSelection: {
    gap: 8,
  },
  staffOption: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 8,
    padding: 12,
  },
  selectedStaffOption: {
    backgroundColor: '#e3f2fd',
    borderColor: '#1976d2',
  },
  staffInfo: {
    flex: 1,
  },
  staffOptionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#495057',
  },
  selectedStaffOptionText: {
    color: '#1976d2',
  },
  staffRole: {
    fontSize: 13,
    color: '#6c757d',
    marginTop: 2,
  },
  selectedStaffRole: {
    color: '#1565c0',
  },

  // 결제 방법 스타일
  paymentMethods: {
    flexDirection: 'row',
    gap: 8,
  },
  paymentMethod: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  selectedPaymentMethod: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  paymentMethodText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#495057',
  },
  selectedPaymentMethodText: {
    color: '#ffffff',
  },

  // 메모 입력 스타일
  memoInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 80,
  },

  // 예약 버튼 스타일
  bookingButton: {
    backgroundColor: '#667eea',
    borderRadius: 12,
    paddingVertical: 16,
    marginHorizontal: 16,
    marginTop: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 54,
  },
  disabledButton: {
    backgroundColor: '#adb5bd',
  },
  bookingButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },

  // 새 고객 등록 버튼 스타일
  addCustomerButton: {
    backgroundColor: '#1976d2',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
    marginTop: 8,
  },
  addCustomerButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },

  // 간단한 날짜 입력 스타일
  dateInputContainer: {
    marginBottom: Spacing.md,
  },
  dateTextInput: {
    borderWidth: 1,
    borderColor: Colors.gray[300],
    borderRadius: 8,
    padding: Spacing.md,
    fontSize: Typography.fontSize.base,
    color: Colors.gray[900],
    backgroundColor: Colors.white,
    marginBottom: Spacing.sm,
  },
  dateDisplay: {
    backgroundColor: Colors.gray[50],
    padding: Spacing.sm,
    borderRadius: 6,
  },
  dateDisplayText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[600],
    textAlign: 'center',
  },

  // 날짜 선택 모달 스타일
  datePickerModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  datePickerModalContent: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    margin: Spacing.xl,
    maxWidth: 400,
    width: '90%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
  },
  datePickerTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.gray[900],
  },
  datePickerCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.gray[50],
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.gray[200],
  },
  datePickerCloseText: {
    fontSize: Typography.fontSize.lg,
    color: Colors.gray[500],
    fontWeight: Typography.fontWeight.semibold,
  },
});
