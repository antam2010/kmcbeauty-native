import axios from 'axios';

const API_BASE_URL = 'https://api-kmc2.daeho3.shop';

// API 인터셉터를 위한 인스턴스
export const createApiClient = (token?: string) => {
  const client = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    withCredentials: true,
  });

  return client;
};

// 대시보드 요약 정보
export interface DashboardSummaryResponse {
  target_date: string;
  summary: {
    target_date: {
      total_reservations: number;
      completed: number;
      reserved: number;
      visited: number;
      canceled: number;
      no_show: number;
      expected_sales: number;
      actual_sales: number;
      unpaid_total: number;
    };
    month: {
      total_reservations: number;
      completed: number;
      reserved: number;
      visited: number;
      canceled: number;
      no_show: number;
      expected_sales: number;
      actual_sales: number;
      unpaid_total: number;
    };
  };
  sales: {
    target_date: {
      menu_detail_id: number;
      name: string;
      count: number;
      expected_price: number;
      actual_price: number;
    }[];
    month: {
      menu_detail_id: number;
      name: string;
      count: number;
      expected_price: number;
      actual_price: number;
    }[];
  };
  customer_insights: {
    id: number;
    reserved_at: string;
    customer_name: string | null;
    phone_number: string | null;
    status: string;
    treatments: {
      treatment_id: number;
      menu_detail_id: number | null;
      base_price: number;
      duration_min: number;
      session_no: number;
    }[];
    total_duration_min: number;
    total_price: number;
    memo: string | null;
    payment_method: string;
    staff: string | null;
    total_reservations: number;
    no_show_count: number;
    no_show_rate: number;
    unpaid_amount: number;
    total_spent: number;
  }[];
  staff_summary: {
    target_date: {
      staff_id: number;
      staff_name: string;
      count: number;
    }[];
    month: {
      staff_id: number;
      staff_name: string;
      count: number;
    }[];
  };
}

// 시술 메뉴 응답
export interface TreatmentMenuResponse {
  id: number;
  shop_id: number;
  name: string;
  created_at: string;
  updated_at: string;
  details: {
    id: number;
    menu_id: number;
    name: string;
    duration_min: number;
    base_price: number;
    created_at: string;
    updated_at: string;
  }[];
}

export const dashboardService = {
  async getDashboardSummary(token: string, targetDate?: string): Promise<DashboardSummaryResponse> {
    const client = createApiClient(token);
    const params = targetDate ? { target_date: targetDate } : {};
    
    const response = await client.get<DashboardSummaryResponse>('/summary/dashboard', { params });
    return response.data;
  },
};

export const treatmentMenuService = {
  async getTreatmentMenus(token: string, page = 1, size = 50): Promise<{
    items: TreatmentMenuResponse[];
    total: number;
    page: number;
    size: number;
    pages: number;
  }> {
    const client = createApiClient(token);
    const response = await client.get<{
      items: TreatmentMenuResponse[];
      total: number;
      page: number;
      size: number;
      pages: number;
    }>('/treatment-menus', {
      params: { page, size }
    });
    return response.data;
  },

  async createTreatmentMenu(token: string, name: string): Promise<TreatmentMenuResponse> {
    const client = createApiClient(token);
    const response = await client.post<TreatmentMenuResponse>('/treatment-menus', { name });
    return response.data;
  },
};
