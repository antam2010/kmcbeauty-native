// SPEC-DATA-001 REQ-DATA-001-04 (F-12c/e) AC-08: 메뉴·전화번호부 목록 재진입 시 staleTime 내 재요청 0회.
import { renderHook, waitFor, act } from '@testing-library/react-native';
import { makeQueryWrapper } from './utils/queryTestUtils';

const mockGetAllWithDetails = jest.fn();
const mockPhonebookList = jest.fn();

jest.mock('@/src/api/services/treatmentMenu', () => ({
  treatmentMenuApiService: { getAllWithDetails: (...a: any[]) => mockGetAllWithDetails(...a) },
}));
jest.mock('@/src/api/services/phonebook', () => ({
  phonebookApiService: { list: (...a: any[]) => mockPhonebookList(...a) },
}));

import { useTreatmentMenusQuery } from '@/hooks/queries/useTreatmentMenusQuery';
import { usePhonebookQuery } from '@/hooks/queries/usePhonebookQuery';

describe('SPEC-DATA-001 AC-08: 목록 재진입 dedup', () => {
  beforeEach(() => {
    mockGetAllWithDetails.mockReset().mockResolvedValue([]);
    mockPhonebookList.mockReset().mockResolvedValue({ items: [], total: 0, page: 1, size: 100, pages: 1 });
  });

  it('메뉴 목록: 동일 shopId 로 2회 마운트해도 fetch 1회', async () => {
    const { Wrapper } = makeQueryWrapper();
    const a = renderHook(() => useTreatmentMenusQuery(1), { wrapper: Wrapper });
    await waitFor(() => expect(a.result.current.isSuccess).toBe(true));
    a.unmount();

    const b = renderHook(() => useTreatmentMenusQuery(1), { wrapper: Wrapper });
    await waitFor(() => expect(b.result.current.isSuccess).toBe(true));

    expect(mockGetAllWithDetails).toHaveBeenCalledTimes(1);
  });

  it('전화번호부 목록: 동일 (shopId, search, page) 로 2회 마운트해도 fetch 1회', async () => {
    const { Wrapper } = makeQueryWrapper();
    const a = renderHook(() => usePhonebookQuery({ shopId: 1, search: '', page: 1 }), { wrapper: Wrapper });
    await waitFor(() => expect(a.result.current.isSuccess).toBe(true));
    a.unmount();

    const b = renderHook(() => usePhonebookQuery({ shopId: 1, search: '', page: 1 }), { wrapper: Wrapper });
    await act(async () => { await Promise.resolve(); });

    expect(b.result.current.isSuccess).toBe(true);
    expect(mockPhonebookList).toHaveBeenCalledTimes(1);
  });

  it('전화번호부: 제출된 검색어(key)가 바뀌면 재조회한다', async () => {
    const { Wrapper } = makeQueryWrapper();
    const { result, rerender } = renderHook(
      ({ search }: { search: string }) => usePhonebookQuery({ shopId: 1, search, page: 1 }),
      { wrapper: Wrapper, initialProps: { search: '' } },
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockPhonebookList).toHaveBeenCalledTimes(1);

    rerender({ search: '홍길동' });
    await waitFor(() => expect(mockPhonebookList).toHaveBeenCalledTimes(2));
    expect(mockPhonebookList).toHaveBeenLastCalledWith({ search: '홍길동', page: 1, size: 100 });
  });
});
