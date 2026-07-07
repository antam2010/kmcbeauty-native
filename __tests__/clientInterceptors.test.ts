// SPEC-REFACTOR-001 (PRESERVE): src/api/client.ts 인터셉터 특성(characterization) 테스트.
// 목적: 앱 전역 단일 axios 클라이언트(@MX:ANCHOR)의 인증 크리티컬 경로(요청 헤더 부착,
//   응답 우선순위 처리, 401 리프레시 큐)의 CURRENT 동작을 그대로 고정한다.
//   client.ts 는 수정하지 않는다. 인터셉터는 네트워크 없이 등록된 핸들러
//   (interceptors.request.handlers[0].fulfilled / interceptors.response.handlers[0].rejected)를
//   직접 호출하여 검증한다. 재시도(apiClient(originalRequest))는 mock adapter 로 가로챈다.
//
// REQ-REF-001/004: Authorization / X-Shop-ID 단일 헤더 부착 경계
// REQ-REF-002: 리프레시는 bare axios 로만 → 인터셉터 재귀 회피, 단일 in-flight + 대기 큐

import axios from 'axios';

// --- 제어 가능한 스토어 상태 (jest.mock factory 는 mock* 접두 변수만 참조 가능) ---
const mockAuthState: any = {
  accessToken: null,
  setAccessToken: jest.fn(),
  clearAuth: jest.fn(),
};
const mockShopState: any = {
  selectedShop: null,
  clearSelectedShop: jest.fn(),
};
const mockAuthStore = { getState: () => mockAuthState };
const mockShopStore = { getState: () => mockShopState };

// storeLoaders 를 모킹하여 dynamic import(jest CJS VM 에서 실행 불가) 회피 + 스토어 주입.
jest.mock('@/src/api/storeLoaders', () => ({
  loadAuthStore: jest.fn(async () => mockAuthStore),
  loadShopStore: jest.fn(async () => mockShopStore),
}));

// 리다이렉트 메커니즘(client.ts 는 expo-router 의 router.replace/push 사용)을 모킹.
jest.mock('expo-router', () => ({
  router: { replace: jest.fn(), push: jest.fn() },
}));

process.env.EXPO_PUBLIC_API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || 'https://api.test.local';

// 모듈은 전역 상태(isRefreshing/failedQueue/isNavigating*)를 갖는다. 단일 로드 후
// beforeEach 에서 상태를 초기화하고, afterEach 에서 pending 타이머(플래그 리셋)를 flush 한다.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const clientMod = require('@/src/api/client');
const apiClient = clientMod.default;
const API_BASE_URL = clientMod.API_BASE_URL;
const { router } = require('expo-router');

// 등록된 인터셉터 핸들러 직접 참조.
const reqFulfilled = apiClient.interceptors.request.handlers[0].fulfilled;
const respRejected = apiClient.interceptors.response.handlers[0].rejected;

// 재시도(apiClient(originalRequest))를 가로채는 mock adapter — 네트워크 없이 200 반환.
const mockAdapter = jest.fn((config: any) =>
  Promise.resolve({ data: {}, status: 200, statusText: 'OK', headers: {}, config }),
);
apiClient.defaults.adapter = mockAdapter;

// 리프레시 엔드포인트(bare axios.post) 스파이.
const axiosPostSpy = jest.spyOn(axios, 'post');

const makeError = (overrides: any = {}) => ({
  config: { url: '/protected', method: 'get', headers: {}, ...(overrides.config || {}) },
  response: overrides.response,
  ...overrides.extra,
});

beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();

  // 스토어 상태 리셋
  mockAuthState.accessToken = null;
  mockShopState.selectedShop = null;
  // setAccessToken 은 실제로 스토어 accessToken 을 갱신(리프레시 성공 후 인터셉터가 신규 토큰을 읽도록).
  mockAuthState.setAccessToken.mockImplementation((t: string | null) => {
    mockAuthState.accessToken = t;
  });

  // adapter/refresh 기본 동작 재설정
  mockAdapter.mockImplementation((config: any) =>
    Promise.resolve({ data: {}, status: 200, statusText: 'OK', headers: {}, config }),
  );
  axiosPostSpy.mockResolvedValue({ data: { access_token: 'new-token' } } as any);
});

