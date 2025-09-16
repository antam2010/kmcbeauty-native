// API 서비스들을 위한 기본 클래스
import apiClient from '../client';

export abstract class BaseApiService {
  protected readonly client = apiClient;
  protected abstract readonly basePath: string;

  protected async get<T>(
    endpoint: string = '', 
    config?: any
  ): Promise<T> {
    const fullUrl = `${this.basePath}${endpoint}`;
    
    try {
      console.log('🔄 API GET 요청:', {
        url: fullUrl,
        method: 'GET',
        timestamp: new Date().toISOString(),
        config: config
      });
      
      const response = await this.client.get(fullUrl, config);
      
      console.log('✅ API GET 성공:', {
        url: fullUrl,
        status: response.status,
        dataType: typeof response.data,
        timestamp: new Date().toISOString()
      });
      
      return response.data as T;
    } catch (error: any) {
      console.error('❌ API GET 실패:', {
        url: fullUrl,
        method: 'GET',
        status: error.response?.status,
        statusText: error.response?.statusText,
        errorData: error.response?.data,
        message: error.message,
        timestamp: new Date().toISOString()
      });
      
      throw error;
    }
  }

  protected async post<T>(
    endpoint: string = '', 
    data?: any, 
    config?: any
  ): Promise<T> {
    try {
      console.log('🔄 API POST 요청:', {
        url: `${this.basePath}${endpoint}`,
        method: 'POST',
        headers: this.client.defaults.headers,
        data: data,
        config: config
      });
      
      const response = await this.client.post(`${this.basePath}${endpoint}`, data, config);
      
      console.log('✅ API POST 성공:', {
        status: response.status,
        statusText: response.statusText,
        data: response.data
      });
      
      return response.data as T;
    } catch (error: any) {
      console.error('❌ API POST 실패:', {
        url: `${this.basePath}${endpoint}`,
        method: 'POST',
        requestData: data,
        status: error.response?.status,
        statusText: error.response?.statusText,
        errorData: error.response?.data,
        message: error.message,
        stack: error.stack?.split('\n').slice(0, 3) // 스택 트레이스 일부만
      });
      
      // 422 에러의 경우 상세한 유효성 검사 오류 정보 출력
      if (error.response?.status === 422) {
        console.error('🔍 422 Unprocessable Entity - 상세 오류 정보:');
        console.error('📝 요청 데이터:', JSON.stringify(data, null, 2));
        console.error('🚫 서버 응답:', JSON.stringify(error.response.data, null, 2));
        
        if (error.response.data?.detail) {
          console.error('💡 오류 세부사항:', error.response.data.detail);
        }
        
        if (error.response.data?.errors) {
          console.error('📋 필드별 오류:', error.response.data.errors);
        }
        
        // 누락된 필드 정보 추출 시도
        const errorMessage = error.response.data?.detail || error.response.data?.message || '';
        if (errorMessage.includes('required') || errorMessage.includes('missing')) {
          console.error('⚠️ 필수 필드 누락 의심:', errorMessage);
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
