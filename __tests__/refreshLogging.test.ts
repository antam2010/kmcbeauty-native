// SPEC-SECURITY-002 REQ-SEC-002-008·009 — client.ts 토큰 갱신 실패 로그 검증 (M1 RED).
// 운영 모드에서는 갱신 실패 console.error가 0건이고, 개발 모드 로그에는 에러 객체·XHR 객체·요청 설정이
// 없으며 상태 코드·메시지·서버 오류 내용은 남는지 본다.
// 모킹 방식은 clientInterceptors.test.ts와 같다. refreshAccessToken()은 authDebugUtils.testRefreshToken()으로 실행한다.
import axios from 'axios';
import { API_BASE_URL, authDebugUtils } from '@/src/api/client';
import {
  TOKEN_SENTINEL,
  XHR_SENTINEL,
  allArgs,
  containsRef,
  hasExactValue,
  includesText,
  makeAxiosError,
  restoreConsoleSpies,
  spyOnConsole,
  type ConsoleSpies,
} from './utils/consoleArgs';

// 제어 가능한 스토어 상태 (jest.mock factory는 mock 접두 변수만 참조할 수 있다)
const mockAuthState: any = { accessToken: null, setAccessToken: jest.fn(), clearAuth: jest.fn() };
const mockShopState: any = { selectedShop: null, clearSelectedShop: jest.fn() };

// storeLoaders를 모킹해 dynamic import(jest CJS VM에서 실행 불가)를 피하고 스토어를 주입한다.
jest.mock('@/src/api/storeLoaders', () => ({
  loadAuthStore: jest.fn(async () => ({ getState: () => mockAuthState })),
  loadShopStore: jest.fn(async () => ({ getState: () => mockShopState })),
}));

jest.mock('expo-router', () => ({
  router: { replace: jest.fn(), push: jest.fn() },
}));

const ORIGINAL_DEV = (global as any).__DEV__;
const REFRESH_URL = `${API_BASE_URL}/auth/refresh`;

type RefreshCase = {
  id: string;
  label: string;
  makeError: () => Error;
  // 응답이 있는 경우의 상태 코드와 서버 오류 문구
  status?: string;
  serverText?: string;
};

const refreshCases: RefreshCase[] = [
  {
    id: 'a',
    label: 'AxiosError 401 (응답 detail, request에 XHR 표식)',
    makeError: () =>
      makeAxiosError({
        method: 'post',
        url: REFRESH_URL,
        status: 401,
        data: '{}',
        responseData: { detail: 'Refresh token expired' },
      }),
    status: '401',
    serverText: 'Refresh token expired',
  },
  {
    id: 'b',
    label: '응답 없이 request만 있는 AxiosError (ERR_NETWORK, XHR 표식)',
    makeError: () => makeAxiosError({ method: 'post', url: REFRESH_URL, data: '{}', code: 'ERR_NETWORK' }),
  },
  {
    id: 'c',
    label: '응답도 요청도 없는 Error',
    makeError: () => new Error('refresh failed'),
  },
];

let spies: ConsoleSpies;
let axiosPost: jest.SpyInstance;

// 모듈을 불러온 뒤에 콘솔 스파이를 건다.
beforeEach(() => {
  axiosPost = jest.spyOn(axios, 'post');
  spies = spyOnConsole();
});

afterEach(() => {
  (global as any).__DEV__ = ORIGINAL_DEV;
  restoreConsoleSpies();
});