afterEach(() => {
  // 네비게이션 플래그를 리셋하는 pending setTimeout 을 실행하여 테스트 간 상태 누수 방지.
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

// ============================================================================
// Target 1: 요청 인터셉터 — Authorization / X-Shop-ID 헤더 부착 계약
// ============================================================================
describe('요청 인터셉터: 헤더 부착 (REQ-REF-001/004)', () => {
  it('(a) authStore 에 토큰이 있으면 Authorization: Bearer 헤더를 부착한다', async () => {
    mockAuthState.accessToken = 'tok-123';
    const config = await reqFulfilled({ headers: {}, method: 'get', url: '/me' });
    expect(config.headers.Authorization).toBe('Bearer tok-123');
  });

  it('(b) 토큰이 없으면 Authorization 헤더를 부착하지 않는다', async () => {
    mockAuthState.accessToken = null;
    const config = await reqFulfilled({ headers: {}, method: 'get', url: '/me' });
    expect(config.headers.Authorization).toBeUndefined();
  });

  it('(c) shopStore 에 선택된 상점이 있으면 X-Shop-ID 헤더를 부착한다(문자열화)', async () => {
    mockShopState.selectedShop = { id: 42, name: '샵' };
    const config = await reqFulfilled({ headers: {}, method: 'get', url: '/x' });
    expect(config.headers['X-Shop-ID']).toBe('42');
  });

  it('(d) 선택된 상점이 없으면 X-Shop-ID 를 생략하되 요청은 그대로 진행된다(차단 없음)', async () => {
    mockShopState.selectedShop = null;
    const input = { headers: {}, method: 'get', url: '/x' };
    const config = await reqFulfilled(input);
    expect(config.headers['X-Shop-ID']).toBeUndefined();
    // 인터셉터는 config 를 반환(요청 계속) — reject/throw 하지 않는다.
    expect(config).toBe(input);
  });
});

// ============================================================================
// Target 2: 응답 인터셉터 우선순위
// ============================================================================
describe('응답 인터셉터: 에러 우선순위', () => {
  it('(a) SHOP_NOT_SELECTED 는 401 보다 우선하여 /shop-selection 으로 리다이렉트하고 명확한 에러로 reject 한다', async () => {
    const err = makeError({
      response: { status: 401, data: { detail: { code: 'SHOP_NOT_SELECTED' } } },
    });
    await expect(respRejected(err)).rejects.toThrow(
      '상점이 선택되지 않았습니다. 상점을 선택해주세요.',
    );
    expect(router.replace).toHaveBeenCalledWith('/shop-selection');
    // 우선순위 증명: 401 리프레시 경로로 진입하지 않는다(리프레시 호출 없음).
    expect(axiosPostSpy).not.toHaveBeenCalled();
  });

  it('(b) 403 은 강제 로그아웃 경로(performLogout)를 실행하고 /login 으로 이동한다', async () => {
    const err = makeError({ response: { status: 403, data: {} } });
    await expect(respRejected(err)).rejects.toThrow('권한이 없습니다. 다시 로그인해주세요.');
    expect(mockAuthState.clearAuth).toHaveBeenCalled();
    expect(mockShopState.clearSelectedShop).toHaveBeenCalled();
    expect(router.replace).toHaveBeenCalledWith('/login');
    // 403 은 리프레시를 시도하지 않는다.
    expect(axiosPostSpy).not.toHaveBeenCalled();
  });

  it('(c) 일반 500 에러는 가공 없이 동일 에러 객체 그대로 통과(reject)한다', async () => {
    const err = makeError({ response: { status: 500, data: { message: 'boom' } } });
    await expect(respRejected(err)).rejects.toBe(err);
    expect(router.replace).not.toHaveBeenCalled();
    expect(router.push).not.toHaveBeenCalled();
    expect(axiosPostSpy).not.toHaveBeenCalled();
  });
});

// ============================================================================
// Target 3: 401 리프레시 플로우 (핵심 @MX:WARN 동시성 존)
// ============================================================================
describe('401 리프레시 플로우 (REQ-REF-002)', () => {
  it('(a) 단일 401 → refreshAccessToken 1회 호출 → 신규 토큰으로 원 요청 재시도', async () => {
    mockAuthState.accessToken = 'old-token'; // currentToken 존재 체크 통과
    const err = makeError({
      config: { url: '/protected', method: 'get', headers: {} },
      response: { status: 401, data: {} },
    });

    const result = await respRejected(err);

    // 리프레시는 정확히 1회.
    expect(axiosPostSpy).toHaveBeenCalledTimes(1);
    expect(axiosPostSpy).toHaveBeenCalledWith(
      `${API_BASE_URL}/auth/refresh`,
      {},
      expect.objectContaining({ withCredentials: true }),
    );
    // 재시도가 mock adapter 로 흘러갔고, 신규 토큰이 부착됨.
    expect(mockAdapter).toHaveBeenCalledTimes(1);
    expect(mockAdapter.mock.calls[0][0].headers.Authorization).toBe('Bearer new-token');
    expect(result.status).toBe(200);
  });

  it('(b) 동시 401 → 리프레시는 단 1회, 대기 큐의 모든 요청이 이후 재시도된다(failedQueue 계약)', async () => {
    mockAuthState.accessToken = 'old-token';
    const err1 = makeError({
      config: { url: '/a', method: 'get', headers: {} },
      response: { status: 401, data: {} },
    });
    const err2 = makeError({
      config: { url: '/b', method: 'get', headers: {} },
      response: { status: 401, data: {} },
    });

    // 동기적으로 연달아 호출: 첫 핸들러가 isRefreshing=true 를 세운 뒤 두 번째가 큐에 대기.
    const p1 = respRejected(err1);
    const p2 = respRejected(err2);
    const [r1, r2] = await Promise.all([p1, p2]);

    // 리프레시(bare axios.post)는 단 1회.
    expect(axiosPostSpy).toHaveBeenCalledTimes(1);
    // 두 요청 모두 재시도됨(adapter 2회).
    expect(mockAdapter).toHaveBeenCalledTimes(2);
    expect(r1.status).toBe(200);
    expect(r2.status).toBe(200);
    // 재시도된 두 요청 모두 신규 토큰 부착.
    const auths = mockAdapter.mock.calls.map((c) => c[0].headers.Authorization);
    expect(auths).toEqual(['Bearer new-token', 'Bearer new-token']);
  });

  it('(c) 리프레시 실패 → 강제 로그아웃, 대기 큐 요청 모두 reject', async () => {
    mockAuthState.accessToken = 'old-token';
    // 리프레시 엔드포인트가 401 로 실패 → refreshAccessToken 은 null 반환 → 로그아웃 경로.
    axiosPostSpy.mockRejectedValue({ response: { status: 401, data: {} } } as any);

    const err1 = makeError({
      config: { url: '/a', method: 'get', headers: {} },
      response: { status: 401, data: {} },
    });
    const err2 = makeError({
      config: { url: '/b', method: 'get', headers: {} },
      response: { status: 401, data: {} },
    });

    const p1 = respRejected(err1);
    const p2 = respRejected(err2);

    // in-flight 리프레시 주도 요청: 인증 만료 에러로 reject.
    await expect(p1).rejects.toThrow('인증이 만료되었습니다. 다시 로그인해주세요.');
    // 대기 큐 요청: processQueue(error) 로 reject.
    await expect(p2).rejects.toBeDefined();

    // 강제 로그아웃 부수효과.
    expect(mockAuthState.clearAuth).toHaveBeenCalled();
    expect(router.replace).toHaveBeenCalledWith('/login');
    // 재시도는 발생하지 않는다(adapter 미호출).
    expect(mockAdapter).not.toHaveBeenCalled();
  });
});

// ============================================================================
// Target 4: refreshAccessToken 은 bare axios 사용 → 인터셉터 재귀 없음
// ============================================================================
describe('리프레시는 bare axios 사용 (인터셉터 재귀 회피, REQ-REF-002)', () => {
  it('리프레시 호출은 apiClient(인터셉트 인스턴스)가 아닌 bare axios.post 로 나간다', async () => {
    mockAuthState.accessToken = 'old-token';
    const err = makeError({
      config: { url: '/protected', method: 'get', headers: {} },
      response: { status: 401, data: {} },
    });

    await respRejected(err);

    // bare axios.post 로 리프레시 엔드포인트 호출.
    expect(axiosPostSpy).toHaveBeenCalledTimes(1);
    expect(axiosPostSpy).toHaveBeenCalledWith(
      `${API_BASE_URL}/auth/refresh`,
      {},
      expect.objectContaining({ withCredentials: true }),
    );
    // apiClient adapter(인터셉트 경로)로는 /auth/refresh 가 절대 흐르지 않는다.
    const adapterUrls = mockAdapter.mock.calls.map((c) => c[0].url);
    expect(adapterUrls).not.toContain('/auth/refresh');
    expect(adapterUrls.some((u: string) => String(u).includes('auth/refresh'))).toBe(false);
    // adapter 는 원 요청 재시도로만 호출(1회).
    expect(mockAdapter).toHaveBeenCalledTimes(1);
    expect(mockAdapter.mock.calls[0][0].url).toBe('/protected');
  });
});
