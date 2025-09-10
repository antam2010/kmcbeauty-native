---
mode: agent
---
https://api-kmc2.daeho3.shop/openapi.json 에서 API 를 사용합니다.
.env 에 있는 주소를 api 주소로 사용합니다.
뷰티앱 어플 입니다.
관리자가 직원을 관리할 수 있고 화장, 눈썹, 두피등 뷰티 관련 서비스를 예약할 수 있습니다.

## 프로젝트 구조

- **홈 탭**: 대시보드 - 오늘의 예약 현황, 통계, 인기 서비스 등
- **예약 탭**: 서비스 예약 - 서비스 선택, 날짜/시간 선택, 예약 생성
- **관리 탭**: 직원 관리 - 직원 목록, 추가/수정/상태 변경
- **프로필 탭**: 사용자 프로필 - 개인정보, 예약 내역, 설정

## 기술 스택

- React Native + Expo
- TypeScript
- Axios (API 통신)
- File-based routing (Expo Router)


beauty-app/
├─ app/                                   # Expo Router: 화면·네비게이션
│  ├─ _layout.tsx                         # 전역 Provider(SafeArea, QueryClient, Zustand Persist, i18n)
│  ├─ (auth)/                             # 인증 스택
│  │  ├─ _layout.tsx
│  │  ├─ sign-in.tsx
│  │  └─ sign-up.tsx
│  ├─ (tabs)/                             # 메인 탭: 홈/예약/매장/내정보
│  │  ├─ _layout.tsx
│  │  ├─ index.tsx                        # 홈(프로모션, 추천 매장/디자이너)
│  │  ├─ booking/
│  │  │  ├─ index.tsx                     # 예약 캘린더(일/주/월 전환)
│  │  │  ├─ select-service.tsx
│  │  │  ├─ select-stylist.tsx
│  │  │  ├─ select-time.tsx
│  │  │  └─ checkout.tsx                  # 결제/쿠폰 적용
│  │  ├─ salons/
│  │  │  ├─ index.tsx                     # 매장 리스트/검색/필터
│  │  │  └─ [salonId].tsx                 # 매장 상세(리뷰/서비스/지도)
│  │  └─ profile/
│  │     ├─ index.tsx                     # 내 정보/포인트/쿠폰
│  │     ├─ bookings.tsx                  # 내 예약 내역
│  │     └─ settings.tsx
│  └─ (modals)/
│     ├─ coupon-picker.tsx
│     └─ image-viewer.tsx
│
├─ src/
│  ├─ api/                                # OpenAPI 기반 API 레이어
│  │  ├─ generated/                       # (자동 생성) 타입/클라이언트
│  │  ├─ hooks/                           # (선택) orval/tanstack-query용 훅
│  │  ├─ client.ts                        # axios 인스턴스 + 인터셉터
│  │  └─ index.ts                         # 엔드포인트 래퍼(필요 시)
│  │
│  ├─ features/                           # 도메인 모듈(상태+UI+서비스 응집)
│  │  ├─ auth/
│  │  │  ├─ store.ts                      # access/refresh 토큰, 유저
│  │  │  ├─ hooks.ts                      # useSignIn/useSignOut
│  │  │  └─ guards.tsx                    # 라우트 가드
│  │  ├─ booking/
│  │  │  ├─ store.ts                      # 진행중 예약(선택 서비스/스타일리스트/시간)
│  │  │  ├─ components/
│  │  │  │  ├─ Calendar.tsx               # RN Big Calendar 래퍼
│  │  │  │  ├─ ServiceCard.tsx
│  │  │  │  └─ TimeslotGrid.tsx
│  │  │  └─ hooks.ts                      # useCreateBooking/useCancelBooking 등
│  │  ├─ salon/
│  │  │  ├─ filters.ts                    # 지역/가격/카테고리 필터 로직
│  │  │  └─ components/SalonItem.tsx
│  │  ├─ stylist/
│  │  │  └─ components/StylistCard.tsx
│  │  ├─ payment/
│  │  │  ├─ hooks.ts                      # 결제 시그널/검증/영수증
│  │  │  └─ utils.ts                      # 금액/쿠폰/포인트 계산
│  │  ├─ reviews/
│  │  │  └─ components/ReviewList.tsx
│  │  └─ notifications/
│  │     ├─ push.ts                       # Expo Notifications 등록/토큰
│  │     └─ inapp.ts                      # 앱 내 토스트/배지
│  │
│  ├─ stores/                             # 전역 공용(Zustand)
│  │  ├─ useAppStore.ts                   # 테마/네트워크 상태/토스트
│  │  └─ persist/mmkv.ts                  # MMKV/SecureStore 래퍼
│  │
│  ├─ services/
│  │  ├─ http/
│  │  │  ├─ authRefresh.ts                # 401 → 토큰 재발급 처리
│  │  │  └─ errorMapper.ts                # 서버 에러 → 사용자 메시지
│  │  ├─ storage/
│  │  │  ├─ secure.ts                     # SecureStore(Keychain) 접근
│  │  │  └─ local.ts                      # 캐시(AsyncStorage/MMKV)
│  │  └─ location/geocoding.ts            # 지도/거리 계산(매장용)
│  │
│  ├─ ui/                                 # 디자인 시스템(Atoms/Molecules)
│  │  ├─ atoms/
│  │  │  ├─ Button.tsx
│  │  │  └─ Text.tsx
│  │  ├─ molecules/
│  │  │  ├─ StatCard.tsx
│  │  │  └─ SearchBar.tsx
│  │  └─ theme.ts
│  │
│  ├─ utils/
│  │  ├─ date.ts                          # KST 포맷, 주/월 경계
│  │  ├─ money.ts                         # 통화/할인/포인트 계산
│  │  └─ validators.ts
│  │
│  └─ types/
│     ├─ models.d.ts                      # 앱 전용 타입(서버 공통 외)
│     └─ route.d.ts
│
├─ assets/ (fonts/images/icons/sounds)
├─ tests/   (unit/e2e)
├─ app.config.ts                          # Expo 설정(환경 분기)
├─ .env / .env.development / .env.production
├─ package.json
└─ README.md
