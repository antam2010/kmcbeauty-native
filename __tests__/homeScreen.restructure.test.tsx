// SPEC-HOME-001 IMPROVE 검증 — 신규 홈 구조 AC 테스트.
// AC-01(첫 화면 오늘 리스트+CTA), AC-02(상세 3섹션 미렌더), AC-03(오늘 필터·정렬·추가 호출 0),
// AC-04(항목 탭→UnifiedTreatmentModal detail + 죽은 모달 미import), AC-05/06(CTA), AC-07(요약 2~3),
// AC-08(주간 위젯·Alert 제거), AC-15(빈 상태), AC-16/17/18(a11y·폰트·색상), AC-19(자세히 보기→월간 모달).
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import fs from 'fs';
import path from 'path';
import React from 'react';
import { Alert, StyleSheet } from 'react-native';
import { makeQueryWrapper } from './utils/queryTestUtils';

const mockGetTodayDetailedSummary = jest.fn();
const mockGetMonthlyDetailedSummary = jest.fn();
const mockGetWeeklyTreatments = jest.fn();
const mockPush = jest.fn();
const mockShopState: { selectedShop: { id: number; name: string } | null } = {
  selectedShop: { id: 1, name: '테스트샵' },
};

// UnifiedTreatmentModal 은 마지막 props 를 캡처하는 경량 목으로 대체(booking.tsx 소비 패턴 검증용).
let lastModalProps: any = null;
jest.mock('@/components/modals/UnifiedTreatmentModal', () => {
  const { Text } = require('react-native');
  return (props: any) => {
    lastModalProps = props;
    return props.visible ? <Text testID="unified-treatment-modal">UnifiedTreatmentModalMock</Text> : null;
  };
});

