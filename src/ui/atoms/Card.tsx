// =============================================================================
// 🎨 공통 카드 컴포넌트
// =============================================================================

import React from 'react';
import {
    StyleSheet,
    TouchableOpacity,
    TouchableOpacityProps,
    View,
    ViewStyle,
} from 'react-native';
import { CardStyles, Shadow } from '../theme';

export interface CardProps {
  /** 카드 내용 */
  children: React.ReactNode;
  /** 카드 변형 */
  variant?: 'default' | 'outlined' | 'elevated' | 'compact';
  /** 터치 가능 여부 */
  touchable?: boolean;
  /** 터치 시 실행할 함수 */
  onPress?: () => void;
  /** 커스텀 스타일 */
  style?: ViewStyle;
  /** 터치 속성 (touchable이 true일 때만 적용) */
  touchableProps?: Omit<TouchableOpacityProps, 'style' | 'onPress'>;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  touchable = false,
  onPress,
  style,
  touchableProps,
}) => {
  // 카드 스타일 계산
  const getCardStyle = (): ViewStyle => {
    const baseStyle: ViewStyle[] = [CardStyles.base];
    
    switch (variant) {
      case 'outlined':
        baseStyle.push(CardStyles.outline);
        break;
      case 'elevated':
        baseStyle.push(Shadow.lg);
        break;
      case 'compact':
        baseStyle.push(CardStyles.compact);
        break;
    }
    
    if (style) {
      baseStyle.push(style);
    }
    
    return StyleSheet.flatten(baseStyle);
  };

  const cardStyle = getCardStyle();

  if (touchable || onPress) {
    return (
      <TouchableOpacity
        style={cardStyle}
        onPress={onPress}
        activeOpacity={0.7}
        {...touchableProps}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={cardStyle}>
      {children}
    </View>
  );
};
