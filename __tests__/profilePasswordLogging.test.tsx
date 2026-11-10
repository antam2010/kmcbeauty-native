// SPEC-SECURITY-002 REQ-SEC-002-005~007 — 프로필 비밀번호 변경 실패 로그 검증 (M1 RED).
// 실패 로그가 에러 메시지와 HTTP 상태 코드만 남기고 알림과 반환 동작은 그대로인지 본다.
// 모킹 방식은 profileDeadMenu.test.tsx와 같다.
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import { Alert } from 'react-native';
import ProfileScreen from '@/app/(tabs)/profile';
import { authApiService } from '@/src/api/services/auth';
import {
  PW_SENTINEL,
  TOKEN_SENTINEL,
  allArgs,
  argsOf,
  containsRef,
  hasExactValue,
  includesText,
  makeAxiosError,
  restoreConsoleSpies,
  spyOnConsole,
  type ConsoleSpies,
} from './utils/consoleArgs';

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
  const { View } = jest.requireActual('react-native');
  return { SafeAreaView: ({ children }: any) => <View>{children}</View> };
});

const mockedAuth = authApiService as unknown as { changePassword: jest.Mock };
const ORIGINAL_DEV = (global as any).__DEV__;
const SESSION_EXPIRED = '인증이 만료되었습니다. 다시 로그인해주세요.';

let spies: ConsoleSpies;
let alertSpy: jest.SpyInstance;

beforeEach(() => {
  mockedAuth.changePassword.mockReset();
  spies = spyOnConsole();
  alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
});

afterEach(() => {
  (global as any).__DEV__ = ORIGINAL_DEV;
  restoreConsoleSpies();
});

// 프로필 화면을 그리고 '비밀번호 변경'을 누른 뒤 두 입력란에 PW 표식을 넣고 '변경'을 누른다.
async function submitPasswordChange() {
  const screen = render(<ProfileScreen />);
  await waitFor(() => screen.getByText('내 정보'));
  fireEvent.press(screen.getByText('비밀번호 변경'));
  fireEvent.changeText(screen.getByPlaceholderText('새 비밀번호를 입력하세요 (8자 이상)'), PW_SENTINEL);
  fireEvent.changeText(screen.getByPlaceholderText('새 비밀번호를 다시 입력하세요'), PW_SENTINEL);
  fireEvent.press(screen.getByText('변경'));
  // catch 블록 첫 줄의 실패 로그가 남을 때까지 기다린다. 뒤따르는 알림과 반환은 같은 흐름에서 바로 실행된다.
  await waitFor(() => expect(spies.error.mock.calls.some((call) => call[0] === '비밀번호 변경 실패:')).toBe(true));
  expect(mockedAuth.changePassword).toHaveBeenCalledWith(PW_SENTINEL);
}

describe('SPEC-SECURITY-002 프로필 비밀번호 변경 실패 로그', () => {
  // 개발 모드는 필수이고, 운영 모드 실행은 선택 보강 X4다.
  describe.each([
    { mode: '개발 모드', dev: true },
    { mode: '운영 모드, 선택 보강 X4', dev: false },
  ])('AC-SEC-002-08 비밀번호 변경 실패: 메시지·상태만 남기고 알림은 그대로다 ($mode)', ({ dev }) => {
    beforeEach(() => {
      (global as any).__DEV__ = dev;
    });

    it('경우 a: AxiosError 422 (요청 본문, Authorization, 응답의 input에 표식)', async () => {
      const error = makeAxiosError({
        method: 'put',
        url: '/users/me',
        status: 422,
        data: JSON.stringify({ name: '홍길동', email: 'a@b.com', role: 'OWNER', password: PW_SENTINEL }),
        responseData: {
          detail: [
            {
              loc: ['body', 'password'],
              msg: 'String should have at least 8 characters',
              type: 'string_too_short',
              input: PW_SENTINEL,
            },
          ],
        },
      });
      mockedAuth.changePassword.mockRejectedValueOnce(error);

      await submitPasswordChange();

      // 알림은 그대로다 (REQ-SEC-002-007)
      expect(alertSpy).toHaveBeenCalledTimes(1);
      expect(alertSpy).toHaveBeenCalledWith('오류', '입력한 정보가 올바르지 않습니다.');
      // 메시지와 상태 코드는 남는다 (REQ-SEC-002-005)
      const errorArgs = argsOf(spies.error);
      expect(includesText(errorArgs, error.message)).toBe(true);
      expect(hasExactValue(errorArgs, '422')).toBe(true);
      // 에러 객체와 표식은 남지 않는다 (REQ-SEC-002-006)
      const args = allArgs(spies);
      expect(includesText(args, PW_SENTINEL)).toBe(false);
      expect(includesText(args, TOKEN_SENTINEL)).toBe(false);
      expect(containsRef(args, error)).toBe(false);
    });

    it('경우 b: 응답 없는 Error', async () => {
      const error = new Error(SESSION_EXPIRED);
      mockedAuth.changePassword.mockRejectedValueOnce(error);

      await submitPasswordChange();

      // 인터셉터 처리로 넘기고 반환한다. 제목이 '오류'인 알림은 없다 (REQ-SEC-002-007)
      expect(alertSpy.mock.calls.filter((call) => call[0] === '오류')).toHaveLength(0);
      // 메시지는 남는다 (REQ-SEC-002-005)
      const errorArgs = argsOf(spies.error);
      expect(includesText(errorArgs, error.message)).toBe(true);
      // 에러 객체와 표식은 남지 않는다 (REQ-SEC-002-006)
      const args = allArgs(spies);
      expect(includesText(args, PW_SENTINEL)).toBe(false);
      expect(includesText(args, TOKEN_SENTINEL)).toBe(false);
      expect(containsRef(args, error)).toBe(false);
    });
  });
});
