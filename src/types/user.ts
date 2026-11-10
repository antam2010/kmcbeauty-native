// 사용자 관리 관련 타입 정의
// @MX:NOTE: [AUTO] 직원 관련 타입 정본은 src/api/services/staff.ts 다.
// 이 파일은 하위 호환 재노출(re-export)만 유지한다 — 여기에 필드를 중복 선언하지 말 것
// (username/password/role 을 클라이언트에서 공급하지 않는다: SECURITY-001).
export type {
  ShopUserResponse,
  StaffUser,
  StaffUserCreate,
  StaffUserUpdate,
} from '@/src/api/services/staff';
