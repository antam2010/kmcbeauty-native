// =============================================================================
// 🎨 통합 디자인 시스템 (KMC Beauty App)
// =============================================================================

import { StyleSheet } from 'react-native';

// 색상 팔레트
export const Colors = {
  // 기본 색상
  primary: '#6366f1',      // Indigo-500
  primaryDark: '#4f46e5',  // Indigo-600
  primaryLight: '#a5b4fc', // Indigo-300
  
  // 보조 색상
  secondary: '#06b6d4',    // Cyan-500
  secondaryDark: '#0891b2', // Cyan-600
  
  // 상태 색상
  success: '#10b981',      // Emerald-500
  warning: '#f59e0b',      // Amber-500
  error: '#ef4444',        // Red-500
  info: '#3b82f6',         // Blue-500
  
  // 그레이 스케일
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
  
  // 베이스 색상
  white: '#ffffff',
  black: '#000000',
  
  // 배경 색상
  background: '#ffffff',
  backgroundSecondary: '#f9fafb',
  
  // 텍스트 색상
  text: {
    primary: '#111827',
    secondary: '#6b7280',
    // SPEC-UX-001 REQ-UX-001: #9ca3af(대비 ≈2.5:1)는 WCAG AA 미달 → gray[500](#6b7280, ≈4.83:1)로 상향
    muted: '#6b7280',
    inverse: '#ffffff',
  },
  
  // 보더 색상
  border: {
    light: '#e5e7eb',
    medium: '#d1d5db',
    dark: '#9ca3af',
  },
  
  // 그림자 색상
  shadow: 'rgba(0, 0, 0, 0.1)',
} as const;

// 타이포그래피
export const Typography = {
  // 폰트 크기
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },
  
  // 폰트 가중치
  fontWeight: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  
  // 줄 높이
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const;

// 간격 시스템
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
} as const;

// 보더 반지름
export const BorderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
} as const;

// 그림자 스타일
export const Shadow = {
  sm: {
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  lg: {
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 5,
  },
} as const;

// 공통 버튼 스타일
export const ButtonStyles = StyleSheet.create({
  base: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  primary: {
    backgroundColor: Colors.primary,
  },
  secondary: {
    backgroundColor: Colors.secondary,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  disabled: {
    backgroundColor: Colors.gray[300],
  },
  small: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  large: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
  },
});

// 공통 텍스트 스타일
export const TextStyles = StyleSheet.create({
  h1: {
    fontSize: Typography.fontSize['4xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    lineHeight: Typography.fontSize['4xl'] * Typography.lineHeight.tight,
  },
  h2: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    lineHeight: Typography.fontSize['3xl'] * Typography.lineHeight.tight,
  },
  h3: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    lineHeight: Typography.fontSize['2xl'] * Typography.lineHeight.tight,
  },
  h4: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    lineHeight: Typography.fontSize.xl * Typography.lineHeight.normal,
  },
  body: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.normal,
    color: Colors.text.primary,
    lineHeight: Typography.fontSize.base * Typography.lineHeight.normal,
  },
  caption: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.normal,
    color: Colors.text.secondary,
    lineHeight: Typography.fontSize.sm * Typography.lineHeight.normal,
  },
  small: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.normal,
    color: Colors.text.muted,
    lineHeight: Typography.fontSize.xs * Typography.lineHeight.normal,
  },
});

// 공통 카드 스타일
export const CardStyles = StyleSheet.create({
  base: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadow.md,
  },
  compact: {
    padding: Spacing.md,
  },
  outline: {
    borderWidth: 1,
    borderColor: Colors.border.light,
    ...Shadow.sm,
  },
});

// 공통 입력 필드 스타일
export const InputStyles = StyleSheet.create({
  base: {
    borderWidth: 1,
    borderColor: Colors.border.medium,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
    backgroundColor: Colors.white,
  },
  focused: {
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  error: {
    borderColor: Colors.error,
  },
  disabled: {
    backgroundColor: Colors.gray[100],
    color: Colors.text.muted,
  },
});

// 공통 레이아웃 스타일
export const LayoutStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  padding: {
    padding: Spacing.lg,
  },
  paddingHorizontal: {
    paddingHorizontal: Spacing.lg,
  },
  paddingVertical: {
    paddingVertical: Spacing.lg,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spaceBetween: {
    justifyContent: 'space-between',
  },
  spaceAround: {
    justifyContent: 'space-around',
  },
});

// 애니메이션 상수
export const Animation = {
  timing: {
    fast: 200,
    normal: 300,
    slow: 500,
  },
  easing: {
    easeInOut: 'ease-in-out',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
  },
} as const;

// 반응형 브레이크포인트
export const Breakpoints = {
  sm: 480,
  md: 768,
  lg: 1024,
  xl: 1280,
} as const;

// 테마별 색상 (기존 Colors와 별도)
const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const ThemeColors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
};
