// =============================================================================
// 📞 전화번호부 관련 타입 정의
// =============================================================================

import type { Page } from './common';

export interface Phonebook {
  id: number;
  shop_id: number;
  group_name: string | null;
  name: string;
  phone_number: string;
  memo: string | null;
  created_at: string;
  updated_at: string;
}

export interface PhonebookCreate {
  group_name?: string | null;
  memo?: string | null;
  name: string;
  phone_number: string;
}

export interface PhonebookUpdate {
  group_name?: string | null;
  memo?: string | null;
  name?: string;
  phone_number?: string;
}

export type PhonebookResponse = Page<Phonebook>;

export interface PhonebookGroup {
  group_name: string;
  count: number;
  items: Phonebook[];
}

export interface ContactSyncItem {
  name: string;
  phoneNumber: string;
  selected: boolean;
}

// 추가 타입들
export interface DuplicateCheckResponse {
  isDuplicate: boolean;
  existingContact?: Phonebook;
}

export interface PhonebookGroupedByGroupnameResponse {
  groups: PhonebookGroup[];
}

export type PhonebookPageResponse = PhonebookResponse;
