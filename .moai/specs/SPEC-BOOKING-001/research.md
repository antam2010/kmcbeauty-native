# SPEC-BOOKING-001 — Research (재검증 근거)

본 문서는 SPEC-BOOKING-001의 요구사항을 뒷받침하는 코드 근거를 **현재 HEAD 기준으로 재검증**한 결과다. 감사가 인용한 라인은 선행 단계(SPEC-UX-001·PERF-001·PERF-003·REFACTOR-001) 반영으로 이동했으므로, 아래 값은 직접 재확인한 것이다.

- 정본 경로: `components/forms/BookingForm.tsx` (감사가 언급한 `components/booking/`가 아님 — `components/booking/`에는 `BookingListScreen.tsx`만 존재).
- 검증 대상 커밋 기준: `feature/refactor-hardening-2026-07` HEAD.
- 개발 방법론: **DDD**(ANALYZE → PRESERVE(특성 테스트) → IMPROVE).

---

## 1. 재검증된 file:line (감사 라인 → 현재 라인)

| Finding | 항목 | 감사 인용(변경 전) | 현재 HEAD 재검증 |
|---------|------|--------------------|------------------|
| F-8 | `handleBooking` payload 누락 | `:478-484` | `components/forms/BookingForm.tsx` `handleBooking` **409**, `treatmentData` 객체 **482-488**, `create` 호출 **519** |
| F-8 | 직원 상태·UI | — | `selectedStaff` state **61**, 직원 로드 **247-258**, 직원 선택 UI **981-1042**(`setSelectedStaff` **1006/1023**) |
| F-8 | 결제 상태·UI | — | `paymentMethod` state **63**, 결제 UI **1044-1070**(`setPaymentMethod` **1059**) |
| F-8 | 타입 지원 | `treatment.ts:85-86` | `TreatmentCreate.payment_method` **85**, `.staff_user_id` **86**(블록 79-88) |
| F-9 | 자동 포커스 | `:276-291` | `addTreatment` **264-296**, `InteractionManager.runAfterInteractions` **280**, `setTimeout` **286**, `focus()` **288** |
| F-9 | 기본값 보존 | — | `customPrice: menuDetail.base_price` **275** |
| F-10 | 확인 Alert | `:437-464` | Promise+Alert 확인 **441-468**(`new Promise<boolean>` **442**, `Alert.alert('고객 미지정', …)` **443-457**) |
| F-17 | 성공 Alert | `:517` | 성공 `Alert.alert('완료', …, [{text:'확인', onPress:onBookingComplete}])` **521-523** |
| F-17 | shop-selection | `:72-88` | `app/shop-selection.tsx` `handleSelectShop` **65**, 인위적 500ms 지연 **71**, 성공 `Alert` **73-89** |
| F-11a | 최근 직원 | — | `selectedStaff` 초기 `null` **61**; AsyncStorage 최근직원 키 **부재**(신규) |
| F-11b | 시간 슬롯 | — | `timeSlots`(고정 배열) **79-84**, `selectedTime` 초기 `null` **59**, `isTimeReserved` **260-262**, 시간 그리드 **872-902** |

### F-8 핵심 증거 — payload에서 두 필드가 빠진 현재 코드

`components/forms/BookingForm.tsx:482-488`:

```ts
const treatmentData: TreatmentCreate = {
  phonebook_id: customerToUse.id,
  reserved_at: reservedAt,
  memo: memo.trim() || undefined,
  status: 'RESERVED',
  treatment_items: treatmentItems,
  // ❌ staff_user_id 없음 — 화면에서 고른 selectedStaff(61) 유실
  // ❌ payment_method 없음 — 화면에서 고른 paymentMethod(63) 유실
};
```

UI는 `selectedStaff`(`setSelectedStaff` 981-1042)와 `paymentMethod`(`setPaymentMethod` 1044-1070) 로컬 상태를 갱신하지만, 위 payload에 반영되지 않아 **전송 시점에 폐기**된다. 수정: `staff_user_id: selectedStaff?.user_id`(미선택 시 undefined), `payment_method: paymentMethod` 추가.

---

## 2. F-8 백엔드 계약 근거 (필수 사전조사)

**결론: `staff_user_id`·`payment_method`는 신규 필드가 아니라 이미 지원되는 계약 필드다. payload에 포함시키는 것은 계약 변경이 아니다.** 다만 CREATE 경로의 실제 수용은 Run 단계 통합 검증 대상.

### 2.1 타입 계약 (`src/types/treatment.ts`)

- `TreatmentCreate`(79-88): `payment_method?: 'CARD' | 'CASH' | 'UNPAID'`(85), `staff_user_id?: number`(86) — 둘 다 이미 선언됨.
- `TreatmentUpdate`(100-111): `payment_method`(108), `staff_user_id?: number | null`(109).
- 정본 주석: `Treatment` 인터페이스(17)는 "백엔드 정본: app/schemas/treatment.py TreatmentResponse (TreatmentBase → TreatmentInDBBase → TreatmentResponse)"; `TreatmentUpdate`(97)는 "백엔드 정본: app/schemas/treatment.py TreatmentUpdate(TreatmentBase)". 즉 Create/Update가 **동일한 `TreatmentBase` 필드 집합**을 공유하며, `TreatmentResponse`는 `staff_user_id`(31)·`payment_method`(30)·`staff_user`(49-54)를 반환한다.