jest.mock('@/src/api/services/dashboard', () => ({
  dashboardApiService: {
    getTodayDetailedSummary: (...a: any[]) => mockGetTodayDetailedSummary(...a),
    getMonthlyDetailedSummary: (...a: any[]) => mockGetMonthlyDetailedSummary(...a),
  },
}));
jest.mock('@/src/api/services/treatment', () => ({
  treatmentApiService: { getWeeklyTreatments: (...a: any[]) => mockGetWeeklyTreatments(...a) },
}));
jest.mock('@/contexts/DashboardContext', () => ({
  useDashboard: () => ({ refreshTrigger: 0, triggerRefresh: jest.fn() }),
}));
jest.mock('@/src/stores/shopStore', () => ({
  useShopStore: (selector: any) => selector(mockShopState),
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock('@/components/navigation/ShopHeader', () => () => null);
jest.mock('@/components/dashboard/MonthlyDashboard', () => {
  const { Text } = require('react-native');
  return () => <Text testID="monthly-dashboard-mock">MonthlyDashboardMock</Text>;
});

import HomeScreen from '@/app/(tabs)/index';

const TODAY = new Date().toISOString().split('T')[0];

const SUMMARY = {
  summary: {
    target_date: {
      actual_sales: 150000,
      expected_sales: 200000,
      completed: 3,
      total_reservations: 5,
      cancelled: 1,
      no_show: 0,
    },
    month: { actual_sales: 3000000 },
  },
  sales: { target_date: [] },
  customer_insights: [],
};

function makeTreatment(id: number, timeHHmm: string, name: string): any {
  return {
    id,
    shop_id: 1,
    reserved_at: `${TODAY}T${timeHHmm}:00`,
    status: 'RESERVED',
    status_label: '예약됨',
    payment_method_label: '카드',
    created_at: `${TODAY}T00:00:00`,
    updated_at: `${TODAY}T00:00:00`,
    phonebook: {
      id, shop_id: 1, name, phone_number: '010-0000-0000',
      created_at: `${TODAY}T00:00:00`, updated_at: `${TODAY}T00:00:00`,
    },
    treatment_items: [
      { id, treatment_id: id, menu_detail_id: 1, session_no: 1, custom_price: 0, duration_min: 60, base_price: 30000,
        menu_detail: { id: 1, name: '젤네일', duration_min: 60, base_price: 30000 },
        created_at: `${TODAY}T00:00:00`, updated_at: `${TODAY}T00:00:00` },
    ],
  };
}

// 오늘 2건(정렬 확인용, 입력은 역순) + 어제 1건(오늘 필터 제외 확인).
const YESTERDAY = new Date(Date.now() - 86400000).toISOString().split('T')[0];
const WEEKLY = [
  makeTreatment(2, '14:30', '이영희'),
  makeTreatment(1, '09:00', '김철수'),
  { ...makeTreatment(3, '11:00', '어제고객'), reserved_at: `${YESTERDAY}T11:00:00` },
];

function setup(weekly: any[] = WEEKLY) {
  mockGetTodayDetailedSummary.mockReset();
  mockGetMonthlyDetailedSummary.mockReset();
  mockGetWeeklyTreatments.mockReset();
  mockPush.mockReset();
  lastModalProps = null;
  mockShopState.selectedShop = { id: 1, name: '테스트샵' };
  mockGetTodayDetailedSummary.mockResolvedValue(SUMMARY);
  mockGetWeeklyTreatments.mockResolvedValue(weekly);
  mockGetMonthlyDetailedSummary.mockResolvedValue(SUMMARY);
}

async function renderHome(weekly?: any[]) {
  setup(weekly);
  const { Wrapper } = makeQueryWrapper();
  const utils = render(<HomeScreen />, { wrapper: Wrapper });
  // 데이터 resolve 후 헤더 렌더 대기.
  await waitFor(() => utils.getByText('오늘의 현황'));
  await act(async () => { await Promise.resolve(); });
  return utils;
}

function flat(style: any) {
  return StyleSheet.flatten(style) || {};
}

describe('SPEC-HOME-001 신규 홈 구조 (AC-01 ~ AC-19)', () => {
  beforeEach(() => {
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  it('AC-01: 첫 화면에 오늘의 예약 리스트와 새 예약 버튼이 모두 렌더된다', async () => {
    const { getByTestId, queryByLabelText } = await renderHome();
    expect(getByTestId('today-reservations-list')).toBeTruthy();
    expect(queryByLabelText('새 예약')).not.toBeNull();
  });

  it('AC-02: 상세 통계 3섹션(인기 서비스·고객 인사이트·VIP 고객)이 직접 렌더되지 않는다', async () => {
    const { queryByText } = await renderHome();
    expect(queryByText('인기 서비스')).toBeNull();
    expect(queryByText('고객 인사이트')).toBeNull();
    expect(queryByText('VIP 고객')).toBeNull();
  });

  it('AC-03: 오늘 리스트는 오늘 필터·reserved_at 오름차순이고 추가 서비스 호출이 없다', async () => {
    const { getByTestId } = await renderHome();
    const list = getByTestId('today-reservations-list');
    const itemIds = [
      ...new Set(
        list
          .findAll((n: any) => typeof n.props?.testID === 'string' && n.props.testID.startsWith('today-item-'))
          .map((n: any) => n.props.testID),
      ),
    ];
    // 어제 항목 제외 + 09:00(id1) → 14:30(id2) 오름차순.
    expect(itemIds).toEqual(['today-item-1', 'today-item-2']);
    // 마운트 조회 외 추가 호출 0.
    expect(mockGetTodayDetailedSummary).toHaveBeenCalledTimes(1);
    expect(mockGetWeeklyTreatments).toHaveBeenCalledTimes(1);
  });

  it('AC-04: 항목 탭 → UnifiedTreatmentModal 이 visible + selectedTreatment=탭한 예약(편집 미배선)', async () => {
    const { getByTestId } = await renderHome();
    await act(async () => { fireEvent.press(getByTestId('today-item-1')); });
    expect(lastModalProps.visible).toBe(true);
    expect(lastModalProps.selectedTreatment?.id).toBe(1);
    // 편집 경로(onEditRequest)는 홈에서 배선하지 않는다(예약 탭 소관).
    expect(lastModalProps.onEditRequest).toBeUndefined();
  });

  it('AC-04(grep gate): index.tsx 는 죽은 모달(TreatmentDetailModal/TreatmentListModal)을 import 하지 않는다', () => {
    const src = fs.readFileSync(path.resolve(__dirname, '../app/(tabs)/index.tsx'), 'utf8');
    expect(src).not.toMatch(/TreatmentDetailModal/);
    expect(src).not.toMatch(/TreatmentListModal/);
    expect(src).toMatch(/UnifiedTreatmentModal/);
  });

  it('AC-05: 새 예약 CTA — minHeight>=56 + accessibilityRole=button + 비어있지 않은 accessibilityLabel', async () => {
    const { getByTestId } = await renderHome();
    const cta = getByTestId('new-booking-cta');
    expect(flat(cta.props.style).minHeight).toBeGreaterThanOrEqual(56);
    expect(cta.props.accessibilityRole).toBe('button');
    expect(String(cta.props.accessibilityLabel).length).toBeGreaterThan(0);
  });

  it('AC-06: 새 예약 CTA press → 예약 탭 이동(router.push("/booking"))', async () => {
    const { getByTestId } = await renderHome();
    await act(async () => { fireEvent.press(getByTestId('new-booking-cta')); });
    expect(mockPush).toHaveBeenCalledWith('/booking');
  });

  it('AC-07: 요약 카드 수가 2~3개이고 오늘 매출·예약 데이터를 파생한다', async () => {
    const { getAllByTestId, getByText } = await renderHome();
    const cards = getAllByTestId('summary-card');
    expect(cards.length).toBeGreaterThanOrEqual(2);
    expect(cards.length).toBeLessThanOrEqual(3);
    expect(getByText('오늘 매출')).toBeTruthy();
    expect(getByText('5건')).toBeTruthy(); // total_reservations
  });

  it('AC-08: 주간 달력 위젯이 렌더되지 않고 Alert.alert 예약 목록도 호출되지 않는다', async () => {
    const { queryByText } = await renderHome();
    expect(queryByText('이번 주 예약 현황')).toBeNull();
    expect(Alert.alert).not.toHaveBeenCalled();
  });

  it('AC-15: 오늘 예약 0건 → 빈 상태 안내 + 새 예약 버튼 유지', async () => {
    const { queryByText, queryByLabelText } = await renderHome([]);
    expect(queryByText('오늘 예약이 없습니다')).not.toBeNull();
    expect(queryByLabelText('새 예약')).not.toBeNull();
  });

  it('AC-16: 오늘 리스트 각 항목 터치 타깃 >=44pt + 비어있지 않은 accessibilityLabel', async () => {
    const { getByTestId } = await renderHome();
    for (const id of ['today-item-1', 'today-item-2']) {
      const node = getByTestId(id);
      expect(flat(node.props.style).minHeight).toBeGreaterThanOrEqual(44);
      expect(String(node.props.accessibilityLabel).length).toBeGreaterThan(0);
    }
  });

  it('AC-17: 신규 홈 본문 폰트 >=16, 캡션 >=14', async () => {
    const { getByText } = await renderHome();
    // 본문: 시간·이름·상태·금액 >= 16
    expect(flat(getByText('09:00').props.style).fontSize).toBeGreaterThanOrEqual(16);
    expect(flat(getByText('김철수').props.style).fontSize).toBeGreaterThanOrEqual(16);
    expect(flat(getByText('오늘 매출').props.style).fontSize).toBeGreaterThanOrEqual(14);
    // 요약 값(금액) >= 16
    const salesValue = getByText('₩150,000');
    expect(flat(salesValue.props.style).fontSize).toBeGreaterThanOrEqual(16);
  });

  it('AC-18: 신규 홈 UI 에 저대비 raw hex(#9ca3af/#999/#ccc 계열)가 0건이고 Colors.text 토큰을 사용한다', () => {
    const src = fs.readFileSync(path.resolve(__dirname, '../app/(tabs)/index.tsx'), 'utf8');
    for (const lit of ['#9ca3af', '#999999', '#999', '#cccccc', '#ccc']) {
      expect(src.split(lit).length - 1).toBe(0);
    }
    expect(src).toMatch(/Colors\.text\./);
  });

  it('AC-19: "자세히 보기" press → MonthlyDashboard 모달 마운트', async () => {
    const { getByTestId, queryByTestId } = await renderHome();
    expect(queryByTestId('monthly-dashboard-mock')).toBeNull(); // 닫힘 상태(AC-11 쌍)
    await act(async () => { fireEvent.press(getByTestId('view-details-button')); });
    await waitFor(() => expect(queryByTestId('monthly-dashboard-mock')).not.toBeNull());
  });
});
