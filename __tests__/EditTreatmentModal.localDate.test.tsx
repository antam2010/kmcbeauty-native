// UTC 날짜를 로컬(KST) 날짜로 쓰던 버그의 회귀 방지 — 예약 수정 모달.
// 기존 동작: 날짜는 UTC 날짜(toISOString), 시간은 로컬 시각(toTimeString)으로 채운 뒤 저장 시
// `${날짜}T${시간}:00` 을 로컬 시각으로 다시 조립 → 00:00~08:59 KST 예약을 그대로 저장해도 하루 앞당겨졌다.
// 시간대는 jest.config.js 가 Asia/Seoul 로 고정한다.
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import { Alert } from 'react-native';

const mockTreatmentUpdate = jest.fn();
const mockGetAllWithDetails = jest.fn();
const mockGetCurrentShopUsers = jest.fn();
const mockPhonebookList = jest.fn();
const mockPhonebookSearch = jest.fn();

jest.mock('@/src/api/services/treatment', () => ({
  treatmentApiService: { update: (...a: any[]) => mockTreatmentUpdate(...a) },
}));
jest.mock('@/src/api/services/treatmentMenu', () => ({
  treatmentMenuApiService: { getAllWithDetails: (...a: any[]) => mockGetAllWithDetails(...a) },
}));
jest.mock('@/src/api/services/shop', () => ({
  shopApiService: { getCurrentShopUsers: (...a: any[]) => mockGetCurrentShopUsers(...a) },
}));
jest.mock('@/src/api/services/phonebook', () => ({
  phonebookApiService: {
    list: (...a: any[]) => mockPhonebookList(...a),
    search: (...a: any[]) => mockPhonebookSearch(...a),
  },
}));
jest.mock('@/contexts/DashboardContext', () => ({
  useDashboard: () => ({ refreshTrigger: 0, triggerRefresh: jest.fn() }),
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

import EditTreatmentModal from '@/components/modals/EditTreatmentModal';

// 2026-11-10(화) 07:30 KST 예약. API 는 UTC(오프셋 포함)로 내려준다 — UTC 날짜로는 아직 11-09.
const RESERVED_AT = '2026-11-09T22:30:00Z';

const TREATMENT = {
  id: 7,
  shop_id: 1,
  phonebook_id: 3,
  reserved_at: RESERVED_AT,
  status: 'RESERVED',
  payment_method: 'CARD',
  memo: '',
  staff_user_id: null,
  phonebook: { id: 3, name: '김고객', phone_number: '010-1111-2222' },
  treatment_items: [
    {
      id: 1,
      treatment_id: 7,
      menu_detail_id: 11,
      session_no: 1,
      base_price: 30000,
      duration_min: 60,
      menu_detail: { id: 11, menu_id: 1, name: '젤네일', duration_min: 60, base_price: 30000 },
      created_at: '2026-11-01T00:00:00Z',
      updated_at: '2026-11-01T00:00:00Z',
    },
  ],
  created_at: '2026-11-01T00:00:00Z',
  updated_at: '2026-11-01T00:00:00Z',
} as any;

function renderModal() {
  return render(<EditTreatmentModal visible treatment={TREATMENT} onClose={jest.fn()} />);
}

describe('EditTreatmentModal: 00:00~08:59 KST 예약의 날짜', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetAllWithDetails.mockResolvedValue([]);
    mockGetCurrentShopUsers.mockResolvedValue([]);
    mockPhonebookList.mockResolvedValue({ items: [], total: 0, page: 1, pages: 1, size: 10 });
    mockPhonebookSearch.mockResolvedValue([]);
    mockTreatmentUpdate.mockResolvedValue({ id: 7, created_at: '', updated_at: '' });
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('예약 날짜를 KST 날짜(2026년 11월 10일 화요일)로 표시한다', async () => {
    const { findByText } = renderModal();
    expect(await findByText('2026년 11월 10일 화요일')).toBeTruthy();
  });

  it('변경 없이 저장하면 처음과 같은 시각(reserved_at)을 보낸다', async () => {
    const { getByText } = renderModal();
    await waitFor(() => expect(mockGetCurrentShopUsers).toHaveBeenCalledTimes(1));

    fireEvent.press(getByText('저장'));

    await waitFor(() => expect(mockTreatmentUpdate).toHaveBeenCalledTimes(1));
    expect(mockTreatmentUpdate).toHaveBeenCalledWith(
      7,
      expect.objectContaining({ reserved_at: new Date(RESERVED_AT).toISOString() }),
    );
  });
});
