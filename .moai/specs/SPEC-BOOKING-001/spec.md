---
id: SPEC-BOOKING-001
version: 0.1.1
status: draft
created_at: 2026-07-07
updated: 2026-07-07
author: antam2010
priority: high
labels: [booking, bug, data-loss, ux, senior, haptics, async-storage]
issue_number: null
---

# SPEC-BOOKING-001 — 예약 등록 흐름 간편화 및 입력 유실 수정

## HISTORY

- 2026-07-07 (v0.1.1): plan-audit 리뷰(`.moai/reports/plan-audit/SPEC-BOOKING-001-review-1.md`) minor 결함 6건 반영 — (D1) L71/L77/L83/L99 무조건 금지형을 SPEC-PERF-003 관례에 맞춰 Ubiquitous 부정형으로 재라벨, (D2) REQ-05 AsyncStorage 저장 대안 동작을 단일 동작(미저장)으로 확정, (D3) REQ-04 "인라인 성공 배너" 삭제·AC-07 재정의, (D4) REQ-06 첫 가용 슬롯 계산·하이라이트 검증 AC(AC-15) 추가, (D6) REQ-01 EARS 문장의 비규범 절차 주석을 참고 bullet로 분리. (D5) `research.md` 경로 표기 정정.
- 2026-07-07 (v0.1.0): 초안 작성. 검증된 UX 감사(읽기 전용)에서 확인된 6건(F-8/F-9/F-10/F-17/F-11a/F-11b + P3 햅틱 권고)을 기반으로 4단계 시니어 UX·성능 로드맵의 3단계(Stage 3)를 정의. 모든 file:line은 현재 코드(SPEC-UX-001·SPEC-PERF-001·SPEC-PERF-003·SPEC-REFACTOR-001 반영 후) 기준으로 재검증됨. 백엔드 계약 근거·재검증 결과·특성 테스트 전략은 `research.md` 참조.

---

## 1. 개요 (Overview)

KMC Beauty Native 앱의 **주 사용자는 오너의 어머니(60대)**로, **예약 등록이 매일의 핵심 업무**다. 본 SPEC은 예약 등록 흐름에서 발생하는 **입력 유실 버그**와 **불필요한 단계·차단성 대화상자**를 제거하여, 최소한의 탭으로 예약이 완료되도록 한다.

본 SPEC은 4단계 로드맵의 **3단계(Stage 3)**이며, 다음 원칙을 따른다.

- **데이터 무결성 우선**: 화면에서 사용자가 입력·선택한 값(담당 직원·결제 방법)이 생성 payload에서 **유실되지 않아야 한다**.
- **단계 축소는 감사 항목으로 한정**: 자동 포커스 제거(F-9), 확인 Alert 제거(F-10), 성공 Alert 자동 닫힘(F-17), 스마트 기본값(F-11)에 한정하며, **BookingForm 전면 재설계는 하지 않는다**.
- **비파괴 UX 전환**: 차단성 모달 `Alert`을 비차단 인라인 안내·자동 닫힘·경량 햅틱으로 대체하되, **새 무거운 의존성은 추가하지 않는다**(기존 `expo-haptics` 사용).
- 개발 방법론은 **DDD**(ANALYZE-PRESERVE-IMPROVE)이며, 변경 전 `handleBooking`의 **payload/흐름 특성 테스트**를 먼저 확보한다(제출 로직을 테스트 가능한 함수/훅으로 추출).

## 2. 목표 (Goals)

