import { authApiService } from '@/src/api/services/auth';
import { shopApiService, type Shop } from '@/src/api/services/shop';
import { type User } from '@/src/types';
import AsyncStorage from '@react-native-async-storage/async-storage';

const USER_STORAGE_KEY = 'user_data';
const SELECTED_SHOP_STORAGE_KEY = 'selected_shop';

// User 타입을 그대로 사용하여 타입 일관성 확보
export type UserData = User;

class UserDataService {
  // 사용자 정보 저장
  async saveUser(user: UserData): Promise<void> {
    try {
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    } catch (error) {
      console.error('사용자 정보 저장 실패:', error);
    }
  }

  // 사용자 정보 불러오기
  async getUser(): Promise<UserData | null> {
    try {
      const userData = await AsyncStorage.getItem(USER_STORAGE_KEY);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('사용자 정보 불러오기 실패:', error);
      return null;
    }
  }

  // 사용자 정보 삭제
  async removeUser(): Promise<void> {
    try {
      await AsyncStorage.removeItem(USER_STORAGE_KEY);
    } catch (error) {
      console.error('사용자 정보 삭제 실패:', error);
    }
  }

  // 선택된 상점 정보 저장
  async saveSelectedShop(shop: Shop): Promise<void> {
    try {
      await AsyncStorage.setItem(SELECTED_SHOP_STORAGE_KEY, JSON.stringify(shop));
    } catch (error) {
      console.error('선택된 상점 정보 저장 실패:', error);
    }
  }

  // 선택된 상점 정보 불러오기
  async getSelectedShop(): Promise<Shop | null> {
    try {
      const shopData = await AsyncStorage.getItem(SELECTED_SHOP_STORAGE_KEY);
      return shopData ? JSON.parse(shopData) : null;
    } catch (error) {
      console.error('선택된 상점 정보 불러오기 실패:', error);
      return null;
    }
  }

  // 선택된 상점 정보 삭제
  async removeSelectedShop(): Promise<void> {
    try {
      await AsyncStorage.removeItem(SELECTED_SHOP_STORAGE_KEY);
    } catch (error) {
      console.error('선택된 상점 정보 삭제 실패:', error);
    }
  }

  // API에서 최신 사용자 정보 가져와서 저장
  async fetchAndSaveUserData(): Promise<UserData | null> {
    try {
      const user = await authApiService.getMe();
      // API에서 받은 사용자 정보를 그대로 저장
      await this.saveUser(user);
      return user;
    } catch (error) {
      console.error('사용자 정보 API 요청 실패:', error);
      return null;
    }
  }

  // API에서 선택된 상점 정보 가져와서 저장
  async fetchAndSaveSelectedShop(): Promise<Shop | null> {
    try {
      const shop = await shopApiService.getSelected();
      await this.saveSelectedShop(shop);
      return shop;
    } catch (error) {
      console.error('선택된 상점 정보 API 요청 실패:', error);
      return null;
    }
  }

  // 상점 선택 후 로컬스토리지에 저장
  async selectShop(shopId: number): Promise<Shop | null> {
    try {
      await shopApiService.select(shopId);
      const shop = await shopApiService.getSelected();
      await this.saveSelectedShop(shop);
      return shop;
    } catch (error) {
      console.error('상점 선택 실패:', error);
      return null;
    }
  }

  // 모든 데이터 초기화 (로그아웃시 사용)
  async clearAllData(): Promise<void> {
    try {
      await Promise.all([
        this.removeUser(),
        this.removeSelectedShop(),
      ]);
    } catch (error) {
      console.error('데이터 초기화 실패:', error);
    }
  }

  // 앱 시작시 저장된 데이터 복원
  async restoreData(): Promise<{ user: UserData | null; shop: Shop | null }> {
    try {
      const [user, shop] = await Promise.all([
        this.getUser(),
        this.getSelectedShop(),
      ]);
      return { user, shop };
    } catch (error) {
      console.error('데이터 복원 실패:', error);
      return { user: null, shop: null };
    }
  }
}

export const userDataService = new UserDataService();
