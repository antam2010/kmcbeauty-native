// SPEC-DATA-001 REQ-DATA-001-04 (F-12e): 전화번호부 목록 query.
// query key `['phonebook', shopId, search, page]` — 제출된 검색어/페이지가 바뀌면 재조회한다.
// (검색은 기존 UX 대로 명시적 제출 시점에만 갱신되도록, 소비 측에서 제출된 검색어를 key 로 전달한다.)
import { queryKeys } from '@/src/api/queryKeys';
import { phonebookApiService, type Phonebook } from '@/src/api/services/phonebook';
import { useQuery } from '@tanstack/react-query';

interface UsePhonebookQueryParams {
  shopId: number | undefined;
  search: string;
  page: number;
  size?: number;
}

export function usePhonebookQuery({ shopId, search, page, size = 100 }: UsePhonebookQueryParams) {
  return useQuery<Phonebook[]>({
    queryKey: queryKeys.phonebook(shopId, search, page),
    queryFn: async () => {
      const response = await phonebookApiService.list({
        search: search || undefined,
        page,
        size,
      });
      return response.items;
    },
    enabled: !!shopId,
  });
}
