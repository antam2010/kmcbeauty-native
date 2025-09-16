import { BaseApiService } from './base';

// 초대 코드 관련 타입 정의
export interface InviteCode {
  id: number;
  code: string;
  shop_id: number;
  role: string;
  expires_at: string;
  is_used: boolean;
  created_by: number;
  created_at: string;
  updated_at: string;
}

// 새 API 명세에 맞춘 응답 타입
export interface InviteCodeData {
  invite_code: string;
  shop_id: number;
  expired_at: string;
}

export interface InviteCodeCreate {
  expire_in?: number; // 유효기간 (초 단위), 기본값은 서버에서 설정
}

export interface InviteCodeResponse {
  invite_code: InviteCode;
  invite_url?: string; // 초대 링크 (있다면)
}

// 초대 코드를 통한 회원가입
export interface InviteSignupRequest {
  invite_code: string;
  name: string;
  email: string;
  password: string;
  phone_number?: string;
}

export interface InviteSignupResponse {
  id: number;
  name: string;
  email: string;
  role: string;
  role_name: string;
  created_at: string;
  updated_at: string;
}

export class InviteApiService extends BaseApiService {
  protected readonly basePath = '';

  /**
   * 초대 코드 생성 (관리자/소유자용) - 새 API 명세
   */
  async generateInviteCode(shopId: number, data: InviteCodeCreate): Promise<InviteCodeData> {
    console.log('🔍 API 요청: POST /shops/' + shopId + '/invites', data);
    const response = await this.post<InviteCodeData>(`/shops/${shopId}/invites`, data);
    console.log('✅ 초대 코드 생성 완료:', response.invite_code);
    return response;
  }

  /**
   * 초대 코드 생성 (관리자/소유자용) - 기존 호환용
   */
  async createInviteCode(shopId: number, data: InviteCodeCreate): Promise<InviteCodeResponse> {
    console.log('🔍 API 요청: POST /shops/' + shopId + '/invites', data);
    const response = await this.post<InviteCodeResponse>(`/shops/${shopId}/invites`, data);
    console.log('✅ 초대 코드 생성 완료:', response.invite_code.code);
    return response;
  }

  /**
   * 상점의 현재 활성 초대 코드 조회 (단일) - 새 API 명세
   */
  async getCurrentInviteCode(shopId: number): Promise<InviteCodeData | null> {
    try {
      console.log('🔍 API 요청: GET /shops/' + shopId + '/invites');
      const response = await this.get<InviteCodeData>(`/shops/${shopId}/invites`);
      console.log('✅ 현재 초대 코드 조회 완료:', response.invite_code);
      return response;
    } catch (error) {
      console.error('❌ 현재 초대 코드 조회 실패:', error);
      return null;
    }
  }

  /**
   * 현재 초대 코드 삭제 (새로 생성하기 위해) - 새 API 명세
   */
  async deleteCurrentInviteCode(shopId: number): Promise<void> {
    try {
      console.log('🔍 API 요청: DELETE /shops/' + shopId + '/invites');
      await this.delete(`/shops/${shopId}/invites`);
      console.log('✅ 현재 초대 코드 삭제 완료');
    } catch (error) {
      console.error('❌ 현재 초대 코드 삭제 실패:', error);
      throw error;
    }
  }

  /**
   * 초대 코드 검증 (회원가입 전 체크)
   */
  async validateInviteCode(code: string): Promise<{
    valid: boolean;
    shop_name?: string;
    role?: string;
    expires_at?: string;
  }> {
    console.log('🔍 API 요청: GET /invite-codes/' + code + '/validate');
    const response = await this.get<{
      valid: boolean;
      shop_name?: string;
      role?: string;
      expires_at?: string;
    }>(`/invite-codes/${code}/validate`);
    console.log('✅ 초대 코드 검증 완료:', response.valid ? '유효' : '무효');
    return response;
  }

  /**
   * 초대 코드를 통한 회원가입
   */
  async signupWithInviteCode(data: InviteSignupRequest): Promise<InviteSignupResponse> {
    console.log('🔍 API 요청: POST /users (초대 코드 회원가입)', {
      ...data,
      password: '***'
    });
    
    // role을 MANAGER로 고정하여 요청 데이터 구성
    const requestData = {
      ...data,
      role: 'MANAGER' as const
    };
    
    const response = await this.post<InviteSignupResponse>('/users', requestData);
    console.log('✅ 초대 코드 회원가입 완료:', response.name);
    return response;
  }
}

export const inviteApiService = new InviteApiService();

// 기본 export도 추가
export const inviteService = inviteApiService;
