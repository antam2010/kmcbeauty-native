---
mode: agent
---
https://api-kmc2.daeho3.shop/openapi.json 에서 API 를 사용합니다.
.env 에 있는 주소를 api 주소로 사용합니다.
뷰티앱 어플 입니다.
관리자가 직원을 관리할 수 있고 화장, 눈썹, 두피등 뷰티 관련 서비스를 예약할 수 있습니다.

## 프로젝트 구조

- **홈 탭**: 대시보드 - 오늘의 예약 현황, 통계, 인기 서비스 등
- **예약 탭**: 서비스 예약 - 서비스 선택, 날짜/시간 선택, 예약 생성
- **관리 탭**: 직원 관리 - 직원 목록, 추가/수정/상태 변경
- **프로필 탭**: 사용자 프로필 - 개인정보, 예약 내역, 설정

## 기술 스택

- React Native + Expo
- TypeScript
- Axios (API 통신)
- File-based routing (Expo Router)


타입스크립트 인터페이스는 따로 types 에서 관리합니다.