### 2.2 강한 증거 — EditTreatmentModal이 이미 두 필드를 write/read 한다

`components/modals/EditTreatmentModal.tsx`:

- **write**: `handleSubmit`(331)의 `updateData: TreatmentUpdate`(389-397)가 `staff_user_id: selectedStaff?.user_id || null`(392)와 `payment_method: paymentMethod`(395)를 포함하고, `treatmentApiService.update(treatment.id, updateData)`(400)로 `PUT /treatments/{id}` 전송.
- **read(round-trip)**: `initializeData`가 GET 응답에서 `treatment.payment_method`(91), `treatment.staff_user`(115) / `treatment.staff_user_id`(118)를 되읽어 상태를 초기화.

→ 백엔드가 treatment write 경로에서 두 필드를 **저장·반환·수정 수용**함을 강하게 시사한다. `create`와 `update`는 `TreatmentBase`를 공유하므로 CREATE도 수용할 개연성이 높다.

### 2.3 서비스 계층 (`src/api/services/treatment.ts`)

- `create`(18-21): `this.post<TreatmentSimpleResponse>('', data)` — `data`를 그대로 `POST /treatments` 본문으로 전송(필드 화이트리스트/필터 없음). 따라서 payload에 필드를 추가하면 서버로 전달된다.
- `update`(23-26): `this.put<TreatmentSimpleResponse>('/${id}', data)`.

### 2.4 SECURITY-001은 무관함 (다른 엔드포인트)

`src/api/services/staff.ts:41`의 SECURITY-001은 **`POST /shops/{shop_id}/users`(직원 연결)** 및 **`PUT /shops/{shop_id}/users/{user_id}`(주소유자 지정)** 엔드포인트에서 클라이언트가 `role`/`password`를 공급하지 않는다는 규칙이다(`StaffUserCreate` 42-45, `StaffUserUpdate` 49-51). 예약 CREATE(`POST /treatments`)에 `staff_user_id`(=이미 존재하는 사용자 참조 FK)를 보내는 것과는 **엔드포인트·의미가 모두 다르며 충돌하지 않는다**.

### 2.5 통합 검증 플래그 (REQ-01 Unwanted)

정적 근거는 강하지만 CREATE의 실서버 수용은 정적으로 단정할 수 없다. 따라서:

- Run 단계에서 실서버 생성 1회로 두 필드 저장을 확인(예약 생성 후 GET에서 `staff_user`·`payment_method` 반영 확인).
- 만약 CREATE가 두 필드로 4xx를 반환하면, 폼 상태를 유지하고 명확한 오류를 표시(데이터 유실 금지). 현재 `handleBooking`은 실패 시 `Alert('오류', …)`만 표시하고 상태를 초기화하지 않으므로(525-530, `onBookingComplete`는 성공 경로에서만 호출) 이 불변식은 유지 가능.

### 2.6 타입 안전성 메모

- BookingForm의 `paymentMethod` state(63)는 **좁은 유니온** `'CARD' | 'CASH' | 'UNPAID'`이고 `selectedStaff?.user_id`는 `number | undefined`이므로, 두 필드를 `TreatmentCreate`에 추가해도 **신규 tsc 오류가 발생하지 않는다**.
- 참고: `EditTreatmentModal`의 기존 tsc 오류 2건은 `Treatment['payment_method']`가 `string`으로 넓혀진 타입을 사용하기 때문(`:395`)이며, BookingForm에는 해당하지 않는다(§4 baseline 참조).

---

## 3. F-9 / F-10 / F-17 / F-11 근거

