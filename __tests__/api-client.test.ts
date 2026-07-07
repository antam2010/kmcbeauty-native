// SPEC-UX-001 (PRESERVE): api/client.ts 특성 스모크 테스트.
// 로그 게이팅(REQ-UX-008) 변경 전후로 모듈 로드/익스포트 동작이 동일함을 보장한다.
jest.mock('expo-router', () => ({
  router: { replace: jest.fn(), push: jest.fn() },
}));

describe('SPEC-UX-001 api client smoke', () => {
  const OLD_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

  beforeAll(() => {
    process.env.EXPO_PUBLIC_API_BASE_URL = 'https://api.test.local';
  });
  afterAll(() => {
    process.env.EXPO_PUBLIC_API_BASE_URL = OLD_URL;
  });

  it('loads the module and exports a configured axios client', () => {
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const mod = require('@/src/api/client');
      expect(mod.default).toBeDefined();
      expect(mod.API_BASE_URL).toBe('https://api.test.local');
      expect(typeof mod.default.get).toBe('function');
      expect(typeof mod.default.post).toBe('function');
      // 요청/응답 인터셉터가 등록되어 있어야 한다 (헤더 부착 계약 유지)
      expect(mod.default.interceptors.request).toBeDefined();
      expect(mod.default.interceptors.response).toBeDefined();
      // 디버그 유틸리티 export 유지
      expect(mod.authDebugUtils).toBeDefined();
    });
  });
});
