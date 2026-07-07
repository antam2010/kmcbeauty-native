# SPEC-UX-001 — 진단 근거 (Research)

> 두 건의 독립 읽기 전용 감사(UX + 성능)에서 file:line 단위로 검증된 결과 요약.
> 주 사용자: 오너의 어머니(60대), 매일 미용실 운영에 앱 사용. 시니어 시인성·접근성·즉효 회복성이 핵심 품질 속성.
> 본 문서는 SPEC-UX-001(4단계 로드맵 중 Stage 1)의 진단 근거이며, 각 항목은 검증된 위치와 현재 상태를 기록한다.

---

## F-2 — 저대비 텍스트 (WCAG AA 미달)

| 위치 | 현재 값 | 문제 | 목표 |
|------|---------|------|------|
| `src/ui/theme.ts:50` | `text.muted: '#9ca3af'` | 흰 배경 대비 ≈ 2.5:1 (AA 4.5:1 미달) | 대비 4.5:1 이상으로 상향 |
| `components/forms/BookingForm.tsx:695` | 플레이스홀더 `#999` | 저대비 | `#6b7280` 이상 |
| `app/(tabs)/profile.tsx:263,275` | 플레이스홀더 `#999` | 저대비 | `#6b7280` 이상 |
| `components/booking/BookingListScreen.tsx:457,509` | 보조 텍스트 `#6b7280` | 시니어 기준 경계 | gray[700](`#374151`, theme.ts:33) 수준으로 강화 |

검증됨: `theme.ts:47-52` 팔레트에서 `muted:'#9ca3af'` 확인. `secondary:'#6b7280'`가 이미 존재하므로 muted를 secondary 이상으로 끌어올리는 방향이 자연스러움.

---

## F-3 — 상태 배지 대비 부족

| 위치 | 현재 | 대비 |
|------|------|------|
| `BookingListScreen.tsx:30-36` | `statusColors`: `NO_SHOW '#feca57'`, `VISITED '#f093fb'`, `RESERVED '#667eea'`, `COMPLETED '#4facfe'`, `CANCELLED '#ff6b6b'` | 밝은 배경 다수 |
| `BookingListScreen.tsx:516-520` | `statusText`: `color:'#ffffff'`, `fontSize:12`, `fontWeight:'600'` | 흰 12pt 텍스트 |

검증됨: 밝은 배경(`#feca57`, `#f093fb`) 위 흰색 텍스트 대비 ≈ 1.4:1로 사실상 판독 불가. 전 상태 배지(5종) 재검증 필요 — 어두운 텍스트 또는 진한 배경으로 4.5:1 확보.

---

## F-4 — 최소 폰트 크기 미달

원칙: 본문 ≥ 16pt, 캡션/라벨 ≥ 14pt (시니어 가독성).

| 위치 | 현재 | 용도 |
|------|------|------|
| `app/(tabs)/index.tsx:581` | `statLabel: 12` | 통계 라벨 |
| `components/forms/BookingForm.styles.ts:191` | `13` | 폼 텍스트 |
| `BookingForm.styles.ts:244` | `10` | 최소치, 판독 곤란 |
| `BookingForm.styles.ts:280` | `13` | 폼 텍스트 |
| `BookingForm.styles.ts:525` | `13` | 폼 텍스트 |
| `BookingListScreen.tsx` (12pt) | `statusFilterText:456`, `statusText:517` 외 | 필터/배지/보조 |
| `ImprovedCalendar` | `bookingCount:10` (weekDayText:14는 캡션 하한 충족, 대상 아님) | 캘린더 라벨 |
| `profile` | `13pt` | 프로필 텍스트 |
| `shop-selection` | `12pt` | 샵 선택 텍스트 |

검증됨: `BookingListScreen.styles`에서 `statusFilterText.fontSize:12`(:456), `statusText.fontSize:12`(:517) 확인.

---

## F-5 — 터치 타깃 44pt 미달

| 위치 | 현재 크기 | 컨트롤 |
|------|-----------|--------|
| `BookingListScreen.tsx:443-449` | `paddingVertical:6` → 높이 ≈ 28px | 상태 필터 칩 |
| `BookingForm.styles.ts:212-223` | ≈ 39px | 시간 슬롯 |
| `BookingForm.styles.ts:357-366` | 30×30 | 회차 ± 버튼 |
| `BookingForm.styles.ts:457-464` | 24×24 | 삭제 ✕ 버튼 |
| `ShopHeader.tsx:84-92` | ≈ 32px | 헤더 컨트롤 |

검증됨: `statusFilterButton`(:443-449) `paddingHorizontal:12/paddingVertical:6` → 44pt 미달. `minHeight:44` 또는 `hitSlop` 필요. iOS HIG / Android Material 권장 최소 44×44pt.

