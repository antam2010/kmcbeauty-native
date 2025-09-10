// 모든 API 서비스들을 중앙에서 관리
import { authApiService } from './auth';
import { dashboardApiService } from './dashboard';
import { treatmentApiService } from './treatment';

export { authApiService, dashboardApiService, treatmentApiService };

// 편의를 위한 통합 API 객체
export const apiServices = {
  auth: authApiService,
  treatment: treatmentApiService,
  dashboard: dashboardApiService,
};

// 기본 export
export default apiServices;
