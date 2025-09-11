import { StyleSheet } from 'react-native';

export const bookingFormStyles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#f8f9fa" 
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  scrollView: { 
    flex: 1 
  },
  
  // 헤더 스타일
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#6c757d',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212529',
  },
  placeholder: {
    width: 40,
  },

  // 섹션 공통 스타일
  section: {
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 10,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#6c757d',
    marginBottom: 10,
    fontStyle: 'italic',
    lineHeight: 18,
  },

  // 날짜 카드 스타일
  dateCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  dateText: {
    fontSize: 16,
    color: '#495057',
    textAlign: 'center',
  },

  // 고객 검색 스타일
  searchInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 10,
    elevation: 1, // 안드로이드 그림자
    shadowColor: '#000', // iOS 그림자
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    minHeight: 48, // 안드로이드 접근성을 위한 최소 높이
  },
  selectedCustomer: {
    backgroundColor: '#e3f2fd',
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1976d2',
  },
  customerPhone: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },

  // 검색 결과 스타일
  searchResults: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
    maxHeight: 300,
    marginTop: 8,
    elevation: 2, // 안드로이드 그림자
    shadowColor: '#000', // iOS 그림자
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  searchResultsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
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
});
