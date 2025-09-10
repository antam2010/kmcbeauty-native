// 인증 관련 타입들
export interface User {
  id: number;
  email: string;
  name: string;
  role: 'ADMIN' | 'STAFF' | 'USER';
  shop_id?: number;
  created_at: string;
  updated_at: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
  refresh_token: string;
  expires_in: number;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface RefreshTokenResponse {
  token: string;
  refresh_token: string;
  expires_in: number;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  shop_id?: number;
}

export interface RegisterResponse {
  user: User;
  token: string;
  refresh_token: string;
  expires_in: number;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  email: string;
  password: string;
}

// 인증 에러 타입
export interface AuthError {
  code: string;
  message: string;
  details?: any;
}

// 토큰 정보
export interface TokenInfo {
  token: string;
  refresh_token: string;
  expires_in: number;
  expires_at: Date;
}

// 사용자 권한 관련
export type UserRole = 'ADMIN' | 'STAFF' | 'USER';

export interface Permission {
  id: string;
  name: string;
  description: string;
}

export interface RolePermissions {
  role: UserRole;
  permissions: Permission[];
}
