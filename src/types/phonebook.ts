// 전화번호부 관련 타입 정의

export interface PhonebookResponse {
  id: number;
  shop_id: number;
  group_name?: string;
  name: string;
  phone_number: string;
  memo?: string;
  created_at: string;
  updated_at: string;
}

export interface PhonebookCreate {
  group_name?: string;
  name: string;
  phone_number: string;
  memo?: string;
}

export interface PhonebookUpdate {
  group_name?: string;
  name?: string;
  phone_number?: string;
  memo?: string;
}

export interface PhonebookGroupedByGroupnameResponse {
  group_name: string;
  count: number;
  items: PhonebookResponse[];
}

export interface PhonebookPageResponse {
  items: PhonebookResponse[];
  total: number;
  page: number;
  size: number;
  pages?: number;
}
