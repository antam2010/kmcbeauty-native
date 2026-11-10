// SPEC-SECURITY-002 REQ-SEC-002-001~004 — base.ts get()·post() 로그 검증 (M1 RED).
// 운영 모드 콘솔 호출 0건, 개발 모드 실패 로그의 진단 정보 유지와 표식 없음,
// 개발 모드 요청·성공 로그의 표식 없음, 잡은 에러를 같은 참조로 다시 던지기를 본다.
// 판정 도구와 표식은 acceptance.md §1을 따른다(__tests__/utils/consoleArgs.ts).
import apiClient from '@/src/api/client';
import { BaseApiService } from '@/src/api/services/base';
import {
  PII_SENTINEL,
  PW_SENTINEL,
  TOKEN_SENTINEL,
  XHR_SENTINEL,
  allArgs,
  hasExactValue,
  includesText,
  makeAxiosError,
  restoreConsoleSpies,
  spyOnConsole,
  totalCalls,
  type ConsoleSpies,
} from './utils/consoleArgs';

// @/src/api/client를 가짜 클라이언트로 바꾼다. base.ts의 '../client'도 같은 모듈이라 이 가짜를 받는다.
jest.mock('@/src/api/client', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), defaults: { headers: {} } },
}));

type FakeClient = {
  get: jest.Mock;
  post: jest.Mock;
  defaults: { headers: Record<string, unknown> };
};
const fakeClient = apiClient as unknown as FakeClient;

// BaseApiService를 상속한 시험용 서비스
class ProbeService extends BaseApiService {
  protected readonly basePath = '/probe';

  callGet<T>(endpoint?: string, config?: any): Promise<T> {
    return this.get<T>(endpoint, config);
  }

  callPost<T>(endpoint?: string, data?: any, config?: any): Promise<T> {
    return this.post<T>(endpoint, data, config);
  }
}

const service = new ProbeService();
const ORIGINAL_DEV = (global as any).__DEV__;
const SESSION_EXPIRED = '인증이 만료되었습니다. 다시 로그인해주세요.';

// 초대 가입 형태 요청 본문
function signupBody() {
  return {
    invite_code: 'INV-' + PII_SENTINEL,
    name: '홍길동',
    email: PII_SENTINEL + '@test.local',
    password: PW_SENTINEL,
    phone_number: '010-' + PII_SENTINEL,
  };
}

// 서버가 돌려준 422 검증 오류 목록. input 항목은 없다.
const VALIDATION_DETAIL = [
  { loc: ['body', 'password'], msg: 'String should have at least 8 characters', type: 'string_too_short' },
];

// post('/users', body)가 받는 AxiosError. config.data에 본문 JSON 문자열을 담는다.
function postError(status: number, responseData: unknown) {
  return makeAxiosError({
    method: 'post',
    url: '/probe/users',
    status,
    data: JSON.stringify(signupBody()),
    responseData,
  });
}

// get('/me', { params })가 받는 AxiosError. config에 data 대신 params를 담는다.
function getError(status: number, responseData: unknown) {
  return makeAxiosError({ method: 'get', url: '/probe/me', status, params: { q: PII_SENTINEL }, responseData });
}

function callPostUsers() {
  return service.callPost('/users', signupBody());
}

function callGetMe() {
  return service.callGet('/me', { params: { q: PII_SENTINEL } });
}

let spies: ConsoleSpies;

beforeEach(() => {
  fakeClient.get.mockReset();
  fakeClient.post.mockReset();
  fakeClient.defaults.headers = { common: { Authorization: 'Bearer ' + TOKEN_SENTINEL } };
  spies = spyOnConsole();
});

afterEach(() => {
  (global as any).__DEV__ = ORIGINAL_DEV;
  restoreConsoleSpies();
});