- 예약 생성 payload(`TreatmentCreate`)에 **선택한 담당 직원(`staff_user_id`)과 결제 방법(`payment_method`)을 포함**하여 입력 유실(F-8)을 제거한다.
- 시술 선택 시 **가격 입력 자동 포커스/키보드 강제 노출을 제거**(F-9)하여, 사용자가 시술만 고를 때 키보드가 튀어나오지 않게 한다.
- 고객 미지정 시 **차단성 확인 Alert을 비차단 인라인 안내로 대체**(F-10)하여 한 번의 탭으로 예약이 진행되게 한다.
- 예약 성공 시 **"확인" 탭이 필요한 성공 Alert을 자동 닫힘 + 경량 성공 안내 + 확인 햅틱으로 대체**(F-17 + 햅틱)한다. 동일 패턴을 `shop-selection` 성공 흐름에도 적용한다.
- **스마트 기본값**을 제공한다: 최근 사용 직원 자동 선택(F-11a), 현재 시각 이후 첫 가용 시간 슬롯의 시각적 유도(F-11b, 선택 강제 없음).
- 위 모든 변경은 **기존 테스트 39개(7 스위트) 통과**·**tsc 회귀 0건**을 만족한다.

## 3. 범위 (In Scope)

감사에서 확인되고 현재 코드 기준으로 재검증된 다음 6개 항목에 한정한다. (라인은 `research.md`에서 재검증된 현재 값)

| # | 항목 | Finding | 우선순위 | 대표 위치 (현재 기준) |
|---|------|---------|----------|-----------------------|
| 1 | 담당 직원·결제 방법 입력 유실 수정 | F-8 | P1 (BUG) | `BookingForm.tsx` `handleBooking` `409`, payload `482-488`(누락 필드), `create` 호출 `519`; 직원 UI `981-1042`(state `61`), 결제 UI `1044-1070`(state `63`); 타입 `treatment.ts` `TreatmentCreate.payment_method` `85`·`staff_user_id` `86` |
| 2 | 시술 선택 시 가격 입력 자동 포커스 제거 | F-9 | P2 | `BookingForm.tsx` `addTreatment` `264-296`, `InteractionManager.runAfterInteractions` `280`, `setTimeout` `286`, `focus()` `288`; `base_price` 기본값 `275` |
| 3 | 고객 미지정 확인 Alert 제거·인라인 안내 | F-10 | P2 | `BookingForm.tsx` Promise+Alert 확인 `441-468`(`new Promise` `442`, `Alert.alert` `443-457`) |
| 4 | 성공 Alert → 자동 닫힘 + 확인 햅틱 | F-17 (+ 햅틱 P3) | P2 | `BookingForm.tsx` 성공 `Alert` `521-523`; `shop-selection.tsx` 성공 `Alert` `73-89`(인위적 지연 `71`); `expo-haptics` `package.json:31` |
| 5 | 최근 사용 직원 자동 선택 | F-11a | P3 | `BookingForm.tsx` `selectedStaff` 초기값 `61`, 직원 로드 `247-258`; `@react-native-async-storage/async-storage` `package.json:17` |
| 6 | 첫 가용 시간 슬롯 시각적 유도 | F-11b | P3 | `BookingForm.tsx` `timeSlots` `79-84`, `selectedTime` 초기값 `59`, `isTimeReserved` `260-262`, 시간 그리드 `872-902` |

> **주의(재검증 결과)**: 감사가 인용한 라인은 선행 단계(SPEC-UX-001·PERF-001·PERF-003) 반영으로 이동했으며, 위 표는 현재 HEAD 기준으로 재확인한 값이다. `BookingForm.tsx`의 정본 경로는 `components/forms/BookingForm.tsx`이다(과거 `components/booking/` 아님). 상세는 `research.md` 참조.

---

## 4. 요구사항 (EARS Requirements)

요구사항은 제안 구현 순서(§8, 버그 우선)와 동일한 번호 순서로 정의한다.

### REQ-BOOKING-001-01 — 담당 직원·결제 방법 저장 (F-8, BUG)

