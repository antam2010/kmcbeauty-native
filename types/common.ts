// 대시보드 관련 타입
export interface DashboardStats {
  todayBookings: number;
  activeStaff: number;
  monthlyRevenue: number;
  newCustomers: number;
  completedBookings: number;
  cancelledBookings: number;
  popularServices: PopularService[];
}

export interface PopularService {
  name: string;
  bookings: number;
  revenue: number;
}

// 일반적인 API 응답 타입
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// 에러 타입
export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

// 달력 관련 타입
export interface CalendarDate {
  date: string;
  isToday: boolean;
  isSelected: boolean;
  hasBookings: boolean;
  bookingCount: number;
}

export interface CalendarMonth {
  year: number;
  month: number;
  dates: CalendarDate[];
}
