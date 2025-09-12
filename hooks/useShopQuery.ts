import { shopApiService, type Shop } from '@/src/api/services/shop';
import { useCallback, useEffect, useState } from 'react';

interface UseShopQueryOptions {
  enabled?: boolean;
  refetchOnMount?: boolean;
  staleTime?: number; // 데이터가 stale 상태가 되기까지의 시간 (ms)
  cacheTime?: number; // 캐시 유지 시간 (ms)
}

interface UseShopQueryResult {
  data: Shop | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  isStale: boolean;
}

// 간단한 캐시 시스템
let cachedShop: Shop | null = null;
let cacheTimestamp: number = 0;
let isLoading = false;

export function useShopQuery(options: UseShopQueryOptions = {}): UseShopQueryResult {
  const {
    enabled = true,
    refetchOnMount = true,
    staleTime = 5 * 60 * 1000, // 5분
    cacheTime = 10 * 60 * 1000, // 10분
  } = options;

  const [data, setData] = useState<Shop | null>(cachedShop);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isStale = Date.now() - cacheTimestamp > staleTime;
  const isCacheExpired = Date.now() - cacheTimestamp > cacheTime;

  const fetchShop = useCallback(async () => {
    if (isLoading) return; // 중복 요청 방지
    
    isLoading = true;
    setLoading(true);
    setError(null);

    try {
      const shop = await shopApiService.getSelected();
      cachedShop = shop;
      cacheTimestamp = Date.now();
      setData(shop);
    } catch (err: any) {
      const errorMessage = err.message || '상점 정보를 불러올 수 없습니다.';
      setError(errorMessage);
      
      // 404 에러인 경우 캐시 초기화
      if (err.response?.status === 404) {
        cachedShop = null;
        cacheTimestamp = 0;
        setData(null);
      }
    } finally {
      setLoading(false);
      isLoading = false;
    }
  }, []);

  const refetch = useCallback(async () => {
    await fetchShop();
  }, [fetchShop]);

  useEffect(() => {
    if (!enabled) return;

    // 캐시가 만료된 경우
    if (isCacheExpired) {
      cachedShop = null;
      cacheTimestamp = 0;
      setData(null);
    }

    // 캐시된 데이터가 없거나 stale한 경우, 또는 마운트시 refetch가 설정된 경우
    if (!cachedShop || isStale || refetchOnMount) {
      fetchShop();
    } else {
      // 캐시된 데이터 사용
      setData(cachedShop);
    }
  }, [enabled, refetchOnMount, fetchShop, isStale, isCacheExpired]);

  return {
    data,
    loading,
    error,
    refetch,
    isStale,
  };
}

// 캐시 무효화 함수
export function invalidateShopCache() {
  cachedShop = null;
  cacheTimestamp = 0;
}

// 캐시 업데이트 함수
export function updateShopCache(shop: Shop | null) {
  cachedShop = shop;
  cacheTimestamp = Date.now();
}