- **Event-Driven**: 사용자가 담당 직원을 선택한 상태에서 "예약하기"를 누르면(When), 시스템은 생성 payload(`TreatmentCreate`)에 선택된 직원의 `staff_user_id`(= `selectedStaff.user_id`)를 포함해야 한다(shall).
- **Event-Driven**: 사용자가 "예약하기"를 누르면(When), 시스템은 생성 payload에 선택된 `payment_method`(기본값 `CARD` 포함)를 포함해야 한다(shall).
- **State-Driven**: "담당 직원 없음"이 선택된 동안, 시스템은 payload에 `staff_user_id`를 포함하지 않아야 한다(생략/undefined).
- **Unwanted**: **If** 생성 요청이 `staff_user_id`/`payment_method` 관련 4xx 오류로 거부되면, **then** 시스템은 입력된 폼 상태(선택 직원·결제 방법·시술·고객·시간)를 초기화하지 않고 유지하며 명확한 오류 안내를 표시해야 한다(예약 데이터 유실 금지).

> **참고(비규범)**: 백엔드 `POST /treatments`의 실제 수용 여부는 Run 단계 통합 검증으로 확인한다(§6 Definition of Done, §7 위험 평가 참조).

### REQ-BOOKING-001-02 — 시술 선택 시 자동 포커스 제거 (F-9)

- **Ubiquitous**: 시스템은 시술 항목 선택(추가) 시 가격 입력 필드에 자동으로 `focus()`를 호출하거나 키보드를 강제로 열지 않아야 한다(shall not).
- **Event-Driven**: 사용자가 특정 시술의 가격 필드를 **명시적으로 탭**하면, 시스템은 그때에만 해당 필드를 편집 가능하게 해야 한다.
- **Ubiquitous**: 시스템은 시술 추가 시 해당 시술의 `base_price`를 기본 가격(`customPrice`)으로 보존해야 한다(자동 포커스 제거가 기본값 동작을 변경하지 않는다).

### REQ-BOOKING-001-03 — 고객 미지정 확인 Alert 제거·인라인 안내 (F-10)

- **Ubiquitous**: 시스템은 고객 미선택 상태로 예약을 진행할 때 Promise 기반 확인용 모달 `Alert`(취소/계속 진행 대화상자)을 표시하지 않아야 한다(shall not).
- **State-Driven**: 고객이 선택되지 않은 동안, 시스템은 폼 내에 "고객 미지정으로 저장됩니다" 비차단 인라인 안내를 렌더해야 한다.
- **Event-Driven**: 고객 미선택 상태에서 사용자가 "예약하기"를 한 번 누르면, 시스템은 추가 확인 없이 기본 고객으로 예약 생성을 진행해야 한다.

### REQ-BOOKING-001-04 — 성공 Alert 제거·자동 닫힘·확인 햅틱 (F-17 + 햅틱)

- **Ubiquitous**: 시스템은 예약 생성 성공 시 "확인" 탭이 필요한 성공 `Alert`을 표시하지 않아야 한다(shall not).
- **Event-Driven**: 예약 생성이 성공하면(When), 시스템은 폼을 자동으로 닫고(`onBookingComplete` 호출) 부모 예약 목록을 갱신하여 신규 예약이 목록에 나타나도록 해야 한다(별도 인라인 성공 배너 없음 — 성공 햅틱 1회와 목록 반영이 성공의 시각적 확인이 된다).
- **Event-Driven**: 예약 생성이 성공하면(When), 시스템은 `expo-haptics`의 `notificationAsync(NotificationFeedbackType.Success)`로 확인 햅틱을 정확히 1회 발생시켜야 한다.
- **Event-Driven** (동일 패턴): 상점 선택(`shop-selection.tsx`)이 성공하면, 시스템은 "확인" 탭 성공 `Alert` 없이 자동으로 다음 화면(`router.back()`/`replace`)으로 이동해야 한다.
- **Ubiquitous**: 시스템은 성공 안내를 위해 새로운 무거운 토스트/스낵바 의존성을 추가하지 않아야 한다(shall not) — 기존 `expo-haptics` 및 인라인 UI만 사용한다.

### REQ-BOOKING-001-05 — 최근 사용 직원 자동 선택 (F-11a)

