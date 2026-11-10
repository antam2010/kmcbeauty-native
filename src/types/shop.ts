// =============================================================================
// 🏪 상점 관련 타입 정의
// =============================================================================

import type { Page } from './common';

export interface Shop {
  id: number;
  name: string;
  address: string;
  address_detail: string | null;
  phone: string | null;
  business_number: string | null;
  created_at: string;
  updated_at: string;
}

// @MX:NOTE: [AUTO] ShopUser 정본은 src/api/services/staff.ts 의 ShopUserResponse 다.
// 여기서는 하위 호환을 위해 재노출(re-export)만 한다 — 필드를 중복 선언하지 말 것.
// is_primary_owner 는 백엔드가 int(0/1) 로 직렬화하므로 number 유지(=== 1 코어션은 소비 측 책임).
export type { ShopUserResponse, ShopUserResponse as ShopUser } from '@/src/api/services/staff';

export type ShopResponse = Page<Shop>;

export interface ShopCreate {
  name: string;
  address: string;
  address_detail?: string;
  phone?: string;
  business_number?: string;
}

export interface ShopUpdate {
  name: string;
  address: string;
  address_detail?: string;
  phone?: string;
  business_number?: string;
}

export interface ShopSelect {
  shop_id: number;
}

export interface Staff {
  id: number;
  name: string;
  email: string;
  role: string;
  phone?: string;
  shop_id?: number;
  created_at?: string;
  updated_at?: string;
}

export interface StaffCreate {
  name: string;
  email: string;
  role: string;
  phone?: string;
}

export interface StaffUpdate {
  name: string;
  email: string;
  role: string;
  phone?: string;
}

export type ShopsResponse = Page<Shop>;

export interface SelectedShop {
  shop_id: number;
  shop: Shop;
}
