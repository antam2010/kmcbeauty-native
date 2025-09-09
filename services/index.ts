import { apiClient } from './api';

// 타입 정의
export interface Staff {
  id: string;
  name: string;
  position: string;
  specialties: string[];
  status: 'active' | 'inactive';
  email?: string;
  phone?: string;
  joinDate?: string;
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
}

export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number; // 분 단위
  category: string;
  isActive: boolean;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  joinDate: string;
  lastVisit?: string;
  totalBookings: number;
}

// 직원 관리 API
export const staffService = {
  // 모든 직원 조회
  getAllStaff: async (): Promise<Staff[]> => {
    const response = await apiClient.get('/staff');
    return response.data;
  },

  // 활성 직원 조회
  getActiveStaff: async (): Promise<Staff[]> => {
    const response = await apiClient.get('/staff?status=active');
    return response.data;
  },

  // 직원 상세 조회
  getStaffById: async (id: string): Promise<Staff> => {
    const response = await apiClient.get(`/staff/${id}`);
    return response.data;
  },

  // 새 직원 추가
  createStaff: async (staff: Omit<Staff, 'id'>): Promise<Staff> => {
    const response = await apiClient.post('/staff', staff);
    return response.data;
  },

  // 직원 정보 수정
  updateStaff: async (id: string, staff: Partial<Staff>): Promise<Staff> => {
    const response = await apiClient.put(`/staff/${id}`, staff);
    return response.data;
  },

  // 직원 삭제
  deleteStaff: async (id: string): Promise<void> => {
    await apiClient.delete(`/staff/${id}`);
  },

  // 직원 상태 변경
  updateStaffStatus: async (id: string, status: 'active' | 'inactive'): Promise<Staff> => {
    const response = await apiClient.patch(`/staff/${id}/status`, { status });
    return response.data;
  },
};

// 예약 관리 API
export const bookingService = {
  // 모든 예약 조회
  getAllBookings: async (): Promise<Booking[]> => {
    const response = await apiClient.get('/bookings');
    return response.data;
  },

  // 날짜별 예약 조회
  getBookingsByDate: async (date: string): Promise<Booking[]> => {
    const response = await apiClient.get(`/bookings?date=${date}`);
    return response.data;
  },

  // 직원별 예약 조회
  getBookingsByStaff: async (staffId: string): Promise<Booking[]> => {
    const response = await apiClient.get(`/bookings?staffId=${staffId}`);
    return response.data;
  },

  // 예약 상세 조회
  getBookingById: async (id: string): Promise<Booking> => {
    const response = await apiClient.get(`/bookings/${id}`);
    return response.data;
  },

  // 새 예약 생성
  createBooking: async (booking: Omit<Booking, 'id'>): Promise<Booking> => {
    const response = await apiClient.post('/bookings', booking);
    return response.data;
  },

  // 예약 수정
  updateBooking: async (id: string, booking: Partial<Booking>): Promise<Booking> => {
    const response = await apiClient.put(`/bookings/${id}`, booking);
    return response.data;
  },

  // 예약 취소
  cancelBooking: async (id: string): Promise<Booking> => {
    const response = await apiClient.patch(`/bookings/${id}/cancel`);
    return response.data;
  },

  // 예약 상태 변경
  updateBookingStatus: async (id: string, status: Booking['status']): Promise<Booking> => {
    const response = await apiClient.patch(`/bookings/${id}/status`, { status });
    return response.data;
  },
};

// 서비스 관리 API
export const serviceService = {
  // 모든 서비스 조회
  getAllServices: async (): Promise<Service[]> => {
    const response = await apiClient.get('/services');
    return response.data;
  },

  // 활성 서비스 조회
  getActiveServices: async (): Promise<Service[]> => {
    const response = await apiClient.get('/services?isActive=true');
    return response.data;
  },

  // 서비스 상세 조회
  getServiceById: async (id: string): Promise<Service> => {
    const response = await apiClient.get(`/services/${id}`);
    return response.data;
  },

  // 새 서비스 추가
  createService: async (service: Omit<Service, 'id'>): Promise<Service> => {
    const response = await apiClient.post('/services', service);
    return response.data;
  },

  // 서비스 수정
  updateService: async (id: string, service: Partial<Service>): Promise<Service> => {
    const response = await apiClient.put(`/services/${id}`, service);
    return response.data;
  },

  // 서비스 삭제
  deleteService: async (id: string): Promise<void> => {
    await apiClient.delete(`/services/${id}`);
  },
};

// 고객 관리 API
export const customerService = {
  // 모든 고객 조회
  getAllCustomers: async (): Promise<Customer[]> => {
    const response = await apiClient.get('/customers');
    return response.data;
  },

  // 고객 상세 조회
  getCustomerById: async (id: string): Promise<Customer> => {
    const response = await apiClient.get(`/customers/${id}`);
    return response.data;
  },

  // 새 고객 추가
  createCustomer: async (customer: Omit<Customer, 'id' | 'joinDate' | 'totalBookings'>): Promise<Customer> => {
    const response = await apiClient.post('/customers', customer);
    return response.data;
  },

  // 고객 정보 수정
  updateCustomer: async (id: string, customer: Partial<Customer>): Promise<Customer> => {
    const response = await apiClient.put(`/customers/${id}`, customer);
    return response.data;
  },

  // 고객 삭제
  deleteCustomer: async (id: string): Promise<void> => {
    await apiClient.delete(`/customers/${id}`);
  },

  // 고객 예약 히스토리 조회
  getCustomerBookingHistory: async (id: string): Promise<Booking[]> => {
    const response = await apiClient.get(`/customers/${id}/bookings`);
    return response.data;
  },
};

// 대시보드 통계 API
export const dashboardService = {
  // 대시보드 통계 조회
  getDashboardStats: async () => {
    const response = await apiClient.get('/dashboard/stats');
    return response.data;
  },

  // 월별 매출 조회
  getMonthlyRevenue: async (year: number, month: number) => {
    const response = await apiClient.get(`/dashboard/revenue?year=${year}&month=${month}`);
    return response.data;
  },

  // 인기 서비스 조회
  getPopularServices: async () => {
    const response = await apiClient.get('/dashboard/popular-services');
    return response.data;
  },
};
