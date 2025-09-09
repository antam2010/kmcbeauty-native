// 타입 정의
export interface Staff {
  id: string;
  name: string;
  position: string;
  specialties: string[];
  status: 'active' | 'inactive';
  email?: string;
  phone?: string;
  joinDate?: string;
}

export interface Booking {
  id: string;
  customerId: string;
  customerName: string;
  staffId: string;
  staffName: string;
  serviceId: string;
  serviceName: string;
  date: string;
  time: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  price: number;
  duration: number;
  notes?: string;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number; // 분 단위
  category: string;
  isActive: boolean;
}

// 직원 관리 API (목업 데이터 사용)
export const staffService = {
  // 모든 직원 조회
  getAllStaff: async (): Promise<Staff[]> => {
    // 임시 목업 데이터
    return [
      {
        id: '1',
        name: '김미용',
        position: '수석 아티스트',
        specialties: ['화장', '스킨케어'],
        status: 'active',
        email: 'kim@kmcbeauty.com',
        phone: '010-1234-5678',
        joinDate: '2024-01-15'
      },
      {
        id: '2',
        name: '박눈썹',
        position: '아이브로우 전문가',
        specialties: ['눈썹', '속눈썹'],
        status: 'active',
        email: 'park@kmcbeauty.com',
        phone: '010-2345-6789',
        joinDate: '2024-02-01'
      },
      {
        id: '3',
        name: '이두피',
        position: '두피케어 전문가',
        specialties: ['두피케어', '헤어트리트먼트'],
        status: 'inactive',
        email: 'lee@kmcbeauty.com',
        phone: '010-3456-7890',
        joinDate: '2024-03-01'
      }
    ];
  },

  // 활성 직원 조회
  getActiveStaff: async (): Promise<Staff[]> => {
    const allStaff = await staffService.getAllStaff();
    return allStaff.filter(staff => staff.status === 'active');
  },

  // 직원 상세 조회
  getStaffById: async (id: string): Promise<Staff | null> => {
    const allStaff = await staffService.getAllStaff();
    return allStaff.find(staff => staff.id === id) || null;
  },

  // 새 직원 추가
  createStaff: async (staff: Omit<Staff, 'id'>): Promise<Staff> => {
    const newStaff = {
      ...staff,
      id: Date.now().toString(),
    };
    // 실제 API 호출 시 사용
    // const response = await apiClient.post('/staff', staff);
    // return response.data as Staff;
    return newStaff;
  },

  // 직원 정보 수정
  updateStaff: async (id: string, staff: Partial<Staff>): Promise<Staff | null> => {
    // 실제 API 호출 시 사용
    // const response = await apiClient.put(`/staff/${id}`, staff);
    // return response.data as Staff;
    const existingStaff = await staffService.getStaffById(id);
    if (!existingStaff) return null;
    return { ...existingStaff, ...staff };
  },
};

// 예약 관리 API (목업 데이터 사용)
export const bookingService = {
  // 모든 예약 조회
  getAllBookings: async (): Promise<Booking[]> => {
    return [
      {
        id: '1',
        customerId: '1',
        customerName: '김고객',
        staffId: '1',
        staffName: '김미용',
        serviceId: '1',
        serviceName: '화장',
        date: '2024-09-09',
        time: '10:00',
        status: 'scheduled',
        price: 50000,
        duration: 60,
        notes: '웨딩 메이크업'
      },
      {
        id: '2',
        customerId: '2',
        customerName: '이고객',
        staffId: '2',
        staffName: '박눈썹',
        serviceId: '2',
        serviceName: '눈썹',
        date: '2024-09-09',
        time: '11:30',
        status: 'in-progress',
        price: 30000,
        duration: 30
      },
      {
        id: '3',
        customerId: '3',
        customerName: '박고객',
        staffId: '3',
        staffName: '이두피',
        serviceId: '3',
        serviceName: '두피케어',
        date: '2024-09-09',
        time: '14:00',
        status: 'completed',
        price: 80000,
        duration: 90
      }
    ];
  },

  // 날짜별 예약 조회
  getBookingsByDate: async (date: string): Promise<Booking[]> => {
    const allBookings = await bookingService.getAllBookings();
    return allBookings.filter(booking => booking.date === date);
  },

  // 예약 생성
  createBooking: async (booking: Omit<Booking, 'id'>): Promise<Booking> => {
    const newBooking = {
      ...booking,
      id: Date.now().toString(),
    };
    return newBooking;
  },
};

// 서비스 관리 API (목업 데이터 사용)
export const serviceService = {
  // 모든 서비스 조회
  getAllServices: async (): Promise<Service[]> => {
    return [
      {
        id: '1',
        name: '화장',
        description: '웨딩, 행사용 메이크업',
        price: 50000,
        duration: 60,
        category: '메이크업',
        isActive: true
      },
      {
        id: '2',
        name: '눈썹',
        description: '눈썹 디자인 및 정리',
        price: 30000,
        duration: 30,
        category: '아이브로우',
        isActive: true
      },
      {
        id: '3',
        name: '두피케어',
        description: '두피 관리 및 트리트먼트',
        price: 80000,
        duration: 90,
        category: '헤어케어',
        isActive: true
      },
      {
        id: '4',
        name: '스킨케어',
        description: '페이셜 관리 및 스킨케어',
        price: 70000,
        duration: 80,
        category: '스킨케어',
        isActive: true
      }
    ];
  },

  // 활성 서비스 조회
  getActiveServices: async (): Promise<Service[]> => {
    const allServices = await serviceService.getAllServices();
    return allServices.filter(service => service.isActive);
  },
};

// 대시보드 통계 API (목업 데이터 사용)
export const dashboardService = {
  // 대시보드 통계 조회
  getDashboardStats: async () => {
    return {
      todayBookings: 8,
      activeStaff: 12,
      monthlyRevenue: 2800000,
      newCustomers: 23,
      completedBookings: 156,
      cancelledBookings: 12
    };
  },

  // 인기 서비스 조회
  getPopularServices: async () => {
    return [
      { name: '화장', bookings: 25, revenue: 1250000 },
      { name: '눈썹', bookings: 18, revenue: 540000 },
      { name: '스킨케어', bookings: 15, revenue: 1050000 },
      { name: '두피케어', bookings: 12, revenue: 960000 }
    ];
  },
};
