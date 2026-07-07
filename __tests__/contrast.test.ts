// SPEC-UX-001 (AC-01 ~ AC-03): WCAG 대비 헬퍼 검증 + 신규 토큰이 4.5:1을 만족함을 단언.
import { contrastRatio, hexToRgb, meetsAA, relativeLuminance } from '@/src/utils/contrast';

describe('WCAG contrast helper', () => {
  it('parses 6-digit and 3-digit hex', () => {
    expect(hexToRgb('#ffffff')).toEqual({ r: 255, g: 255, b: 255 });
    expect(hexToRgb('#000')).toEqual({ r: 0, g: 0, b: 0 });
    expect(hexToRgb('#6b7280')).toEqual({ r: 107, g: 114, b: 128 });
  });

  it('computes known luminance bounds', () => {
    expect(relativeLuminance('#ffffff')).toBeCloseTo(1, 5);
    expect(relativeLuminance('#000000')).toBeCloseTo(0, 5);
  });

  it('computes known contrast ratios', () => {
    // 흑/백 = 21:1 (WCAG 최대)
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 1);
    // 동일 색 = 1:1
    expect(contrastRatio('#123456', '#123456')).toBeCloseTo(1, 5);
  });

  it('flags the OLD low-contrast tokens as failing (baseline evidence)', () => {
    // 개선 전 값들이 실제로 4.5:1 미만이었음을 특성 기록으로 남긴다.
    expect(meetsAA('#9ca3af', '#ffffff')).toBe(false); // 기존 text.muted
    expect(meetsAA('#999999', '#ffffff')).toBe(false); // 기존 플레이스홀더
  });
});

describe('SPEC-UX-001 REQ-UX-001: text tokens meet AA on white', () => {
  const WHITE = '#ffffff';
  it.each([
    ['text.muted (#6b7280)', '#6b7280'],
    ['text.secondary (#6b7280)', '#6b7280'],
    ['placeholder (#6b7280)', '#6b7280'],
    ['gray[700] reinforced (#374151)', '#374151'],
    ['text.primary (#111827)', '#111827'],
  ])('%s >= 4.5:1', (_label, color) => {
    expect(contrastRatio(color, WHITE)).toBeGreaterThanOrEqual(4.5);
  });
});

describe('SPEC-UX-001 REQ-UX-002: status badges meet AA (white text)', () => {
  // 개선 후 배지 배경색(어둡게 조정) + 흰색 텍스트 조합. BookingListScreen.tsx statusColors 와 동기화.
  const WHITE = '#ffffff';
  const badgeColors: Record<string, string> = {
    RESERVED: '#4f46e5',
    VISITED: '#a21caf',
    COMPLETED: '#0369a1',
    CANCELLED: '#dc2626',
    NO_SHOW: '#b45309',
  };
  it.each(Object.entries(badgeColors))('%s badge >= 4.5:1', (_status, bg) => {
    expect(contrastRatio(WHITE, bg)).toBeGreaterThanOrEqual(4.5);
  });
});
