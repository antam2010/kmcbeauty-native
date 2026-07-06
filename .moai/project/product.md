# KMC Beauty Native — 제품 문서

> 문서 기준: 리팩토링 목표 상태 (branch: feature/refactor-hardening-2026-07)
> 최종 업데이트: 2026-07-06

---

## 프로젝트 개요

**KMC Beauty Native**는 뷰티샵(미용실) 운영을 위한 모바일 관리 앱입니다. 샵 오너·매니저·직원이 예약, 시술 메뉴, 직원, 전화번호부, 매출 현황을 하나의 앱에서 관리할 수 있도록 설계되었습니다.

- **플랫폼**: iOS / Android (React Native + Expo)
- **번들 ID**: `com.antam2010.kmcbeautynative`
- **백엔드**: REST API (`EXPO_PUBLIC_API_BASE_URL`)

---

## 대상 사용자

| 역할 | 설명 |
|------|------|
| ADMIN / MASTER | 샵 전체 설정, 직원 등록 및 관리, 통계 열람 |
| MANAGER | 예약 관리, 시술 메뉴 편집, 직원 조회 |
| STAFF | 본인 예약 확인, 고객 전화번호부 조회 |
| USER | 초대 코드로 가입 후 기본 기능 이용 |

멀티샵을 운영하는 사업자를 지원합니다. 로그인 후 샵을 선택하면 이후 모든 API 요청에 해당 샵 컨텍스트가 자동 적용됩니다.

---

## 핵심 기능 도메인 (9개)

### 1. 인증 (Authentication)
- JWT Bearer 토큰 + HttpOnly refresh cookie 방식
- 초대 코드 기반 가입 (`InviteSignupForm`)
- 액세스 토큰 자동 갱신 (단일 리프레시 + 동시 요청 큐 재시도)
- 로그아웃 시 remembered-email 제외 전체 스토리지 정리

### 2. 샵 선택 / 등록 (Shop Selection)
- 멀티샵 지원: 로그인 후 `/shop-selection` 화면에서 샵 선택
- 선택된 샵 ID는 `X-Shop-ID` 헤더로 모든 API 요청에 자동 주입
- `shopStore`에 영속 저장 (AsyncStorage `shop-storage`)

### 3. 시술 예약 (Booking)
- 예약 생성: `BookingForm` (고객, 시술 메뉴, 담당 직원, 날짜/시간 선택)
- 예약 목록: `BookingListScreen` (필터·정렬, 렌더링 최적화)
- 예약 상태: `RESERVED` / `VISITED` / `CANCELLED` / `COMPLETED` / `NO_SHOW`

### 4. 시술 메뉴 관리 (Treatment Menu)
- 시술 메뉴 CRUD (`TreatmentMenuManagement`)
- 통합 시술 모달 (`UnifiedTreatmentModal`)

### 5. 월간 대시보드 (Monthly Dashboard)
- 매출 · 직원 · 고객 인사이트 시각화 (`MonthlyDashboard`)
- 복수 페이지 동시 조회 (`Promise.allSettled` 병렬 페이지네이션)

### 6. 직원 관리 (Staff Management)
- 직원 목록 조회 및 주 소유자(`is_primary_owner`) 지정 변경 (`StaffManagement`); 역할(Role)은 서버가 제어하며 클라이언트는 공급하지 않음 (SECURITY-001)
- 직원 등록 모달 (`StaffRegistrationModal`)
- 역할 계층: ADMIN > MASTER > MANAGER > STAFF > USER

### 7. 전화번호부 / 연락처 동기화 (Phonebook)
- 기기 연락처 읽기 (`expo-contacts`)
- 서버 전화번호부와 동기화 (`PhonebookManagement`)

### 8. 초대 코드 생성 (Invite)
- 신규 직원 초대 링크/코드 생성
- 초대 경로로 가입한 사용자는 해당 샵에 자동 소속

### 9. 캘린더 (Calendar)
- 월별 예약 현황 시각화 (`ImprovedCalendar`)
- 날짜 선택 시 해당 일자의 예약 목록 표시

---

## 주요 사용 시나리오

1. **신규 직원 온보딩**: 오너가 초대 코드를 생성 → 직원이 `InviteSignupForm`으로 가입 → 샵 선택 → 홈 탭 진입
2. **예약 등록**: 직원이 `BookingForm` 작성 → 상태 `RESERVED`로 생성 → 캘린더·목록에 반영
3. **방문 완료 처리**: `BookingListScreen`에서 예약 상태를 `VISITED` 또는 `COMPLETED`로 변경
4. **월 마감 보고**: 매니저가 `MonthlyDashboard`에서 해당 월 매출·방문 통계 확인
5. **멀티샵 전환**: 상단 `ShopHeader`에서 샵을 재선택 → `X-Shop-ID` 헤더 즉시 갱신
