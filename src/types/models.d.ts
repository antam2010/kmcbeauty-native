// 앱 전체에서 사용하는 공통 타입 정의

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ErrorResponse {
  message: string;
  code?: string;
  details?: any;
}

// 뷰티 서비스 관련 타입
export interface Service {
  id: number;
  name: string;
  description?: string;
  price: number;
  duration: number; // 분 단위
  category: 'MAKEUP' | 'EYEBROW' | 'SCALP' | 'OTHER';
  status: 'ACTIVE' | 'INACTIVE';
  created_at: string;
  updated_at: string;
}

// 스타일리스트 타입
export interface Stylist {
  id: number;
  name: string;
  email: string;
  phone: string;
  specialties: string[];
  experience_years: number;
  rating: number;
  status: 'ACTIVE' | 'INACTIVE';
  shop_id: number;
  created_at: string;
  updated_at: string;
}

// 시간 슬롯 타입
export interface TimeSlot {
  time: string; // HH:MM 형식
  available: boolean;
  booking_id?: number;
}

// 일정 타입
export interface Schedule {
  date: string; // YYYY-MM-DD 형식
  slots: TimeSlot[];
}

// 통계 타입
export interface DashboardStats {
  todayBookings: number;
  monthlyRevenue: number;
  popularServices: {
    service: Service;
    bookingCount: number;
  }[];
  recentBookings: {
    id: number;
    customerName: string;
    serviceName: string;
    appointmentTime: string;
    status: string;
  }[];
}
