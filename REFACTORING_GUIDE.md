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
