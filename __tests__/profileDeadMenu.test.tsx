// SPEC-HOME-001 REQ-HOME-001-07 — 프로필 죽은 메뉴 정리 검증.
// AC-09: "프로필 수정"(편집 아이콘)·"알림 설정" 노출 0.
// AC-10: 정상 항목(비밀번호 변경·앱 정보·로그아웃) 노출 유지.
import { render, waitFor } from '@testing-library/react-native';
import React from 'react';

const mockUser = { name: '홍길동', email: 'a@b.com', role: 'OWNER', role_name: '사장', created_at: '2026-01-01T00:00:00' };
const mockAuthState = { logout: jest.fn(), user: mockUser };
const mockShopState = { selectedShop: { id: 1, name: '테스트샵', address: '주소', phone: '010' } };

jest.mock('@/src/stores/authStore', () => ({
  useAuthStore: (selector: any) => selector(mockAuthState),
}));
jest.mock('@/src/stores/shopStore', () => ({
  useShopStore: (selector: any) => selector(mockShopState),
}));
jest.mock('@/src/api/services/auth', () => ({
  authApiService: { changePassword: jest.fn() },
}));
jest.mock('@/components/navigation/ShopHeader', () => () => null);
jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return { SafeAreaView: ({ children }: any) => <View>{children}</View> };
});

import ProfileScreen from '@/app/(tabs)/profile';

async function renderProfile() {
  const utils = render(<ProfileScreen />);
  await waitFor(() => utils.getByText('내 정보'));
  return utils;
}

describe('SPEC-HOME-001 프로필 죽은 메뉴 정리 (AC-09/10)', () => {
  it('AC-09: "프로필 수정" 편집 아이콘과 "알림 설정" 항목이 노출되지 않는다', async () => {
    const { queryByLabelText, queryByText } = await renderProfile();
    expect(queryByLabelText('프로필 수정')).toBeNull();
    expect(queryByText('알림 설정')).toBeNull();
  });

  it('AC-10: 정상 항목(비밀번호 변경·앱 정보·로그아웃)은 유지된다', async () => {
    const { queryByText } = await renderProfile();
    expect(queryByText('비밀번호 변경')).not.toBeNull();
    expect(queryByText('앱 정보')).not.toBeNull();
    expect(queryByText('로그아웃')).not.toBeNull();
  });
});
