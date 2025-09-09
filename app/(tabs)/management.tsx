import { Collapsible } from '@/components/Collapsible';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Staff, staffService } from '@/services/mockServices';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';

export default function ManagementScreen() {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStaff();
  }, []);

  const loadStaff = async () => {
    try {
      const staffData = await staffService.getAllStaff();
      setStaffList(staffData);
    } catch (error) {
      console.error('직원 데이터 로딩 중 오류:', error);
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

  const activeStaff = staffList.filter(staff => staff.status === 'active');
  const inactiveStaff = staffList.filter(staff => staff.status === 'inactive');

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText type="title" style={styles.title}>
          직원 관리
        </ThemedText>
        <ThemedView style={styles.loadingContainer}>
          <ThemedText>직원 정보를 불러오는 중...</ThemedText>
        </ThemedView>
      </ThemedView>
    );
  }

  const renderStaffItem = (staff: Staff) => (
    <ThemedView key={staff.id} style={styles.staffItem}>
      <ThemedView style={styles.staffInfo}>
        <ThemedText type="subtitle">{staff.name}</ThemedText>
        <ThemedText>{staff.position}</ThemedText>
        <ThemedText style={styles.specialties}>
          전문분야: {staff.specialties.join(', ')}
        </ThemedText>
      </ThemedView>
      <ThemedView style={styles.staffActions}>
        <TouchableOpacity 
          style={styles.editButton}
          onPress={() => handleEditStaff(staff.id)}
        >
          <ThemedText style={styles.buttonText}>수정</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[
            styles.statusButton,
            staff.status === 'active' ? styles.deactivateButton : styles.activateButton
          ]}
          onPress={() => toggleStaffStatus(staff.id)}
        >
          <ThemedText style={styles.buttonText}>
            {staff.status === 'active' ? '비활성화' : '활성화'}
          </ThemedText>
        </TouchableOpacity>
      </ThemedView>
    </ThemedView>
  );

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        직원 관리
      </ThemedText>
      
      <TouchableOpacity style={styles.addButton} onPress={handleAddStaff}>
        <ThemedText type="defaultSemiBold" style={styles.addButtonText}>
          + 새 직원 추가
        </ThemedText>
      </TouchableOpacity>

      <ScrollView style={styles.content}>
        <Collapsible title={`활성 직원 (${activeStaff.length}명)`}>
          <ThemedView style={styles.staffContainer}>
            {activeStaff.map(renderStaffItem)}
          </ThemedView>
        </Collapsible>

        <Collapsible title={`비활성 직원 (${inactiveStaff.length}명)`}>
          <ThemedView style={styles.staffContainer}>
            {inactiveStaff.map(renderStaffItem)}
          </ThemedView>
        </Collapsible>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    marginBottom: 20,
    textAlign: 'center',
  },
  addButton: {
    backgroundColor: '#28a745',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    alignItems: 'center',
  },
  addButtonText: {
    color: 'white',
  },
  content: {
    flex: 1,
  },
  staffContainer: {
    gap: 10,
  },
  staffItem: {
    flexDirection: 'row',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  staffInfo: {
    flex: 1,
  },
  specialties: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 5,
  },
  staffActions: {
    flexDirection: 'row',
    gap: 10,
  },
  editButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 5,
  },
  statusButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 5,
  },
  activateButton: {
    backgroundColor: '#28a745',
  },
  deactivateButton: {
    backgroundColor: '#dc3545',
  },
  buttonText: {
    color: 'white',
    fontSize: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
});
