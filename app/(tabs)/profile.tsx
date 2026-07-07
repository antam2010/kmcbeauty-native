import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import ShopHeader from '@/components/navigation/ShopHeader';
import { authApiService } from '@/src/api/services/auth';
import { useAuthStore } from '@/src/stores/authStore';
import { useShopStore } from '@/src/stores/shopStore';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Dimensions, Modal, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useShallow } from 'zustand/react/shallow';

const { width } = Dimensions.get('window');

export default function ProfileScreen() {
  // REQ-PERF-003-08: 필드 셀렉터 구독(다중 필드는 useShallow).
  const { logout, user } = useAuthStore(
    useShallow((s) => ({ logout: s.logout, user: s.user })),
  );
  const selectedShop = useShopStore((s) => s.selectedShop);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const currentShop = selectedShop;

  const handleLogout = () => {
    Alert.alert(
      '로그아웃',
      '정말 로그아웃하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        { 
          text: '로그아웃', 
          style: 'destructive',
          onPress: () => {
            logout();
            router.replace('/login');
          }
        },
      ]
    );
  };

  const handlePasswordChange = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert('오류', '새 비밀번호를 입력해주세요.');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('오류', '새 비밀번호가 일치하지 않습니다.');
      return;
    }

    if (newPassword.length < 4) {
      Alert.alert('오류', '새 비밀번호는 4자 이상이어야 합니다.');
      return;
    }

    try {
      // /users/me PUT API 사용 - 현재 비밀번호 불필요
      await authApiService.changePassword(newPassword);

      Alert.alert('성공', '비밀번호가 변경되었습니다.', [
        { text: '확인', onPress: () => {
          setShowPasswordModal(false);
          setNewPassword('');
          setConfirmPassword('');
        }}
      ]);
    } catch (error: any) {
      console.error('비밀번호 변경 실패:', error);
      
      // 인증 관련 에러는 인터셉터가 처리하도록 함
      if (error.message?.includes('인증이 만료') || error.message?.includes('권한이 없습니다')) {
        console.log('🔐 비밀번호 변경 중 인증 에러 감지 - 인터셉터가 로그인 페이지로 이동 처리');
        return; // 인터셉터가 처리하므로 여기서는 UI만 정리
      }
      
      // 일반 에러 처리
      let errorMessage = '비밀번호 변경에 실패했습니다.';
      
      if (error.response?.status === 422) {
        errorMessage = '입력한 정보가 올바르지 않습니다.';
      }
      
      Alert.alert('오류', errorMessage);
    }
  };

  // SPEC-HOME-001 REQ-HOME-001-07: "프로필 수정"·"알림 설정" 죽은 메뉴 제거로 관련 "준비중" Alert 핸들러도 함께 삭제(도달 경로 0).

  const handleAppInfo = () => {
    Alert.alert('앱 정보', 'KMC Beauty\n버전: 1.0.0');
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case 'OWNER': return '사장';
      case 'MANAGER': return '매니저';
      case 'STAFF': return '직원';
      default: return role;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ThemedView style={styles.innerContainer}>
        <ShopHeader />
        
        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
        {/* 내 정보 섹션 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>내 정보</ThemedText>
          </View>
          <View style={styles.card}>
            <View style={styles.profileHeader}>
              <View style={styles.avatarContainer}>
                <ThemedText style={styles.avatarText}>
                  {user?.name?.charAt(0) || 'U'}
                </ThemedText>
              </View>
              <View style={styles.profileInfo}>
                <ThemedText type="defaultSemiBold" style={styles.userName}>
                  {user?.name || '사용자'}
                </ThemedText>
                <ThemedText style={styles.userRole}>
                  {getRoleText(user?.role || 'MANAGER')}
                </ThemedText>
              </View>
              {/* SPEC-HOME-001 REQ-HOME-001-07: "프로필 수정"은 "준비중" Alert 만 뜨는 죽은 메뉴 → 노출 제거(도달 경로 0). */}
            </View>
            
            <View style={styles.infoList}>
              <View style={styles.infoItem}>
                <ThemedText style={styles.infoLabel}>이메일</ThemedText>
                <ThemedText style={styles.infoValue}>
                  {user?.email || '이메일 정보 없음'}
                </ThemedText>
              </View>
              <View style={styles.infoItem}>
                <ThemedText style={styles.infoLabel}>권한</ThemedText>
                <ThemedText style={styles.infoValue}>
                  {user?.role_name || getRoleText(user?.role || 'MANAGER')}
                </ThemedText>
              </View>
              <View style={styles.infoItem}>
                <ThemedText style={styles.infoLabel}>가입일</ThemedText>
                <ThemedText style={styles.infoValue}>
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString('ko-KR') : '정보 없음'}
                </ThemedText>
              </View>
            </View>
          </View>
        </View>

        {/* 상점 정보 섹션 */}
        {currentShop && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>현재 상점</ThemedText>
            </View>
            <View style={styles.card}>
              <View style={styles.shopInfo}>
                <View style={styles.shopIconContainer}>
                  <ThemedText style={styles.shopIcon}>🏪</ThemedText>
                </View>
                <View style={styles.shopDetails}>
                  <ThemedText type="defaultSemiBold" style={styles.shopName}>
                    {currentShop.name}
                  </ThemedText>
                  <ThemedText style={styles.shopAddress}>
                    {currentShop.address || '주소 정보 없음'}
                  </ThemedText>
                  <ThemedText style={styles.shopPhone}>
                    {currentShop.phone || '전화번호 정보 없음'}
                  </ThemedText>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* 설정 섹션 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>설정</ThemedText>
          </View>
          <View style={styles.card}>
            <TouchableOpacity 
              style={styles.settingItem} 
              onPress={() => setShowPasswordModal(true)}
            >
              <View style={styles.settingItemLeft}>
                <ThemedText style={styles.settingIcon}>🔒</ThemedText>
                <ThemedText style={styles.settingText}>비밀번호 변경</ThemedText>
              </View>
              <ThemedText style={styles.arrow}>›</ThemedText>
            </TouchableOpacity>
            
            {/* SPEC-HOME-001 REQ-HOME-001-07: "알림 설정"은 "준비중" Alert 만 뜨는 죽은 메뉴 → 노출 제거(도달 경로 0). */}

            <TouchableOpacity style={styles.settingItem} onPress={handleAppInfo}>
              <View style={styles.settingItemLeft}>
                <ThemedText style={styles.settingIcon}>ℹ️</ThemedText>
                <ThemedText style={styles.settingText}>앱 정보</ThemedText>
              </View>
              <ThemedText style={styles.arrow}>›</ThemedText>
            </TouchableOpacity>
          </View>
        </View>

        {/* 로그아웃 버튼 */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <ThemedText style={styles.logoutButtonText}>로그아웃</ThemedText>
        </TouchableOpacity>
      </ScrollView>

      {/* 비밀번호 변경 모달 */}
      <Modal
        visible={showPasswordModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPasswordModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <ThemedText type="subtitle" style={styles.modalTitle}>비밀번호 변경</ThemedText>
              <TouchableOpacity
                onPress={() => setShowPasswordModal(false)}
                style={styles.closeButton}
                accessibilityRole="button"
                accessibilityLabel="닫기"
              >
                <ThemedText style={styles.closeButtonText}>✕</ThemedText>
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalContent}>
              <View style={styles.inputGroup}>
                <ThemedText style={styles.inputLabel}>새 비밀번호</ThemedText>
                <TextInput
                  style={styles.input}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                  placeholder="새 비밀번호를 입력하세요 (4자 이상)"
                  placeholderTextColor="#6b7280"
                />
              </View>
              
              <View style={styles.inputGroup}>
                <ThemedText style={styles.inputLabel}>새 비밀번호 확인</ThemedText>
                <TextInput
                  style={styles.input}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  placeholder="새 비밀번호를 다시 입력하세요"
                  placeholderTextColor="#6b7280"
                />
              </View>
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={() => setShowPasswordModal(false)}
              >
                <ThemedText style={styles.cancelButtonText}>취소</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.confirmButton} 
                onPress={handlePasswordChange}
              >
                <ThemedText style={styles.confirmButtonText}>변경</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  innerContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  scrollContent: {
    paddingBottom: 50, // 하단 여백 추가
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  
  // 프로필 정보 스타일
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    marginBottom: 4,
    color: '#333',
  },
  userRole: {
    fontSize: 14,
    color: '#666',
  },
  editIconButton: {
    padding: 8,
  },
  editIcon: {
    fontSize: 20,
  },
  infoList: {
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    textAlign: 'right',
    flex: 2,
  },
  
  // 상점 정보 스타일
  shopInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shopIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  shopIcon: {
    fontSize: 24,
  },
  shopDetails: {
    flex: 1,
  },
  shopName: {
    fontSize: 16,
    marginBottom: 4,
    color: '#333',
  },
  shopAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  shopPhone: {
    fontSize: 14,
    color: '#666',
  },
  
  // 설정 항목 스타일
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  settingText: {
    fontSize: 16,
    color: '#333',
  },
  arrow: {
    fontSize: 18,
    color: '#ccc',
  },
  
  // 로그아웃 버튼
  logoutButton: {
    backgroundColor: '#dc3545',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 60, // 하단 여백을 더 늘림
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // 모달 스타일
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    width: width - 40,
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 18,
    color: '#666',
  },
  modalContent: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  modalButtons: {
    flexDirection: 'row',
    padding: 20,
    paddingTop: 0,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
  confirmButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    backgroundColor: '#007AFF',
    alignItems: 'center',
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
