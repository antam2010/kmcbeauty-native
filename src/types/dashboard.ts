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

// 새로운 DashboardSummaryResponse 타입
export interface DashboardSummaryResponse {
  target_date: string;
  summary: DashboardSummary;
  sales: DashboardSalesSummary;
  customer_insights: DetailedCustomerInsight[];
  staff_summary: DashboardStaffSummary;
}

export interface DetailedCustomerInsight {
  id: number;
  reserved_at: string;
  customer_name: string;
  phone_number: string;
  status: string;
  treatments: TreatmentDetail[];
  total_duration_min: number;
  total_price: number;
  memo: string | null;
  payment_method: string;
  staff: any;
  staff_user: any;
  total_reservations: number;
  no_show_count: number;
  no_show_rate: number;
  unpaid_amount: number;
  total_spent: number;
}

export interface TreatmentDetail {
  treatment_id: number;
  menu_detail_id: number;
  base_price: number;
  duration_min: number;
  session_no: number;
  menu_detail: {
    menu_id: number;
    name: string;
    duration_min: number;
    base_price: number;
  };
}
