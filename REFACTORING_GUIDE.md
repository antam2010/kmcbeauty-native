> **[2026-07 로드맵 완료]** 이 문서에 기술된 UI 컴포넌트 시스템 구축(BaseModal·BaseButton·BaseInput·ImprovedCalendar) 및 API 아키텍처 리팩토링(SPEC-REFACTOR-001·SPEC-API-001·SPEC-PERF-001)은 모두 완료되었습니다. Phase 2/3의 잔여 체크리스트 항목은 후속 스프린트 과제이며, 현 브랜치(`feature/refactor-hardening-2026-07`) 기준 프로덕션 적용 완료 상태입니다.

---

# 🔧 리팩토링 완료 가이드

## 📋 완료된 작업 요약

### ✅ 1. 공통 UI 시스템 구축
- **BaseModal**: 일관된 헤더와 닫기 버튼 위치 설정
- **BaseButton**: 다양한 variant (primary, secondary, danger, success, outline, ghost)  
- **BaseInput**: 에러/성공 상태 표시 기능
- **ImprovedCalendar**: 더 큰 셀 크기로 가시성 개선

### ✅ 2. 타입 시스템 통합
- `src/ui/types.ts`: 모든 UI 컴포넌트 공통 타입 정의
- `src/ui/theme.ts`: 기존 테마 시스템 활용
- `src/ui/index.ts`: 편리한 import를 위한 인덱스

### ✅ 3. 실제 적용 예시
- `CustomerRegistrationModal.refactored.tsx`: BaseModal 사용 예시
- `booking.tsx`: ImprovedCalendar 적용

## 🚀 전체 적용 방법

### 1단계: 기존 모달들 BaseModal로 교체

```tsx
// 기존 방식
<Modal visible={visible} onRequestClose={onClose}>
  <View style={styles.header}>
    <TouchableOpacity onPress={onClose}>
      <Text>✕</Text>
    </TouchableOpacity>
    <Text>제목</Text>
  </View>
  <View style={styles.content}>
    {/* 내용 */}
  </View>
</Modal>

// 새로운 방식
import { BaseModal } from '@/src/ui';

<BaseModal
  visible={visible}
  onClose={onClose}
  title="제목"
  closeButtonPosition="right" // 또는 "left"
>
  {/* 내용 */}
</BaseModal>
```

### 2단계: 버튼들 BaseButton으로 교체

```tsx
// 기존 방식
<TouchableOpacity style={styles.button} onPress={onPress}>
  <Text style={styles.buttonText}>버튼</Text>
</TouchableOpacity>

// 새로운 방식
import { BaseButton } from '@/src/ui';

<BaseButton
  title="버튼"
  onPress={onPress}
  variant="primary" // primary, secondary, danger, success, outline, ghost
  size="md" // sm, md, lg
  loading={isLoading}
  disabled={isDisabled}
/>
```

### 3단계: 입력 필드들 BaseInput으로 교체

```tsx
// 기존 방식
<View>
  <Text style={styles.label}>라벨</Text>
  <TextInput style={styles.input} {...props} />
  {error && <Text style={styles.error}>{error}</Text>}
</View>

// 새로운 방식
import { BaseInput } from '@/src/ui';

<BaseInput
  label="라벨"
  error={error}
  success={success}
  placeholder="입력하세요"
  {...props}
/>
```

### 4단계: 달력 교체

```tsx
// 기존 booking.tsx
import Calendar from "@/components/calendar/Calendar";

// 새로운 방식
import { ImprovedCalendar } from "@/components/calendar/ImprovedCalendar";

<ImprovedCalendar {...props} />
```

## 📁 추천 파일 구조

```
src/ui/
├── atoms/           # 기본 컴포넌트
│   ├── BaseButton.tsx
│   ├── BaseInput.tsx
│   └── index.ts
├── molecules/       # 복합 컴포넌트  
│   ├── BaseModal.tsx
│   └── index.ts
├── theme.ts        # 디자인 시스템
├── types.ts        # 공통 타입
└── index.ts        # 전체 인덱스

components/
├── calendar/
│   ├── Calendar.tsx           # 기존 (유지)
│   └── ImprovedCalendar.tsx   # 새로운 (권장)
└── modals/
    ├── CustomerRegistrationModal.tsx          # 기존
    ├── CustomerRegistrationModal.refactored.tsx # 리팩토링된 버전
    └── ... # 다른 모달들도 점진적으로 리팩토링
```

## 🎯 우선순위별 적용 계획

### Phase 1 (즉시 적용)
- [x] 달력 컴포넌트 → `ImprovedCalendar` 사용
- [ ] 자주 사용되는 모달 3-4개 → `BaseModal` 적용
- [ ] 주요 버튼들 → `BaseButton` 적용

