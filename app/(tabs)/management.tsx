import { Collapsible } from '@/components/Collapsible';
import TreatmentMenuManagement from '@/components/management/TreatmentMenuManagement';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { Service, serviceService, Staff, staffService } from '@/services/mockServices';
import { MaterialIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, TouchableOpacity, useColorScheme } from 'react-native';

export default function ManagementScreen() {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [serviceList, setServiceList] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTreatmentManagement, setShowTreatmentManagement] = useState(false);
  const colorScheme = useColorScheme() ?? 'light';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [staffData, serviceData] = await Promise.all([
        staffService.getAllStaff(),
        serviceService.getAllServices(),
      ]);
      setStaffList(staffData);
      setServiceList(serviceData);
    } catch (error) {
      console.error('데이터 로딩 중 오류:', error);
      Alert.alert('오류', '데이터를 불러오는 중 문제가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // Staff handlers
  const handleAddStaff = () => Alert.alert('직원 추가', '새 직원을 추가하는 화면으로 이동합니다.');
  const handleEditStaff = (staffId: string) => Alert.alert('직원 수정', `직원 ID: ${staffId}의 정보를 수정합니다.`);
  const toggleStaffStatus = (staffId: string) => {
    setStaffList(prev =>
      prev.map(staff =>
        staff.id === staffId
          ? { ...staff, status: staff.status === 'active' ? 'inactive' : 'active' }
          : staff
      )
    );
  };

  // Service handlers
  const handleAddService = () => Alert.alert('시술 추가', '새 시술을 추가하는 화면으로 이동합니다.');
  const handleEditService = (serviceId: string) => Alert.alert('시술 수정', `시술 ID: ${serviceId}의 정보를 수정합니다.`);
  const toggleServiceStatus = (serviceId: string) => {
    setServiceList(prev =>
      prev.map(service =>
        service.id === serviceId ? { ...service, isActive: !service.isActive } : service
      )
    );
  };

  const styles = createStyles(colorScheme);

  if (showTreatmentManagement) {
    return <TreatmentMenuManagement onGoBack={() => setShowTreatmentManagement(false)} />;
  }

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText type="title" style={styles.title}>매장 관리</ThemedText>
        <ThemedView style={styles.loadingContainer}>
          <ThemedText>데이터를 불러오는 중...</ThemedText>
        </ThemedView>
      </ThemedView>
    );
  }

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
            color={staff.status === 'active' ? Colors.light.tint : Colors[colorScheme].icon} />
        </TouchableOpacity>
      </ThemedView>
    </ThemedView>
  );

  const renderServiceItem = (service: Service) => (
    <ThemedView key={service.id} style={styles.card}>
      <ThemedView style={styles.cardInfo}>
        <ThemedText type="subtitle" style={styles.cardTitle}>{service.name}</ThemedText>
        <ThemedText style={styles.cardSubtitle}>{service.category} - {service.duration}분</ThemedText>
        <ThemedText style={styles.cardDetails}>{service.price.toLocaleString()}원</ThemedText>
      </ThemedView>
      <ThemedView style={styles.cardActions}>
        <TouchableOpacity style={styles.iconButton} onPress={() => handleEditService(service.id)}>
          <MaterialIcons name="edit" size={22} color={Colors[colorScheme].text} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => toggleServiceStatus(service.id)}
        >
          <MaterialIcons 
            name={service.isActive ? 'toggle-on' : 'toggle-off'} 
            size={28} 
            color={service.isActive ? Colors.light.tint : Colors[colorScheme].icon} />
        </TouchableOpacity>
      </ThemedView>
    </ThemedView>
  );

  return (
    <ScrollView style={styles.container}>
      <ThemedText type="title" style={styles.title}>매장 관리</ThemedText>
      
      <ThemedView style={styles.collapsibleSection}>
        <Collapsible title={`직원 관리 (${staffList.length})`}>
          <TouchableOpacity style={styles.addButton} onPress={handleAddStaff}>
            <MaterialIcons name="add" size={20} color="#fff" />
            <ThemedText style={styles.addButtonText}>새 직원 추가</ThemedText>
          </TouchableOpacity>
          <ThemedView style={styles.listContainer}>
              {staffList.length > 0 ? 
                  staffList.map(renderStaffItem) : 
                  <ThemedText style={styles.emptyListText}>등록된 직원이 없습니다.</ThemedText>}
          </ThemedView>
        </Collapsible>
      </ThemedView>

      <ThemedView style={styles.collapsibleSection}>
        <Collapsible title={`시술 관리 (${serviceList.length})`}>
          <TouchableOpacity style={styles.addButton} onPress={handleAddService}>
            <MaterialIcons name="add" size={20} color="#fff" />
            <ThemedText style={styles.addButtonText}>새 시술 추가</ThemedText>
          </TouchableOpacity>
          <ThemedView style={styles.listContainer}>
              {serviceList.length > 0 ? 
                  serviceList.map(renderServiceItem) : 
                  <ThemedText style={styles.emptyListText}>등록된 시술이 없습니다.</ThemedText>}
          </ThemedView>
        </Collapsible>
      </ThemedView>

      <ThemedView style={styles.collapsibleSection}>
        <Collapsible title="시술 메뉴 관리">
          <TouchableOpacity 
            style={styles.addButton} 
            onPress={() => setShowTreatmentManagement(true)}
          >
            <MaterialIcons name="menu-book" size={20} color="#fff" />
            <ThemedText style={styles.addButtonText}>시술 메뉴 관리</ThemedText>
          </TouchableOpacity>
          <ThemedText style={styles.emptyListText}>
            시술 메뉴와 하위 상세 메뉴를 관리할 수 있습니다.
          </ThemedText>
        </Collapsible>
      </ThemedView>
    </ScrollView>
  );
}

const createStyles = (colorScheme: 'light' | 'dark') => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors[colorScheme].background,
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
    color: Colors[colorScheme].text,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  collapsibleSection: {
    marginBottom: 20,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.tint,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  listContainer: {
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    backgroundColor: Colors[colorScheme].background,
    borderWidth: 1,
    borderColor: Colors[colorScheme].icon + '33', // Add some transparency
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardInfo: {
    flex: 1,
    gap: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  cardSubtitle: {
    fontSize: 14,
    color: Colors[colorScheme].icon,
  },
  cardDetails: {
    fontSize: 12,
    color: Colors[colorScheme].icon,
    marginTop: 4,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconButton: {
    padding: 4,
  },
  emptyListText: {
    textAlign: 'center',
    paddingVertical: 20,
    color: Colors[colorScheme].icon,
  },
});
