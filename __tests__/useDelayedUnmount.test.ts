// REQ-PERF-003-02: 조건부 마운트 모달의 닫힘 애니메이션 보존 — useDelayedUnmount 단위 테스트.
// 열리면 즉시 마운트, 닫히면 지연 시간 동안 마운트 유지 후 언마운트, 지연 중 재오픈은 언마운트 취소,
// 언마운트 시 대기 중인 타이머 정리를 검증한다.
import { act, renderHook } from '@testing-library/react-native';
import { MODAL_CLOSE_UNMOUNT_DELAY_MS, useDelayedUnmount } from '@/hooks/useDelayedUnmount';

function setup(initialVisible: boolean, delayMs?: number) {
  return renderHook(({ visible }: { visible: boolean }) => useDelayedUnmount(visible, delayMs), {
    initialProps: { visible: initialVisible },
  });
}

describe('useDelayedUnmount (REQ-PERF-003-02)', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('닫힌 채로 시작하면 마운트하지 않는다', () => {
    const { result } = setup(false);
    expect(result.current).toBe(false);
  });

  it('열린 채로 시작하면 마운트한다', () => {
    const { result } = setup(true);
    expect(result.current).toBe(true);
  });

  it('열리면 같은 렌더에서 즉시 마운트한다', () => {
    const { result, rerender } = setup(false);
    rerender({ visible: true });
    expect(result.current).toBe(true);
  });

  it('닫힌 뒤 지연 시간 동안은 마운트를 유지하고, 지연이 지나면 언마운트한다', () => {
    const { result, rerender } = setup(true);
    rerender({ visible: false });
    // 닫힌 직후: 닫힘 애니메이션 동안 마운트 유지
    expect(result.current).toBe(true);

    act(() => {
      jest.advanceTimersByTime(MODAL_CLOSE_UNMOUNT_DELAY_MS - 1);
    });
    expect(result.current).toBe(true);

    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(result.current).toBe(false);
  });

  it('지연 중 다시 열면 예약된 언마운트를 취소한다', () => {
    const { result, rerender } = setup(true);
    rerender({ visible: false });
    act(() => {
      jest.advanceTimersByTime(MODAL_CLOSE_UNMOUNT_DELAY_MS - 1);
    });

    rerender({ visible: true });
    act(() => {
      jest.advanceTimersByTime(MODAL_CLOSE_UNMOUNT_DELAY_MS * 2);
    });
    expect(result.current).toBe(true);

    // 다시 닫으면 지연 시간 전체를 새로 기다린 뒤 언마운트한다.
    rerender({ visible: false });
    act(() => {
      jest.advanceTimersByTime(MODAL_CLOSE_UNMOUNT_DELAY_MS - 1);
    });
    expect(result.current).toBe(true);
    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(result.current).toBe(false);
  });

  it('delayMs 인자로 지연 시간을 바꿀 수 있다', () => {
    const { result, rerender } = setup(true, 50);
    rerender({ visible: false });
    act(() => {
      jest.advanceTimersByTime(49);
    });
    expect(result.current).toBe(true);
    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(result.current).toBe(false);
  });

  it('닫힌 채로 시작하면 타이머를 만들지 않는다', () => {
    const before = jest.getTimerCount();
    setup(false);
    expect(jest.getTimerCount()).toBe(before);
  });

  it('지연 중 컴포넌트가 내려가면 대기 중인 타이머를 정리한다', () => {
    const { rerender, unmount } = setup(true);
    rerender({ visible: false });
    const pending = jest.getTimerCount();
    expect(pending).toBeGreaterThanOrEqual(1);

    unmount();
    expect(jest.getTimerCount()).toBe(pending - 1);
  });

  it('기본 지연 시간은 slide/pageSheet 닫힘 애니메이션(약 300ms)보다 길다', () => {
    expect(MODAL_CLOSE_UNMOUNT_DELAY_MS).toBeGreaterThan(300);
  });
});
