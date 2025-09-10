// API 서비스들을 위한 기본 클래스
import apiClient from '../client';

export abstract class BaseApiService {
  protected readonly client = apiClient;
  protected abstract readonly basePath: string;

  protected async get<T>(
    endpoint: string = '', 
    config?: any
  ): Promise<T> {
    const response = await this.client.get(`${this.basePath}${endpoint}`, config);
    return response.data as T;
  }

  protected async post<T>(
    endpoint: string = '', 
    data?: any, 
    config?: any
  ): Promise<T> {
    const response = await this.client.post(`${this.basePath}${endpoint}`, data, config);
    return response.data as T;
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
