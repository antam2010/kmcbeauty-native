// 대시보드 관련 타입들
export interface DashboardSummary {
  target_date: TreatmentSummary;
  month: TreatmentSummary;
}

export interface TreatmentSummary {
  total_reservations: number;
  completed: number;
  reserved: number;
  visited: number;
  canceled: number;
  no_show: number;
  expected_sales: number;
  actual_sales: number;
  unpaid_total: number;
}

export interface TreatmentSalesItem {
  menu_detail_id: number;
  name: string;
  count: number;
  expected_price: number;
  actual_price: number;
}

export interface DashboardSalesSummary {
  target_date: TreatmentSalesItem[];
  month: TreatmentSalesItem[];
}

export interface DashboardStaffSummaryItem {
  staff_id: number;
  staff_name: string;
  count: number;
}

export interface DashboardStaffSummary {
  target_date: DashboardStaffSummaryItem[];
  month: DashboardStaffSummaryItem[];
}

export interface CustomerInsight {
  id: number;
  reserved_at: string;
  customer_name: string | null;
  phone_number: string | null;
  status: string;
  menu_detail_name: string | null;
  memo: string | null;
  staff_user_name: string | null;
}

export interface DashboardResponse {
  summary: DashboardSummary;
  sales_summary: DashboardSalesSummary;
  staff_summary: DashboardStaffSummary;
  insights: CustomerInsight[];
}
