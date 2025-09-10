import { Collapsible } from '@/components/Collapsible';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/stores/authContext';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';

interface UserProfile {
  name: string;
  email: string;
  phone: string;
  role: 'admin' | 'staff' | 'customer';
  joinDate: string;
}

export default function ProfileScreen() {
  const { logout, user } = useAuth();
  const [profile, setProfile] = useState<UserProfile>({
    name: user?.name || '김관리자',
    email: user?.email || 'admin@kmcbeauty.com',
    phone: '010-1234-5678',
    role: 'admin',
    joinDate: '2024-01-15'
  });

  const [bookingHistory] = useState([
    { id: '1', service: '화장', date: '2024-09-01', status: '완료' },
    { id: '2', service: '눈썹', date: '2024-08-28', status: '완료' },
    { id: '3', service: '두피케어', date: '2024-09-15', status: '예정' },
  ]);

  const handleEditProfile = () => {
    Alert.alert('프로필 수정', '프로필 수정 화면으로 이동합니다.');
  };

  const handleChangePassword = () => {
    Alert.alert('비밀번호 변경', '비밀번호 변경 화면으로 이동합니다.');
  };

  const handleLogout = () => {
    Alert.alert(
      '로그아웃',
      '정말 로그아웃 하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        { text: '로그아웃', style: 'destructive', onPress: async () => {
          try {
            console.log('🚪 사용자가 로그아웃 버튼을 눌렀습니다');
            await logout();
            console.log('✅ 로그아웃 완료 - AuthNavigator가 자동으로 로그인 화면으로 이동할 것입니다');
          } catch (error) {
            console.error('로그아웃 실패:', error);
            Alert.alert('오류', '로그아웃 중 오류가 발생했습니다.');
          }
        }}
      ]
    );
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case 'admin': return '관리자';
      case 'staff': return '직원';
      case 'customer': return '고객';
      default: return '사용자';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case '완료': return '#28a745';
      case '예정': return '#007AFF';
      case '취소': return '#dc3545';
      default: return '#6c757d';
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        프로필
      </ThemedText>
      
      <ScrollView style={styles.content}>
        <Collapsible title="내 정보">
          <ThemedView style={styles.profileSection}>
            <ThemedView style={styles.profileItem}>
              <ThemedText type="defaultSemiBold">이름</ThemedText>
              <ThemedText>{profile.name}</ThemedText>
            </ThemedView>
            <ThemedView style={styles.profileItem}>
              <ThemedText type="defaultSemiBold">이메일</ThemedText>
              <ThemedText>{profile.email}</ThemedText>
            </ThemedView>
            <ThemedView style={styles.profileItem}>
              <ThemedText type="defaultSemiBold">전화번호</ThemedText>
              <ThemedText>{profile.phone}</ThemedText>
            </ThemedView>
            <ThemedView style={styles.profileItem}>
              <ThemedText type="defaultSemiBold">권한</ThemedText>
              <ThemedText>{getRoleText(profile.role)}</ThemedText>
            </ThemedView>
            <ThemedView style={styles.profileItem}>
              <ThemedText type="defaultSemiBold">가입일</ThemedText>
              <ThemedText>{profile.joinDate}</ThemedText>
            </ThemedView>
            
            <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
              <ThemedText style={styles.editButtonText}>프로필 수정</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </Collapsible>

        <Collapsible title="예약 내역">
          <ThemedView style={styles.historySection}>
            {bookingHistory.map((booking) => (
              <ThemedView key={booking.id} style={styles.historyItem}>
                <ThemedView style={styles.historyInfo}>
                  <ThemedText type="defaultSemiBold">{booking.service}</ThemedText>
                  <ThemedText>{booking.date}</ThemedText>
                </ThemedView>
                <ThemedView 
                  style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(booking.status) }
                  ]}
                >
                  <ThemedText style={styles.statusText}>{booking.status}</ThemedText>
                </ThemedView>
              </ThemedView>
            ))}
          </ThemedView>
        </Collapsible>

        <Collapsible title="설정">
          <ThemedView style={styles.settingsSection}>
            <TouchableOpacity 
              style={styles.settingItem} 
              onPress={handleChangePassword}
            >
              <ThemedText>비밀번호 변경</ThemedText>
              <ThemedText style={styles.arrow}>›</ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.settingItem}>
              <ThemedText>알림 설정</ThemedText>
              <ThemedText style={styles.arrow}>›</ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.settingItem}>
              <ThemedText>앱 정보</ThemedText>
              <ThemedText style={styles.arrow}>›</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </Collapsible>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <ThemedText style={styles.logoutButtonText}>로그아웃</ThemedText>
        </TouchableOpacity>
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
  content: {
    flex: 1,
  },
  profileSection: {
    gap: 15,
  },
  profileItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  editButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  editButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  historySection: {
    gap: 10,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  historyInfo: {
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  settingsSection: {
    gap: 5,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  arrow: {
    fontSize: 18,
    color: '#999',
  },
  logoutButton: {
    backgroundColor: '#dc3545',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 20,
  },
  logoutButtonText: {
    color: 'white',
    fontWeight: '600',
  },
});
