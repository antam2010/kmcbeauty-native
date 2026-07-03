// =============================================================================
// 👤 인증 관련 타입 정의
// =============================================================================

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'ADMIN' | 'MASTER' | 'MANAGER' | 'STAFF';
  role_name: string;
  created_at: string;
  updated_at: string;
  // 참고: 실제 API에는 phone, shop_id 필드가 없음
}

export interface LoginCredentials {
  email: string;
  password: string;
}

// 백엔드 정본: app/schemas/auth.py LoginResponse ({access_token, refresh_token, token_type})
// login/refresh 응답은 user 를 반환하지 않는다. 사용자 정보는 별도 GET /users/me 로 취득한다.
export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  accessToken?: string | null; // 액세스 토큰 추가
  user: User | null;
  loading: boolean;
  error?: string | null;
}

export interface RefreshTokenResponse {
  access_token: string;
  token_type: string;
}
