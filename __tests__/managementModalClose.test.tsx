// REQ-PERF-003-05 + REQ-PERF-003-02: 관리 화면의 조건부 마운트 모달 — 닫힘 애니메이션 보존.
// 시술 메뉴·세부 항목 모달과 연락처 동기화 모달은 닫은 직후 visible=false 로 마운트된 채 남고,
// 지연(MODAL_CLOSE_UNMOUNT_DELAY_MS)이 지나면 내려간다.
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import { Modal } from 'react-native';
import { MODAL_CLOSE_UNMOUNT_DELAY_MS } from '@/hooks/useDelayedUnmount';
import { makeQueryWrapper } from './utils/queryTestUtils';

jest.mock('@/src/api/services/phonebook', () => ({
  phonebookApiService: {
    list: jest.fn(async () => ({
      items: [
        { id: 1, name: '홍길동', phone_number: '01011112222', group_name: null, memo: null, shop_id: 1, created_at: '2026-01-01', updated_at: '2026-01-01' },
      ],
      total: 1, page: 1, size: 100, pages: 1,
    })),
    remove: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
}));
jest.mock('@/src/api/services/treatmentMenu', () => ({
  treatmentMenuApiService: {
    getAllWithDetails: jest.fn(async () => [
      { id: 1, shop_id: 1, name: '네일', created_at: '2026-01-01', updated_at: '2026-01-01', details: [] },
    ]),
    getDetails: jest.fn(async () => []),
    remove: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
}));
jest.mock('@/src/stores/shopStore', () => ({
  useShopStore: (selector: any) => selector({ selectedShop: { id: 1, name: 's' }, loading: false }),
}));
// 실제 ContactSyncModal 처럼 visible 을 그대로 RN Modal 에 넘기는 얇은 대역(ContactSyncModal.tsx 346행).
// 여기서는 PhonebookManagement 쪽 마운트 배선만 검증한다.
jest.mock('@/components/modals/ContactSyncModal', () => {
  const { Modal: RNModal, Text } = require('react-native');
  return function ContactSyncModalStub(props: { visible: boolean; onClose: () => void }) {
    return (
      <RNModal visible={props.visible} transparent animationType="slide" onRequestClose={props.onClose}>
        <Text onPress={props.onClose}>동기화 닫기</Text>
      </RNModal>
    );
  };
});

import ContactSyncModal from '@/components/modals/ContactSyncModal';
import PhonebookManagement from '@/components/management/PhonebookManagement';
import TreatmentMenuManagement from '@/components/management/TreatmentMenuManagement';

// 아이콘만 있는 버튼은 testID 가 없어 아이콘 name 으로 찾는다(누르면 가장 가까운 onPress 로 전파된다).
function iconsNamed(utils: ReturnType<typeof render>, name: string) {
  return utils.UNSAFE_getAllByProps({ name });
}

function renderWithQuery(ui: React.ReactElement) {
  const { Wrapper } = makeQueryWrapper();
  return render(ui, { wrapper: Wrapper });
}

describe('관리 화면 조건부 마운트 모달 닫힘 애니메이션 (REQ-PERF-003-02/05)', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('시술 메뉴 모달: 닫은 직후 visible=false 로 남고 지연이 지나면 내려간다', async () => {
    const utils = renderWithQuery(<TreatmentMenuManagement />);
    await waitFor(() => utils.getByText('네일'));
    const modals = () => utils.UNSAFE_queryAllByType(Modal);
    expect(modals()).toHaveLength(0);

    jest.useFakeTimers();
    // 왼쪽 패널 머리글의 메뉴 추가(+) 버튼
    fireEvent.press(iconsNamed(utils, 'add')[0]);
    expect(modals()).toHaveLength(1);
    expect(modals()[0].props.visible).toBe(true);

    fireEvent.press(utils.getByText('취소'));
    expect(modals()).toHaveLength(1);
    expect(modals()[0].props.visible).toBe(false);

    act(() => {
      jest.advanceTimersByTime(MODAL_CLOSE_UNMOUNT_DELAY_MS);
    });
    expect(modals()).toHaveLength(0);
  });

  it('시술 세부 항목 모달: 닫은 직후 visible=false 로 남고 지연이 지나면 내려간다', async () => {
    const utils = renderWithQuery(<TreatmentMenuManagement />);
    await waitFor(() => utils.getByText('네일'));
    await act(async () => {
      fireEvent.press(utils.getByText('네일'));
    });
    await waitFor(() => utils.getByText('네일 상세'));
    const modals = () => utils.UNSAFE_queryAllByType(Modal);
    expect(modals()).toHaveLength(0);

    jest.useFakeTimers();
    // 오른쪽 패널 머리글의 상세 추가(+) 버튼(트리 순서상 마지막 add 아이콘)
    const addIcons = iconsNamed(utils, 'add');
    fireEvent.press(addIcons[addIcons.length - 1]);
    expect(modals()).toHaveLength(1);
    expect(modals()[0].props.visible).toBe(true);
    expect(utils.getByText('시술 상세 생성')).toBeTruthy();

    fireEvent.press(utils.getByText('취소'));
    expect(modals()).toHaveLength(1);
    expect(modals()[0].props.visible).toBe(false);

    act(() => {
      jest.advanceTimersByTime(MODAL_CLOSE_UNMOUNT_DELAY_MS);
    });
    expect(modals()).toHaveLength(0);
  });

  it('연락처 동기화 모달: 닫은 직후 visible=false 로 남고 지연이 지나면 내려간다', async () => {
    const utils = renderWithQuery(<PhonebookManagement />);
    await waitFor(() => utils.getByText('홍길동'));
    const syncModals = () => utils.UNSAFE_queryAllByType(ContactSyncModal);
    expect(syncModals()).toHaveLength(0);

    jest.useFakeTimers();
    fireEvent.press(iconsNamed(utils, 'sync')[0]);
    expect(syncModals()).toHaveLength(1);
    expect(syncModals()[0].props.visible).toBe(true);

    fireEvent.press(utils.getByText('동기화 닫기'));
    expect(syncModals()).toHaveLength(1);
    expect(syncModals()[0].props.visible).toBe(false);

    act(() => {
      jest.advanceTimersByTime(MODAL_CLOSE_UNMOUNT_DELAY_MS);
    });
    expect(syncModals()).toHaveLength(0);
  });
});
