import { BorderRadius, Colors, Spacing, Typography } from '@/src/ui/theme';
import React, { ReactNode } from 'react';
import {
    Modal,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export interface BaseModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: ReactNode;
  
  // 헤더 설정
  showHeader?: boolean;
  showCloseButton?: boolean;
  closeButtonPosition?: 'left' | 'right';
  headerLeft?: ReactNode;
  headerRight?: ReactNode;
  
  // 모달 설정
  presentationStyle?: 'fullScreen' | 'pageSheet' | 'formSheet' | 'overFullScreen';
  animationType?: 'none' | 'slide' | 'fade';
  transparent?: boolean;
  
  // 스타일 커스터마이징
  containerStyle?: any;
  headerStyle?: any;
  contentStyle?: any;
}

export const BaseModal: React.FC<BaseModalProps> = ({
  visible,
  onClose,
  title,
  subtitle,
  children,
  showHeader = true,
  showCloseButton = true,
  closeButtonPosition = 'right',
  headerLeft,
  headerRight,
  presentationStyle = 'pageSheet',
  animationType = 'slide',
  transparent = false,
  containerStyle,
  headerStyle,
  contentStyle,
}) => {
  const insets = useSafeAreaInsets();

  const renderCloseButton = () => (
    <TouchableOpacity
      onPress={onClose}
      style={styles.closeButton}
      activeOpacity={0.7}
      hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
    >
      <Text style={styles.closeButtonText}>✕</Text>
    </TouchableOpacity>
  );

  const renderHeader = () => {
    if (!showHeader) return null;

    return (
      <View style={[styles.header, headerStyle]}>
        {/* 왼쪽 영역 */}
        <View style={styles.headerSide}>
          {closeButtonPosition === 'left' && showCloseButton && renderCloseButton()}
          {headerLeft}
        </View>

        {/* 중앙 영역 */}
        <View style={styles.headerCenter}>
          {title && <Text style={styles.title}>{title}</Text>}
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>

        {/* 오른쪽 영역 */}
        <View style={styles.headerSide}>
          {headerRight}
          {closeButtonPosition === 'right' && showCloseButton && renderCloseButton()}
        </View>
      </View>
    );
  };

  if (transparent) {
    return (
      <Modal
        visible={visible}
        transparent
        animationType={animationType}
        onRequestClose={onClose}
      >
        <StatusBar barStyle="light-content" backgroundColor="rgba(0,0,0,0.5)" />
        <View style={[styles.transparentContainer, containerStyle]}>
          <View style={[styles.transparentModal, { paddingTop: insets.top }]}>
            {renderHeader()}
            <View style={[styles.content, contentStyle]}>
              {children}
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal
      visible={visible}
      animationType={animationType}
      presentationStyle={presentationStyle}
      onRequestClose={onClose}
    >
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />
      <View style={[styles.container, { paddingTop: insets.top }, containerStyle]}>
        {renderHeader()}
        <View style={[styles.content, contentStyle]}>
          {children}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  // 일반 모달 스타일
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  
  // 투명 모달 스타일
  transparentContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  transparentModal: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    maxHeight: '90%',
  },
  
  // 헤더 스타일
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
    minHeight: 56,
  },
  headerSide: {
    width: 40,
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  
  // 제목 스타일
  title: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.normal,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginTop: 2,
  },
  
  // 닫기 버튼 스타일
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: Colors.text.secondary,
    fontWeight: '600',
  },
  
  // 콘텐츠 스타일
  content: {
    flex: 1,
    backgroundColor: Colors.backgroundSecondary,
  },
});
