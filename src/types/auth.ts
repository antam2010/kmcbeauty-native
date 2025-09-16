// =============================================================================
// 👤 인증 관련 타입 정의
// =============================================================================

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'ADMIN' | 'MASTER' | 'MANAGER' | 'STAFF';
  role_name: string;
  shop_id?: number;
  phone?: string;
  created_at: string;
  updated_at: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User; // 사용자 정보 추가
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
