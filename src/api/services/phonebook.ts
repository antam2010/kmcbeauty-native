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
  // @MX:NOTE: [AUTO] 순차 페이지 루프 + 50ms 인위적 sleep 제거(REQ-PERF-002). 첫 페이지로 총 페이지 수를 파악한 뒤 2..N 페이지를 Promise.all 로 동시 수집한다. 결과 순서는 페이지 인덱스 순으로 결정적이며 기존 순차 방식과 동일.
  async getAllContacts(): Promise<Phonebook[]> {
    const size = 100; // 서버 LIMIT이 100으로 제한됨

    console.log('📋 전체 전화번호부 조회 시작...');

    try {
      // 1) 첫 페이지 조회로 총 페이지 수 파악
      const firstPage = await this.list({ page: 1, size });
      const totalPages = firstPage.pages || 1;

      // 2) 나머지 페이지(2..N)를 동시 요청 (인위적 지연 없음). 일부 페이지 실패가 전체를 폐기하지 않도록 allSettled 사용(AC-002-2)
      const restResults = await Promise.allSettled(
        Array.from({ length: Math.max(0, totalPages - 1) }, (_, i) =>
          this.list({ page: i + 2, size })
        )
      );

      // 3) 성공한 페이지만 입력 순서대로 병합 (첫 페이지 → 성공한 2..N). 실패 페이지는 건너뜀
      const restItems = restResults
        .filter((r): r is PromiseFulfilledResult<PhonebookResponse> => r.status === 'fulfilled')
        .reduce<Phonebook[]>((acc, r) => acc.concat(r.value.items), []);
      const allContacts = [...firstPage.items, ...restItems];

      const failedPages = restResults.filter((r) => r.status === 'rejected').length;
      if (failedPages > 0) {
        console.warn(`⚠️ 전체 전화번호부 일부 페이지 조회 실패: ${failedPages}개 페이지 누락(성공분만 반환)`);
      }

      console.log(`✅ 전체 전화번호부 조회 완료: ${allContacts.length}개`);
      return allContacts;
    } catch (error) {
      console.error('전체 전화번호부 조회 실패:', error);
      return [];
    }
  }

  // 특정 그룹의 연락처만 가져오기
  // @MX:NOTE: [AUTO] 순차 페이지 루프 + 50ms 인위적 sleep 제거(REQ-PERF-002). 동시 수집 후 group_name 필터링. 필터 결과 순서는 기존 순차 방식과 동일.
  async getContactsByGroup(groupName: string): Promise<Phonebook[]> {
    const size = 100;

    console.log(`📋 그룹 "${groupName}" 연락처 조회 시작...`);

    try {
      // 1) 첫 페이지 조회로 총 페이지 수 파악
      const firstPage = await this.list({ page: 1, size });
      const totalPages = firstPage.pages || 1;

      // 2) 나머지 페이지(2..N)를 동시 요청 (인위적 지연 없음). 일부 페이지 실패가 전체를 폐기하지 않도록 allSettled 사용(AC-002-2)
      const restResults = await Promise.allSettled(
        Array.from({ length: Math.max(0, totalPages - 1) }, (_, i) =>
          this.list({ page: i + 2, size })
        )
      );

      // 3) 성공한 페이지만 입력 순서대로 병합 후 해당 그룹만 필터링. 실패 페이지는 건너뜀
      const restItems = restResults
        .filter((r): r is PromiseFulfilledResult<PhonebookResponse> => r.status === 'fulfilled')
        .reduce<Phonebook[]>((acc, r) => acc.concat(r.value.items), []);
      const allItems = [...firstPage.items, ...restItems];
      const allContacts = allItems.filter(contact => contact.group_name === groupName);

      const failedPages = restResults.filter((r) => r.status === 'rejected').length;
      if (failedPages > 0) {
        console.warn(`⚠️ 그룹 "${groupName}" 일부 페이지 조회 실패: ${failedPages}개 페이지 누락(성공분만 반환)`);
      }

      console.log(`✅ 그룹 "${groupName}" 연락처 조회 완료: ${allContacts.length}개`);
      return allContacts;
    } catch (error) {
      console.error(`그룹 "${groupName}" 연락처 조회 실패:`, error);
      return [];
    }
  }
}

export const phonebookApiService = new PhonebookApiService();
