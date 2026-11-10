// UTC 날짜를 로컬(KST) 날짜로 쓰던 버그의 회귀 방지 — API 날짜 파라미터.
// API 는 start_date / end_date / target_date 를 KST 달력 날짜(종료일 포함)로 해석한다.
// 시간대는 jest.config.js 가 Asia/Seoul 로 고정한다.
import apiClient, { authDebugUtils } from '@/src/api/client';
import { dashboardApiService } from '@/src/api/services/dashboard';
import { treatmentApiService } from '@/src/api/services/treatment';

const emptyPage = () => ({ items: [], total: 0, page: 1, size: 50, pages: 1 }) as any;

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe('treatment.ts 조회 기간(start_date / end_date)', () => {
  it('getMonthlyTreatments(2026, 11) → 2026-11-01 ~ 2026-11-30 (말일 포함)', async () => {
    const listSpy = jest.spyOn(treatmentApiService, 'list').mockResolvedValue(emptyPage());
    await treatmentApiService.getMonthlyTreatments(2026, 11);
    expect(listSpy).toHaveBeenCalledWith(
      expect.objectContaining({ start_date: '2026-11-01', end_date: '2026-11-30' }),
    );
  });

  it('getMonthlyTreatments(2026, 2) → 2026-02-01 ~ 2026-02-28', async () => {
    const listSpy = jest.spyOn(treatmentApiService, 'list').mockResolvedValue(emptyPage());
    await treatmentApiService.getMonthlyTreatments(2026, 2);
    expect(listSpy).toHaveBeenCalledWith(
      expect.objectContaining({ start_date: '2026-02-01', end_date: '2026-02-28' }),
    );
  });

  it('getWeeklyTreatments: 2026-11-09(월) 08:00 KST → 2026-11-09 ~ 2026-11-15', async () => {
    jest.useFakeTimers({ now: new Date('2026-11-08T23:00:00Z') }); // 2026-11-09(월) 08:00 KST
    const listSpy = jest.spyOn(treatmentApiService, 'list').mockResolvedValue(emptyPage());
    await treatmentApiService.getWeeklyTreatments();
    expect(listSpy).toHaveBeenCalledWith(
      expect.objectContaining({ start_date: '2026-11-09', end_date: '2026-11-15' }),
    );
  });

  it('getWeeklyTreatments: 2026-11-15(일) 14:00 KST → 그 주 2026-11-09 ~ 2026-11-15 (일요일은 주의 마지막 날)', async () => {
    jest.useFakeTimers({ now: new Date('2026-11-15T05:00:00Z') }); // 2026-11-15(일) 14:00 KST
    const listSpy = jest.spyOn(treatmentApiService, 'list').mockResolvedValue(emptyPage());
    await treatmentApiService.getWeeklyTreatments();
    expect(listSpy).toHaveBeenCalledWith(
      expect.objectContaining({ start_date: '2026-11-09', end_date: '2026-11-15' }),
    );
  });
});

describe('오늘(target_date) 소비자: 2026-11-10 07:30 KST', () => {
  beforeEach(() => {
    jest.useFakeTimers({ now: new Date('2026-11-09T22:30:00Z') }); // UTC 로는 아직 11-09
  });

  it('dashboardApiService.getTodayDetailedSummary → target_date 2026-11-10', async () => {
    const spy = jest.spyOn(dashboardApiService, 'getDetailedSummary').mockResolvedValue({} as any);
    await dashboardApiService.getTodayDetailedSummary();
    expect(spy).toHaveBeenCalledWith({ target_date: '2026-11-10', force_refresh: false });
  });

  it('dashboardApiService.getTodaySummary → target_date 2026-11-10', async () => {
    const spy = jest.spyOn(dashboardApiService, 'getSummary').mockResolvedValue({} as any);
    await dashboardApiService.getTodaySummary();
    expect(spy).toHaveBeenCalledWith({ target_date: '2026-11-10' });
  });

  it('authDebugUtils.testDashboardAPI → target_date 2026-11-10', async () => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    const getSpy = jest.spyOn(apiClient, 'get').mockResolvedValue({ status: 200 } as any);
    await authDebugUtils.testDashboardAPI();
    expect(getSpy).toHaveBeenCalledWith('/summary/dashboard', {
      params: { target_date: '2026-11-10', force_refresh: false },
    });
  });
});
