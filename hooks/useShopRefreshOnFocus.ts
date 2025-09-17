import { useShopStore } from '@/src/stores/shopStore';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';

export function useShopRefreshOnFocus() {
  const { selectedShop, loadSelectedShop } = useShopStore();

  useFocusEffect(
    useCallback(() => {
      // 화면이 포커스될 때만 상점 정보 새로고침
      // 하지만 너무 자주 호출되지 않도록 조건부로 실행
      if (!selectedShop) {
        loadSelectedShop();
      }
    }, [selectedShop, loadSelectedShop])
  );
}
