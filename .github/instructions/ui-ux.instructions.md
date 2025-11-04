---
applyTo: "**/*.tsx"
---

# 🎨 UI / UX Rules

## 기본

- `Screen` 레이아웃 wrapper 사용 (SafeArea, padding, background 일관화)
- FlashList 우선 사용 (대규모 리스트)
- Skeleton → Content → Error 패턴 권장
- 접근성 고려(터치 타겟, 폰트 크기, 대비)

## 디자인 시스템 레이어

| Layer | 예시 |
|---|---|
elements | Text, Button, Input |
layout | Screen, SafeArea |
feedback | Toast, Spinner |
form | Form, FormField (react-hook-form 연계) |

## 애니메이션

- Reanimated/Moti는 필요한 경우만
- 과도한 LayoutAnimation 지양, 성능 우선
