import PhonebookManagement from '@/components/management/PhonebookManagement';
import StaffManagement from '@/components/management/StaffManagement';
import TreatmentMenuManagement from '@/components/management/TreatmentMenuManagement';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { MaterialIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, useColorScheme } from 'react-native';

export default function ManagementScreen() {
  const [showTreatmentManagement, setShowTreatmentManagement] = useState(false);
  const [showPhonebookManagement, setShowPhonebookManagement] = useState(false);
  const [showStaffManagement, setShowStaffManagement] = useState(false);
  const colorScheme = useColorScheme() ?? 'light';

  const styles = createStyles(colorScheme);

  if (showStaffManagement) {
    return <StaffManagement onGoBack={() => setShowStaffManagement(false)} />;
  }

  if (showTreatmentManagement) {
    return <TreatmentMenuManagement onGoBack={() => setShowTreatmentManagement(false)} />;
  }

  if (showPhonebookManagement) {
    return <PhonebookManagement onGoBack={() => setShowPhonebookManagement(false)} />;
  }

  const managementItems = [
    {
      id: 'staff',
      title: '직원 관리',
      description: '직원 정보 등록, 수정 및 상태 관리',
      icon: 'people',
      onPress: () => setShowStaffManagement(true),
      color: '#007AFF',
    },
    {
      id: 'phonebook',
      title: '전화번호 관리',
      description: '고객 및 연락처 정보 관리',
      icon: 'contacts',
      onPress: () => setShowPhonebookManagement(true),
      color: '#34C759',
    },
    {
      id: 'treatment',
      title: '시술 메뉴 관리',
      description: '시술 메뉴와 하위 상세 메뉴 관리',
      icon: 'menu-book',
      onPress: () => setShowTreatmentManagement(true),
      color: '#FF9500',
    },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <ThemedText type="title" style={styles.title}>매장 관리</ThemedText>
      <ThemedText style={styles.subtitle}>관리할 항목을 선택하세요</ThemedText>
      
      <ThemedView style={styles.cardContainer}>
        {managementItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.card}
            onPress={item.onPress}
            activeOpacity={0.7}
          >
            <ThemedView style={[styles.iconContainer, { backgroundColor: item.color + '15' }]}>
              <MaterialIcons name={item.icon as any} size={32} color={item.color} />
            </ThemedView>
            <ThemedView style={styles.cardContent}>
              <ThemedText style={styles.cardTitle}>{item.title}</ThemedText>
              <ThemedText style={styles.cardDescription}>{item.description}</ThemedText>
            </ThemedView>
            <MaterialIcons name="chevron-right" size={24} color={Colors[colorScheme].icon} />
          </TouchableOpacity>
        ))}
      </ThemedView>
    </ScrollView>
  );
}

const createStyles = (colorScheme: 'light' | 'dark') => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors[colorScheme].background,
    padding: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
    color: Colors[colorScheme].text,
  },
  subtitle: {
    fontSize: 16,
    color: Colors[colorScheme].icon,
    textAlign: 'center',
    marginBottom: 32,
  },
  cardContainer: {
    gap: 16,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    backgroundColor: Colors[colorScheme].background,
    borderWidth: 1,
    borderColor: Colors[colorScheme].icon + '20',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors[colorScheme].text,
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: Colors[colorScheme].icon,
    lineHeight: 20,
  },
});
