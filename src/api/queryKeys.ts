// SPEC-DATA-001 REQ-DATA-001-01~05: 서버-상태 캐시의 단일 query key 출처.
// 화면 간 캐시 공유(직원 목록)와 mutation 무효화 대상 계열을 한 곳에서 관리한다.
// 계열(prefix) 무효화를 위해 각 key 의 첫 세그먼트를 안정적으로 유지한다.

export const queryKeys = {
  // 홈 대시보드 오늘 요약 (F-12a)
  dashboardToday: (shopId: number | undefined, date: string) =>
    ['dashboard', 'today', shopId, date] as const,

  // 주간 시술 (F-12a)
  treatmentsWeekly: (shopId: number | undefined, range: string) =>
    ['treatments', 'weekly', shopId, range] as const,

  // 월간 시술(달력 읽기 경로) (F-12b)
  treatmentsMonthly: (shopId: number | undefined, month: string) =>
    ['treatments', 'monthly', shopId, month] as const,

  // 직원 목록 — 예약 폼·직원 관리 화면 공유 key (F-12d, REQ-04 D5)
  shopUsers: (shopId: number | undefined) => ['shopUsers', shopId] as const,

  // 시술 메뉴 — 예약 폼·메뉴 관리 화면 공유 key (F-12c)
  treatmentMenus: (shopId: number | undefined) => ['treatmentMenus', shopId] as const,

  // 전화번호부 목록 (F-12e)
  phonebook: (shopId: number | undefined, search: string, page: number) =>
    ['phonebook', shopId, search, page] as const,
} as const;

// mutation 무효화 대상 계열 prefix (부분 일치 무효화)
export const queryKeyPrefix = {
  dashboard: ['dashboard'] as const,
  treatments: ['treatments'] as const,
  shopUsers: ['shopUsers'] as const,
  treatmentMenus: ['treatmentMenus'] as const,
  phonebook: ['phonebook'] as const,
} as const;
