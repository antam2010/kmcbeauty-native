import { Booking, BookingSlot, CreateBookingRequest } from '@/types';
import { apiClient } from '../api';

export const bookingService = {
  // 모든 예약 조회
  getAllBookings: async (): Promise<Booking[]> => {
    const response = await apiClient.get('/bookings');
    return response.data as Booking[];
  },

  // 날짜별 예약 조회
  getBookingsByDate: async (date: string): Promise<Booking[]> => {
    const response = await apiClient.get(`/bookings?date=${date}`);
    return response.data as Booking[];
  },

  // 월별 예약 조회
  getBookingsByMonth: async (year: number, month: number): Promise<Booking[]> => {
    const response = await apiClient.get(`/bookings?year=${year}&month=${month}`);
    return response.data as Booking[];
  },

  // 직원별 예약 조회
  getBookingsByStaff: async (staffId: string): Promise<Booking[]> => {
    const response = await apiClient.get(`/bookings?staffId=${staffId}`);
    return response.data as Booking[];
  },

  // 예약 상세 조회
  getBookingById: async (id: string): Promise<Booking> => {
    const response = await apiClient.get(`/bookings/${id}`);
    return response.data as Booking;
  },

  // 새 예약 생성
  createBooking: async (booking: CreateBookingRequest): Promise<Booking> => {
    const response = await apiClient.post('/bookings', booking);
    return response.data as Booking;
  },

  // 예약 수정
  updateBooking: async (id: string, booking: Partial<Booking>): Promise<Booking> => {
    const response = await apiClient.put(`/bookings/${id}`, booking);
    return response.data as Booking;
  },

  // 예약 취소
  cancelBooking: async (id: string): Promise<Booking> => {
    const response = await apiClient.patch(`/bookings/${id}/cancel`);
    return response.data as Booking;
  },

  // 예약 상태 변경
  updateBookingStatus: async (id: string, status: Booking['status']): Promise<Booking> => {
    const response = await apiClient.patch(`/bookings/${id}/status`, { status });
    return response.data as Booking;
  },

  // 예약 가능한 시간 슬롯 조회
  getAvailableSlots: async (
    date: string, 
    serviceId: string, 
    staffId?: string
  ): Promise<BookingSlot[]> => {
    const params = new URLSearchParams({
      date,
      serviceId,
      ...(staffId && { staffId }),
    });
    const response = await apiClient.get(`/bookings/available-slots?${params}`);
    return response.data as BookingSlot[];
  },

  // 예약 통계 조회
  getBookingStats: async (startDate: string, endDate: string) => {
    const response = await apiClient.get(`/bookings/stats?startDate=${startDate}&endDate=${endDate}`);
    return response.data;
  },
};
