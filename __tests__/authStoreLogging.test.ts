// SPEC-SECURITY-002 REQ-SEC-002-005~007 — authStore 인증 경로 로그 검증 (M1 RED).
// 로그인·로그아웃·사용자 조회 실패 로그가 에러 메시지와 HTTP 상태 코드만 남기고
// 실패 뒤 동작(다시 던지기, 상태 갱신)은 그대로인지 본다.
// 실제 useAuthStore를 쓰고 서비스만 모킹한다(jest-expo가 ExpoSecureStore를 모킹한다).
import { authApiService } from '@/src/api/services/auth';
import { useAuthStore } from '@/src/stores/authStore';
import {
  PII_SENTINEL,
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

jest.mock('@/src/api/services/auth', () => ({
  authApiService: { login: jest.fn(), getMe: jest.fn(), logout: jest.fn() },
}));

const mockedAuth = authApiService as unknown as { login: jest.Mock; getMe: jest.Mock; logout: jest.Mock };

const ORIGINAL_DEV = (global as any).__DEV__;
const SESSION_EXPIRED = '인증이 만료되었습니다. 다시 로그인해주세요.';
// 서버 응답 본문에 개인정보 표식을 담는다.
const SERVER_ERROR_BODY = { detail: '서버 오류 ' + PII_SENTINEL };

// Authorization에 Bearer 표식, 응답 본문에 개인정보 표식을 담은 AxiosError
function authError(status: number, method: string, url: string) {
  return makeAxiosError({ method, url, status, responseData: SERVER_ERROR_BODY });
}

let spies: ConsoleSpies;

beforeEach(() => {
  mockedAuth.login.mockReset();
  mockedAuth.getMe.mockReset();
  mockedAuth.logout.mockReset();
  useAuthStore.setState({ user: null, isAuthenticated: false, isLoading: false, error: null, accessToken: null });
  spies = spyOnConsole();
});

afterEach(() => {
  (global as any).__DEV__ = ORIGINAL_DEV;
  restoreConsoleSpies();
});

describe('SPEC-SECURITY-002 authStore 인증 경로 로그', () => {
  describe.each([
    { mode: '개발 모드', dev: true },
    { mode: '운영 모드', dev: false },
  ])('AC-SEC-002-06 로그인 실패: 메시지·상태만 남기고 같은 에러를 다시 던진다 ($mode)', ({ dev }) => {
    beforeEach(() => {
      (global as any).__DEV__ = dev;
    });

    it('토큰을 받은 뒤 getMe()가 AxiosError 500으로 거부한다', async () => {
      mockedAuth.login.mockResolvedValueOnce({ access_token: TOKEN_SENTINEL, token_type: 'bearer' });
      const error = authError(500, 'get', '/users/me');
      mockedAuth.getMe.mockRejectedValueOnce(error);

      await expect(useAuthStore.getState().login(PII_SENTINEL + '@test.local', PW_SENTINEL)).rejects.toBe(error);

      // 운영 모드에서도 console.error 로그가 남는다 (REQ-SEC-002-005)
      const errorArgs = argsOf(spies.error);
      expect(includesText(errorArgs, error.message)).toBe(true);
      expect(hasExactValue(errorArgs, '500')).toBe(true);
      // 실패 뒤 상태는 그대로다 (REQ-SEC-002-007)
      expect(useAuthStore.getState().error).toBe(error.message);
      expect(useAuthStore.getState().isLoading).toBe(false);
      // 에러 객체·요청 설정과 표식은 남지 않는다 (REQ-SEC-002-006)
      const args = allArgs(spies);
      expect(includesText(args, TOKEN_SENTINEL)).toBe(false);
      expect(includesText(args, PW_SENTINEL)).toBe(false);
      expect(includesText(args, PII_SENTINEL)).toBe(false);
      expect(containsRef(args, error)).toBe(false);
      expect(containsRef(args, error.config)).toBe(false);
    });
  });

  // 개발 모드는 필수이고, 운영 모드 실행은 선택 보강 X4다.
  describe.each([
    { mode: '개발 모드', dev: true },
    { mode: '운영 모드, 선택 보강 X4', dev: false },
  ])('AC-SEC-002-07 로그아웃·사용자 조회 실패: 메시지·상태만 남긴다 ($mode)', ({ dev }) => {
    beforeEach(() => {
      (global as any).__DEV__ = dev;
      // 각 호출 전에 로그인한 상태로 둔다.
      useAuthStore.setState({
        accessToken: TOKEN_SENTINEL,
        isAuthenticated: true,
        user: { name: '홍길동', email: 'a@b.com', role: 'OWNER' } as any,
      });
    });

    function expectOnlyMessageAndStatus(error: Error, status?: number) {
      const errorArgs = argsOf(spies.error);
      expect(includesText(errorArgs, error.message)).toBe(true);
      if (status !== undefined) {
        expect(hasExactValue(errorArgs, String(status))).toBe(true);
      }
      const args = allArgs(spies);
      expect(includesText(args, TOKEN_SENTINEL)).toBe(false);
      expect(includesText(args, PII_SENTINEL)).toBe(false);
      expect(containsRef(args, error)).toBe(false);
    }

    it('logout(): 로그아웃 API가 AxiosError 500으로 거부한다', async () => {
      const error = authError(500, 'post', '/auth/logout');
      mockedAuth.logout.mockRejectedValueOnce(error);

      await expect(useAuthStore.getState().logout()).resolves.toBeUndefined();

      // 로컬 정리는 계속한다 (REQ-SEC-002-007)
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
      expect(useAuthStore.getState().accessToken).toBeNull();
      expectOnlyMessageAndStatus(error, 500);
    });

    it('loadUser(): getMe()가 AxiosError 401로 거부한다', async () => {
      const error = authError(401, 'get', '/users/me');
      mockedAuth.getMe.mockRejectedValueOnce(error);

      await expect(useAuthStore.getState().loadUser()).resolves.toBeUndefined();

      expect(useAuthStore.getState().error).toBe(error.message);
      expectOnlyMessageAndStatus(error, 401);
    });

    it('loadUser(): getMe()가 응답 없는 Error로 거부한다', async () => {
      const error = new Error(SESSION_EXPIRED);
      mockedAuth.getMe.mockRejectedValueOnce(error);

      await expect(useAuthStore.getState().loadUser()).resolves.toBeUndefined();

      expect(useAuthStore.getState().error).toBe(error.message);
      expectOnlyMessageAndStatus(error);
    });
  });
});
