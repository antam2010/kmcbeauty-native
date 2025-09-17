// =============================================================================
// 🧩 UI 컴포넌트 인덱스 (KMC Beauty App)
// =============================================================================

// 기본 컴포넌트 (Atoms)
export { BaseButton } from './atoms/BaseButton';
export { BaseInput } from './atoms/BaseInput';

// 복합 컴포넌트 (Molecules)  
export { BaseModal } from './molecules/BaseModal';

// 타입 정의 (ThemeColors 제외)
export type {
    AnimatedProps, BaseComponentProps, Breakpoint, ButtonProps, ButtonSize, ButtonVariant, CardProps, DatePickerProps, EmptyStateProps, FormFieldProps,
    FormSectionProps, GridProps, InputProps, InputSize, LayoutProps, ListItemProps, LoadingProps, ModalContentProps, ModalHeaderProps, PickerItem,
    PickerProps, ResponsiveValue, SearchProps, StatusBadgeProps, StatusType, TabItem,
    TabsProps, ThemeColorSchema
} from './types';

// 테마
export {
    Animation, BorderRadius, Breakpoints, Colors, Shadow, Spacing, ThemeColors, Typography
} from './theme';

