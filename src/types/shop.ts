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

export interface ShopUser {
  shop_id: number;
  user_id: number;
  is_primary_owner: number; // 1=대표, 0=아님
  user: {
    name: string;
    email: string;
    role: string;
  };
}

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
