// 사용자 관리 관련 타입 정의

export interface StaffUser {
  id: number;
  name: string;
  email: string;
  username: string;
  role: string;
  status: 'active' | 'inactive';
  phone_number?: string;
  created_at: string;
  updated_at: string;
}

export interface StaffUserCreate {
  name: string;
  email: string;
  username: string;
  password: string;
  role: string;
  phone_number?: string;
}

export interface StaffUserUpdate {
  name?: string;
  email?: string;
  username?: string;
  role?: string;
  phone_number?: string;
  status?: 'active' | 'inactive';
}
