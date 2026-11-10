// SPEC-UX-001 (REQ-UX-001, AC-01/AC-11): 디자인 토큰 특성 테스트.
// 팔레트 구조를 스냅샷으로 고정하고, 상향된 텍스트 토큰 값을 명시적으로 단언한다.
import { contrastRatio } from '@/src/utils/contrast';
import { Colors, Typography } from '@/src/ui/theme';

describe('SPEC-UX-001 theme tokens', () => {
  it('grayscale palette structure is preserved', () => {
    // 팔레트 스케일(gray) 자체는 변경하지 않는다(리브랜딩 금지).
    expect(Colors.gray).toMatchSnapshot();
  });

  it('text tokens are raised to AA-compliant values', () => {
    expect(Colors.text.primary).toBe('#111827');
    expect(Colors.text.secondary).toBe('#6b7280');
    // REQ-UX-001: muted 를 #9ca3af -> gray[500](#6b7280) 이상으로 상향
    expect(Colors.text.muted).toBe('#6b7280');
  });

  it('every text token meets WCAG AA on white background', () => {
    const white = '#ffffff';
    (Object.entries(Colors.text) as [string, string][])
      .filter(([key]) => key !== 'inverse') // inverse 는 컬러 배경 위에서 사용
      .forEach(([, color]) => {
        expect(contrastRatio(color, white)).toBeGreaterThanOrEqual(4.5);
      });
  });

  it('typography scale is unchanged (no rebranding)', () => {
    expect(Typography.fontSize).toEqual({
      xs: 12,
      sm: 14,
      base: 16,
      lg: 18,
      xl: 20,
      '2xl': 24,
      '3xl': 30,
      '4xl': 36,
    });
  });
});
