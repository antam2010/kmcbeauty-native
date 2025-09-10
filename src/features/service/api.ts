import { api } from '../../api';
import { Schedule, Service, Stylist } from '../../types/models';

// 서비스 관련 타입
export interface CreateServiceRequest {
  name: string;
  description?: string;
  price: number;
  duration: number;
  category: 'MAKEUP' | 'EYEBROW' | 'SCALP' | 'OTHER';
}

// 서비스 API
export const serviceAPI = {
  // 서비스 목록 가져오기
  getServices: async (): Promise<Service[]> => {
    const response = await api.get('/api/services');
    return response.data as Service[];
  },

  // 서비스 생성
  createService: async (serviceData: CreateServiceRequest): Promise<Service> => {
    const response = await api.post('/api/services', serviceData);
    return response.data as Service;
  },

  // 서비스 수정
  updateService: async (serviceId: number, updateData: Partial<CreateServiceRequest>): Promise<Service> => {
    const response = await api.put(`/api/services/${serviceId}`, updateData);
    return response.data as Service;
  },

  // 서비스 삭제
  deleteService: async (serviceId: number): Promise<{ message: string }> => {
    const response = await api.delete(`/api/services/${serviceId}`);
    return response.data as { message: string };
  }
};

// 스타일리스트 API
export const stylistAPI = {
  // 스타일리스트 목록 가져오기
  getStylists: async (): Promise<Stylist[]> => {
    const response = await api.get('/api/stylists');
    return response.data as Stylist[];
  },

  // 스타일리스트 일정 가져오기
  getStylistSchedule: async (stylistId: number, date: string): Promise<Schedule> => {
    const response = await api.get(`/api/stylists/${stylistId}/schedule/${date}`);
    return response.data as Schedule;
  },

  // 사용 가능한 시간 슬롯 가져오기
  getAvailableSlots: async (stylistId: number, serviceId: number, date: string) => {
    const response = await api.get(`/api/stylists/${stylistId}/available-slots`, {
      params: { service_id: serviceId, date }
    });
    return response.data;
  }
};
