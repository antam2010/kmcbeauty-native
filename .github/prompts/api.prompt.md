---
mode: agent
---

# KMC Beauty Native App Development Guide

## 🎯 프로젝트 개요
뷰티 관리 시스템 모바일 앱 (React Native + Expo)
- API 서버: https://api-kmc2.daeho3.shop/openapi.json
- 환경변수(.env)의 EXPO_PUBLIC_API_BASE_URL 사용
- 관리자/직원이 예약, 고객, 서비스를 관리하는 B2B 앱

## 🏗️ 현재 프로젝트 구조

```
kmcbeauty-native/
├─ app/                                   # Expo Router: 화면·네비게이션
│  ├─ _layout.tsx                         # 전역 Provider 설정
│  ├─ index.tsx                           # 앱 진입점
│  ├─ login.tsx                           # 로그인 화면
│  ├─ shop-selection.tsx                  # 상점 선택 화면
│  ├─ monthly-dashboard.tsx              # 월별 대시보드
│  ├─ +not-found.tsx                     # 404 페이지
│  └─ (tabs)/                            # 메인 탭 네비게이션
│     ├─ _layout.tsx                     # 탭 레이아웃
│     ├─ index.tsx                       # 홈 (대시보드)
│     ├─ booking.tsx                     # 예약 관리
│     ├─ management.tsx                  # 관리 (직원, 전화번호부, 메뉴)
│     └─ profile.tsx                     # 프로필
│
├─ src/                                  # 핵심 소스코드
│  ├─ stores/                           # Zustand 상태 관리
│  │  ├─ authStore.ts                   # 인증 상태 (로그인, 사용자 정보)
│  │  └─ shopStore.ts                   # 상점 선택 및 관리
│  │
│  ├─ api/                              # API 레이어
│  │  ├─ client.ts                      # axios 인스턴스 + 인터셉터
│  │  ├─ services/                      # API 서비스들
│  │  │  ├─ auth.ts                     # 인증 API
│  │  │  ├─ booking.ts                  # 예약 API
│  │  │  ├─ dashboard.ts                # 대시보드 API
│  │  │  ├─ phonebook.ts                # 전화번호부 API
│  │  │  └─ shop.ts                     # 상점 API
│  │  └─ index.ts
│  │
│  ├─ features/                         # 도메인별 기능 모듈
│  │  ├─ auth/                          # 인증 관련
│  │  ├─ booking/                       # 예약 관련
│  │  ├─ dashboard/                     # 대시보드 관련
│  │  ├─ salon/                         # 상점/매장 관련
│  │  └─ service/                       # 서비스 관련
│  │
│  ├─ services/                         # 공통 서비스
│  │  ├─ api/                          # API 래퍼
│  │  ├─ http/                         # HTTP 관련
│  │  └─ storage/                      # 저장소 관련
│  │
│  ├─ types/                           # 타입 정의
│  │  ├─ index.ts
│  │  ├─ models.d.ts
│  │  └─ unified.ts                    # 통합 타입 시스템
│  │
│  ├─ ui/                              # UI 컴포넌트
│  │  └─ atoms/                        # 기본 UI 컴포넌트
│  │
│  └─ utils/                           # 유틸리티
│     └─ phoneFormat.ts                # 전화번호 포맷팅
│
├─ components/                          # React 컴포넌트
│  ├─ calendar/                        # 캘린더 관련
│  ├─ dashboard/                       # 대시보드 관련
│  ├─ forms/                          # 폼 관련
│  ├─ management/                      # 관리 관련
│  ├─ modals/                         # 모달 관련
│  ├─ navigation/                     # 네비게이션 관련
│  └─ ui/                            # 공통 UI 컴포넌트
│
├─ stores/                            # 상태 관리 (백업 파일들)
│  └─ backup/                         # 이전 Context API 파일들 (참고용)
│
├─ contexts/                          # React Context
│  └─ DashboardContext.tsx
│
├─ services/                          # 외부 서비스 연동
│  ├─ api.ts                         # API 기본 설정
│  ├─ mockServices.ts                # 모의 서비스
│  └─ api/                          # API 서비스별 분리
│
├─ types/                            # 전역 타입 정의
│  ├─ index.ts
│  ├─ auth.ts
│  ├─ business.ts
│  └─ common.ts
│
├─ hooks/                            # 커스텀 훅
├─ constants/                        # 상수
├─ assets/                          # 에셋 (폰트, 이미지)
└─ scripts/                         # 스크립트

```

## 🎯 주요 기능

### 🏠 홈 탭 (대시보드)
- 오늘의 예약 현황, 매출 통계
- 주간/월간 예약 캘린더
- 인기 서비스, 고객 인사이트

### 📅 예약 탭 (booking.tsx)
- 예약 일정 관리
- 예약 생성/수정/취소
- 고객 정보 연동

### ⚙️ 관리 탭 (management.tsx)  
- 직원 관리 (추가/수정/상태 변경)
- 전화번호부 관리 (고객 정보)
- 시술 메뉴 관리

### 👤 프로필 탭 (profile.tsx)
- 사용자 정보
- 설정
- 로그아웃

## 🛠️ 기술 스택