---

## F-1 / F-6 — 접근성 라벨 전무

검증됨: `grep -rn "accessibilityLabel|accessibilityRole" app components src` → **0건**. 앱 전체에 스크린리더 라벨·역할이 하나도 없음.

- 아이콘 전용 버튼 예: `app/(tabs)/index.tsx:247`(월간 달력), `:254`(새로고침), `ImprovedCalendar.tsx:236-252`, `profile.tsx:139`, `BookingForm.tsx:572`.
- 텍스트 라벨 버튼(아이콘 전용 아님, `accessibilityRole` 부여는 별도 검토): `ShopHeader.tsx:50-59` — `TouchableOpacity` 내부에 텍스트('상점 선택'/'로딩...')와 `▼` 표시가 있어 스크린리더가 라벨을 읽을 수 있음.
- 조치 방향: `src/ui/atoms/BaseButton.tsx`에 accessibility props 표준화 → 아이콘 전용 버튼 전수 라벨링. 핵심 액션(홈 새로고침 등)은 한국어 텍스트 라벨 병기 검토.

---

## F-15 — 홈 오류 막다른 화면

검증됨: `app/(tabs)/index.tsx:202-210`.

```
if (!dashboardData) {
  return (
    <View ...><View style={styles.errorContainer}>
      <Text style={styles.errorText}>데이터를 불러올 수 없습니다</Text>
    </View></View>
  );
}
```

문제: "데이터를 불러올 수 없습니다" 텍스트만 있고 재시도 수단이 없는 막다른 화면. 시니어 사용자는 앱을 종료·재실행할 수밖에 없음. 기존 `onHeaderRefresh`(:251)를 재사용해 큰 "다시 시도" 버튼 추가 가능.

---

## F-16 — 조용한 실패(무음)

검증됨:

- `components/forms/BookingForm.tsx:245-254` `loadStaffUsers`: 실패 시 `console.error` + `console.warn`만 실행, UI 무변화. 사용자는 직원 목록이 왜 비었는지 알 수 없음.
- `app/(tabs)/index.tsx:45-60` `loadWeeklyTreatments`: 실패 시 인증 에러만 재throw, 그 외는 catch 후 무음(주석 "그 외 에러는 여기서 처리 — UI 상태만 업데이트"이나 실제 안내 없음).

조치 방향: 인라인 안내 + 재시도 수단 노출.

---

## Perf F-9 — 프로덕션 로그 미게이팅

검증됨: `src/api/client.ts`에 `console.log` 59건 존재(`console.*` 전체는 84건). 요청/응답 상세 로그(`:250`/`:279`/`:288`)는 이미 `if (__DEV__)` 가드(각각 `:249`/`:278`/`:287`) 내부에 있어 게이팅됨. 그러나 토큰 조회 경로(`:33`/`:48`/`:227`)와 상점 미선택 분기(`:307~`)는 미게이팅.

| 위치 | 상태 |
|------|------|
| `src/api/client.ts:33` | `console.log('🔑 Zustand 스토어 토큰 사용')` — 토큰 조회 시마다, 미게이팅 |
| `src/api/client.ts:48` | `console.warn('⚠️ 사용 가능한 토큰이 없음')` — 미게이팅 |
| `src/api/client.ts:227` | `console.warn('⚠️ 사용 가능한 토큰이 없음')` — 요청 인터셉터 `else` 분기(`:226`), 미게이팅 |
| `src/api/client.ts:250,279,288` | `🚀 API 요청 상세`/`✅ API 응답`/`❌ API 에러 상세` — **이미 `if (__DEV__)` 게이팅됨(가드 `:249`/`:278`/`:287`), 조치 불필요** |
| `src/api/client.ts:307~309` | 상점 미선택(`SHOP_NOT_SELECTED`) 분기 로그 — 미게이팅(요청마다가 아닌 해당 에러 발생 시에만 실행) |
| `BookingListScreen.tsx:136,157,172,231,240` | 목록/스토어 로드 로그 |

조치 방향: 요청 경로 진단 로그를 `if (__DEV__)`로 게이팅. 이미 `client.ts`에 `__DEV__` 패턴이 6회 사용되고 있어 일관 적용 가능.

---

## 진단 요약

8개 항목 모두 스타일 토큰·컴포넌트 props·소규모 가드 수준에서 해결 가능하며, 데이터 흐름·API 계약·화면 전환 로직 변경을 요구하지 않는다. 따라서 4단계 로드맵 중 **최저 위험·최고 체감 가치인 Stage 1**으로 분리한다. 후속 단계(FlatList/메모이제이션, 예약 흐름 버그, react-query·IA 재구성)는 별도 SPEC에서 다룬다.
