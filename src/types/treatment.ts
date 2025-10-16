// =============================================================================
// 🩺 시술 예약 관련 타입 정의
// =============================================================================

import type { Page } from './common';

// 시술 예약 관련 타입
export interface Treatment {
  id: number;
  shop_id: number;
  customer_name: string;
  customer_phone: string;
  service_name: string; // 서비스명 추가
  appointment_date: string; // YYYY-MM-DD
  appointment_time: string; // HH:MM
  reserved_at: string;
  duration: number;
  price: number;
  status: string;
  notes?: string | null;
  memo?: string | null; // 메모 필드 추가
  payment_method?: 'CARD' | 'CASH' | 'TRANSFER' | string; // 결제 방법 추가
  staff_user_id?: number; // 담당 직원 ID 추가
  phonebook?: {
    id: number;
    name: string;
    phone_number: string; // 필수 필드로 변경
    group_name?: string | null; // 그룹명 추가
    memo?: string | null; // 메모 추가
  };
  staff_user?: {
    id: number;
    name: string;
    email: string;
    role: string;
  }; // 담당 직원 정보 추가
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
  phonebook_id?: number | null; // 선택 필드
  customer_name?: string | null; // 고객명 (전화번호부 미등록 시)
  customer_phone?: string | null; // 고객 전화번호 (전화번호부 미등록 시)
  reserved_at: string; // 필수 필드 (date-time 형식)
  memo?: string;
  status: 'RESERVED' | 'VISITED' | 'CANCELLED' | 'NO_SHOW' | 'COMPLETED'; // 필수 필드
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

export interface TreatmentUpdate {
  phonebook_id?: number | null; // 선택 필드
  customer_name?: string | null; // 고객명 (전화번호부 미등록 시)
  customer_phone?: string | null; // 고객 전화번호 (전화번호부 미등록 시)
  reserved_at?: string; // 예약 시간
  memo?: string; // 메모
  status?: 'RESERVED' | 'VISITED' | 'CANCELLED' | 'NO_SHOW' | 'COMPLETED'; // 상태
  finished_at?: string; // 시술 완료일시
  payment_method?: 'CARD' | 'CASH' | 'UNPAID'; // 결제 방법
  staff_user_id?: number | null; // 담당 직원 ID
  treatment_items?: TreatmentItemCreate[]; // 시술 항목 리스트
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

export interface TreatmentSimpleResponse {
  id: number;
  message: string;
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
