import apiClient from '../../api/client';
import {
    PhonebookCreate,
    PhonebookGroupedByGroupnameResponse,
    PhonebookPageResponse,
    PhonebookResponse,
    PhonebookUpdate
} from '../../types/phonebook';

export const phonebookAPI = {
  // 전화번호부 목록 조회
  getPhonebooks: async (params?: {
    search?: string;
    page?: number;
    size?: number;
  }): Promise<PhonebookPageResponse> => {
    const response = await apiClient.get('/phonebooks', { params });
    return response.data as PhonebookPageResponse;
  },

  // 전화번호부 그룹별 목록 조회
  getPhonebookGroups: async (withItems: boolean = false): Promise<PhonebookGroupedByGroupnameResponse[]> => {
    const response = await apiClient.get('/phonebooks/groups', {
      params: { with_items: withItems }
    });
    return response.data as PhonebookGroupedByGroupnameResponse[];
  },

  // 전화번호부 상세 조회
  getPhonebook: async (phonebookId: number): Promise<PhonebookResponse> => {
    const response = await apiClient.get(`/phonebooks/${phonebookId}`);
    return response.data as PhonebookResponse;
  },

  // 전화번호부 생성
  createPhonebook: async (data: PhonebookCreate): Promise<PhonebookResponse> => {
    const response = await apiClient.post('/phonebooks', data);
    return response.data as PhonebookResponse;
  },

  // 전화번호부 수정
  updatePhonebook: async (phonebookId: number, data: PhonebookUpdate): Promise<PhonebookResponse> => {
    const response = await apiClient.put(`/phonebooks/${phonebookId}`, data);
    return response.data as PhonebookResponse;
  },

  // 전화번호부 삭제
  deletePhonebook: async (phonebookId: number): Promise<void> => {
    await apiClient.delete(`/phonebooks/${phonebookId}`);
  },
};
