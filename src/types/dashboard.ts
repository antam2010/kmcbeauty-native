// =============================================================================
// 📊 대시보드 관련 타입 정의
// =============================================================================

export interface DashboardResponse {
  target_date: string;
  summary: DashboardSummary;
  sales: DashboardSales;
  customer_insights: CustomerInsight[];
  staff_summary: StaffSummary;
}

export interface DashboardSummaryResponse {
  target_date: string;
  summary: any;
  sales: any;
  customer_insights: any[];
  staff_summary: any;
}

export interface DashboardSummary {
  total_treatments: number;
  total_customers: number;
  total_revenue: number;
  avg_treatment_duration: number;
}

export interface DashboardSales {
  today: SalesData;
  week: SalesData;
  month: SalesData[];
}

export interface SalesData {
  revenue: number;
  treatments: number;
  customers: number;
}

export interface CustomerInsight {
  customer_name: string;
  customer_phone: string;
  total_treatments: number;
  total_revenue: number;
  last_visit: string;
}

export interface StaffSummary {
  total_staff: number;
  active_staff: number;
  treatments_per_staff: number;
}

export interface DashboardStats {
  todayBookings: number;
  monthlyRevenue: number;
  popularServices: PopularService[];
  recentBookings: RecentBooking[];
}

export interface PopularService {
  service: {
    id: string;
    name: string;
  };
  bookingCount: number;
}

export interface RecentBooking {
  id: number;
  customerName: string;
  serviceName: string;
  appointmentTime: string;
  status: string;
}
