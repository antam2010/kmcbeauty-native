// =============================================================================
// 🔧 공통 UI 타입 정의 (KMC Beauty App)
// =============================================================================

import { ComponentProps, ReactNode } from 'react';
import { TextStyle, ViewStyle } from 'react-native';

// 기본 컴포넌트 프롭스
export interface BaseComponentProps {
  children?: ReactNode;
  style?: ViewStyle | ViewStyle[];
  testID?: string;
}

// 모달 관련 타입
export interface ModalHeaderProps {
  title?: string;
  subtitle?: string;
  showCloseButton?: boolean;
  closeButtonPosition?: 'left' | 'right';
  onClose?: () => void;
  headerLeft?: ReactNode;
  headerRight?: ReactNode;
}

export interface ModalContentProps {
  children: ReactNode;
  containerStyle?: ViewStyle;
  scrollable?: boolean;
  keyboardAware?: boolean;
}

// 버튼 관련 타입
export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'success' | 'outline' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends BaseComponentProps {
  title?: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: ButtonVariant;
  size?: ButtonSize;
  textStyle?: TextStyle;
  activeOpacity?: number;
  hitSlop?: { top: number; bottom: number; left: number; right: number };
}

// 입력 필드 관련 타입
export type InputSize = 'sm' | 'md' | 'lg';

export interface InputProps extends BaseComponentProps {
  label?: string;
  error?: string;
  success?: string;
  helperText?: string;
  placeholder?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  hasError?: boolean;
  hasSuccess?: boolean;
  size?: InputSize;
  multiline?: boolean;
  numberOfLines?: number;
  editable?: boolean;
  keyboardType?: ComponentProps<typeof import('react-native').TextInput>['keyboardType'];
  autoCapitalize?: ComponentProps<typeof import('react-native').TextInput>['autoCapitalize'];
  secureTextEntry?: boolean;
  maxLength?: number;
}

// 카드 관련 타입
export interface CardProps extends BaseComponentProps {
  variant?: 'default' | 'outlined' | 'elevated';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  borderRadius?: 'none' | 'sm' | 'md' | 'lg';
}

// 리스트 관련 타입
export interface ListItemProps extends BaseComponentProps {
  title: string;
  subtitle?: string;
  description?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  showDivider?: boolean;
}

// 상태 배지 타입
export type StatusType = 'RESERVED' | 'VISITED' | 'COMPLETED' | 'CANCELED' | 'NO_SHOW';

export interface StatusBadgeProps {
  status: StatusType;
  text?: string;
  size?: 'sm' | 'md' | 'lg';
}

// 폼 관련 타입
export interface FormFieldProps {
  name: string;
  label?: string;
  required?: boolean;
  error?: string;
}

export interface FormSectionProps extends BaseComponentProps {
  title?: string;
  subtitle?: string;
  collapsible?: boolean;
  defaultExpanded?: boolean;
}

// 로딩 관련 타입
export interface LoadingProps {
  visible?: boolean;
  text?: string;
  size?: 'small' | 'large';
}

// 빈 상태 타입
export interface EmptyStateProps extends BaseComponentProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: {
    title: string;
    onPress: () => void;
  };
}

// 애니메이션 관련 타입
export interface AnimatedProps {
  animationType?: 'none' | 'fade' | 'slide' | 'scale';
  duration?: number;
  delay?: number;
}

// 테마 관련 타입
export interface ThemeColorSchema {
  primary: string;
  secondary: string;
  success: string;
  warning: string;
  error: string;
  info: string;
  background: string;
  surface: string;
  text: {
    primary: string;
    secondary: string;
    muted: string;
    inverse: string;
  };
  border: string;
  shadow: string;
}

// 반응형 관련 타입
export type Breakpoint = 'sm' | 'md' | 'lg' | 'xl';

export interface ResponsiveValue<T> {
  sm?: T;
  md?: T;
  lg?: T;
  xl?: T;
}

// 레이아웃 관련 타입
export interface LayoutProps {
  flex?: number;
  flexDirection?: 'row' | 'column';
  justifyContent?: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly';
  alignItems?: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline';
  padding?: number | string;
  paddingTop?: number | string;
  paddingRight?: number | string;
  paddingBottom?: number | string;
  paddingLeft?: number | string;
  paddingHorizontal?: number | string;
  paddingVertical?: number | string;
  margin?: number | string;
  marginTop?: number | string;
  marginRight?: number | string;
  marginBottom?: number | string;
  marginLeft?: number | string;
  marginHorizontal?: number | string;
  marginVertical?: number | string;
}

// 그리드 관련 타입
export interface GridProps extends BaseComponentProps {
  columns?: number;
  gap?: number;
  data: any[];
  renderItem: (item: any, index: number) => ReactNode;
  keyExtractor?: (item: any, index: number) => string;
}

// 탭 관련 타입
export interface TabItem {
  key: string;
  title: string;
  content: ReactNode;
  disabled?: boolean;
  badge?: string | number;
}

export interface TabsProps extends BaseComponentProps {
  items: TabItem[];
  activeKey?: string;
  onTabChange?: (key: string) => void;
  variant?: 'line' | 'pill';
  scrollable?: boolean;
}

// 검색 관련 타입
export interface SearchProps extends InputProps {
  onSearch?: (query: string) => void;
  onClear?: () => void;
  showClearButton?: boolean;
  debounceMs?: number;
}

// 날짜 선택기 관련 타입
export interface DatePickerProps {
  value?: Date;
  onChange?: (date: Date) => void;
  minimumDate?: Date;
  maximumDate?: Date;
  mode?: 'date' | 'time' | 'datetime';
  format?: string;
  placeholder?: string;
  disabled?: boolean;
}

// 선택기 관련 타입
export interface PickerItem {
  label: string;
  value: any;
  disabled?: boolean;
}

export interface PickerProps {
  items: PickerItem[];
  selectedValue?: any;
  onValueChange?: (value: any) => void;
  placeholder?: string;
  disabled?: boolean;
  searchable?: boolean;
}
