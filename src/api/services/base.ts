// API 서비스들을 위한 기본 클래스
import apiClient from '../client';

export abstract class BaseApiService {
  protected readonly client = apiClient;
  protected abstract readonly basePath: string;

  // @MX:ANCHOR: [AUTO] 서비스 7곳의 GET 요청 15건이 지나는 공통 경계다. 실패하면 잡은 에러를 같은 참조 그대로 다시 던진다.
  // @MX:REASON: fan_in 15(dashboard·invite·phonebook·shop·staff·treatment·treatmentMenu 서비스). 여기서 에러를 바꿔 던지거나 로그 내용을 늘리면 모든 GET 호출의 오류 처리와 로그 노출이 함께 바뀐다.
  protected async get<T>(
    endpoint: string = '', 
    config?: any
  ): Promise<T> {
    const fullUrl = `${this.basePath}${endpoint}`;
    
    try {
      if (__DEV__) {
        console.log('🔄 API GET 요청:', {
          url: fullUrl,
          method: 'GET',
          timestamp: new Date().toISOString()
        });
      }
      
      const response = await this.client.get(fullUrl, config);
      
      if (__DEV__) {
        console.log('✅ API GET 성공:', {
          url: fullUrl,
          status: response.status,
          dataType: typeof response.data,
          timestamp: new Date().toISOString()
        });
      }
      
      return response.data as T;
    } catch (error: any) {
      if (__DEV__) {
        console.error('❌ API GET 실패:', {
          url: fullUrl,
          method: 'GET',
          status: error.response?.status,
          statusText: error.response?.statusText,
          errorData: error.response?.data,
          message: error.message,
          timestamp: new Date().toISOString()
        });

        // 401 에러 특별 처리
        if (error.response?.status === 401) {
          console.error('🔐 401 Unauthorized 에러 - 인증 만료:', {
            url: fullUrl,
            accessToken: error.config?.headers?.Authorization ? '있음' : '없음',
            errorDetail: error.response?.data
          });
        }
      }
      
      throw error;
    }
  }

  // @MX:ANCHOR: [AUTO] 서비스 7곳의 POST 요청 13건이 지나는 공통 경계다. 실패하면 잡은 에러를 같은 참조 그대로 다시 던진다.
  // @MX:REASON: fan_in 13(auth·invite·phonebook·shop·staff·treatment·treatmentMenu 서비스). 여기서 에러를 바꿔 던지거나 로그 내용을 늘리면 모든 POST 호출의 오류 처리와 로그 노출이 함께 바뀐다.
  // @MX:SPEC: SPEC-SECURITY-002 (REQ-SEC-002-001~004)
  protected async post<T>(
    endpoint: string = '', 
    data?: any, 
    config?: any
  ): Promise<T> {
    try {
      if (__DEV__) {
        console.log('🔄 API POST 요청:', {
          url: `${this.basePath}${endpoint}`,
          method: 'POST'
        });
      }
      
      const response = await this.client.post(`${this.basePath}${endpoint}`, data, config);
      
      if (__DEV__) {
        console.log('✅ API POST 성공:', {
          status: response.status,
          statusText: response.statusText
        });
      }
      
      return response.data as T;
    } catch (error: any) {
      // @MX:WARN: [AUTO] 이 실패 로그와 422·401 로그에는 요청 본문, 요청 설정, 에러 객체, error.request, error.response(응답 객체 전체), Authorization 값을 넣지 않는다. 로그는 개발 빌드에서만 남긴다.
      // @MX:REASON: 초대 가입 본문에는 비밀번호가 들어 있다. 에러를 객체로 감싸 넘기면 운영 빌드의 ExceptionsManager가 AxiosError.toJSON()으로 요청 본문과 Bearer 토큰을 직렬화한다.
      if (__DEV__) {
        console.error('❌ API POST 실패:', {
          url: `${this.basePath}${endpoint}`,
          method: 'POST',
          status: error.response?.status,
          statusText: error.response?.statusText,
          errorData: error.response?.data,
          message: error.message
        });

        // 422 에러의 경우 상세한 유효성 검사 오류 정보 출력
        if (error.response?.status === 422) {
          console.error('🔍 422 Unprocessable Entity - 상세 오류 정보:');
          console.error('🚫 서버 응답:', JSON.stringify(error.response.data, null, 2));

          if (error.response.data?.detail) {
            console.error('💡 오류 세부사항:', error.response.data.detail);
          }

          if (error.response.data?.errors) {
            console.error('📋 필드별 오류:', error.response.data.errors);
          }

          // 누락된 필드 정보 추출 시도
          const errorMessage = error.response.data?.detail || error.response.data?.message || '';
          if (typeof errorMessage === 'string' && (errorMessage.includes('required') || errorMessage.includes('missing'))) {
            console.error('⚠️ 필수 필드 누락 의심:', errorMessage);
          }
        }

        // 401 에러 특별 처리
        if (error.response?.status === 401) {
          console.error('🔐 401 Unauthorized 에러 - 인증 만료:', {
            url: `${this.basePath}${endpoint}`,
            accessToken: error.config?.headers?.Authorization ? '있음' : '없음',
            errorDetail: error.response?.data
          });
        }
      }
      
      throw error;
    }
  }

  protected async put<T>(
    endpoint: string = '', 
    data?: any, 
    config?: any
  ): Promise<T> {
    const response = await this.client.put(`${this.basePath}${endpoint}`, data, config);
    return response.data as T;
  }

  protected async patch<T>(
    endpoint: string = '', 
    data?: any, 
    config?: any
  ): Promise<T> {
    const response = await this.client.patch(`${this.basePath}${endpoint}`, data, config);
    return response.data as T;
  }

  protected async delete<T>(
    endpoint: string = '', 
    config?: any
  ): Promise<T> {
    const response = await this.client.delete(`${this.basePath}${endpoint}`, config);
    return response.data as T;
  }

  protected buildQueryString(params: Record<string, any>): string {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });

    const queryString = searchParams.toString();
    return queryString ? `?${queryString}` : '';
  }
}
