// 시술 메뉴 관련 타입 정의

export interface TreatmentMenu {
  id: number;
  shop_id: number;
  name: string;
  created_at: string;
  updated_at: string;
  details?: TreatmentMenuDetail[];
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

export interface TreatmentMenuResponse {
  id: number;
  shop_id: number;
  name: string;
  created_at: string;
  updated_at: string;
  details: TreatmentMenuDetail[];
}

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages?: number;
}