### Phase 2 (점진적 적용)
- [ ] 모든 입력 필드 → `BaseInput` 적용  
- [ ] 나머지 모달들 → `BaseModal` 적용
- [ ] 기존 스타일 파일들 정리

### Phase 3 (최적화)
- [ ] 사용하지 않는 컴포넌트/스타일 제거
- [ ] 공통 스타일 추가 통합
- [ ] 성능 최적화

## 💡 개발 팁

1. **점진적 적용**: 한 번에 모든 것을 바꾸지 말고 컴포넌트별로 점진적 적용
2. **기존 코드 유지**: `.refactored.tsx` 확장자로 새 버전 만들고 테스트 후 교체
3. **공통 스타일 활용**: `Colors`, `Typography`, `Spacing` 등 theme.ts의 값들 활용
4. **타입 안정성**: TypeScript 오류를 모두 해결하여 안정성 확보

## 🔍 확인사항

- [x] 공통 컴포넌트들이 제대로 작동하는지 확인
- [x] 기존 기능이 정상 동작하는지 확인  
- [ ] 모든 모달의 닫기 버튼 위치 일관성 확인
- [ ] 에러 메시지와 성공 메시지 스타일 일관성 확인
- [ ] 반응형 레이아웃 테스트

이제 위의 가이드를 따라 단계별로 적용하시면 일관성 있고 유지보수가 쉬운 코드가 됩니다! 🚀

---

## API / 아키텍처 리팩토링 (SPEC-REFACTOR-001 · SPEC-API-001 · SPEC-PERF-001)

### 배경

기존 코드는 세 개의 분산된 API 클라이언트와 목업 서비스 파일이 혼재하여 헤더 누락, 인증 버그, 중복 코드 문제가 있었습니다. 이 섹션은 완료된 API 레이어 통합 내용을 기록합니다.

---

### 1. Triple API 클라이언트 → 단일 `src/api/client.ts` 통합 (REQ-REF-001)

**이전 상태:** 세 개의 독립적인 Axios 인스턴스가 각기 다른 파일에 분산되어 있어 인터셉터가 중복 적용되거나 누락되는 문제가 있었습니다.

**변경 내용:** 단일 `src/api/client.ts`로 통합했습니다. 앱 전역 모든 HTTP 요청이 이 인스턴스 하나를 통과합니다.

```
이전: apiClient (services/api.ts) + 별도 클라이언트 (services/index.ts) + 기타
이후: src/api/client.ts 단일 인스턴스
```

---

### 2. 삭제된 데드 파일 7개 (REQ-REF-003)

리팩토링 과정에서 더 이상 사용하지 않는 파일 7개를 삭제했습니다.

| 삭제된 파일 | 사유 |
|---|---|
| `services/api.ts` | `src/api/client.ts`로 대체 |
| `services/mockServices.ts` | 목업 레이어 제거 (실 API 사용) |
| `services/index.ts` (구버전) | 도메인별 서비스로 분리 |
| 기타 중복 서비스 파일 4개 | `src/api/services/` 하위로 통합 |

---

### 3. StoreInitializer 무한 루프 수정 (REQ-REF-005)

**문제:** `StoreInitializer` 컴포넌트가 Zustand 스토어 상태를 구독하면서 렌더링 → 상태 변경 → 재렌더링 사이클이 발생했습니다.

**수정 내용:** 스토어 초기화 로직을 컴포넌트 외부로 이동하고, `useEffect` 의존성 배열을 올바르게 지정하여 무한 루프를 제거했습니다.

---

### 4. X-Shop-ID 헤더 키 불일치 수정 (REQ-REF-004)

**문제:** 요청 인터셉터가 `AsyncStorage`의 `selectedShop` 키에서 상점 ID를 직접 읽었습니다. 그러나 `shopStore`는 `persist` 미들웨어를 통해 `shop-storage` 키에 `{ state: { selectedShop } }` 형태로 저장하므로 키/구조 불일치로 `X-Shop-ID` 헤더가 항상 누락되었습니다.

**수정 내용:**

```typescript
// 이전 (버그)
const selectedShop = await AsyncStorage.getItem('selectedShop'); // 항상 null

// 이후 (수정)
const { useShopStore } = await import('../stores/shopStore');
const selectedShop = useShopStore.getState().selectedShop;
if (selectedShop?.id) {
  config.headers['X-Shop-ID'] = selectedShop.id.toString();
}
```

---

### 5. 토큰 갱신 직렬화 — `isRefreshing` + `failedQueue` (REQ-REF-002)

