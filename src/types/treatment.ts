// 시술 예약 관련 타입들
export interface Treatment {
  id: number;
  phonebook_id: number;
  reserved_at: string; // ISO date-time
  memo: string | null;
  status: 'RESERVED' | 'VISITED' | 'CANCELLED' | 'NO_SHOW' | 'COMPLETED';
  finished_at: string | null;
  payment_method: 'CARD' | 'CASH' | 'UNPAID';
  staff_user_id: number | null;
  shop_id: number;
  created_at: string;
  updated_at: string;
  created_user_id: number | null;
  status_label: string;
  payment_method_label: string;
  treatment_items: TreatmentItem[];
  phonebook: {
    id: number;
    name: string;
    phone_number: string;
    group_name: string | null;
    memo: string | null;
  };
  staff_user: {
    name: string;
    email: string;
    role: string;
  } | null;
}

export interface TreatmentCreate {
  phonebook_id: number;
  reserved_at: string; // ISO date-time format
  memo?: string | null;
  status: 'RESERVED' | 'VISITED' | 'CANCELLED' | 'NO_SHOW' | 'COMPLETED';
  finished_at?: string | null;
  payment_method?: 'CARD' | 'CASH' | 'UNPAID';
  staff_user_id?: number | null;
  treatment_items: TreatmentItemCreate[];
}

export interface TreatmentUpdate {
  phonebook_id: number;
  reserved_at: string;
  memo?: string | null;
  status: 'RESERVED' | 'VISITED' | 'CANCELLED' | 'NO_SHOW' | 'COMPLETED';
  finished_at?: string | null;
  payment_method?: 'CARD' | 'CASH' | 'UNPAID';
  staff_user_id?: number | null;
  treatment_items: TreatmentItemUpdate[];
}

export interface TreatmentItemCreate {
  menu_detail_id: number;
  base_price: number;
  duration_min: number;
  session_no: number;
}

export interface TreatmentItemUpdate {
  id?: number | null;
  menu_detail_id?: number | null;
  base_price?: number | null;
  duration_min?: number | null;
  session_no?: number | null;
}

export interface TreatmentItem {
  id: number;
  treatment_id: number;
  menu_detail_id: number | null;
  base_price: number;
  duration_min: number;
  session_no: number;
  menu_detail: {
    menu_id: number;
    name: string;
    duration_min: number;
    base_price: number;
  };
  created_at: string;
  updated_at: string;
}

export interface TreatmentListParams {
  start_date?: string; // YYYY-MM-DD
  end_date?: string; // YYYY-MM-DD
  status?: 'RESERVED' | 'VISITED' | 'CANCELLED' | 'NO_SHOW' | 'COMPLETED';
  search?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  staff_user_id?: number;
  page?: number;
  size?: number;
}

export interface TreatmentResponse {
  items: Treatment[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface TreatmentSimpleResponse {
  id: number;
  created_at: string;
  updated_at: string;
}
