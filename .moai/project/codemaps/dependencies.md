# KMC Beauty Native — 의존성 맵

> 기준: feature/refactor-hardening-2026-07 | 최종 업데이트: 2026-07-06

---

## 내부 의존성 그래프

```
app/ (라우팅 화면)
  └─► components/ (UI 위임)
        └─► src/stores/ (상태 구독)
              └─► src/api/services/ (스토어 액션이 직접 호출)
                    └─► src/api/client.ts (단일 axios 인스턴스)
                          └─► 외부 REST API

src/api/client.ts
  └─► src/stores/authStore (읽기 전용: 토큰 읽기)
  └─► src/stores/shopStore (읽기 전용: shopId 읽기)

components/ (일부)
  └─► src/stores/ (직접 구독 허용)

src/types/
  └─► (단방향 소비됨; 의존을 받지 않음)
```

**의존 방향 규칙**:
- `stores → services`: 스토어 액션이 서비스를 호출 (authStore.ts:150,157,178,205 / shopStore.ts:62,91)
- `client.ts → stores`: 헤더 주입 목적의 읽기 전용 참조 (단방향, 순환 없음)
- `services → client.ts`: 모든 서비스는 apiClient만 사용 (레거시 2개 제외)
- 역방향 금지: services가 stores를 직접 import하면 안 됨

---

## 외부 패키지 카탈로그

### 핵심 런타임

| 패키지 | 버전 | 용도 |
|--------|------|------|
| `react` | 19.1.0 | UI 렌더링 |
| `react-native` | 0.81.4 | 모바일 런타임 |
| `expo` | 54.0.8 | SDK + 네이티브 모듈 플랫폼 |
| `expo-router` | 6.0.7 | 파일 기반 라우팅 |
| `@react-navigation/bottom-tabs` | 7.3.10 | 하단 탭 네비게이션 |
| `typescript` | 5.9.2 | 타입 시스템 (strict) |

### 상태 및 네트워크

| 패키지 | 버전 | 용도 |
|--------|------|------|
| `zustand` | 5.0.8 | 전역 상태 관리 (persist 미들웨어 포함) |
| `axios` | 1.11.0 | HTTP 클라이언트 |
| `@react-native-async-storage/async-storage` | 2.2.0 | 일반 로컬 영속화 |
| `expo-secure-store` | 15.0.7 | 보안 키체인 (액세스 토큰) |

### 네이티브 기능

| 패키지 | 버전 | 용도 |
|--------|------|------|
| `expo-contacts` | (Expo 54 번들) | 기기 연락처 읽기 (전화번호부 동기화) |
| `expo-haptics` | (Expo 54 번들) | 햅틱 피드백 |
| `expo-blur` | (Expo 54 번들) | 블러 시각 효과 |
| `expo-image` | (Expo 54 번들) | 최적화 이미지 렌더링 |
| `expo-font` | (Expo 54 번들) | 커스텀 폰트 로딩 |

### 유틸리티 및 UI

| 패키지 | 버전 | 용도 |
|--------|------|------|
| `dayjs` | 1.11.18 | 날짜 처리 |
| `react-native-reanimated` | 4.1.0 | 애니메이션 |
| `react-native-ui-datepicker` | (서드파티) | 예약 날짜 선택 (Expo 패키지 아님) |

### 개발 도구

| 패키지 | 용도 |
|--------|------|
| `eslint` 9 + `eslint-config-expo` | 린팅 |
| `eas-cli` (전역) | EAS 빌드 및 배포 |

---

## 레거시 위반 사항

아래 파일은 현재 아키텍처 경계 규칙을 위반하고 있으며 이전 대상이다.

| 파일 | 위반 내용 | 조치 |
|------|---------|------|
| `src/services/api/phonebook.ts` | `apiClient`를 직접 import (services 레이어 우회) | `src/api/services/phonebook.ts` 활용으로 이전 |
| `src/services/api/treatment-menu.ts` | `apiClient`를 직접 import (services 레이어 우회) | `src/api/services/treatmentMenu.ts` 활용으로 이전 |
| `contexts/DashboardContext.tsx` | 루트에 위치, 미사용 | 제거 예정 |

---

## 환경 변수 의존성

| 변수 | 소비처 | 필수 여부 |
|------|--------|---------|
| `EXPO_PUBLIC_API_BASE_URL` | `src/api/client.ts` baseURL 설정 | 필수 (미설정 시 모든 API 호출 실패) |
