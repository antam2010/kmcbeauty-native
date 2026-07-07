# KMC Beauty Native — 데이터 흐름 맵

> 기준: feature/refactor-hardening-2026-07 | 최종 업데이트: 2026-07-06

---

## 1. 로그인 흐름

```
LoginForm (components/forms/LoginForm.tsx)
  └─► authStore.login(email, password)          [authStore.ts:150]
        └─► authApiService.login(credentials)
              └─► POST /auth/login  (client.ts 경유)
                    └─► 응답: { accessToken, refreshToken(HttpOnly cookie) }
                          ├─ SecureStore.setItemAsync('auth_access_token', token)
                          └─► authApiService.getMe()
                                └─► GET /users/me
                                      └─► AsyncStorage: user, isAuthenticated 저장
                                            └─► router.replace('/shop-selection')
```

**보안 계약 (SECURITY-001)**: 클라이언트는 role/password를 서버에 절대 공급하지 않는다. `StaffUserUpdate = { is_primary_owner: boolean }` 만 허용.

---

## 2. 샵 선택 흐름

```
shop-selection.tsx
  └─► shopApiService.list()             [GET /shops]
        └─► 사용자가 샵 선택
              └─► shopStore.setSelectedShop(shop)   [shopStore.ts:62]
                    └─► AsyncStorage 영속화 ('shop-storage')
                          └─► client.ts 인터셉터 활성화
                                이후 모든 요청에 X-Shop-ID: {shopId} 주입
                                └─► router.replace('/(tabs)/')
```

---

## 3. 인증된 API 요청 생애주기

```
컴포넌트 (예: BookingListScreen)
  └─► treatmentApiService.list()
        └─► client.ts apiClient.get('/treatments', ...)

  [요청 인터셉터 — client.ts]
  ├─ authStore에서 accessToken 읽기
  ├─ Authorization: Bearer {accessToken} 헤더 주입
  ├─ shopStore에서 selectedShopId 읽기
  └─ X-Shop-ID: {shopId} 헤더 주입 (미선택 시 헤더 생략, 차단 없음)

  [서버 응답]
  └─► [응답 인터셉터 — 우선순위 순서]
        1순위: errorCode === 'SHOP_NOT_SELECTED'
               └─► router.replace('/shop-selection')   [client.ts:304]

        2순위: HTTP 403
               └─► authStore.logout() → router.replace('/login')  [client.ts:343]

        3순위: HTTP 401 (토큰 만료)
               ├─ 단일 비행(single-flight) 갱신 시작
               ├─ 이후 도착 요청은 failedQueue에 적재   [client.ts:355]
               ├─► refreshAccessToken()
               │     └─ bare axios (인터셉터 재귀 방지 @MX:WARN)
               │     └─► POST /auth/refresh  (HttpOnly cookie 사용)
               │           └─ SecureStore에 새 accessToken 저장
               └─► failedQueue 재시도 (성공) 또는 강제 로그아웃 (실패)
```

---

## 4. 예약 생성 흐름

```
BookingForm (components/forms/BookingForm.tsx)
  └─► 부모 화면으로 onSubmit 핸들러 전달 (직접 API 호출 금지)
        └─► treatmentApiService.create(bookingData)
              └─► POST /treatments  (client.ts 경유)
                    └─► 성공 시 BookingListScreen 목록 갱신
```

월간 시술 조회 시 병렬 페이지네이션 사용:
```
treatmentApiService.getMonthly(year, month)
  └─► 총 페이지 수 파악 (1차 요청)
        └─► Promise.allSettled([
              GET /treatments?page=0&...,
              GET /treatments?page=1&...,
              ...
            ])
              └─► 성공 페이지만 병합하여 반환
```

---

## 5. 연락처 동기화 흐름

```
PhonebookManagement (components/management/PhonebookManagement.tsx)
  └─► expo-contacts.getContactsAsync()   [네이티브 경계]
        └─► 기기 연락처 읽기 (권한 필요)
              └─► phonebookApiService.sync(contacts)
                    └─► POST /phonebook/sync  (client.ts 경유)
                          └─► 서버 전화번호부 갱신 결과 반환
```

---

## 6. 상태 영속화 및 복원 경로

| 데이터 | 저장소 | 키 | 복원 시점 |
|--------|--------|-----|---------|
| accessToken | SecureStore | `auth_access_token` | `authStore.loadUser()` |
| user, isAuthenticated | AsyncStorage | `auth-storage` | `authStore.loadUser()` |
| selectedShop | AsyncStorage | `shop-storage` | `shopStore.loadSelectedShop()` |
| remembered-email | AsyncStorage | `remembered-email` | 로그아웃 후에도 보존 |
| refreshToken | HttpOnly Cookie | (서버 관리) | POST /auth/refresh 시 자동 전송 |

**앱 재시작 복원 순서**: `_layout.tsx` → `StoreInitializer` → `loadUser()` → `loadSelectedShop()` → 라우팅 분기.