describe('SPEC-SECURITY-002 client.ts 토큰 갱신 실패 로그', () => {
  describe('AC-SEC-002-10 운영 모드 토큰 갱신 실패: console.error 0건', () => {
    beforeEach(() => {
      (global as any).__DEV__ = false;
    });

    it.each(refreshCases)('경우 $id: $label', async ({ makeError }) => {
      const error = makeError();
      axiosPost.mockRejectedValueOnce(error);

      await authDebugUtils.testRefreshToken();

      expect(axiosPost).toHaveBeenCalledTimes(1);
      expect(axiosPost.mock.calls[0][0]).toBe(REFRESH_URL);
      expect(spies.error).toHaveBeenCalledTimes(0);
    });
  });

  describe('AC-SEC-002-11 개발 모드 토큰 갱신 실패: 에러 객체·XHR 없음', () => {
    it.each(refreshCases)('경우 $id: $label', async ({ makeError, status, serverText }) => {
      const error = makeError();
      axiosPost.mockRejectedValueOnce(error);

      await authDebugUtils.testRefreshToken();

      expect(axiosPost).toHaveBeenCalledTimes(1);
      const args = allArgs(spies);
      // 메시지와, 응답이 있으면 상태 코드·서버 오류 내용이 남는다 (REQ-SEC-002-009)
      expect(includesText(args, error.message)).toBe(true);
      if (status !== undefined) {
        expect(hasExactValue(args, status)).toBe(true);
      }
      if (serverText !== undefined) {
        expect(includesText(args, serverText)).toBe(true);
      }
      // 에러 객체, XHR 객체(error.request), 요청 설정(error.config)은 넘기지 않는다 (REQ-SEC-002-009)
      const { request, config } = error as Error & { request?: unknown; config?: unknown };
      expect(containsRef(args, error)).toBe(false);
      if (request !== undefined) {
        expect(containsRef(args, request)).toBe(false);
      }
      if (config !== undefined) {
        expect(containsRef(args, config)).toBe(false);
      }
      expect(includesText(args, XHR_SENTINEL)).toBe(false);
      // 선택 보강 X3: Authorization의 토큰 표식도 남지 않는다.
      expect(includesText(args, TOKEN_SENTINEL)).toBe(false);
    });
  });

  // 401·403이 아닌 응답 상태로 갱신이 실패하는 분기('일시적인 서버 에러' 로그). 위 경우 a~c는 이 분기를 지나지 않는다.
  describe('401·403이 아닌 상태(500)로 토큰 갱신 실패: 일시적 서버 에러 분기', () => {
    const TRANSIENT_LINE = '🔄 일시적인 서버 에러 가능성 - 네트워크 확인 필요';
    const EXPIRED_LINE = '🚪 리프레시 토큰 만료 또는 유효하지 않음 - 완전 로그아웃 필요';
    // testRefreshToken()은 refreshAccessToken()이 null(거짓 값)을 돌려줄 때만 이 문구를 남긴다.
    const RETURNED_NULL_LINE = '❌ 리프레시 토큰 갱신 실패';

    const serverError = () =>
      makeAxiosError({
        method: 'post',
        url: REFRESH_URL,
        status: 500,
        data: '{}',
        responseData: { detail: 'Internal Server Error' },
      });

    it('개발 모드: 상태 코드와 일시적 서버 에러 문구를 남기고 토큰·요청 설정·에러 객체는 넘기지 않는다', async () => {
      const error = serverError();
      axiosPost.mockRejectedValueOnce(error);

      await authDebugUtils.testRefreshToken();

      expect(axiosPost).toHaveBeenCalledTimes(1);
      expect(spies.log).toHaveBeenCalledWith(RETURNED_NULL_LINE);
      // 상태 코드와 일시적 서버 에러 문구가 남고, 401·403 문구는 남지 않는다.
      const args = allArgs(spies);
      expect(hasExactValue(args, '500')).toBe(true);
      expect(spies.log).toHaveBeenCalledWith(TRANSIENT_LINE);
      expect(spies.log).not.toHaveBeenCalledWith(EXPIRED_LINE);
      // 에러 객체, 요청 설정(error.config), XHR 객체(error.request), 토큰 표식은 남지 않는다.
      expect(containsRef(args, error)).toBe(false);
      expect(containsRef(args, error.config)).toBe(false);
      expect(containsRef(args, error.request)).toBe(false);
      expect(includesText(args, XHR_SENTINEL)).toBe(false);
      expect(includesText(args, TOKEN_SENTINEL)).toBe(false);
    });

    // jest는 babel 운영 설정(transform-remove-console, error 제외)을 거치지 않아 분기 밖의 console.log는 그대로 찍힌다.
    // 그래서 운영 번들에 남는 console.error가 0건인지 보고, 분기 내용은 모든 콘솔 메서드에서 찾는다.
    it('운영 모드: 갱신 실패 분기는 아무 로그도 남기지 않는다', async () => {
      (global as any).__DEV__ = false;
      const error = serverError();
      axiosPost.mockRejectedValueOnce(error);

      await authDebugUtils.testRefreshToken();

      expect(axiosPost).toHaveBeenCalledTimes(1);
      expect(spies.log).toHaveBeenCalledWith(RETURNED_NULL_LINE);
      expect(spies.error).toHaveBeenCalledTimes(0);
      const args = allArgs(spies);
      expect(hasExactValue(args, '500')).toBe(false);
      expect(includesText(args, TRANSIENT_LINE)).toBe(false);
      expect(containsRef(args, error)).toBe(false);
      expect(includesText(args, TOKEN_SENTINEL)).toBe(false);
    });
  });
});
