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

  // 전화번호 중복 확인
  async checkDuplicate(phoneNumber: string): Promise<{ exists: boolean; phone_number?: string }> {
    return this.get<{ exists: boolean; phone_number?: string }>(`/check-duplicate?phone_number=${encodeURIComponent(phoneNumber)}`);
  }

  // 모든 전화번호부 가져오기 (페이지네이션 우회)
  async getAllContacts(): Promise<Phonebook[]> {
    let allContacts: Phonebook[] = [];
    let page = 1;
    const size = 100; // 서버 LIMIT이 100으로 제한됨
    let hasMore = true;

    console.log('📋 전체 전화번호부 조회 시작...');

    while (hasMore) {
      try {
        console.log(`📄 페이지 ${page} 조회 중... (${size}개씩)`);
        const response = await this.list({ page, size });
        
        allContacts = allContacts.concat(response.items);
        
        console.log(`📊 현재까지 ${allContacts.length}개 조회, 전체 ${response.total}개`);
        
        // 더 이상 가져올 데이터가 없으면 종료
        hasMore = response.items.length === size && allContacts.length < response.total;
        page++;
        
        // API 과부하 방지를 위한 짧은 지연
        if (hasMore) {
          await new Promise(resolve => setTimeout(resolve, 50));
        }
        
      } catch (error) {
        console.error(`페이지 ${page} 조회 실패:`, error);
        break;
      }
    }

    console.log(`✅ 전체 전화번호부 조회 완료: ${allContacts.length}개`);
    return allContacts;
  }

  // 특정 그룹의 연락처만 가져오기
  async getContactsByGroup(groupName: string): Promise<Phonebook[]> {
    let allContacts: Phonebook[] = [];
    let page = 1;
    const size = 100;
    let hasMore = true;

    console.log(`📋 그룹 "${groupName}" 연락처 조회 시작...`);

    while (hasMore) {
      try {
        console.log(`📄 페이지 ${page} 조회 중... (${size}개씩)`);
        const response = await this.list({ page, size });
        
        // 해당 그룹에 속한 연락처만 필터링
        const groupContacts = response.items.filter(contact => 
          contact.group_name === groupName
        );
        
        allContacts = allContacts.concat(groupContacts);
        
        console.log(`📊 현재까지 ${allContacts.length}개 조회 (그룹: ${groupName})`);
        
        // 더 이상 가져올 데이터가 없으면 종료
        hasMore = response.items.length === size && allContacts.length < response.total;
        page++;
        
        // API 과부하 방지를 위한 짧은 지연
        if (hasMore) {
          await new Promise(resolve => setTimeout(resolve, 50));
        }
        
      } catch (error) {
        console.error(`페이지 ${page} 조회 실패:`, error);
        break;
      }
    }

    console.log(`✅ 그룹 "${groupName}" 연락처 조회 완료: ${allContacts.length}개`);
    return allContacts;
  }
}

export const phonebookApiService = new PhonebookApiService();
