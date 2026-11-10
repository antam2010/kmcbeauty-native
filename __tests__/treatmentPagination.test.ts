// SPEC-DATA-001 REQ-DATA-001-07 (F-14) AC-13/AC-14: 페이지네이션 팬아웃 상한.
import { treatmentApiService } from '@/src/api/services/treatment';
import type { Treatment } from '@/src/types';

function page(items: Treatment[], pages: number) {
  return { items, total: items.length, page: 1, size: 50, pages } as any;
}
function makeItem(id: number): Treatment {
  return { id, reserved_at: `2026-07-${(id % 28) + 1}T10:00:00` } as unknown as Treatment;
}

describe('SPEC-DATA-001 treatment.ts 팬아웃 상한', () => {
  afterEach(() => jest.restoreAllMocks());

  it('AC-13: pages=25 → list 호출 정확히 20회 + console.warn 1회(월간)', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const listSpy = jest
      .spyOn(treatmentApiService, 'list')
      .mockImplementation(async (params?: any) => {
        const p = params?.page ?? 1;
        if (p === 1) return page([makeItem(1)], 25);
        return page([makeItem(p)], 25);
      });

    await treatmentApiService.getMonthlyTreatments(2026, 7);

    // 첫 페이지(1) + 나머지 19페이지 = 20회 (상한 MAX_PAGES=20).
    expect(listSpy).toHaveBeenCalledTimes(20);
    // 상한 초과 경고 1회.
    const capWarn = warnSpy.mock.calls.filter((c) => String(c[0]).includes('상한 초과'));
    expect(capWarn).toHaveLength(1);
  });

  it('AC-13: pages=25 → 주간도 동일하게 20회로 제한', async () => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    const listSpy = jest
      .spyOn(treatmentApiService, 'list')
      .mockImplementation(async (params?: any) => {
        const p = params?.page ?? 1;
        return page([makeItem(p)], 25);
      });

    await treatmentApiService.getWeeklyTreatments();
    expect(listSpy).toHaveBeenCalledTimes(20);
  });

  it('AC-14: pages=3(≤MAX) 경로는 반환 항목/순서 변경 없음 + 경고 없음', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const listSpy = jest
      .spyOn(treatmentApiService, 'list')
      .mockImplementation(async (params?: any) => {
        const p = params?.page ?? 1;
        return page([makeItem(p * 10), makeItem(p * 10 + 1)], 3);
      });

    const result = await treatmentApiService.getMonthlyTreatments(2026, 7);

    expect(listSpy).toHaveBeenCalledTimes(3); // page 1,2,3
    // 병합 순서: page1 → page2 → page3 (입력 순서 결정적)
    expect(result.map((t) => t.id)).toEqual([10, 11, 20, 21, 30, 31]);
    const capWarn = warnSpy.mock.calls.filter((c) => String(c[0]).includes('상한 초과'));
    expect(capWarn).toHaveLength(0);
  });
});