- **Event-Driven**: 예약 생성이 성공하면(When), 시스템은 선택된 담당 직원의 `user_id`를 최근 사용 직원으로 `AsyncStorage`에 저장해야 한다.
- **State-Driven**: "담당 직원 없음"이 선택된 동안, 시스템은 최근 사용 직원 `AsyncStorage` 키를 저장(갱신)하지 않아야 한다(미지정 기록 대안 없음).
- **Event-Driven**: 예약 폼이 열리고 직원 목록 로드가 완료되면(When), 시스템은 저장된 최근 직원 `user_id`가 로드된 직원 목록에 존재하는 경우 해당 직원을 기본 선택 상태로 복원해야 한다.
- **Unwanted**: **If** 저장된 최근 직원 `user_id`가 현재 직원 목록에 존재하지 않으면, **then** 시스템은 이를 복원하지 않고 "담당 직원 없음" 상태를 유지해야 한다.
- **State-Driven**: 최근 직원 정보가 저장된 적이 없는 동안, 시스템은 "담당 직원 없음"을 기본값으로 유지해야 한다.

### REQ-BOOKING-001-06 — 첫 가용 시간 슬롯 시각적 유도 (F-11b)

- **Event-Driven**: 예약 폼이 열리면(When), 시스템은 현재 시각(오늘 날짜 기준) 이후의 첫 가용(예약되지 않은) 시간 슬롯을 계산하여 시각적으로 강조하고 그 위치로 스크롤 유도해야 한다.
- **Ubiquitous**: 첫 가용 슬롯의 시각적 강조는 선택을 강제하지 않아야 한다 — 시스템은 사용자가 명시적으로 슬롯을 탭하기 전까지 `selectedTime`을 설정하지 않아야 한다(shall not).
- **State-Driven**: 오늘 날짜에 남은 가용 슬롯이 없는 동안, 시스템은 어떤 슬롯도 강조하지 않아야 한다.

---

## 5. 제외 사항 (Exclusions — What NOT to Build)

본 SPEC은 아래 항목을 **명시적으로 제외**한다. 예약 흐름 로직 이외의 구조·아키텍처 변경은 후속 SPEC 소관이다.

- **홈 IA(정보구조) 재구성 및 달력 중복 제거** → 후속 SPEC-4 소관.
- **react-query·캐싱 계층 도입** → 후속 SPEC-4 소관.
- **레거시 서비스 계층 통합·페이지네이션 상한 조정** → 후속 SPEC-4 소관.
- **데모/로그인 정리** → 별도 보안 트랙 소관.
- **BookingForm 전면 재설계**: 단계 축소는 본 SPEC의 F-9/F-10/F-17/F-11 항목으로 한정하며, 레이아웃·컴포넌트 구조 재설계는 하지 않는다.
- **EditTreatmentModal의 기존 tsc 오류 2건 수정**(`EditTreatmentModal.tsx:123`, `:395`) → 별도 작업. 본 SPEC은 이 기준선 오류를 유지(회귀 0)만 확인한다.
- **백엔드 스키마 확장**: `staff_user_id`/`payment_method`는 이미 `TreatmentCreate` 타입과 백엔드 계약(정본 주석)에 존재하므로, 신규 필드 추가가 아니라 **기존 지원 필드를 payload에 포함**하는 작업이다(계약 변경 아님).
- **시각적/브랜드 재디자인**: 색상·타이포·아이콘 등 시각 요소의 재설계는 하지 않는다(인라인 안내·성공 배너·슬롯 강조는 기존 스타일 토큰 재사용).

---

## 6. 수용 기준 (Acceptance Criteria)

구체적·이진 판정 가능 기준(개발 모드 `ddd` — 변경 전 `handleBooking` payload/흐름 특성 테스트 우선; 호출 횟수·payload는 jest 서비스 모킹으로 측정).

