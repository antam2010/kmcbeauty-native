// =============================================================================
// 🩺 시술 예약 관련 타입 정의
// =============================================================================

import type { Page } from './common';

// 백엔드 정본: app/enum/treatment_status.py TreatmentStatus
// (RESERVED/VISITED/CANCELLED/NO_SHOW/COMPLETED)
export type TreatmentStatus =
  | 'RESERVED'
  | 'VISITED'
  | 'CANCELLED'
  | 'NO_SHOW'
  | 'COMPLETED';

// 시술 예약 관련 타입
// 백엔드 정본: app/schemas/treatment.py TreatmentResponse
// (TreatmentBase -> TreatmentInDBBase -> TreatmentResponse 상속 필드 집합과 1:1 대응)
export interface Treatment {
  id: number;
  shop_id: number;
  // 전화번호부 미등록 고객용 (백엔드 TreatmentBase.customer_name / customer_phone)
  customer_name?: string | null;
  customer_phone?: string | null;
  reserved_at: string; // 백엔드는 단일 datetime(ISO) 으로 반환 — 날짜/시간 분리 금지
  memo?: string | null;
  status: TreatmentStatus; // 백엔드 TreatmentStatus enum
  finished_at?: string | null; // 시술 완료일시
  // 백엔드 PaymentMethod enum = CARD | CASH | UNPAID (TRANSFER 없음)
  payment_method?: 'CARD' | 'CASH' | 'UNPAID' | string;
  staff_user_id?: number | null;
  // 백엔드가 파생 생성하는 읽기 전용 라벨 (요청 본문에 포함하지 않음)
  status_label: string;
  payment_method_label: string;
  created_user_id?: number | null; // 예약 생성자 유저 ID
  phonebook?: {
    // 백엔드 정본: PhonebookResponse
    id: number;
    shop_id: number;
    name: string;
    phone_number: string;
    group_name?: string | null;
    memo?: string | null;
    created_at: string;
    updated_at: string;
  } | null;
  // @MX:NOTE: [AUTO] 백엔드 TreatmentResponse.staff_user 는 UserBase(name+email)만 보장한다.
  // id/role 은 응답에 포함되지 않을 수 있어 optional 로 둔다(계약 필드로 단언하지 않음).
  staff_user?: {
    id?: number;
    name: string;
    email: string;
    role?: string;
  } | null;
  treatment_items?: TreatmentItem[];
  created_at: string;
  updated_at: string;
}

export interface TreatmentItem {
  id: number;
  treatment_id: number;
  menu_detail_id: number;
  session_no: number;
  custom_price: number;
  duration_min: number;
  base_price: number;
  menu_detail?: {
    id: number;
    name: string;
    duration_min: number;
    base_price: number;
    menu_id?: number; // 메뉴 ID 추가
  };
  created_at: string;
  updated_at: string;
}

export interface TreatmentCreate {
  phonebook_id: number; // 필수 필드
  reserved_at: string; // 필수 필드 (date-time 형식)
  memo?: string;
  status: TreatmentStatus; // 필수 필드
  finished_at?: string;
  payment_method?: 'CARD' | 'CASH' | 'UNPAID';
  staff_user_id?: number;
  treatment_items: TreatmentItemCreate[];
}

export interface TreatmentItemCreate {
  menu_detail_id: number;
  base_price: number; // 필수 필드
  duration_min: number; // 필수 필드  
  session_no: number; // 필수 필드
}

// 백엔드 정본: app/schemas/treatment.py TreatmentUpdate(TreatmentBase)
// TreatmentBase 필드 집합 + treatment_items 와 1:1 대응.
// (appointment_date/appointment_time/notes 는 백엔드에 없는 필드라 제거 — 예약 일시는 reserved_at, 메모는 memo)
export interface TreatmentUpdate {
  phonebook_id?: number;
  customer_name?: string;
  customer_phone?: string;
  reserved_at?: string; // 예약 일시 (date-time 형식)
  memo?: string;
  status?: TreatmentStatus;
  finished_at?: string;
  payment_method?: 'CARD' | 'CASH' | 'UNPAID';
  staff_user_id?: number | null;
  treatment_items?: TreatmentItemCreate[];
}

export interface TreatmentListParams {
  search?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
  page?: number;
  size?: number;
  sort_by?: string; // 정렬 필드 추가
  sort_order?: string; // 정렬 순서 추가
}

export type TreatmentResponse = Page<Treatment>;

// 백엔드 정본: app/schemas/treatment.py TreatmentSimpleResponse
// POST/PUT /treatments 의 반환값 ({id, created_at, updated_at}). message 필드는 백엔드가 보내지 않음.
export interface TreatmentSimpleResponse {
  id: number;
  created_at: string;
  updated_at: string;
}

// 시술 메뉴 관련 타입
export interface TreatmentMenu {
  id: number;
  shop_id: number;
  name: string;
  created_at: string;
  updated_at: string;
  details: TreatmentMenuDetail[];
}

export interface TreatmentMenuDetail {
  id: number;
  menu_id: number;
  name: string;
  duration_min: number;
  base_price: number;
  created_at: string;
  updated_at: string;
}

export interface TreatmentMenuCreate {
  name: string;
}

export interface TreatmentMenuDetailCreate {
  name: string;
  duration_min: number;
  base_price: number;
}

export type TreatmentMenuResponse = Page<TreatmentMenu>;
export type TreatmentMenuListResponse = TreatmentMenu[];
export type TreatmentMenuSingleResponse = TreatmentMenu;
