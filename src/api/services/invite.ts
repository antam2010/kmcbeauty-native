import { BaseApiService } from './base';

// 초대 코드 응답 (정본).
// 백엔드 정본: app/schemas/shop_invite.py ShopInviteResponse ({shop_id, invite_code, expired_at})
export interface InviteCodeData {
  invite_code: string;
  shop_id: number;
  expired_at: string;
}

export interface InviteCodeCreate {
  // 유효기간(초 단위). 백엔드 create_invite 는 timedelta(seconds=expire_in) 으로 소비한다.
  // (백엔드 스키마 description 은 "분 단위"라 적혀 있으나 실동작은 초 단위이며 기본값 60*60*24*7 = 7일이다.)
  expire_in?: number;
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
   * 초대 코드 생성 (관리자/소유자용)
   * 백엔드: POST /shops/{shop_id}/invites -> ShopInviteResponse
   */
  async generateInviteCode(shopId: number, data: InviteCodeCreate): Promise<InviteCodeData> {
    console.log('🔍 API 요청: POST /shops/' + shopId + '/invites', data);
    const response = await this.post<InviteCodeData>(`/shops/${shopId}/invites`, data);
    console.log('✅ 초대 코드 생성 완료:', response.invite_code);
    return response;
  }

  /**
   * 상점의 현재 활성 초대 코드 조회 (단일)
   * 백엔드: GET /shops/{shop_id}/invites -> ShopInviteResponse
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
   * 초대 코드를 통한 회원가입
   * 백엔드: POST /users body { name, email, password, invite_code } -> UserResponse
   * SECURITY-001: 클라이언트는 role 을 공급하지 않는다. 백엔드가 invite_code 로 role 을 서버 측에서 결정한다.
   */
  async signupWithInviteCode(data: InviteSignupRequest): Promise<InviteSignupResponse> {
    console.log('🔍 API 요청: POST /users (초대 코드 회원가입)', {
      ...data,
      password: '***'
    });

    // 백엔드가 invite_code 로 role 을 파생하므로 요청 본문은 InviteSignupRequest 그대로 전송한다.
    const response = await this.post<InviteSignupResponse>('/users', data);
    console.log('✅ 초대 코드 회원가입 완료:', response.name);
    return response;
  }
}

export const inviteApiService = new InviteApiService();

// 기본 export도 추가
export const inviteService = inviteApiService;