| ID | 기준 | 검증 방법 | REQ |
|----|------|-----------|-----|
| AC-01 | 직원·결제 선택 시 생성 payload에 `staff_user_id`·`payment_method` **포함** | jest 서비스 모킹 — `create` spy `toHaveBeenCalledWith(objectContaining({ staff_user_id, payment_method }))` | REQ-BOOKING-001-01 |
| AC-02 | "담당 직원 없음" 선택 시 payload에 `staff_user_id` **미포함(undefined)** | jest 서비스 모킹 spy | REQ-BOOKING-001-01 |
| AC-03 | 생성 4xx 실패 시 폼 상태 유지 + 오류 안내 렌더 + `onBookingComplete` **미호출** | jest 모킹(reject) 렌더 테스트 | REQ-BOOKING-001-01 |
| AC-04 | 시술 선택 시 가격 필드 `focus()` 호출 **0회** | jest ref/focus spy 또는 `grep`(`InteractionManager`/`focus()` 자동호출 제거) | REQ-BOOKING-001-02 |
| AC-05 | 시술 추가 시 `customPrice === menuDetail.base_price`(기본값 보존) | 단위/렌더 테스트 | REQ-BOOKING-001-02 |
| AC-06 | 고객 미지정 예약 시 `Alert.alert` 호출 **0회** + "고객 미지정으로 저장됩니다" 인라인 안내 렌더 | jest `Alert` spy + render query | REQ-BOOKING-001-03 |
| AC-07 | 성공 시 성공 `Alert` 호출 **0회** + 폼 닫힘 콜백(`onBookingComplete`) **1회** + `notificationAsync(Success)` **1회** | jest 모킹 검증(`Alert`/콜백/haptics spy) | REQ-BOOKING-001-04 |
| AC-08 | `shop-selection` 성공 시 성공 `Alert` **0회** + 자동 네비게이션 실행 | jest 모킹 렌더 테스트 | REQ-BOOKING-001-04 |
| AC-09 | 신규 토스트/스낵바 의존성 **미추가** | `git diff package.json`(신규 UI 라이브러리 0건) | REQ-BOOKING-001-04 |
| AC-10 | 최근 직원 자동 선택 — 저장→복원(목록에 존재 시 기본 선택) | jest `AsyncStorage` 모킹 테스트 | REQ-BOOKING-001-05 |
| AC-11 | 저장된 최근 직원이 목록에 없으면 **미복원**("담당 직원 없음" 유지) | jest `AsyncStorage` 모킹 테스트 | REQ-BOOKING-001-05 |
| AC-12 | 첫 가용 슬롯 강조 존재 + 강조 시점 `selectedTime === null`(탭 전 미선택) | 렌더 테스트 | REQ-BOOKING-001-06 |
| AC-13 | 기존 jest **테스트 39개(7 스위트) 전부 통과** | `npx jest` | 전체 |
| AC-14 | `tsc --noEmit` **신규 오류 0건**(기준선 = `EditTreatmentModal.tsx` 2건 유지, 신규 0) | `npx tsc --noEmit` | 전체 |
| AC-15 | 현재 시각 이후 첫 가용 슬롯 계산이 **순수 함수로 분리**되고 단위 테스트로 검증됨 + 해당 슬롯에 **하이라이트 스타일 적용** | `grep` + 단위 테스트 | REQ-BOOKING-001-06 |

### Definition of Done

- AC-01 ~ AC-15 전부 충족.
- 변경 전(PRESERVE) `handleBooking`의 payload/흐름에 대한 특성 테스트를 먼저 확보한다. 필요 시 제출 로직을 테스트 가능한 순수 함수/훅으로 추출한다(예: `useDashboardLoad`처럼 로직을 훅으로 분리).
- 최종 diff가 예약 흐름 로직(payload 필드·확인 흐름·성공 처리·스마트 기본값)에 한정되며, 시각적 재설계·데이터 계약 확장·EditTreatmentModal 기존 오류 수정이 diff에 없음.
- F-8 백엔드 수용은 Run 단계에서 실서버 대상 통합 검증(실제 생성 1회)으로 확인하고 결과를 기록한다.

---

