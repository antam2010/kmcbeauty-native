// 새로운 중앙집중식 API 서비스 사용
import { treatmentApiService } from '../../api/services/treatment';

// 기존 API와의 호환성을 위한 래퍼
export const treatmentAPI = {
  list: treatmentApiService.list.bind(treatmentApiService),
  getById: treatmentApiService.getById.bind(treatmentApiService),
  create: treatmentApiService.create.bind(treatmentApiService),
  update: treatmentApiService.update.bind(treatmentApiService),
  remove: treatmentApiService.remove.bind(treatmentApiService),
  getMonthlyTreatments: treatmentApiService.getMonthlyTreatments.bind(treatmentApiService),
  getDailyTreatments: treatmentApiService.getDailyTreatments.bind(treatmentApiService),
};

// 타입들은 중앙에서 import
export type {
    Treatment,
    TreatmentListParams,
    TreatmentResponse
} from '../../types/treatment';

