import { BorderRadius, Colors, Shadow, Spacing, Typography } from '@/src/ui/theme';
import React, { ReactNode } from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TextStyle,
    TouchableOpacity,
    ViewStyle,
} from 'react-native';

export interface BaseButtonProps {
  title?: string;
  children?: ReactNode;
  onPress: () => void;
  
  // 버튼 상태
  disabled?: boolean;
  loading?: boolean;
  
  // 버튼 종류
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  
  // 스타일
  style?: ViewStyle;
  textStyle?: TextStyle;
  
  // 터치 설정
  activeOpacity?: number;
  hitSlop?: { top: number; bottom: number; left: number; right: number };
}

export const BaseButton: React.FC<BaseButtonProps> = ({
  title,
  children,
  onPress,
  disabled = false,
  loading = false,
  variant = 'primary',
  size = 'md',
  style,
  textStyle,
  activeOpacity = 0.7,
  hitSlop,
}) => {
  const buttonStyle = [
    styles.base,
    styles[size],
    styles[variant],
    disabled && styles.disabled,
    style,
  ];

  const buttonTextStyle = [
    styles.text,
    styles[`${size}Text`],
    styles[`${variant}Text`],
    disabled && styles.disabledText,
    textStyle,
  ];

  const renderContent = () => {
    if (loading) {
      return (
        <ActivityIndicator
          size={size === 'sm' ? 'small' : 'small'}
          color={variant === 'outline' || variant === 'ghost' ? Colors.primary : Colors.white}
        />
      );
    }

    if (children) {
      return children;
    }

    return <Text style={buttonTextStyle}>{title}</Text>;
  };

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={activeOpacity}
      hitSlop={hitSlop}
    >
      {renderContent()}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // 기본 스타일
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    borderRadius: BorderRadius.md,
  },

  // 크기별 스타일
  sm: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    minHeight: 36,
  },
  md: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    minHeight: 44,
  },
  lg: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    minHeight: 52,
  },

  // 변형별 스타일
  primary: {
    backgroundColor: Colors.primary,
    ...Shadow.sm,
  },
  secondary: {
    backgroundColor: Colors.gray[200],
  },
  danger: {
    backgroundColor: Colors.error,
    ...Shadow.sm,
  },
  success: {
    backgroundColor: Colors.success,
    ...Shadow.sm,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  ghost: {
    backgroundColor: 'transparent',
  },

  // 비활성화 상태
  disabled: {
    opacity: 0.5,
  },

  // 텍스트 스타일
  text: {
    fontWeight: Typography.fontWeight.semibold,
  },
  smText: {
    fontSize: Typography.fontSize.sm,
  },
  mdText: {
    fontSize: Typography.fontSize.base,
  },
  lgText: {
    fontSize: Typography.fontSize.lg,
  },

  // 변형별 텍스트 색상
  primaryText: {
    color: Colors.white,
  },
  secondaryText: {
    color: Colors.text.primary,
  },
  dangerText: {
    color: Colors.white,
  },
  successText: {
    color: Colors.white,
  },
  outlineText: {
    color: Colors.primary,
  },
  ghostText: {
    color: Colors.primary,
  },

  // 비활성화된 텍스트
  disabledText: {
    color: Colors.text.muted,
  },
});
