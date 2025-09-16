// =============================================================================
// 🎨 공통 텍스트 입력 컴포넌트
// =============================================================================

import { forwardRef, useState } from 'react';
import {
    TextInput as RNTextInput,
    TextInputProps as RNTextInputProps,
    StyleSheet,
    Text,
    TextStyle,
    View,
    ViewStyle,
} from 'react-native';
import { Colors, InputStyles, Spacing, Typography } from '../theme';

export interface TextInputProps extends RNTextInputProps {
  /** 라벨 텍스트 */
  label?: string;
  /** 에러 메시지 */
  error?: string;
  /** 도움말 텍스트 */
  helperText?: string;
  /** 입력 필드 크기 */
  size?: 'small' | 'medium' | 'large';
  /** 컨테이너 스타일 */
  containerStyle?: ViewStyle;
  /** 라벨 스타일 */
  labelStyle?: TextStyle;
  /** 에러 텍스트 스타일 */
  errorStyle?: TextStyle;
  /** 필수 입력 표시 */
  required?: boolean;
}

export const TextInput = forwardRef<RNTextInput, TextInputProps>(
  (
    {
      label,
      error,
      helperText,
      size = 'medium',
      containerStyle,
      labelStyle,
      errorStyle,
      required = false,
      style,
      editable = true,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);

    // 입력 필드 스타일 계산
    const getInputStyle = (): TextStyle => {
      const baseStyle: TextStyle[] = [InputStyles.base as TextStyle];

      // 크기별 스타일
      switch (size) {
        case 'small':
          baseStyle.push({
            paddingHorizontal: Spacing.sm,
            paddingVertical: Spacing.xs,
            fontSize: Typography.fontSize.sm,
          });
          break;
        case 'large':
          baseStyle.push({
            paddingHorizontal: Spacing.lg,
            paddingVertical: Spacing.md,
            fontSize: Typography.fontSize.lg,
          });
          break;
      }

      // 포커스 상태
      if (isFocused) {
        baseStyle.push(InputStyles.focused as TextStyle);
      }

      // 에러 상태
      if (error) {
        baseStyle.push(InputStyles.error as TextStyle);
      }

      // 비활성 상태
      if (!editable) {
        baseStyle.push(InputStyles.disabled as TextStyle);
      }

      // 커스텀 스타일
      if (style) {
        baseStyle.push(style as TextStyle);
      }

      return StyleSheet.flatten(baseStyle);
    };

    // 라벨 스타일
    const getLabelStyle = (): TextStyle => {
      const baseStyle: TextStyle = {
        fontSize: Typography.fontSize.sm,
        fontWeight: Typography.fontWeight.medium,
        color: Colors.text.primary,
        marginBottom: Spacing.xs,
      };

      if (labelStyle) {
        Object.assign(baseStyle, labelStyle);
      }

      return baseStyle;
    };

    // 에러/도움말 텍스트 스타일
    const getHelperTextStyle = (): TextStyle => {
      const baseStyle: TextStyle = {
        fontSize: Typography.fontSize.xs,
        marginTop: Spacing.xs,
        color: error ? Colors.error : Colors.text.secondary,
      };

      if (error && errorStyle) {
        Object.assign(baseStyle, errorStyle);
      }

      return baseStyle;
    };

    return (
      <View style={containerStyle}>
        {/* 라벨 */}
        {label && (
          <Text style={getLabelStyle()}>
            {label}
            {required && <Text style={{ color: Colors.error }}> *</Text>}
          </Text>
        )}

        {/* 입력 필드 */}
        <RNTextInput
          ref={ref}
          style={getInputStyle()}
          editable={editable}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          placeholderTextColor={Colors.text.muted}
          {...props}
        />

        {/* 에러 또는 도움말 텍스트 */}
        {(error || helperText) && (
          <Text style={getHelperTextStyle()}>
            {error || helperText}
          </Text>
        )}
      </View>
    );
  }
);

TextInput.displayName = 'TextInput';
