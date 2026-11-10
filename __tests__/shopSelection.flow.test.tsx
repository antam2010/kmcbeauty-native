// SPEC-BOOKING-001 REQ-BOOKING-001-04 (AC-08): shop-selection 성공 시
// "확인" 탭 성공 Alert 0회 + 자동 네비게이션(햅틱 1회) 실행.
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import React from 'react';

const mockList = jest.fn();
const mockSelectShop = jest.fn();
const mockBack = jest.fn();
const mockReplace = jest.fn();
const mockCanGoBack = jest.fn();
const mockNotificationAsync = jest.fn();

jest.mock('@/src/api/services/shop', () => ({
  shopApiService: { list: (...a: any[]) => mockList(...a) },
}));
jest.mock('@/src/stores/shopStore', () => ({
  useShopStore: (selector: any) => selector({ selectShop: (...a: any[]) => mockSelectShop(...a) }),
}));
jest.mock('expo-router', () => ({
  router: {
    back: (...a: any[]) => mockBack(...a),
    replace: (...a: any[]) => mockReplace(...a),
    canGoBack: (...a: any[]) => mockCanGoBack(...a),
  },
}));
jest.mock('expo-haptics', () => ({
  notificationAsync: (...a: any[]) => mockNotificationAsync(...a),
  NotificationFeedbackType: { Success: 'success' },
}));

import ShopSelectionScreen from '@/app/shop-selection';

const SHOP = {
  id: 7,
  name: '테스트샵',
  address: '서울',
  address_detail: '1층',
  phone: '02-000',
  business_number: '123',
};

describe('ShopSelectionScreen 성공 흐름 (REQ-BOOKING-001-04)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockList.mockResolvedValue({ items: [SHOP], total: 1, page: 1, pages: 1, size: 50 });
    mockSelectShop.mockResolvedValue(undefined);
    mockCanGoBack.mockReturnValue(false);
    mockNotificationAsync.mockResolvedValue(undefined);
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  it('AC-08: 상점 선택 성공 시 성공 Alert 0회 + 햅틱 1회 + 자동 네비게이션', async () => {
    const { getByText } = render(<ShopSelectionScreen />);
    await waitFor(() => getByText('테스트샵'));

    fireEvent.press(getByText('테스트샵'));

    await waitFor(() => expect(mockSelectShop).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(mockReplace).toHaveBeenCalledTimes(1));
    expect(mockNotificationAsync).toHaveBeenCalledTimes(1);
    expect(mockNotificationAsync).toHaveBeenCalledWith('success');
    const alertTitles = (Alert.alert as jest.Mock).mock.calls.map((c) => c[0]);
    expect(alertTitles).not.toContain('상점 선택 완료');
  });
});
