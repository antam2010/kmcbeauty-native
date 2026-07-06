# KMC Beauty Native — 아키텍처 개요

> 기준: feature/refactor-hardening-2026-07 | 최종 업데이트: 2026-07-06

---

## 시스템 목적

미용실 스태프용 React Native 모바일 앱. 예약 조회, 시술 메뉴 관리, 직원 관리, 전화번호부 동기화 기능을 제공한다. 백엔드 REST API(`EXPO_PUBLIC_API_BASE_URL`)와 통신하며, 기기 연락처(`expo-contacts`)를 네이티브 경계로 사용한다.

---

## 레이어 구조

```
┌─────────────────────────────────────────────────────┐
│  app/  (expo-router 파일 기반 라우팅, 11 routes)     │
│  화면 진입점 — UI 로직은 components/로 위임           │
├─────────────────────────────────────────────────────┤
│  components/  (31 files, 8 folders)                  │
│  기능 도메인별 UI 컴포넌트 + 공유 UI 원자(atoms)      │
├─────────────────────────────────────────────────────┤
│  src/stores/  (Zustand 5, persist)                   │
│  authStore · shopStore — 전역 상태 + 로컬 영속화      │
├─────────────────────────────────────────────────────┤
│  src/api/services/  (BaseApiService 상속, 8 도메인)  │
│  도메인별 서비스 클래스 — 스토어 액션이 직접 호출      │
├─────────────────────────────────────────────────────┤
│  src/api/client.ts  (@MX:ANCHOR — 단일 axios 인스턴스)│
│  요청/응답 인터셉터 중앙 처리                          │
├─────────────────────────────────────────────────────┤
│  외부 경계                                            │
│  REST API (HTTPS) · expo-contacts (네이티브 API)      │
└─────────────────────────────────────────────────────┘
```

의존 방향: `app → components → stores → services → client → 외부`

---

## 핵심 설계 패턴

| 패턴 | 위치 | 설명 |
|------|------|------|
| 싱글턴 Axios 클라이언트 | `src/api/client.ts` | 이전 삼중 클라이언트를 단일 인스턴스로 통합 |
| BaseApiService 상속 | `src/api/services/base.ts` | 공통 CRUD 추상화, 모든 도메인 서비스가 상속 |
| 배럴 타입 허브 | `src/types/index.ts → unified.ts` | 소비자는 배럴만 import, 직접 unified.ts import 없음 |
| secureHybridStorage | `src/stores/authStore.ts` | 민감 데이터(토큰)는 SecureStore, 일반 상태는 AsyncStorage |
| 단일 비행 토큰 갱신 | `src/api/client.ts` (401 핸들러) | failedQueue 패턴으로 동시 재시도 요청 처리 |
| Promise.allSettled 페이지네이션 | `src/api/services/treatment.ts` | 월간 시술 데이터 병렬 페이지 조회 |

---

## 시스템 경계

| 경계 | 프로토콜 | 방향 |
|------|---------|------|
| 백엔드 REST API | HTTPS / Axios | 단방향 아웃바운드 |
| expo-contacts | 네이티브 Bridge / JSI | 읽기 전용 인바운드 |
| SecureStore | 기기 보안 키체인 | 양방향 (토큰 R/W) |
| AsyncStorage | 기기 로컬 스토리지 | 양방향 (상태 persist) |

---

## 코드베이스 규모

| 지표 | 값 |
|------|-----|
| 소스 파일 | 87 |
| 총 LOC | ~20,726 |
| 테스트 파일 | 0 (특성 테스트 작성 필요) |
| TypeScript strict | 활성화 |
