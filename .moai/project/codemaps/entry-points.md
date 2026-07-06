# KMC Beauty Native — 진입점 맵

> 기준: feature/refactor-hardening-2026-07 | 최종 업데이트: 2026-07-06

---

## Expo-Router 진입 체인

```
package.json  "main": "expo-router/entry"
      │
      ▼
expo-router/entry  (Expo Router 내부 진입점)
      │
      ▼
app/_layout.tsx  (루트 레이아웃 — 앱 오케스트레이터)
      │
      ├─ 1. expo-font 폰트 로딩 (useFonts)
      ├─ 2. StoreInitializer 실행
      │       └─ authStore.loadUser()      ← SecureStore + AsyncStorage hydration
      │       └─ shopStore.loadSelectedShop() ← AsyncStorage hydration
      ├─ 3. 테마(theme) 적용
      └─ 4. <Stack> 네비게이터 마운트
```

`StoreInitializer`는 앱 첫 렌더 시 비동기 스토어 hydration을 완료한 뒤 자식 라우트를 표시한다.

---

## 전체 라우트 목록 (11개)

| # | 파일 경로 | URL 경로 | 역할 |
|---|----------|---------|------|
| 1 | `app/_layout.tsx` | (루트 레이아웃) | 폰트·스토어 초기화·Stack 마운트 |
| 2 | `app/index.tsx` | `/` | 스플래시 + 인증 상태 분기 (`/login` 또는 `/(tabs)/`) |
| 3 | `app/login.tsx` | `/login` | 로그인 화면 |
| 4 | `app/shop-selection.tsx` | `/shop-selection` | 샵 선택 (SHOP_NOT_SELECTED 리다이렉트 대상) |
| 5 | `app/monthly-dashboard.tsx` | `/monthly-dashboard` | 월간 대시보드 |
| 6 | `app/+not-found.tsx` | `*` | 404 폴백 |
| 7 | `app/(tabs)/_layout.tsx` | `/(tabs)` 레이아웃 | 하단 탭 바 + 탭 구성 |
| 8 | `app/(tabs)/index.tsx` | `/(tabs)/` | 홈 탭 |
| 9 | `app/(tabs)/booking.tsx` | `/(tabs)/booking` | 예약 탭 |
| 10 | `app/(tabs)/management.tsx` | `/(tabs)/management` | 관리 탭 (직원·메뉴·전화번호부) |
| 11 | `app/(tabs)/profile.tsx` | `/(tabs)/profile` | 프로필 탭 |

---

## 인증 분기 로직 (app/index.tsx)

```
app/index.tsx 마운트
  ├─ authStore.isAuthenticated === true
  │     └─► router.replace('/(tabs)/')
  └─ authStore.isAuthenticated === false
        └─► router.replace('/login')
```

인증 후 샵이 미선택 상태이면 `src/api/client.ts` 응답 인터셉터가 `/shop-selection`으로 리다이렉트한다.

---

## StoreInitializer 부트 시퀀스

```
1. authStore.loadUser()
   ├─ SecureStore.getItemAsync('auth_access_token')  → accessToken 복원
   └─ AsyncStorage.getItem('auth-storage')           → user, isAuthenticated 복원

2. shopStore.loadSelectedShop()
   └─ AsyncStorage.getItem('shop-storage')           → selectedShop 복원

3. 완료 후 Stack 네비게이터가 index.tsx를 렌더링
   → 복원된 isAuthenticated 값으로 라우팅 분기
```

---

## CLI / API 서버 진입점

없음. 본 프로젝트는 순수 모바일 앱이며 CLI 도구 또는 독립 서버 진입점을 포함하지 않는다.

빌드 CLI는 `eas build` (외부 EAS 서비스)를 통해 실행된다.
