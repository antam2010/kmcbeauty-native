// SPEC-UX-001 (REQ-UX-001/002, AC-01~AC-03): WCAG 2.1 명도 대비 계산 유틸리티.
// 시니어 시인성(대비 4.5:1) 검증을 코드로 조작 가능하게(operationalize) 만든다.
// 참고: https://www.w3.org/TR/WCAG21/#dfn-relative-luminance

export interface RGB {
  r: number;
  g: number;
  b: number;
}

/** '#rrggbb' 또는 '#rgb' 형식의 hex 문자열을 0~255 RGB로 변환한다. */
export function hexToRgb(hex: string): RGB {
  let normalized = hex.trim().replace(/^#/, '');
  if (normalized.length === 3) {
    normalized = normalized
      .split('')
      .map((c) => c + c)
      .join('');
  }
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
    throw new Error(`Invalid hex color: ${hex}`);
  }
  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16),
  };
}

/** 단일 sRGB 채널(0~1)을 선형화한다. */
function linearize(channel: number): number {
  const c = channel / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/** WCAG 상대 휘도(relative luminance, 0~1)를 계산한다. */
export function relativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}

/**
 * 두 색상 간 WCAG 명도 대비비를 계산한다. 결과 범위는 1(동일) ~ 21(흑/백).
 * @returns 대비비 (예: 4.5 이상이면 본문 텍스트 AA 통과)
 */
export function contrastRatio(foreground: string, background: string): number {
  const l1 = relativeLuminance(foreground);
  const l2 = relativeLuminance(background);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/** WCAG AA 본문 텍스트 기준(4.5:1) 충족 여부. */
export function meetsAA(foreground: string, background: string): boolean {
  return contrastRatio(foreground, background) >= 4.5;
}
