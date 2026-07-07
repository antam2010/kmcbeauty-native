// SPEC-UX-001: 테스트 환경 네이티브 모듈 모킹.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
