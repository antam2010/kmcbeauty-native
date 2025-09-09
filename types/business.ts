// 직원 관련 타입
export interface Staff {
  id: string;
  name: string;
  position: string;
  specialties: string[];
  status: 'active' | 'inactive';
  email?: string;
  phone?: string;
  joinDate?: string;
  avatar?: string;
  workingHours?: {
    start: string;
    end: string;
    daysOff: string[];
  };
}

// 서비스 관련 타입
export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number; // 분 단위
  category: string;
  isActive: boolean;
  image?: string;
}

// 예약 관련 타입
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
  createdAt: string;
  updatedAt: string;
}

export interface BookingSlot {
  date: string;
  time: string;
  isAvailable: boolean;
  staffId?: string;
}

export interface CreateBookingRequest {
  customerId: string;
  staffId: string;
  serviceId: string;
  date: string;
  time: string;
  notes?: string;
}

// 고객 관련 타입
export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  joinDate: string;
  lastVisit?: string;
  totalBookings: number;
  preferences?: {
    preferredStaff?: string;
    preferredServices?: string[];
  };
}
