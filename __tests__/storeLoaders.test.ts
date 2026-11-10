// SPEC-DATA-001 REQ-DATA-001-08 (F-15) AC-15: 스토어 모듈을 최초 1회만 동적 import 후 캐시 참조 재사용.
// 실제 dynamic import 는 jest CJS VM 에서 실행 불가하므로 importers 경계를 스텁하여 호출 횟수를 검증한다.
import { importers, loadAuthStore, loadShopStore, __resetStoreLoaders } from '@/src/api/storeLoaders';

describe('SPEC-DATA-001 storeLoaders 캐싱', () => {
  const fakeAuth = { getState: () => ({}) } as any;
  const fakeShop = { getState: () => ({}) } as any;
  let authImport: jest.Mock;
  let shopImport: jest.Mock;

  beforeEach(() => {
    __resetStoreLoaders();
    authImport = jest.fn(async () => ({ useAuthStore: fakeAuth }));
    shopImport = jest.fn(async () => ({ useShopStore: fakeShop }));
    importers.auth = authImport as any;
    importers.shop = shopImport as any;
  });

  it('AC-15: 반복 호출해도 dynamic import(importers.auth)는 정확히 1회만 실행된다', async () => {
    const p1 = loadAuthStore();
    const p2 = loadAuthStore();
    const p3 = loadAuthStore();
    // 캐시된 동일 Promise 참조 재사용.
    expect(p1).toBe(p2);
    expect(p2).toBe(p3);
    // 최초 1회만 import.
    expect(authImport).toHaveBeenCalledTimes(1);
    await expect(p1).resolves.toBe(fakeAuth);
  });

  it('AC-15: shop 스토어도 최초 1회만 import 후 캐시 참조 재사용', async () => {
    const p1 = loadShopStore();
    const p2 = loadShopStore();
    expect(p1).toBe(p2);
    expect(shopImport).toHaveBeenCalledTimes(1);
    await expect(p1).resolves.toBe(fakeShop);
  });

  it('AC-15: __resetStoreLoaders 이후에는 재-import(새 캐시)한다', () => {
    loadAuthStore();
    expect(authImport).toHaveBeenCalledTimes(1);
    __resetStoreLoaders();
    loadAuthStore();
    expect(authImport).toHaveBeenCalledTimes(2);
  });
});
