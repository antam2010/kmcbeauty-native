// 모든 API 서비스들을 중앙에서 관리
import { authApiService } from './auth';
import { dashboardApiService } from './dashboard';
import { phonebookApiService } from './phonebook';
import { shopApiService } from './shop';
import { userApiService } from './staff';
import { treatmentApiService } from './treatment';
import { treatmentMenuApiService } from './treatmentMenu';

export {
    authApiService,
    dashboardApiService, phonebookApiService, shopApiService, treatmentApiService, treatmentMenuApiService, userApiService
};

// 편의를 위한 통합 API 객체
export const apiServices = {
  auth: authApiService,
  treatment: treatmentApiService,
  dashboard: dashboardApiService,
  phonebook: phonebookApiService,
  treatmentMenu: treatmentMenuApiService,
  shop: shopApiService,
  user: userApiService,
};

// 기본 export
export default apiServices;