describe('SPEC-SECURITY-002 base.ts 로그', () => {
  describe('AC-SEC-002-01 운영 모드에서 base.ts는 콘솔을 호출하지 않는다', () => {
    beforeEach(() => {
      (global as any).__DEV__ = false;
    });

    it('post() 성공', async () => {
      const data = { id: 1 };
      fakeClient.post.mockResolvedValueOnce({ status: 201, statusText: 'Created', data });
      await expect(callPostUsers()).resolves.toBe(data);
      expect(totalCalls(spies)).toBe(0);
    });

    it('post() 실패 500', async () => {
      const error = postError(500, { detail: 'Internal Server Error' });
      fakeClient.post.mockRejectedValueOnce(error);
      await expect(callPostUsers()).rejects.toBe(error);
      expect(totalCalls(spies)).toBe(0);
    });

    it('post() 실패 422 (detail 문자열, errors 객체)', async () => {
      const error = postError(422, { detail: 'field required: password', errors: { password: ['too short'] } });
      fakeClient.post.mockRejectedValueOnce(error);
      await expect(callPostUsers()).rejects.toBe(error);
      expect(totalCalls(spies)).toBe(0);
    });

    it('post() 실패 401', async () => {
      const error = postError(401, { detail: 'Not authenticated' });
      fakeClient.post.mockRejectedValueOnce(error);
      await expect(callPostUsers()).rejects.toBe(error);
      expect(totalCalls(spies)).toBe(0);
    });

    it('get() 성공', async () => {
      const data = [{ id: 1 }];
      fakeClient.get.mockResolvedValueOnce({ status: 200, statusText: 'OK', data });
      await expect(callGetMe()).resolves.toBe(data);
      expect(totalCalls(spies)).toBe(0);
    });

    it('get() 실패 500', async () => {
      const error = getError(500, { detail: 'Internal Server Error' });
      fakeClient.get.mockRejectedValueOnce(error);
      await expect(callGetMe()).rejects.toBe(error);
      expect(totalCalls(spies)).toBe(0);
    });

    it('get() 실패 401', async () => {
      const error = getError(401, { detail: 'Not authenticated' });
      fakeClient.get.mockRejectedValueOnce(error);
      await expect(callGetMe()).rejects.toBe(error);
      expect(totalCalls(spies)).toBe(0);
    });
  });

  describe('AC-SEC-002-02 개발 모드 실패 로그: 표식 없음, 진단 정보 유지', () => {
    type FailureCase = {
      name: string;
      method: 'get' | 'post';
      status?: number;
      serverTexts?: string[];
      makeError: () => Error;
      call?: () => Promise<unknown>;
    };

    const cases: FailureCase[] = [
      {
        name: '가. post() 응답 500',
        method: 'post',
        status: 500,
        makeError: () => postError(500, { detail: 'Internal Server Error' }),
      },
      {
        name: '가. post() 응답 422 (detail 배열, errors 객체, input 없음)',
        method: 'post',
        status: 422,
        serverTexts: ['String should have at least 8 characters', 'too short'],
        makeError: () => postError(422, { detail: VALIDATION_DETAIL, errors: { password: ['too short'] } }),
      },
      {
        name: '가. post() 응답 401',
        method: 'post',
        status: 401,
        makeError: () => postError(401, { detail: 'Not authenticated' }),
      },
      {
        name: '나. get() 응답 500 (params.q에 표식)',
        method: 'get',
        status: 500,
        makeError: () => getError(500, { detail: 'Internal Server Error' }),
      },
      {
        name: '나. get() 응답 401 (params.q에 표식)',
        method: 'get',
        status: 401,
        makeError: () => getError(401, { detail: 'Not authenticated' }),
      },
      {
        name: '다. post() 응답 없는 Error',
        method: 'post',
        makeError: () => new Error(SESSION_EXPIRED),
      },
      {
        name: '다. get() 응답 없는 Error',
        method: 'get',
        makeError: () => new Error(SESSION_EXPIRED),
      },
      {
        // 선택 보강 X2: 셋째 인자로 Authorization이 든 요청 설정을 준다.
        name: '가. post() 응답 500, Authorization이 든 요청 설정 (선택 보강 X2)',
        method: 'post',
        status: 500,
        makeError: () => postError(500, { detail: 'Internal Server Error' }),
        call: () =>
          service.callPost('/users', signupBody(), { headers: { Authorization: 'Bearer ' + TOKEN_SENTINEL } }),
      },
    ];

    it.each(cases)('$name', async ({ method, status, serverTexts = [], makeError, call }) => {
      const error = makeError();
      fakeClient[method].mockRejectedValueOnce(error);
      const promise = call ? call() : method === 'post' ? callPostUsers() : callGetMe();
      await expect(promise).rejects.toBe(error);

      const args = allArgs(spies);
      // 진단 정보는 남는다 (REQ-SEC-002-003)
      expect(includesText(args, error.message)).toBe(true);
      expect(includesText(args, method === 'post' ? '/probe/users' : '/probe/me')).toBe(true);
      if (status !== undefined) {
        expect(hasExactValue(args, String(status))).toBe(true);
      }
      for (const text of serverTexts) {
        expect(includesText(args, text)).toBe(true);
      }
      // 표식은 남지 않는다 (REQ-SEC-002-002)
      expect(includesText(args, PW_SENTINEL)).toBe(false);
      expect(includesText(args, TOKEN_SENTINEL)).toBe(false);
      expect(includesText(args, PII_SENTINEL)).toBe(false);
      expect(includesText(args, XHR_SENTINEL)).toBe(false);
    });
  });

  describe('AC-SEC-002-03 개발 모드 요청·성공 로그: 표식 없음', () => {
    const loginResponse = { access_token: TOKEN_SENTINEL, token_type: 'bearer' };
    const meResponse = [{ id: 1, email: PII_SENTINEL + '@test.local' }];

    beforeEach(() => {
      fakeClient.post.mockResolvedValue({ status: 200, statusText: 'OK', data: loginResponse });
      fakeClient.get.mockResolvedValue({ status: 200, statusText: 'OK', data: meResponse });
    });

    function expectNoSentinel() {
      const args = allArgs(spies);
      expect(includesText(args, PW_SENTINEL)).toBe(false);
      expect(includesText(args, TOKEN_SENTINEL)).toBe(false);
      expect(includesText(args, PII_SENTINEL)).toBe(false);
    }

    it('로그인 형태 post(): URLSearchParams 본문, Authorization이 든 요청 설정', async () => {
      const form = new URLSearchParams();
      form.append('username', PII_SENTINEL + '@test.local');
      form.append('password', PW_SENTINEL);
      form.append('grant_type', 'password');
      const config = {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: 'Bearer ' + TOKEN_SENTINEL,
        },
      };
      await expect(service.callPost('/login', form, config)).resolves.toBe(loginResponse);
      expectNoSentinel();
    });

    it('가입 형태 post()', async () => {
      await expect(callPostUsers()).resolves.toBe(loginResponse);
      expectNoSentinel();
    });

    it('조회 get(): params와 Authorization이 든 요청 설정', async () => {
      const config = { params: { q: PII_SENTINEL }, headers: { Authorization: 'Bearer ' + TOKEN_SENTINEL } };
      await expect(service.callGet('/me', config)).resolves.toBe(meResponse);
      expectNoSentinel();
    });
  });

  type RethrowCase = { id: string; method: 'get' | 'post'; label: string; makeError: () => Error };

  // 경우 a·b·f·g는 get과 post, c·d·e는 post에서 실행한다.
  const rethrowCases: RethrowCase[] = [
    { id: 'a', method: 'get', label: 'AxiosError 500', makeError: () => getError(500, { detail: 'Internal Server Error' }) },
    { id: 'a', method: 'post', label: 'AxiosError 500', makeError: () => postError(500, { detail: 'Internal Server Error' }) },
    { id: 'b', method: 'get', label: '응답 없는 Error', makeError: () => new Error(SESSION_EXPIRED) },
    { id: 'b', method: 'post', label: '응답 없는 Error', makeError: () => new Error(SESSION_EXPIRED) },
    {
      id: 'c',
      method: 'post',
      label: 'AxiosError 422, detail 문자열',
      makeError: () => postError(422, { detail: 'field required: password' }),
    },
    {
      id: 'd',
      method: 'post',
      label: 'AxiosError 422, detail 배열',
      makeError: () => postError(422, { detail: VALIDATION_DETAIL }),
    },
    {
      id: 'e',
      method: 'post',
      label: 'AxiosError 422, detail 객체',
      makeError: () => postError(422, { detail: { code: 'VALIDATION_ERROR', detail: 'invalid' } }),
    },
    { id: 'f', method: 'get', label: 'AxiosError 401', makeError: () => getError(401, { detail: 'Not authenticated' }) },
    { id: 'f', method: 'post', label: 'AxiosError 401', makeError: () => postError(401, { detail: 'Not authenticated' }) },
    { id: 'g', method: 'get', label: 'Axios가 아닌 TypeError', makeError: () => new TypeError('Network request failed') },
    { id: 'g', method: 'post', label: 'Axios가 아닌 TypeError', makeError: () => new TypeError('Network request failed') },
  ];

  describe.each([
    { mode: '개발 모드', dev: true },
    { mode: '운영 모드', dev: false },
  ])('AC-SEC-002-05 잡은 에러를 같은 참조로 다시 던진다 ($mode)', ({ dev }) => {
    beforeEach(() => {
      (global as any).__DEV__ = dev;
    });

    it.each(rethrowCases)('[$id] $method() $label', async ({ method, makeError }) => {
      const error = makeError();
      fakeClient[method].mockRejectedValueOnce(error);
      await expect(method === 'post' ? callPostUsers() : callGetMe()).rejects.toBe(error);
    });
  });
});