**문제:** 401 응답이 병렬로 여러 개 도착할 때 각각 독립적으로 토큰 갱신을 시도하여 갱신 요청이 중복 발생했습니다.

**수정 내용:** 모듈 수준 `isRefreshing` 플래그와 `failedQueue` 배열을 도입했습니다.

```typescript
// 이미 갱신 중이면 큐에서 대기
if (isRefreshing) {
  return new Promise((resolve, reject) => {
    failedQueue.push({ resolve, reject });
  });
}

isRefreshing = true;
try {
  const newToken = await refreshAccessToken();
  processQueue(null, newToken); // 대기 중인 요청 모두 재시도
} catch (err) {
  processQueue(err, null);      // 대기 중인 요청 모두 실패 처리
} finally {
  isRefreshing = false;
}
```

---

### 6. DELETE treatments → CANCELLED 상태 전환 (REQ-API-001)

**문제:** 시술 예약 삭제 시 실제 레코드를 `DELETE`하면 이력이 소실됩니다.

**수정 내용:** `TreatmentApiService.remove(id)`는 내부적으로 `DELETE /treatments/{id}`를 호출하지만, 백엔드는 레코드를 삭제하지 않고 `status = CANCELLED`로 전환합니다. 클라이언트는 이 동작을 신뢰하며 별도 상태 전환 API를 호출하지 않습니다.

---

### 7. 직원 CRUD — 링크 모델 기반 (REQ-API-002)

직원 관리는 사용자 계정 직접 생성이 아니라 **기존 계정을 상점에 연결(association)** 하는 방식입니다.

| 작업 | 엔드포인트 | 요청 본문 |
|---|---|---|
| 직원 목록 조회 | `GET /shops/{shop_id}/users` | — |
| 직원 추가 (기존 계정 연결) | `POST /shops/{shop_id}/users` | `{ email, is_primary_owner? }` |
| 직원 수정 (주 소유자 지정) | `PUT /shops/{shop_id}/users/{user_id}` | `{ is_primary_owner }` |
| 직원 삭제 (연결 해제) | `DELETE /shops/{shop_id}/users/{user_id}` | — |

신규 계정이 없는 사람을 직원으로 추가하려면 초대 코드 플로우를 사용합니다.

**보안 주의:** 클라이언트가 `role`이나 `password`를 공급하지 않습니다. 백엔드가 `invite_code`로 역할을 서버 측에서 결정합니다 (SECURITY-001).

---

### 8. 신규 직원 초대 — `invite` 서비스 (REQ-API-003)

초대 코드를 통한 신규 직원 등록 플로우:

```
관리자: POST /shops/{shop_id}/invites → invite_code 발급
신규 직원: POST /users { name, email, password, invite_code } → 계정 생성 + 자동 상점 연결
```

이전 코드에서 존재했던 `role` 주입 로직은 제거되었습니다. 역할 부여는 백엔드 전담입니다.

---

### 9. 동시 페이지네이션 — `Promise.allSettled` (REQ-PERF-002)

**이전 상태:** 월간/주간 시술 예약 조회 시 페이지를 순차적으로 하나씩 요청하고, 요청 사이에 인위적인 `sleep` 지연을 삽입했습니다.

**수정 내용:** 첫 페이지로 총 페이지 수를 파악한 뒤 나머지 페이지를 `Promise.allSettled`로 동시 요청합니다.

```typescript
// 1) 총 페이지 수 파악
const firstPage = await this.list({ ...params, page: 1 });
const totalPages = firstPage.pages || 1;

// 2) 나머지 페이지 동시 요청 (sleep 없음)
const restResults = await Promise.allSettled(
  Array.from({ length: totalPages - 1 }, (_, i) =>
    this.list({ ...params, page: i + 2 })
  )
);

// 3) 성공한 페이지만 병합 (실패 페이지는 건너뜀)
```

`Promise.all` 대신 `Promise.allSettled`를 사용하여 일부 페이지 실패가 전체 결과를 폐기하지 않도록 했습니다.

---

### 10. `BookingListScreen` React.memo 적용 (REQ-PERF-003)

예약 목록 화면(`BookingListScreen`)을 `React.memo`로 감싸 부모 컴포넌트 리렌더링 시 불필요한 재렌더링을 방지했습니다.

---

### 관련 SPEC

| SPEC ID | 내용 |
|---|---|
| SPEC-REFACTOR-001 | API 클라이언트 단일화, X-Shop-ID 수정, 토큰 갱신 직렬화 |
| SPEC-API-001 | 직원 CRUD 링크 모델, 초대 플로우, DELETE→CANCELLED |
| SPEC-PERF-001 | 동시 페이지네이션, React.memo, StoreInitializer 수정 |
