// SPEC-PERF-003 (PRESERVE): 스토어 셀렉터 구독 특성 테스트 (REQ-PERF-003-08).
// 필드 셀렉터로 구독한 컴포넌트는 무관한 스토어 필드(loading) 변경 시 리렌더되지 않아야 한다.
import { act, render } from '@testing-library/react-native';
import React from 'react';
import { Text } from 'react-native';

// 스토어는 api client 를 전이적으로 로드하므로 env 를 먼저 설정한다(api-client.test.ts 패턴).
process.env.EXPO_PUBLIC_API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || 'https://api.test.local';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { useShopStore } = require('@/src/stores/shopStore');

describe('useShopStore 필드 셀렉터 구독 (REQ-PERF-003-08)', () => {
  it('무관 필드(loading) 변경은 selectedShop 구독 컴포넌트를 리렌더하지 않는다', () => {
    const renderSpy = jest.fn();

    function Probe() {
      const selectedShop = useShopStore((s: any) => s.selectedShop);
      renderSpy();
      return <Text>{selectedShop?.name ?? 'none'}</Text>;
    }

    act(() => {
      useShopStore.setState({ selectedShop: null, loading: false });
    });

    render(<Probe />);
    const initialRenders = renderSpy.mock.calls.length;

    // 무관 필드만 변경 → 리렌더 없음
    act(() => {
      useShopStore.setState({ loading: true });
    });
    expect(renderSpy.mock.calls.length).toBe(initialRenders);

    // 구독 필드 변경 → 리렌더 발생
    act(() => {
      useShopStore.setState({ selectedShop: { id: 9, name: '샵' } });
    });
    expect(renderSpy.mock.calls.length).toBeGreaterThan(initialRenders);
  });
});
