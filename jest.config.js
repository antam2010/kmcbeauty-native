// 테스트 시간대를 한국(UTC+9)으로 고정한다. 날짜 경계(00:00~08:59 KST) 테스트가 실행 환경 TZ 에 좌우되지 않게 한다.
// (설정 파일은 워커 생성 전 부모 프로세스에서 평가되므로 워커가 이 값을 상속한다.)
process.env.TZ = 'Asia/Seoul';

// SPEC-UX-001: 특성(characterization) 테스트 하네스 설정.
// jest-expo 프리셋으로 React Native 0.81 / Expo 54 환경을 모킹한다.
module.exports = {
  preset: 'jest-expo',
  setupFiles: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|zustand))',
  ],
  testMatch: ['<rootDir>/__tests__/**/*.test.{ts,tsx}'],
};
