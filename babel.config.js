module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [],
    env: {
      // 프로덕션 번들에서만 console 호출 제거(console.error 는 보존).
      // 개발 환경 동작은 변경되지 않는다.
      production: {
        plugins: [['transform-remove-console', { exclude: ['error'] }]],
      },
    },
  };
};
