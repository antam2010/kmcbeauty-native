// =============================================================================
// 🎯 통합 타입 시스템 (KMC Beauty App)
// =============================================================================

// 개별 타입 모듈들을 재내보내기
export * from './auth';
export * from './common';
export * from './dashboard';
export * from './phonebook';
export * from './shop';
export * from './treatment';
export * from './user';

// 하위 호환성을 위한 기존 타입들 (레거시 지원)
export type UserRole = 'ADMIN' | 'MASTER' | 'MANAGER' | 'STAFF' | 'USER';

// 비즈니스 로직 관련 타입들
export interface Staff {
  id: string;
  name: string;
  position: string;
  specialties: string[];
  status: 'active' | 'inactive';
  email?: string;
  phone?: string;
  joinDate?: string;
  avatar?: string;
  workingHours?: {
    start: string;
    end: string;
    daysOff: string[];
  };
}

export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number; // 분 단위
  category: string;
  isActive: boolean;
  image?: string;
}

export interface Booking {
  id: string;
  customerId: string;
  customerName: string;
  staffId: string;
  staffName: string;
  serviceId: string;
  serviceName: string;
  date: string;
  time: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  price: number;
  duration: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BookingSlot {
  date: string;
  time: string;
  isAvailable: boolean;
  staffId?: string;
}

export interface CreateBookingRequest {
  customerId: string;
  staffId: string;
  serviceId: string;
  date: string;
  time: string;
  notes?: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  joinDate: string;
  lastVisit?: string;
  totalBookings: number;
  preferences?: {
    preferredStaff?: string;
    preferredServices?: string[];
  };
}

// 캘린더 관련 타입
export interface CalendarDate {
  date: string;
  isToday: boolean;
  isSelected: boolean;
  hasBookings: boolean;
  bookingCount: number;
  isCurrentMonth: boolean;
}

export interface CalendarMonth {
  year: number;
  month: number;
  dates: CalendarDate[];
}

// 폼 관련 타입
export interface SelectedTreatmentItem {
  menuDetail: {
    id: number;
    menu_id: number;
    name: string;
    duration_min: number;
    base_price: number;
    created_at: string;
    updated_at: string;
  };
  sessionNo: number;
  customPrice: number;
  customDuration: number;
}

// 모달 관련 타입
export interface ModalProps {
  visible: boolean;
  onClose: () => void;
}