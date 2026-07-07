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
