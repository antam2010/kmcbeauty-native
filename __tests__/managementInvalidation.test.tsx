// SPEC-DATA-001 REQ-DATA-001-05 (F-12) AC-10 + REQ-06 AC-12(스모크):
// 메뉴/전화번호부 CUD 성공 후 해당 query invalidate 호출.
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import React from 'react';
import { makeQueryWrapper } from './utils/queryTestUtils';

const mockPhonebookList = jest.fn();
const mockPhonebookRemove = jest.fn();
const mockGetAllWithDetails = jest.fn();
const mockMenuRemove = jest.fn();

jest.mock('@/src/api/services/phonebook', () => ({
  // 도메인 서비스(레거시 아님) 사용 확인 겸용.
  phonebookApiService: {
    list: (...a: any[]) => mockPhonebookList(...a),
    remove: (...a: any[]) => mockPhonebookRemove(...a),
    create: jest.fn(),
    update: jest.fn(),
  },
}));
jest.mock('@/src/api/services/treatmentMenu', () => ({
  treatmentMenuApiService: {
    getAllWithDetails: (...a: any[]) => mockGetAllWithDetails(...a),
    remove: (...a: any[]) => mockMenuRemove(...a),
    getDetails: jest.fn().mockResolvedValue([]),
  },
}));
jest.mock('@/src/stores/shopStore', () => ({
  useShopStore: (selector: any) => selector({ selectedShop: { id: 1, name: 's' }, loading: false }),
}));

import PhonebookManagement from '@/components/management/PhonebookManagement';
import TreatmentMenuManagement from '@/components/management/TreatmentMenuManagement';

// Alert.alert 의 파괴적 버튼(onPress)을 자동 실행.
function autoConfirmDestructive() {
  jest.spyOn(Alert, 'alert').mockImplementation((_title: any, _msg?: any, buttons?: any) => {
    const destructive = buttons?.find((b: any) => b.style === 'destructive');
    destructive?.onPress?.();
  });
}

describe('SPEC-DATA-001 AC-10: 관리 화면 CUD 무효화', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPhonebookList.mockResolvedValue({
      items: [
        { id: 1, name: '홍길동', phone_number: '01011112222', group_name: null, memo: null, shop_id: 1, created_at: '2026-01-01', updated_at: '2026-01-01' },
      ],
      total: 1, page: 1, size: 100, pages: 1,
    });
    mockPhonebookRemove.mockResolvedValue(undefined);
    mockGetAllWithDetails.mockResolvedValue([
      { id: 1, shop_id: 1, name: '네일', created_at: '2026-01-01', updated_at: '2026-01-01', details: [] },
    ]);
    mockMenuRemove.mockResolvedValue(undefined);
  });

  it('전화번호부 삭제 성공 → phonebook query invalidate', async () => {
    autoConfirmDestructive();
    const { Wrapper, client } = makeQueryWrapper();
    const invalidateSpy = jest.spyOn(client, 'invalidateQueries');
    const { getByText, getByTestId } = render(<PhonebookManagement />, { wrapper: Wrapper });

    await waitFor(() => getByText('홍길동'));
    fireEvent.press(getByTestId('delete-contact-1'));

    await waitFor(() => expect(mockPhonebookRemove).toHaveBeenCalledWith(1));
    await waitFor(() => expect(invalidateSpy).toHaveBeenCalled());
    const keys = invalidateSpy.mock.calls.map((c) => (c[0] as any)?.queryKey);
    expect(keys).toContainEqual(['phonebook']);
  });

  it('시술 메뉴 삭제 성공 → treatmentMenus query invalidate', async () => {
    autoConfirmDestructive();
    const { Wrapper, client } = makeQueryWrapper();
    const invalidateSpy = jest.spyOn(client, 'invalidateQueries');
    const { getByText, getByTestId } = render(<TreatmentMenuManagement />, { wrapper: Wrapper });

    await waitFor(() => getByText('네일'));
    fireEvent.press(getByTestId('delete-menu-1'));

    await waitFor(() => expect(mockMenuRemove).toHaveBeenCalledWith(1));
    await waitFor(() => expect(invalidateSpy).toHaveBeenCalled());
    const keys = invalidateSpy.mock.calls.map((c) => (c[0] as any)?.queryKey);
    expect(keys).toContainEqual(['treatmentMenus']);
  });
});
