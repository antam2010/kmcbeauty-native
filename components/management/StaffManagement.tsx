import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import InviteCodeGeneratorModal from '@/components/modals/InviteCodeGeneratorModal';
import { Colors } from '@/constants/Colors';
import { StaffUser, userApiService } from '@/src/api/services/staff';
import { useShopStore } from '@/src/stores/shopStore';
import { Button } from '@/src/ui/atoms';
import { Colors as DesignColors, Spacing, Typography } from '@/src/ui/theme';
import { MaterialIcons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
} from 'react-native';

interface StaffManagementProps {
  onGoBack?: () => void;
}

export default function StaffManagement({ onGoBack }: StaffManagementProps) {
  const [staffList, setStaffList] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const { selectedShop } = useShopStore();
  const colorScheme = useColorScheme() ?? 'light';

  useEffect(() => {
    const loadInitialData = async () => {
      if (!selectedShop?.id) {
        Alert.alert('오류', '선택된 상점이 없습니다.');
        return;
      }

      try {
        setLoading(true);
        const staffData = await userApiService.getShopUsers(selectedShop.id);
        setStaffList(staffData);
      } catch (error) {
        console.error('직원 데이터 로딩 중 오류:', error);
        Alert.alert('오류', '직원 데이터를 불러오는 중 문제가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, [selectedShop?.id]);

  const loadData = async () => {
    if (!selectedShop?.id) {
      Alert.alert('오류', '선택된 상점이 없습니다.');
      return;
    }

    try {
      setLoading(true);
      const staffData = await userApiService.getShopUsers(selectedShop.id);
      setStaffList(staffData);
    } catch (error) {
      console.error('직원 데이터 로딩 중 오류:', error);
      Alert.alert('오류', '직원 데이터를 불러오는 중 문제가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadData();
  };

  const handleAddStaff = () => {
    setShowInviteModal(true);
  };

  const handleEditStaff = (staffId: number) => {
    Alert.alert('직원 수정', `직원 ID: ${staffId}의 정보를 수정합니다.`);
  };

  const toggleStaffStatus = async (staffId: number) => {
    if (!selectedShop?.id) return;

    const staff = staffList.find(s => s.id === staffId);
    if (!staff) return;

    try {
      const newStatus = staff.status === 'active' ? 'inactive' : 'active';
      await userApiService.updateUser(selectedShop.id, staffId, { status: newStatus });
      
      setStaffList(prev =>
        prev.map(s =>
          s.id === staffId
            ? { ...s, status: newStatus }
            : s
        )
      );
      
      Alert.alert('완료', `직원 상태가 ${newStatus === 'active' ? '활성화' : '비활성화'}되었습니다.`);
    } catch (error: any) {
      console.error('직원 상태 변경 중 오류:', error);
      
      // 개발 중 메시지인 경우 친화적으로 표시
      if (error.message && error.message.includes('개발 중')) {
        Alert.alert('알림', error.message);
      } else {
        Alert.alert('오류', '직원 상태 변경 중 문제가 발생했습니다.');
      }
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ThemedView style={styles.header}>
          <TouchableOpacity onPress={onGoBack} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <ThemedText style={styles.title}>직원 관리</ThemedText>
        </ThemedView>
        <ThemedView style={styles.loadingContainer}>
          <ThemedText>직원 데이터를 불러오는 중...</ThemedText>
        </ThemedView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <ThemedView style={styles.header}>
        <TouchableOpacity onPress={onGoBack} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <ThemedText style={styles.title}>직원 관리</ThemedText>
        <ThemedView style={styles.headerActions}>
          <TouchableOpacity onPress={handleRefresh} style={styles.headerButton}>
            <MaterialIcons name="refresh" size={24} color="#007AFF" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleAddStaff} style={styles.headerButton}>
            <MaterialIcons name="add" size={24} color="#007AFF" />
          </TouchableOpacity>
        </ThemedView>
      </ThemedView>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 초대 코드 생성 버튼 */}
        <Button
          title="직원 초대 코드 생성"
          onPress={handleAddStaff}
          variant="primary"
          size="large"
          style={styles.addButton}
        />

        {/* 직원 목록 */}
        <ThemedView style={styles.listContainer}>
          {staffList.length > 0 ? (
            staffList.map((staff, index) => (
              <ThemedView 
                key={staff.id} 
                style={[
                  styles.card,
                  index === staffList.length - 1 ? { marginBottom: 0 } : {}
                ]}
              >
                <ThemedView style={styles.cardInfo}>
                  <ThemedText type="subtitle" style={styles.cardTitle}>{staff.name}</ThemedText>
                  <ThemedText style={styles.cardSubtitle}>
                    {staff.role}{staff.is_primary_owner ? ' (주 소유자)' : ''}
                  </ThemedText>
                  <ThemedText style={styles.cardDetails}>
                    이메일: {staff.email}
                  </ThemedText>
                  {staff.phone_number && (
                    <ThemedText style={styles.cardDetails}>
                      전화번호: {staff.phone_number}
                    </ThemedText>
                  )}
                  <ThemedText style={[styles.cardDetails, {
                    color: staff.status === 'active' ? '#4CAF50' : '#FF9800'
                  }]}>
                    상태: {staff.status === 'active' ? '활성' : '비활성'}
                  </ThemedText>
                </ThemedView>
                <ThemedView style={styles.cardActions}>
                  <TouchableOpacity style={styles.iconButton} onPress={() => handleEditStaff(staff.id)}>
                    <MaterialIcons name="edit" size={22} color={Colors[colorScheme].text} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.iconButton}
                    onPress={() => toggleStaffStatus(staff.id)}
                  >
                    <MaterialIcons 
                      name={staff.status === 'active' ? 'toggle-on' : 'toggle-off'} 
                      size={28} 
                      color={staff.status === 'active' ? Colors.light.tint : Colors[colorScheme].icon} 
                    />
                  </TouchableOpacity>
                </ThemedView>
              </ThemedView>
            ))
          ) : (
            <ThemedView style={styles.emptyContainer}>
              <MaterialIcons name="person-outline" size={64} color={Colors[colorScheme].icon} />
              <ThemedText style={styles.emptyText}>등록된 직원이 없습니다</ThemedText>
              <ThemedText style={styles.emptySubText}>초대 코드를 생성하여 직원을 초대해보세요</ThemedText>
              <Button
                title="첫 초대 코드 생성"
                onPress={handleAddStaff}
                variant="secondary"
                size="medium"
                style={styles.emptyAddButton}
              />
            </ThemedView>
          )}
        </ThemedView>
      </ScrollView>

      {/* 초대 코드 생성 모달 */}
      <InviteCodeGeneratorModal
        visible={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        shopId={selectedShop?.id || 0}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DesignColors.gray[50],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: DesignColors.white,
    borderBottomWidth: 1,
    borderBottomColor: DesignColors.gray[200],
  },
  backButton: {
    padding: Spacing.sm,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -8,
  },
  title: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: DesignColors.gray[900],
    flex: 1,
    textAlign: 'center',
  },
  addHeaderButton: {
    padding: Spacing.sm,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: -8,
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
  },
  addButton: {
    marginBottom: Spacing.xl,
  },
  listContainer: {
    backgroundColor: DesignColors.white,
    borderRadius: Spacing.sm,
    padding: Spacing.md,
    shadowColor: DesignColors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  card: {
    flexDirection: 'row',
    padding: Spacing.md,
    borderRadius: Spacing.sm,
    backgroundColor: DesignColors.white,
    shadowColor: DesignColors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm, // gap 대신 marginBottom 사용
  },
  cardInfo: {
    flex: 1,
    gap: 4,
  },
  cardTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: DesignColors.gray[900],
  },
  cardSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: DesignColors.gray[600],
  },
  cardDetails: {
    fontSize: Typography.fontSize.xs,
    color: DesignColors.gray[500],
    marginTop: 4,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  iconButton: {
    padding: Spacing.xs,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: DesignColors.gray[900],
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  emptySubText: {
    fontSize: Typography.fontSize.sm,
    color: DesignColors.gray[600],
    marginBottom: Spacing.xl,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headerButton: {
    padding: Spacing.xs,
  },
  emptyAddButton: {
    // Button 컴포넌트에서 스타일 관리
  },
});
