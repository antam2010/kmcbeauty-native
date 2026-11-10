import { useEffect, useState } from 'react';

// slide/pageSheet 닫힘 애니메이션(약 300ms)에 기기별 편차를 감안한 여유를 더한 값이다.
// 예약 탭이 "모달이 완전히 닫힌 후" 상태를 리셋할 때 기다리는 시간(booking.tsx 500ms)과 같다.
// 지연이 길어도 손해가 거의 없다. iOS 의 RN Modal 은 닫힘이 끝나면(onDismiss) 스스로 자식을 언마운트하고,
// Android 는 visible=false 가 되는 즉시 언마운트한다. 반대로 짧으면 애니메이션 도중 내용이 사라질 수 있다.
export const MODAL_CLOSE_UNMOUNT_DELAY_MS = 500;

// @MX:NOTE: [AUTO] 조건부 마운트 모달의 닫힘 애니메이션 보존(REQ-PERF-003-02). 닫는 순간 Modal 을 트리에서 빼면
//   닫힘 애니메이션이 생략되거나 정지 화면(스냅샷)으로 재생될 수 있어, 지연 동안 visible=false 로 마운트를 유지한다.
// @MX:ANCHOR: [AUTO] 조건부 마운트 모달 4곳(홈 월간 현황, 시술 메뉴·세부 항목, 연락처 동기화)의 마운트 여부를 정한다.
// @MX:REASON: 지연을 없애면 닫힘 애니메이션이 다시 끊기고, 지연 뒤 false 로 돌아가지 않으면 닫힌 모달이 계속
//   마운트돼 "닫힌 동안 모달 하위 트리를 마운트하지 않는다"(REQ-PERF-003-02/05)가 깨진다.
// @MX:SPEC: SPEC-PERF-003
/**
 * 모달을 마운트해 둘지 여부를 반환한다.
 * visible 이 true 가 되면 같은 렌더에서 바로 true, false 가 되면 delayMs 동안 true 를 유지한 뒤 false 가 된다.
 * 지연 중 다시 열리면 예약된 언마운트를 취소하고, 컴포넌트가 언마운트되면 대기 중인 타이머를 정리한다.
 */
export function useDelayedUnmount(
  visible: boolean,
  delayMs: number = MODAL_CLOSE_UNMOUNT_DELAY_MS,
): boolean {
  const [mounted, setMounted] = useState(visible);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      return;
    }
    if (!mounted) return;
    const timer = setTimeout(() => setMounted(false), delayMs);
    return () => clearTimeout(timer);
  }, [visible, mounted, delayMs]);

  return visible || mounted;
}
