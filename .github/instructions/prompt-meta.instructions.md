---
applyTo: "**"
---

# 🤖 AI Output Policy

## AI는 반드시 다음을 수행

- 코드 = TypeScript + Expo Router v3 기준
- 파일 경로/폴더 구조를 명시
- 설명 + 예제 + Best Practices 포함
- 기존 구조를 존중하며 필요한 경우 개선 제안
- 도메인별 instructions 파일 참조 (`.github/instructions/<domain>.instructions.md`)

## 금지

- 컴포넌트 내부에서 axios 호출 ❌
- useEffect를 통한 직접 API 패칭 ❌
- 구조 밖 임시 폴더 생성 ❌
- 별도 문서 파일 생성 ❌ (instructions 파일로 통합)

## 출력 형식 권장

- 코드 블록에 파일 경로 주석 포함
- 가능한 작은 단위로 PR 분할 제안

## 도메인별 Instructions 위치

각 도메인의 규칙은 `.github/instructions/<domain>.instructions.md`에 정의:
- `auth.instructions.md` - 인증 도메인
- `booking.instructions.md` - 예약 도메인 (예정)
- `shop.instructions.md` - 상점 도메인 (예정)
- `management.instructions.md` - 운영 관리 도메인 (예정)
