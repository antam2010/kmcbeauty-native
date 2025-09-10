import { BaseApiService } from './base';

// 전화번호부 타입 정의
export interface Phonebook {
  id: number;
  shop_id: number;
  group_name: string | null;
  name: string;
  phone_number: string;
  memo: string | null;
  created_at: string;
  updated_at: string;
}

export interface PhonebookCreate {
  group_name?: string | null;
  memo?: string | null;
  name: string;
  phone_number: string;
}

export interface PhonebookUpdate {
  group_name?: string | null;
  memo?: string | null;
  name?: string;
  phone_number?: string;
}

export interface PhonebookResponse {
  items: Phonebook[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface PhonebookGroup {
  group_name: string;
  count: number;
  items: Phonebook[];
}

class PhonebookApiService extends BaseApiService {
  protected readonly basePath = '/phonebooks';

  // 전화번호부 목록 조회
  async list(params?: { search?: string; page?: number; size?: number }): Promise<PhonebookResponse> {
    const queryString = this.buildQueryString(params || {});
    return this.get<PhonebookResponse>(queryString);
  }

  // 전화번호부 생성
  async create(data: PhonebookCreate): Promise<Phonebook> {
    return this.post<Phonebook>('', data);
  }

  // 전화번호부 상세 조회
  async getById(id: number): Promise<Phonebook> {
    return this.get<Phonebook>(`/${id}`);
  }

  // 전화번호부 수정
  async update(id: number, data: PhonebookUpdate): Promise<Phonebook> {
    return this.put<Phonebook>(`/${id}`, data);
  }

  // 전화번호부 삭제
  async remove(id: number): Promise<void> {
    return this.delete<void>(`/${id}`);
  }

  // 전화번호부 그룹 목록 조회
  async getGroups(withItems = false): Promise<PhonebookGroup[]> {
    const queryString = this.buildQueryString({ with_items: withItems });
    return this.get<PhonebookGroup[]>(`/groups${queryString}`);
  }

  // 이름 또는 전화번호로 검색
  async search(query: string): Promise<Phonebook[]> {
    const response = await this.list({ search: query, size: 100 });
    return response.items;
  }
}

export const phonebookApiService = new PhonebookApiService();