- **F-9**: `addTreatment`(264-296)는 시술 추가 후 `InteractionManager.runAfterInteractions`(280) 안에서 `setTimeout(…300ms)`(286) 후 `treatmentPriceInputRefs.current[newIndex]?.focus()`(288)로 키보드를 강제로 연다. 사용자가 시술만 고르려 할 때 키보드가 튀어 시니어 사용성을 해친다. → `focus()` 자동 호출만 제거하고, 상태 추가 로직(281-293)과 `base_price` 기본값(275)은 유지.
- **F-10**: `handleBooking`(409)에서 고객 미선택 시 `new Promise<boolean>`(442) + `Alert.alert('고객 미지정', …, [취소/계속 진행])`(443-457)로 흐름을 차단한다. 이미 폼에는 정적 안내 문구("고객을 선택하지 않으면 '고객 미지정'으로 예약됩니다", 659-661)가 있으므로, 차단 Alert을 제거하고 미선택 시 비차단 인라인 안내로 대체하면 한 번의 탭으로 진행 가능.
- **F-17**: 성공 `Alert`(521-523)은 `onBookingComplete`를 "확인" `onPress`에 걸어 **추가 탭 1회를 강제**한다. → 성공 시 즉시 `onBookingComplete` 호출(자동 닫힘) + 경량 성공 안내 + 햅틱. `app/shop-selection.tsx`의 성공 `Alert`(73-89)도 동일 패턴(추가 확인 탭 강제 + 71행 인위적 500ms 지연). 동일하게 자동 네비게이션으로 전환.
- **F-11a**: 최근 직원 자동 선택을 위한 AsyncStorage 키는 현재 없음(신규 추가). `@react-native-async-storage/async-storage@2.2.0`이 설치되어 있고 다수 파일에서 사용 중(`authStore.ts`, `shopStore.ts`, `contactSync.ts`, `userDataService.ts` 등). `ShopUser`(= `staff.ts`의 `ShopUserResponse` 재노출, `src/api/services/shop.ts:6`)의 `user_id`를 저장/복원 키로 사용. 복원 시 로드된 `staffUsers`에 존재하는지 확인 후에만 선택.
- **F-11b**: `timeSlots`(79-84)는 고정 30분 간격 배열, `selectedTime` 초기 `null`(59). "현재 시각 이후 첫 가용 슬롯" = 오늘 날짜에서 `time > now && !isTimeReserved(time)`인 첫 슬롯. 시각적 강조·스크롤 유도만 수행하고 `selectedTime`은 사용자 탭 전까지 미설정(선택 강제 금지).

---

## 4. 테스트 하네스 및 특성 테스트 전략

### 4.1 기존 하네스 (재확인)

- `jest.config.js`: `preset: 'jest-expo'`, `moduleNameMapper` `^@/(.*)$ → <rootDir>/$1`, `testMatch` `__tests__/**/*.test.{ts,tsx}`.
- `jest.setup.js`: `@react-native-async-storage/async-storage`를 공식 jest 목으로 모킹 → **AC-10/AC-11의 AsyncStorage 테스트가 즉시 가능**.
- 현재 스위트 7개 / 테스트 39개(green): `BaseButton`, `api-client`, `contrast`, `perf003-format`, `store-selector`, `theme`, `useDashboardLoad`(+ 스냅샷 1). → AC-13 기준선.
- 서비스 모킹 + payload 검증 패턴 선례: `__tests__/useDashboardLoad.test.tsx`가 `jest.mock('@/src/api/services/treatment', …)` 후 `toHaveBeenCalledTimes`/구현 주입으로 호출을 검증. **F-8은 여기에 `create` spy의 `toHaveBeenCalledWith(objectContaining({ staff_user_id, payment_method }))`를 추가하는 방식**으로 검증.

### 4.2 tsc 기준선 (재확인)

`npx tsc --noEmit` 결과 **정확히 2건**, 모두 `components/modals/EditTreatmentModal.tsx`:
- `(123,11) TS2322`: `string | undefined` → `string` 미할당(staff_user 초기화).
- `(395,9) TS2322`: `string | undefined` → `'CARD'|'CASH'|'UNPAID'|undefined` 미할당(payment_method 위드닝).

두 오류는 **본 SPEC 제외 사항**이며 AC-14는 이 2건 유지 + 신규 0을 요구한다.

### 4.3 PRESERVE(특성 테스트) 권고

- `handleBooking`은 UI 컴포넌트 내부 클로저라 직접 호출이 어렵다. `useDashboardLoad` 선례처럼 **제출/payload 조립 로직을 테스트 가능한 순수 함수 또는 훅으로 추출**(예: `buildTreatmentCreate(state)` 또는 `useBookingSubmit`)한 뒤:
  - payload 조립: `staff_user_id`/`payment_method` 포함·미포함 분기(AC-01/02).
  - 성공/실패 흐름: `create` resolve → `onBookingComplete`·`notificationAsync` 1회 / reject → 상태 유지·`onBookingComplete` 미호출(AC-03/07).
- F-9/F-10/F-06(슬롯)은 렌더 테스트(`@testing-library/react-native`) + `Alert`/`focus`/haptics spy로 호출 횟수 이진 판정.

---

## 5. 요약 (Run 단계 인계)

1. **F-8이 최우선(데이터 유실 버그)**: payload 특성 테스트 확보 → `staff_user_id`/`payment_method` 2필드 추가. 타입 안전(신규 tsc 오류 없음). 백엔드 CREATE 수용은 통합 검증 1회로 확정; 4xx 시 폼 상태 유지 불변식.
2. 흐름 간소화(F-9 자동 포커스 / F-10 확인 Alert / F-17 성공 Alert)는 모두 **호출 횟수 0/1 이진 판정** 가능.
3. 스마트 기본값(F-11a AsyncStorage / F-11b 슬롯 강조)은 기존 목 인프라로 테스트 가능하며, 둘 다 **선택 강제 없이 유도만** 한다.
4. 전 항목 공통 게이트: 기존 39테스트(7 스위트) 통과 + tsc 회귀 0(기준선 2건 유지).
