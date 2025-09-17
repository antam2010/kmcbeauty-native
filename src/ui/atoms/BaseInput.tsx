import { BorderRadius, Colors, Spacing, Typography } from '@/src/ui/theme';
import { forwardRef } from 'react';
import {
    StyleSheet,
    Text,
    TextInput,
    TextInputProps,
    View,
    ViewStyle,
} from 'react-native';

export interface BaseInputProps extends TextInputProps {
  label?: string;
  error?: string;
  success?: string;
  helperText?: string;
  
  // 스타일
  containerStyle?: ViewStyle;
  inputStyle?: ViewStyle;
  
  // 상태
  hasError?: boolean;
  hasSuccess?: boolean;
  
  // 크기
  size?: 'sm' | 'md' | 'lg';
}

export const BaseInput = forwardRef<TextInput, BaseInputProps>(({
  label,
  error,
  success,
  helperText,
  containerStyle,
  inputStyle,
  hasError = false,
  hasSuccess = false,
  size = 'md',
  ...props
}, ref) => {
  const getInputStyle = () => {
    const baseStyle = [styles.input, styles[size]] as any[];
    
    if (hasError || error) {
      baseStyle.push(styles.inputError);
    } else if (hasSuccess || success) {
      baseStyle.push(styles.inputSuccess);
    }
    
    if (inputStyle) {
      baseStyle.push(inputStyle);
    }
    
    return baseStyle;
  };

  const getMessage = () => {
    if (error) return { text: error, style: styles.errorText };
    if (success) return { text: success, style: styles.successText };
    if (helperText) return { text: helperText, style: styles.helperText };
    return null;
  };

  const message = getMessage();

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <TextInput
        ref={ref}
        style={getInputStyle()}
        placeholderTextColor={Colors.text.muted}
        {...props}
      />
      
      {message && (
        <Text style={message.style}>{message.text}</Text>
      )}
    </View>
  );
});

BaseInput.displayName = 'BaseInput';

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  
  label: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  
  input: {
    borderWidth: 1,
    borderColor: Colors.gray[300],
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.white,
    color: Colors.text.primary,
    fontSize: Typography.fontSize.base,
  },
  
  // 크기별 스타일
  sm: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    minHeight: 36,
  },
  md: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    minHeight: 44,
  },
  lg: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    minHeight: 52,
  },
  
  // 상태별 스타일
  inputError: {
    borderColor: Colors.error,
    backgroundColor: '#fef2f2',
  },
  inputSuccess: {
    borderColor: Colors.success,
    backgroundColor: '#f0fdf4',
  },
  
  // 메시지 텍스트
  errorText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.error,
    marginTop: Spacing.xs,
  },
  successText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.success,
    marginTop: Spacing.xs,
  },
  helperText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginTop: Spacing.xs,
  },
});
