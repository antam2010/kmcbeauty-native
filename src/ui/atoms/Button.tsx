// =============================================================================
// 🎨 공통 버튼 컴포넌트
// =============================================================================

import React from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TextStyle,
    TouchableOpacity,
    TouchableOpacityProps,
    ViewStyle,
} from 'react-native';
import { ButtonStyles, Colors, Typography } from '../theme';

export interface ButtonProps extends Omit<TouchableOpacityProps, 'style'> {
  /** 버튼 텍스트 */
  title: string;
  /** 버튼 변형 */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  /** 버튼 크기 */
  size?: 'small' | 'medium' | 'large';
  /** 로딩 상태 */
  loading?: boolean;
  /** 전체 너비 사용 */
  fullWidth?: boolean;
  /** 커스텀 스타일 */
  style?: ViewStyle;
  /** 커스텀 텍스트 스타일 */
  textStyle?: TextStyle;
  /** 아이콘 컴포넌트 */
  icon?: React.ReactNode;
  /** 아이콘 위치 */
  iconPosition?: 'left' | 'right';
}

export const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  size = 'medium',
  loading = false,
  fullWidth = false,
  disabled = false,
  style,
  textStyle,
  icon,
  iconPosition = 'left',
  ...props
}) => {
  // 버튼 스타일 계산
  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle[] = [ButtonStyles.base];
    
    // 변형별 스타일
    switch (variant) {
      case 'primary':
        baseStyle.push(ButtonStyles.primary);
        break;
      case 'secondary':
        baseStyle.push(ButtonStyles.secondary);
        break;
      case 'outline':
        baseStyle.push(ButtonStyles.outline);
        break;
      case 'ghost':
        baseStyle.push({ backgroundColor: 'transparent' });
        break;
    }
    
    // 크기별 스타일
    switch (size) {
      case 'small':
        baseStyle.push(ButtonStyles.small);
        break;
      case 'large':
        baseStyle.push(ButtonStyles.large);
        break;
    }
    
    // 전체 너비
    if (fullWidth) {
      baseStyle.push({ width: '100%' });
    }
    
    // 비활성화 상태
    if (disabled || loading) {
      baseStyle.push(ButtonStyles.disabled);
    }
    
    // 커스텀 스타일
    if (style) {
      baseStyle.push(style);
    }
    
    return StyleSheet.flatten(baseStyle);
  };

  // 텍스트 스타일 계산
  const getTextStyle = (): TextStyle => {
    const baseTextStyle: TextStyle = {
      fontSize: size === 'small' ? Typography.fontSize.sm : 
                size === 'large' ? Typography.fontSize.lg : 
                Typography.fontSize.base,
      fontWeight: Typography.fontWeight.semibold,
    };
    
    // 변형별 텍스트 색상
    switch (variant) {
      case 'primary':
      case 'secondary':
        baseTextStyle.color = Colors.white;
        break;
      case 'outline':
        baseTextStyle.color = Colors.primary;
        break;
      case 'ghost':
        baseTextStyle.color = Colors.text.primary;
        break;
    }
    
    // 비활성화 상태
    if (disabled || loading) {
      baseTextStyle.color = Colors.text.muted;
    }
    
    // 커스텀 텍스트 스타일
    if (textStyle) {
      Object.assign(baseTextStyle, textStyle);
    }
    
    return baseTextStyle;
  };

  const renderContent = () => {
    if (loading) {
      return (
        <>
          <ActivityIndicator 
            size="small" 
            color={variant === 'outline' || variant === 'ghost' ? Colors.primary : Colors.white}
            style={{ marginRight: 8 }}
          />
          <Text style={getTextStyle()}>{title}</Text>
        </>
      );
    }

    if (icon) {
      return iconPosition === 'left' ? (
        <>
          {icon}
          <Text style={[getTextStyle(), { marginLeft: 8 }]}>{title}</Text>
        </>
      ) : (
        <>
          <Text style={[getTextStyle(), { marginRight: 8 }]}>{title}</Text>
          {icon}
        </>
      );
    }

    return <Text style={getTextStyle()}>{title}</Text>;
  };

  return (
    <TouchableOpacity
      style={getButtonStyle()}
      disabled={disabled || loading}
      activeOpacity={0.7}
      {...props}
    >
      {renderContent()}
    </TouchableOpacity>
  );
};