### Core
- **React Native** (0.81.4) + **Expo** (~54.0.0)
- **TypeScript** (~5.8.3)
- **Expo Router** (~6.0.4) - File-based routing

### 상태 관리
- **Zustand** (~4.x) + persist 미들웨어 - 현재 주 상태 관리
- **AsyncStorage** (영구 저장) - Zustand persist 백엔드

### API & 통신
- **Axios** (^1.11.0) - HTTP 클라이언트
- **Interceptors** - 인증, 에러 처리

### UI/UX
- **@expo/vector-icons** - 아이콘
- **react-native-safe-area-context** - Safe Area
- **expo-haptics** - 햅틱 피드백

### 개발 도구
- **ESLint** (^9.25.0) - 코드 품질
- **expo-dev-client** - 개발 클라이언트

## 📝 개발 가이드라인

### 🎨 코딩 컨벤션
1. **TypeScript 필수** - 모든 코드는 TypeScript로 작성
2. **ESLint 준수** - `npm run lint`로 검증
3. **네이밍 컨벤션**:
   - 컴포넌트: PascalCase (`LoginForm.tsx`)
   - 파일/폴더: kebab-case (`phone-format.ts`)
   - 변수/함수: camelCase (`handleLogin`)

### 🗂️ 파일 구조 규칙
1. **기능별 분리**: 관련 기능은 같은 폴더에
2. **타입 정의**: `src/types/`에 중앙화
3. **공통 컴포넌트**: `components/ui/`에 재사용 가능한 UI
4. **도메인 로직**: `src/features/`에 도메인별 분리

### 🔗 Import 규칙
```typescript
// 1. 외부 라이브러리
import React from 'react'
import { View } from 'react-native'

// 2. 내부 절대 경로 (@/ alias)
import { ThemedText } from '@/components/ThemedText'
import { useAuthStore } from '@/src/stores/authStore'
import { useShopStore } from '@/src/stores/shopStore'

// 3. 상대 경로
import './styles.css'
```

### 🔐 API 연동 패턴
```typescript
// 1. API 서비스 정의 (src/api/services/)
class AuthApiService extends BaseApiService {
  async login(credentials: LoginCredentials) {
    return this.post<LoginResponse>('/auth/login', credentials)
  }
}

// 2. 컴포넌트에서 사용 (Zustand)
const { login, isLoading } = useAuthStore()
await login(credentials)

// 3. 상점 관리
const { selectedShop, selectShop } = useShopStore()
```

## ✅ 품질 관리

### 🔍 실행 가능한 검사 명령어
```bash
# 코드 품질 검사
npm run lint                    # ESLint 검사
npm run lint -- --fix         # ESLint 자동 수정

# Expo 진단
npx expo doctor               # Expo 환경 검사
npx expo-doctor              # 의존성 검사

# TypeScript 타입 체크
npx tsc --noEmit             # 타입 에러만 검사

# 빌드 테스트  
npm run android              # Android 빌드 테스트
npm run ios                  # iOS 빌드 테스트
npm run web                  # Web 빌드 테스트

# 의존성 검사
npm audit                    # 보안 취약점 검사
npm outdated                 # 업데이트 가능한 패키지
```

### 🚨 자주 발생하는 문제 해결
```bash
# Metro 캐시 정리
npx expo start -c

# node_modules 재설치  
rm -rf node_modules package-lock.json
npm install

# iOS 시뮬레이터 재설정
npx expo run:ios --device

# Android 권한 문제 해결
npx expo run:android --clear
```

## 🎯 주요 개발 포인트

### 🔄 상태 관리 (완료)
✅ **Zustand 마이그레이션 완료**
- 간단하고 효율적인 상태 관리 구현
- AsyncStorage persist 미들웨어로 자동 지속성
- Context Provider 중첩 문제 해결
- 메모리 기반 상태로 성능 최적화

### 🏪 멀티 상점 지원
- 로그인 후 상점 선택 필수
- 상점별 데이터 격리
- 상점 변경시 데이터 정리

### 📱 사용자 경험
- 전화번호 자동 포맷팅 (010-0000-0000)
- 아이디 기억하기 기능
- 로그아웃시 데이터 완전 정리

### 🔐 보안 고려사항
- JWT 토큰 자동 갱신
- API 요청 인터셉터로 인증 처리
- 민감한 데이터는 SecureStore 사용

## 📋 체크리스트

### ✅ 코드 작성 전
- [ ] 기능 요구사항 명확히 파악
- [ ] 관련 기존 코드 확인
- [ ] 타입 정의 먼저 작성

### ✅ 코드 작성 후
- [ ] `npm run lint` 통과
- [ ] TypeScript 에러 없음
- [ ] 관련 컴포넌트 동작 확인
- [ ] 에러 처리 적절히 구현

### ✅ 커밋 전
- [ ] 불필요한 console.log 제거
- [ ] 주석 및 문서화 완료
- [ ] 변경사항 관련 테스트 완료

---

💡 **개발시 참고사항**: 이 프롬프트는 현재 프로젝트 구조를 반영하며, 새로운 기능 추가시 기존 패턴을 따라 일관성을 유지해주세요.
