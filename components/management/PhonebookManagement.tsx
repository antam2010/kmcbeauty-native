import { phonebookAPI } from '@/src/services/api/phonebook';
import { PhonebookCreate, PhonebookResponse } from '@/src/types/phonebook';
import { MaterialIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Keyboard,
  Modal,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';

import { PhonebookManagementStyles } from './PhonebookManagement.styles';

interface PhonebookManagementProps {
  onGoBack?: () => void;
}

export default function PhonebookManagement({ onGoBack }: PhonebookManagementProps) {
  const [phonebooks, setPhonebooks] = useState<PhonebookResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // 모달 관련 상태
  const [showModal, setShowModal] = useState(false);
  const [editingContact, setEditingContact] = useState<PhonebookResponse | null>(null);
  
  // 폼 상태
  const [contactForm, setContactForm] = useState<PhonebookCreate>({
    name: '',
    phone_number: '',
    group_name: '',
    memo: '',
  });

  useEffect(() => {
    loadPhonebooks();
  }, []);

  const loadPhonebooks = async () => {
    try {
      setLoading(true);
      const response = await phonebookAPI.getPhonebooks({
        search: searchTerm || undefined,
        page: 1,
        size: 100,
      });
      setPhonebooks(response.items);
    } catch (error) {
      console.error('전화번호부 로딩 실패:', error);
      Alert.alert('오류', '전화번호부를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    loadPhonebooks();
  };

  const handleCreateContact = () => {
    setEditingContact(null);
    setContactForm({
      name: '',
      phone_number: '',
      group_name: '',
      memo: '',
    });
    setShowModal(true);
  };

  const handleEditContact = (contact: PhonebookResponse) => {
    setEditingContact(contact);
    setContactForm({
      name: contact.name,
      phone_number: contact.phone_number,
      group_name: contact.group_name || '',
      memo: contact.memo || '',
    });
    setShowModal(true);
  };

  const handleSaveContact = async () => {
    if (!contactForm.name.trim() || !contactForm.phone_number.trim()) {
      Alert.alert('오류', '이름과 전화번호는 필수입니다.');
      return;
    }

    try {
      if (editingContact) {
        // 수정
        await phonebookAPI.updatePhonebook(editingContact.id, contactForm);
        Alert.alert('성공', '연락처가 수정되었습니다.');
      } else {
        // 생성
        await phonebookAPI.createPhonebook(contactForm);
        Alert.alert('성공', '연락처가 추가되었습니다.');
      }
      
      setShowModal(false);
      loadPhonebooks();
    } catch (error) {
      console.error('연락처 저장 실패:', error);
      Alert.alert('오류', '연락처 저장에 실패했습니다.');
    }
  };

  const handleDeleteContact = (contact: PhonebookResponse) => {
    Alert.alert(
      '연락처 삭제',
      `"${contact.name}"을(를) 삭제하시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              await phonebookAPI.deletePhonebook(contact.id);
              Alert.alert('성공', '연락처가 삭제되었습니다.');
              loadPhonebooks();
            } catch (error) {
              console.error('연락처 삭제 실패:', error);
              Alert.alert('오류', '연락처 삭제에 실패했습니다.');
            }
          },
        },
      ]
    );
  };

  const renderContactItem = (contact: PhonebookResponse) => (
    <View key={contact.id} style={styles.contactCard}>
      <View style={styles.contactInfo}>
        <Text style={styles.contactName}>{contact.name}</Text>
        <Text style={styles.contactPhone}>{contact.phone_number}</Text>
        {contact.group_name && (
          <Text style={styles.contactGroup}>그룹: {contact.group_name}</Text>
        )}
        {contact.memo && (
          <Text style={styles.contactMemo}>{contact.memo}</Text>
        )}
      </View>
      <View style={styles.contactActions}>
        <TouchableOpacity
          onPress={() => handleEditContact(contact)}
          style={styles.actionButton}
        >
          <MaterialIcons name="edit" size={20} color="#007AFF" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleDeleteContact(contact)}
          style={styles.actionButton}
        >
          <MaterialIcons name="delete" size={20} color="#FF3B30" />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onGoBack} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.title}>전화번호 관리</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text>전화번호부를 불러오는 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onGoBack} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>전화번호 관리</Text>
        <TouchableOpacity onPress={handleCreateContact} style={styles.addButton}>
          <MaterialIcons name="add" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* 검색 */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="이름 또는 전화번호로 검색"
          value={searchTerm}
          onChangeText={setSearchTerm}
          returnKeyType="search"
          onSubmitEditing={handleSearch}
        />
        <TouchableOpacity onPress={handleSearch} style={styles.searchButton}>
          <MaterialIcons name="search" size={20} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* 연락처 목록 */}
      <ScrollView style={styles.contactList}>
        {phonebooks.length > 0 ? (
          phonebooks.map(renderContactItem)
        ) : (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="contacts" size={64} color="#ccc" />
            <Text style={styles.emptyText}>등록된 연락처가 없습니다.</Text>
            <TouchableOpacity onPress={handleCreateContact} style={styles.emptyAddButton}>
              <Text style={styles.emptyAddButtonText}>첫 연락처 추가하기</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* 연락처 추가/수정 모달 */}
      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet">
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingContact ? '연락처 수정' : '연락처 추가'}
              </Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <MaterialIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>이름 *</Text>
                <TextInput
                  style={styles.textInput}
                  value={contactForm.name}
                  onChangeText={(text) => setContactForm({ ...contactForm, name: text })}
                  placeholder="이름을 입력하세요"
                  returnKeyType="next"
                  onSubmitEditing={Keyboard.dismiss}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>전화번호 *</Text>
                <TextInput
                  style={styles.textInput}
                  value={contactForm.phone_number}
                  onChangeText={(text) => setContactForm({ ...contactForm, phone_number: text })}
                  placeholder="010-1234-5678"
                  keyboardType="phone-pad"
                  returnKeyType="next"
                  onSubmitEditing={Keyboard.dismiss}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>그룹</Text>
                <TextInput
                  style={styles.textInput}
                  value={contactForm.group_name}
                  onChangeText={(text) => setContactForm({ ...contactForm, group_name: text })}
                  placeholder="예: 고객, VIP, 직원 등"
                  returnKeyType="next"
                  onSubmitEditing={Keyboard.dismiss}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>메모</Text>
                <TextInput
                  style={[styles.textInput, styles.memoInput]}
                  value={contactForm.memo}
                  onChangeText={(text) => setContactForm({ ...contactForm, memo: text })}
                  placeholder="메모를 입력하세요"
                  multiline
                  numberOfLines={3}
                  returnKeyType="done"
                  onSubmitEditing={Keyboard.dismiss}
                />
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setShowModal(false)}
                style={[styles.modalButton, styles.cancelButton]}
              >
                <Text style={styles.cancelButtonText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveContact}
                style={[styles.modalButton, styles.saveButton]}
              >
                <Text style={styles.saveButtonText}>저장</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
}

const styles = PhonebookManagementStyles;