import { api } from '../../api';

// 예약 관련 타입
export interface Booking {
  id: number;
  service_id: number;
  stylist_id: number;
  customer_id: number;
  booking_date: string;
  booking_time: string;
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateBookingRequest {
  service_id: number;
  stylist_id: number;
  booking_date: string;
  booking_time: string;
  notes?: string;
}

export interface BookingResponse {
  booking: Booking;
  message: string;
}

// 예약 API
export const bookingAPI = {
  // 예약 목록 가져오기
  getBookings: async (): Promise<Booking[]> => {
    const response = await api.get('/api/bookings');
    return response.data as Booking[];
  },

  // 예약 생성
  createBooking: async (bookingData: CreateBookingRequest): Promise<BookingResponse> => {
    const response = await api.post('/api/bookings', bookingData);
    return response.data as BookingResponse;
  },

  // 예약 수정
  updateBooking: async (bookingId: number, updateData: Partial<CreateBookingRequest>): Promise<BookingResponse> => {
    const response = await api.put(`/api/bookings/${bookingId}`, updateData);
    return response.data as BookingResponse;
  },

  // 예약 취소
  cancelBooking: async (bookingId: number): Promise<{ message: string }> => {
    const response = await api.delete(`/api/bookings/${bookingId}`);
    return response.data as { message: string };
  },

  // 예약 상세 정보
  getBookingDetail: async (bookingId: number): Promise<Booking> => {
    const response = await api.get(`/api/bookings/${bookingId}`);
    return response.data as Booking;
  }
};
