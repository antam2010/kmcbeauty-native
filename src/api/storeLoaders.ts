// SPEC-DATA-001 REQ-DATA-001-08 (F-15): 요청 인터셉터의 스토어 동적 import 캐싱.
// 순환 참조 회피(최초 호출 전까지 스토어 미평가)를 유지하면서, 매 요청마다 반복되던
// `await import(...)` 오버헤드를 제거한다 — 최초 1회 import 후 모듈 참조(Promise)를 캐시하고 재사용한다.
//
// 실제 dynamic import 는 `importers` 로 분리하여(주입 가능) 테스트에서 호출 횟수를 검증할 수 있게 한다.

import type { useAuthStore } from '../stores/authStore';
import type { useShopStore } from '../stores/shopStore';

type AuthStore = typeof useAuthStore;
type ShopStore = typeof useShopStore;

// dynamic import 경계(테스트에서 대체 가능). 런타임에서는 lazy import 로 순환 참조를 회피한다.
export const importers = {
  auth: (): Promise<{ useAuthStore: AuthStore }> => import('../stores/authStore'),
  shop: (): Promise<{ useShopStore: ShopStore }> => import('../stores/shopStore'),
};

let authStorePromise: Promise<AuthStore> | null = null;
let shopStorePromise: Promise<ShopStore> | null = null;

// @MX:NOTE: [AUTO] lazy on first call, cached after. 반환 Promise 참조는 최초 이후 불변이며
//   내부 importers 호출도 최초 1회로 수렴한다(반복 요청 시 재-import 없음).
export function loadAuthStore(): Promise<AuthStore> {
  if (!authStorePromise) {
    authStorePromise = importers.auth().then((m) => m.useAuthStore);
  }
  return authStorePromise;
}

export function loadShopStore(): Promise<ShopStore> {
  if (!shopStorePromise) {
    shopStorePromise = importers.shop().then((m) => m.useShopStore);
  }
  return shopStorePromise;
}

// 테스트 전용: 모듈 캐시 초기화(런타임 코드 경로에서는 호출하지 않는다).
export function __resetStoreLoaders(): void {
  authStorePromise = null;
  shopStorePromise = null;
}