## 7. 위험 평가 (Risk Assessment)

- **전체 위험도: 중간 (Medium)** — 예약 등록은 60대 주 사용자의 **매일 핵심 경로**이며, F-8은 **데이터 유실 버그**다. 흐름 변경이 회귀를 유발하면 주 사용자가 즉시 차단된다.
- **주의 지점**:
  - REQ-01: 백엔드 `POST /treatments`가 `staff_user_id`/`payment_method`를 수용하는지 **실서버 통합 검증** 필요. `EditTreatmentModal`이 `PUT /treatments/{id}`에서 이미 두 필드를 전송하고(`handleSubmit` `updateData` `staff_user_id:392`, `payment_method:395`) GET 응답에서 되읽으므로(초기화 `payment_method:91`, `staff_user:115`) 수용 가능성이 높으나, CREATE 경로는 별도 검증 대상이다. `staff.ts`의 SECURITY-001(직원 UPDATE 시 role/password 미공급)은 `POST /shops/{id}/users` 연결 엔드포인트에 대한 규칙으로, 예약 CREATE의 `staff_user_id` 전송과 **무관**하다(다른 엔드포인트).
  - REQ-04: `onBookingComplete` 자동 호출로 성공 후 화면 전환·목록/대시보드 갱신 타이밍이 달라질 수 있음 — 기존 갱신 동작을 보존한다.
  - REQ-05: `AsyncStorage` 복원은 **직원 목록 로드 완료 이후**에만 수행되어야 하며(경쟁 조건), 목록에 없는 id는 복원 금지.
  - REQ-02: 자동 포커스 제거 시 `InteractionManager.runAfterInteractions` 내 **상태 추가 로직 자체는 유지**하고 `focus()`만 제거해야 한다(시술 추가 동작 회귀 금지).
- **완화**: `development_mode: ddd`에 따라 각 항목 변경 전 특성 테스트(payload/호출 횟수/흐름)를 먼저 확보하고, §8 순서(버그 우선)로 항목별 커밋·검증한다.

## 8. 구현 순서 (Suggested Implementation Order)

버그(데이터 유실) 우선, 이후 흐름 간소화, 마지막으로 스마트 기본값 순으로 진행하며, 각 단계마다 특성 테스트를 먼저 확보한다.

1. **REQ-BOOKING-001-01 (F-8)** — payload 특성 테스트 확보 후 `staff_user_id`·`payment_method` 포함 (BUG, 최우선)
2. **REQ-BOOKING-001-02 (F-9)** — 시술 선택 시 자동 포커스 제거
3. **REQ-BOOKING-001-03 (F-10)** — 고객 미지정 Alert → 인라인 안내
4. **REQ-BOOKING-001-04 (F-17 + 햅틱)** — 성공 Alert → 자동 닫힘 + 햅틱 (`shop-selection` 동일 패턴 포함)
5. **REQ-BOOKING-001-05 (F-11a)** — 최근 사용 직원 자동 선택 (AsyncStorage)
6. **REQ-BOOKING-001-06 (F-11b)** — 첫 가용 시간 슬롯 시각적 유도

## 9. 추적성 (Traceability)

| REQ | Finding | 우선순위 | 유형 | 로드맵 단계 |
|-----|---------|----------|------|-------------|
| REQ-BOOKING-001-01 | F-8 | P1 | BUG(데이터 유실) | Stage 3 |
| REQ-BOOKING-001-02 | F-9 | P2 | UX | Stage 3 |
| REQ-BOOKING-001-03 | F-10 | P2 | UX | Stage 3 |
| REQ-BOOKING-001-04 | F-17 (+ 햅틱 P3) | P2 | UX | Stage 3 |
| REQ-BOOKING-001-05 | F-11a | P3 | UX | Stage 3 |
| REQ-BOOKING-001-06 | F-11b | P3 | UX | Stage 3 |

진단 근거(감사 결과 재검증·백엔드 계약 근거·특성 테스트 전략): `research.md` 참조.
