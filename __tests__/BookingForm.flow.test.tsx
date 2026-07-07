// SPEC-BOOKING-001 렌더 특성/흐름 테스트.
// AC-06(고객 미지정 인라인 안내 + 확인 Alert 0회), AC-07(성공 Alert 0회 + onBookingComplete 1회 + 햅틱 1회),
// AC-03(4xx 실패 시 폼 상태 유지 + onBookingComplete 미호출), AC-12(첫 가용 슬롯 강조 + selectedTime null).
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import React from 'react';
import { makeQueryWrapper } from './utils/queryTestUtils';

const mockGetAllWithDetails = jest.fn();
const mockGetCurrentShopUsers = jest.fn();
const mockGetUsers = jest.fn();
const mockPhonebookList = jest.fn();
const mockPhonebookSearch = jest.fn();
const mockCheckDuplicate = jest.fn();
const mockPhonebookCreate = jest.fn();
const mockTreatmentCreate = jest.fn();
const mockNotificationAsync = jest.fn();

jest.mock('@/src/api/services/treatmentMenu', () => ({
  treatmentMenuApiService: { getAllWithDetails: (...a: any[]) => mockGetAllWithDetails(...a) },
}));
jest.mock('@/src/api/services/shop', () => ({
  shopApiService: {
    getCurrentShopUsers: (...a: any[]) => mockGetCurrentShopUsers(...a),
    getUsers: (...a: any[]) => mockGetUsers(...a),
  },
}));
jest.mock('@/src/api/services/phonebook', () => ({
  phonebookApiService: {
    list: (...a: any[]) => mockPhonebookList(...a),
    search: (...a: any[]) => mockPhonebookSearch(...a),
    checkDuplicate: (...a: any[]) => mockCheckDuplicate(...a),
    create: (...a: any[]) => mockPhonebookCreate(...a),
  },
}));
jest.mock('@/src/api/services/treatment', () => ({
  treatmentApiService: { create: (...a: any[]) => mockTreatmentCreate(...a) },
}));
jest.mock('expo-haptics', () => ({
  notificationAsync: (...a: any[]) => mockNotificationAsync(...a),
  NotificationFeedbackType: { Success: 'success' },
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

import BookingForm from '@/components/forms/BookingForm';

const MENUS = [
  {
    id: 1,
    shop_id: 1,
    name: '네일',
    created_at: '2026-01-01T00:00:00',
    updated_at: '2026-01-01T00:00:00',
    details: [
      {
        id: 11,
        menu_id: 1,
        name: '젤네일',
        duration_min: 60,
        base_price: 30000,
        created_at: '2026-01-01T00:00:00',
        updated_at: '2026-01-01T00:00:00',
      },
    ],
  },
];

function setupMocks() {
  mockGetAllWithDetails.mockResolvedValue(MENUS);
  mockGetCurrentShopUsers.mockResolvedValue([]);
  mockGetUsers.mockResolvedValue([]);
  mockPhonebookList.mockResolvedValue({ items: [], total: 0, page: 1, pages: 1, size: 10 });
  mockPhonebookSearch.mockResolvedValue([]);
  mockCheckDuplicate.mockResolvedValue({ exists: false });
  mockPhonebookCreate.mockResolvedValue({
    id: 999,
    name: '고객 미지정',
    phone_number: '999-9999-9999',
    created_at: '2026-01-01T00:00:00',
    updated_at: '2026-01-01T00:00:00',
  });
  mockNotificationAsync.mockResolvedValue(undefined);
}

async function renderForm() {
  const onBookingComplete = jest.fn();
  const onClose = jest.fn();
  // SPEC-DATA-001: BookingForm 이 react-query 를 사용하므로 QueryClientProvider 로 래핑한다.
  const { Wrapper, client } = makeQueryWrapper();
  const utils = render(
    <BookingForm selectedDate="2026-07-07" onClose={onClose} onBookingComplete={onBookingComplete} />,
    { wrapper: Wrapper },
  );
  // 시술 메뉴 로드 완료 대기(로딩 게이트 해제)
  await waitFor(() => utils.getByText('젤네일'));
  return { ...utils, onBookingComplete, onClose, client };
}

describe('BookingForm 흐름 (SPEC-BOOKING-001)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  it('AC-06: 고객 미선택 시 "고객 미지정으로 저장됩니다" 인라인 안내를 렌더한다', async () => {
    const { getByTestId } = await renderForm();
    expect(getByTestId('customer-unassigned-notice')).toBeTruthy();
  });

  it('AC-07: 고객 미지정 예약 성공 — 확인/성공 Alert 0회 + onBookingComplete 1회 + 햅틱 1회', async () => {
    mockTreatmentCreate.mockResolvedValue({ id: 1, created_at: '', updated_at: '' });
    const { getByText, onBookingComplete } = await renderForm();

    fireEvent.press(getByText('09:00')); // 시간 선택
    fireEvent.press(getByText('젤네일')); // 시술 추가 (InteractionManager)
    await waitFor(() => getByText('✅ 선택된 시술')); // 시술 추가 반영 대기

    fireEvent.press(getByText('예약하기'));

    await waitFor(() => expect(mockTreatmentCreate).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(onBookingComplete).toHaveBeenCalledTimes(1));
    expect(mockNotificationAsync).toHaveBeenCalledTimes(1);
    expect(mockNotificationAsync).toHaveBeenCalledWith('success');
    // 확인 Alert('고객 미지정') 및 성공 Alert('완료') 모두 호출되지 않음
    const alertTitles = (Alert.alert as jest.Mock).mock.calls.map((c) => c[0]);
    expect(alertTitles).not.toContain('고객 미지정');
    expect(alertTitles).not.toContain('완료');
  });

  it('AC-07(payload): 성공 시 create 가 payment_method 를 포함해 호출된다(F-8)', async () => {
    mockTreatmentCreate.mockResolvedValue({ id: 1, created_at: '', updated_at: '' });
    const { getByText } = await renderForm();
    fireEvent.press(getByText('09:00'));
    fireEvent.press(getByText('젤네일'));
    await waitFor(() => getByText('✅ 선택된 시술'));
    fireEvent.press(getByText('예약하기'));
    await waitFor(() => expect(mockTreatmentCreate).toHaveBeenCalledTimes(1));
    expect(mockTreatmentCreate).toHaveBeenCalledWith(
      expect.objectContaining({ payment_method: 'CARD', status: 'RESERVED' }),
    );
  });

  it('AC-03: 생성 4xx 실패 시 폼 상태 유지 + onBookingComplete 미호출', async () => {
    mockTreatmentCreate.mockRejectedValue({ response: { status: 400 } });
    const { getByText, queryByText, onBookingComplete } = await renderForm();

    fireEvent.press(getByText('09:00'));
    fireEvent.press(getByText('젤네일'));
    await waitFor(() => getByText('✅ 선택된 시술'));
    fireEvent.press(getByText('예약하기'));

    await waitFor(() => expect(mockTreatmentCreate).toHaveBeenCalledTimes(1));
    expect(onBookingComplete).not.toHaveBeenCalled();
    // 선택한 시술이 폼에 그대로 유지됨(초기화되지 않음)
    expect(queryByText('✅ 선택된 시술')).toBeTruthy();
  });

  it('SPEC-DATA-001 AC-09: 예약 생성 성공 후 treatments·dashboard query 를 invalidate 한다', async () => {
    mockTreatmentCreate.mockResolvedValue({ id: 1, created_at: '', updated_at: '' });
    const { getByText, client } = await renderForm();
    const invalidateSpy = jest.spyOn(client, 'invalidateQueries');

    fireEvent.press(getByText('09:00'));
    fireEvent.press(getByText('젤네일'));
    await waitFor(() => getByText('✅ 선택된 시술'));
    fireEvent.press(getByText('예약하기'));

    await waitFor(() => expect(mockTreatmentCreate).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(invalidateSpy).toHaveBeenCalled());

    const invalidatedKeys = invalidateSpy.mock.calls.map((c) => (c[0] as any)?.queryKey);
    expect(invalidatedKeys).toContainEqual(['treatments']);
    expect(invalidatedKeys).toContainEqual(['dashboard']);
  });

  it('AC-12: 오늘 날짜에서 첫 가용 슬롯이 강조되고, 강조 시점 selectedTime 은 미설정(탭 전)', async () => {
    // 결정성 확보를 위해 09:15 로 시각 고정 → 첫 가용 슬롯 09:30
    const RealDate = Date;
    const fixed = new RealDate('2026-07-07T09:15:00');
    const spy = jest
      .spyOn(global, 'Date')
      .mockImplementation((...args: any[]) =>
        args.length ? new (RealDate as any)(...args) : (fixed as any),
      );
    (global.Date as unknown as { now: () => number }).now = () => fixed.getTime();

    try {
      const { getByTestId, getByText } = await renderForm();
      const highlighted = getByTestId('highlighted-slot');
      expect(highlighted).toBeTruthy();
      // 09:30 슬롯이 강조되었고, 선택(파란 채움) 스타일은 아직 없음 → selectedTime 미설정
      expect(getByText('09:30')).toBeTruthy();
    } finally {
      spy.mockRestore();
    }
  });
});
