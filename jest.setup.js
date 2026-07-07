// SPEC-UX-001: 테스트 환경 네이티브 모듈 모킹.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// SPEC-DATA-001: 실제 서비스/클라이언트 모듈을 로드하는 테스트를 위해 기본 API base URL 을 제공한다.
// (개별 테스트에서 덮어쓰고 복원할 수 있도록 미설정 시에만 기본값을 채운다.)
process.env.EXPO_PUBLIC_API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || 'https://api.test.local';
