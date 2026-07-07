// SPEC-UX-001 (REQ-UX-005, AC-07): BaseButton 특성 + 접근성 props 검증.
import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';
import { BaseButton } from '@/src/ui/atoms/BaseButton';

describe('BaseButton characterization', () => {
  it('renders the title text', () => {
    const { getByText } = render(<BaseButton title="예약하기" onPress={() => {}} />);
    expect(getByText('예약하기')).toBeTruthy();
  });

  it('fires onPress when tapped', () => {
    const onPress = jest.fn();
    const { getByText } = render(<BaseButton title="확인" onPress={onPress} />);
    fireEvent.press(getByText('확인'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not fire onPress when disabled', () => {
    const onPress = jest.fn();
    const { getByText } = render(<BaseButton title="확인" onPress={onPress} disabled />);
    fireEvent.press(getByText('확인'));
    expect(onPress).not.toHaveBeenCalled();
  });
});

describe('SPEC-UX-001 REQ-UX-005: BaseButton accessibility props', () => {
  it('defaults accessibilityRole to "button"', () => {
    const { getByRole } = render(<BaseButton title="저장" onPress={() => {}} />);
    expect(getByRole('button')).toBeTruthy();
  });

  it('passes through a custom accessibilityLabel', () => {
    const { getByLabelText } = render(
      <BaseButton title="" onPress={() => {}} accessibilityLabel="새로고침" />,
    );
    expect(getByLabelText('새로고침')).toBeTruthy();
  });

  it('exposes disabled state to assistive tech', () => {
    const { getByRole } = render(<BaseButton title="저장" onPress={() => {}} disabled />);
    expect(getByRole('button').props.accessibilityState).toMatchObject({ disabled: true });
  });
});
