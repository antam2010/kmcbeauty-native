import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { Staff, staffService } from '@/services/mockServices';
import { Button, Card } from '@/src/ui/atoms';
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
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const colorScheme = useColorScheme() ?? 'light';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const staffData = await staffService.getAllStaff();
      setStaffList(staffData);
    } catch (error) {
      console.error('데이터 로딩 중 오류:', error);
      Alert.alert('오류', '데이터를 불러오는 중 문제가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddStaff = () => {
    Alert.alert('직원 추가', '새 직원을 추가하는 화면으로 이동합니다.');
  };

  const handleEditStaff = (staffId: string) => {
    Alert.alert('직원 수정', `직원 ID: ${staffId}의 정보를 수정합니다.`);
  };

  const toggleStaffStatus = (staffId: string) => {
    setStaffList(prev =>
      prev.map(staff =>
        staff.id === staffId
          ? { ...staff, status: staff.status === 'active' ? 'inactive' : 'active' }
          : staff
      )
    );
  };

  const renderStaffItem = (staff: Staff) => (
    <ThemedView key={staff.id} style={styles.card}>
      <ThemedView style={styles.cardInfo}>
        <ThemedText type="subtitle" style={styles.cardTitle}>{staff.name}</ThemedText>
        <ThemedText style={styles.cardSubtitle}>{staff.position}</ThemedText>
        <ThemedText style={styles.cardDetails}>전문분야: {staff.specialties.join(', ')}</ThemedText>
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
  );

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
        <TouchableOpacity onPress={handleAddStaff} style={styles.addHeaderButton}>
          <MaterialIcons name="add" size={24} color="#007AFF" />
        </TouchableOpacity>
      </ThemedView>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 새 직원 추가 버튼 */}
        <Button
          title="새 직원 추가"
          onPress={handleAddStaff}
          variant="primary"
          size="large"
          style={styles.addButton}
        />

        {/* 직원 목록 */}
        <Card style={styles.listContainer}>
          {staffList.length > 0 ? (
            staffList.map(renderStaffItem)
          ) : (
            <ThemedView style={styles.emptyContainer}>
              <MaterialIcons name="person-outline" size={64} color={Colors[colorScheme].icon} />
              <ThemedText style={styles.emptyText}>등록된 직원이 없습니다</ThemedText>
              <ThemedText style={styles.emptySubText}>새 직원을 추가해보세요</ThemedText>
              <Button
                title="첫 직원 추가"
                onPress={handleAddStaff}
                variant="secondary"
                size="medium"
                style={styles.emptyAddButton}
              />
            </ThemedView>
          )}
        </Card>
      </ScrollView>
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
    gap: Spacing.sm,
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
  emptyAddButton: {
    // Button 컴포넌트에서 스타일 관리
  },
});
