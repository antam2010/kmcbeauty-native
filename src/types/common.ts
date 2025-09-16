// =============================================================================
// 🎯 공통 타입 정의 (페이징, API 응답 등)
// =============================================================================

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
  status?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ErrorResponse {
  message: string;
  code?: string;
  details?: any;
  status?: number;
}

// 선택 옵션 타입
export interface SelectOption<T = string> {
  label: string;
  value: T;
}

// 날짜 관련 타입
export interface DateRange {
  start: string;
  end: string;
}

// 상태 관련 타입
export type LoadingState = 'idle' | 'pending' | 'succeeded' | 'failed';

export interface LoadingStateWithError {
  status: LoadingState;
  error?: string | null;
}
