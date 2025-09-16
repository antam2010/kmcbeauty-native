import { treatmentMenuAPI } from '@/src/services/api/treatment-menu';
import {
    TreatmentMenu,
    TreatmentMenuCreate,
    TreatmentMenuDetail,
    TreatmentMenuDetailCreate
} from '@/src/types';
import { Button, TextInput as CustomTextInput } from '@/src/ui/atoms';
import { Colors, Spacing, Typography } from '@/src/ui/theme';
import { MaterialIcons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
    Alert,
    Keyboard,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View
} from 'react-native';

interface TreatmentMenuManagementProps {
  onGoBack?: () => void;
}

export default function TreatmentMenuManagement({ onGoBack }: TreatmentMenuManagementProps) {
  const [menus, setMenus] = useState<TreatmentMenu[]>([]);
  const [selectedMenu, setSelectedMenu] = useState<TreatmentMenu | null>(null);
  const [menuDetails, setMenuDetails] = useState<TreatmentMenuDetail[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 모달 관련 상태
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editingMenu, setEditingMenu] = useState<TreatmentMenu | null>(null);
  const [editingDetail, setEditingDetail] = useState<TreatmentMenuDetail | null>(null);
  
  // 폼 상태
  const [menuForm, setMenuForm] = useState<TreatmentMenuCreate>({ name: '' });
  const [detailForm, setDetailForm] = useState<TreatmentMenuDetailCreate>({
    name: '',
    duration_min: 0,
    base_price: 0,
  });

  useEffect(() => {
    loadMenus();
  }, []);

  const loadMenus = async () => {
    try {
      setLoading(true);
      const response = await treatmentMenuAPI.getMenus();
      setMenus(response.items);
    } catch (error) {
      console.error('시술 메뉴 로딩 실패:', error);
      Alert.alert('오류', '시술 메뉴를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const loadMenuDetails = async (menuId: number) => {
    try {
      const details = await treatmentMenuAPI.getMenuDetails(menuId);
      setMenuDetails(details);
    } catch (error) {
      console.error('시술 상세 로딩 실패:', error);
      Alert.alert('오류', '시술 상세를 불러오는데 실패했습니다.');
    }
  };

  const handleMenuSelect = async (menu: TreatmentMenu) => {
    setSelectedMenu(menu);
    await loadMenuDetails(menu.id);
  };

  const handleCreateMenu = () => {
    setEditingMenu(null);
    setMenuForm({ name: '' });
    setShowMenuModal(true);
  };

  const handleEditMenu = (menu: TreatmentMenu) => {
    setEditingMenu(menu);
    setMenuForm({ name: menu.name });
    setShowMenuModal(true);
  };

  const handleSaveMenu = async () => {
    try {
      if (!menuForm.name.trim()) {
        Alert.alert('알림', '메뉴 이름을 입력해주세요.');
        return;
      }

      if (editingMenu) {
        // 수정
        await treatmentMenuAPI.updateMenu(editingMenu.id, menuForm);
        Alert.alert('성공', '시술 메뉴가 수정되었습니다.');
      } else {
        // 생성
        await treatmentMenuAPI.createMenu(menuForm);
        Alert.alert('성공', '시술 메뉴가 생성되었습니다.');
      }

      setShowMenuModal(false);
      await loadMenus();
    } catch (error) {
      console.error('시술 메뉴 저장 실패:', error);
      Alert.alert('오류', '시술 메뉴 저장에 실패했습니다.');
    }
  };

  const handleDeleteMenu = (menu: TreatmentMenu) => {
    Alert.alert(
      '삭제 확인',
      `"${menu.name}" 메뉴를 삭제하시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              await treatmentMenuAPI.deleteMenu(menu.id);
              Alert.alert('성공', '시술 메뉴가 삭제되었습니다.');
              await loadMenus();
              if (selectedMenu?.id === menu.id) {
                setSelectedMenu(null);
                setMenuDetails([]);
              }
            } catch (error) {
              console.error('시술 메뉴 삭제 실패:', error);
              Alert.alert('오류', '시술 메뉴 삭제에 실패했습니다.');
            }
          },
        },
      ]
    );
  };

  const handleCreateDetail = () => {
    if (!selectedMenu) return;
    
    setEditingDetail(null);
    setDetailForm({
      name: '',
      duration_min: 0,
      base_price: 0,
    });
    setShowDetailModal(true);
  };

  const handleEditDetail = (detail: TreatmentMenuDetail) => {
    setEditingDetail(detail);
    setDetailForm({
      name: detail.name,
      duration_min: detail.duration_min,
      base_price: detail.base_price,
    });
    setShowDetailModal(true);
  };

  const handleSaveDetail = async () => {
    try {
      if (!selectedMenu) return;

      if (!detailForm.name.trim()) {
        Alert.alert('알림', '상세 이름을 입력해주세요.');
        return;
      }

      if (detailForm.duration_min <= 0) {
        Alert.alert('알림', '시술 시간을 올바르게 입력해주세요.');
        return;
      }

      if (detailForm.base_price <= 0) {
        Alert.alert('알림', '가격을 올바르게 입력해주세요.');
        return;
      }

      if (editingDetail) {
        // 수정
        await treatmentMenuAPI.updateMenuDetail(selectedMenu.id, editingDetail.id, detailForm);
        Alert.alert('성공', '시술 상세가 수정되었습니다.');
      } else {
        // 생성
        await treatmentMenuAPI.createMenuDetail(selectedMenu.id, detailForm);
        Alert.alert('성공', '시술 상세가 생성되었습니다.');
      }

      setShowDetailModal(false);
      await loadMenuDetails(selectedMenu.id);
    } catch (error) {
      console.error('시술 상세 저장 실패:', error);
      Alert.alert('오류', '시술 상세 저장에 실패했습니다.');
    }
  };

  const handleDeleteDetail = (detail: TreatmentMenuDetail) => {
    Alert.alert(
      '삭제 확인',
      `"${detail.name}" 상세를 삭제하시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              if (!selectedMenu) return;
              
              await treatmentMenuAPI.deleteMenuDetail(selectedMenu.id, detail.id);
              Alert.alert('성공', '시술 상세가 삭제되었습니다.');
              await loadMenuDetails(selectedMenu.id);
            } catch (error) {
              console.error('시술 상세 삭제 실패:', error);
              Alert.alert('오류', '시술 상세 삭제에 실패했습니다.');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>시술 관리</Text>
          <TouchableOpacity onPress={onGoBack} style={styles.closeButton}>
            <MaterialIcons name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <Text>데이터를 불러오는 중...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>시술 관리</Text>
        <TouchableOpacity onPress={onGoBack} style={styles.closeButton}>
          <MaterialIcons name="close" size={24} color="#666" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* 시술 메뉴 목록 */}
        <View style={styles.leftPanel}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>시술 메뉴</Text>
            <TouchableOpacity onPress={handleCreateMenu} style={styles.addButton}>
              <MaterialIcons name="add" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.menuList}>
            {menus.map((menu) => (
              <TouchableOpacity
                key={menu.id}
                style={[
                  styles.menuItem,
                  selectedMenu?.id === menu.id && styles.selectedMenuItem,
                ]}
                onPress={() => handleMenuSelect(menu)}
              >
                <View style={styles.menuInfo}>
                  <Text style={styles.menuName}>{menu.name}</Text>
                  <Text style={styles.menuDate}>
                    {new Date(menu.created_at).toLocaleDateString('ko-KR')}
                  </Text>
                </View>
                <View style={styles.menuActions}>
                  <TouchableOpacity
                    onPress={() => handleEditMenu(menu)}
                    style={styles.actionButton}
                  >
                    <MaterialIcons name="edit" size={18} color="#666" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDeleteMenu(menu)}
                    style={styles.actionButton}
                  >
                    <MaterialIcons name="delete" size={18} color="#ff6b6b" />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* 시술 상세 목록 */}
        <View style={styles.rightPanel}>
          {selectedMenu ? (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{selectedMenu.name} 상세</Text>
                <TouchableOpacity onPress={handleCreateDetail} style={styles.addButton}>
                  <MaterialIcons name="add" size={20} color="#fff" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.detailList}>
                {menuDetails.map((detail) => (
                  <View key={detail.id} style={styles.detailItem}>
                    <View style={styles.detailInfo}>
                      <Text style={styles.detailName}>{detail.name}</Text>
                      <Text style={styles.detailPrice}>
                        {detail.base_price.toLocaleString()}원 • {detail.duration_min}분
                      </Text>
                    </View>
                    <View style={styles.detailActions}>
                      <TouchableOpacity
                        onPress={() => handleEditDetail(detail)}
                        style={styles.actionButton}
                      >
                        <MaterialIcons name="edit" size={18} color="#666" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleDeleteDetail(detail)}
                        style={styles.actionButton}
                      >
                        <MaterialIcons name="delete" size={18} color="#ff6b6b" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
                
                {menuDetails.length === 0 && (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>등록된 상세가 없습니다.</Text>
                    <Text style={styles.emptySubtext}>상단의 + 버튼을 눌러 상세를 추가해보세요.</Text>
                  </View>
                )}
              </ScrollView>
            </>
          ) : (
            <View style={styles.emptyState}>
              <MaterialIcons name="spa" size={64} color="#ddd" />
              <Text style={styles.emptyText}>시술 메뉴를 선택해주세요</Text>
              <Text style={styles.emptySubtext}>왼쪽에서 메뉴를 선택하면 상세 내용을 확인할 수 있습니다.</Text>
            </View>
          )}
        </View>
      </View>

      {/* 메뉴 생성/수정 모달 */}
      <Modal visible={showMenuModal} animationType="slide" presentationStyle="pageSheet">
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingMenu ? '시술 메뉴 수정' : '시술 메뉴 생성'}
              </Text>
              <TouchableOpacity onPress={() => setShowMenuModal(false)}>
                <MaterialIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalContent}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>메뉴 이름 *</Text>
                <CustomTextInput
                  style={styles.textInput}
                  value={menuForm.name}
                  onChangeText={(text: string) => setMenuForm({ ...menuForm, name: text })}
                  placeholder="예: 눈썹"
                  placeholderTextColor="#999"
                  returnKeyType="done"
                  onSubmitEditing={Keyboard.dismiss}
                />
              </View>

              <View style={styles.modalActions}>
                <Button
                  title="취소"
                  onPress={() => setShowMenuModal(false)}
                  variant="secondary"
                  size="medium"
                  style={styles.cancelButton}
                />
                <Button
                  title="저장"
                  onPress={handleSaveMenu}
                  variant="primary"
                  size="medium"
                  style={styles.saveButton}
                />
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* 상세 생성/수정 모달 */}
      <Modal visible={showDetailModal} animationType="slide" presentationStyle="pageSheet">
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingDetail ? '시술 상세 수정' : '시술 상세 생성'}
              </Text>
              <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                <MaterialIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalContent}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>상세 이름 *</Text>
                <CustomTextInput
                  style={styles.textInput}
                  value={detailForm.name}
                  onChangeText={(text: string) => setDetailForm({ ...detailForm, name: text })}
                  placeholder="예: 눈썹 문신"
                  placeholderTextColor="#999"
                  returnKeyType="next"
                  onSubmitEditing={() => {
                    // 다음 필드로 포커스 이동하거나 키보드 닫기
                    Keyboard.dismiss();
                  }}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>시술 시간 (분) *</Text>
                <CustomTextInput
                  style={styles.textInput}
                  value={detailForm.duration_min.toString()}
                  onChangeText={(text: string) => 
                    setDetailForm({ ...detailForm, duration_min: parseInt(text) || 0 })
                  }
                  placeholder="60"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                  returnKeyType="next"
                  onSubmitEditing={() => {
                    // 다음 필드로 포커스 이동
                    Keyboard.dismiss();
                  }}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>기본 가격 (원) *</Text>
                <CustomTextInput
                  style={styles.textInput}
                  value={detailForm.base_price.toString()}
                  onChangeText={(text: string) => 
                    setDetailForm({ ...detailForm, base_price: parseInt(text) || 0 })
                  }
                  placeholder="50000"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                  returnKeyType="done"
                  onSubmitEditing={Keyboard.dismiss}
                />
              </View>

              <View style={styles.modalActions}>
                <Button
                  title="취소"
                  onPress={() => setShowDetailModal(false)}
                  variant="secondary"
                  size="medium"
                  style={styles.cancelButton}
                />
                <Button
                  title="저장"
                  onPress={handleSaveDetail}
                  variant="primary"
                  size="medium"
                  style={styles.saveButton}
                />
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.gray[50],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
    ...Platform.select({
      ios: {
        paddingTop: 60,
      },
      android: {
        paddingTop: 20,
      },
    }),
  },
  headerTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.gray[900],
  },
  closeButton: {
    padding: Spacing.xs,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
  },
  leftPanel: {
    flex: 1,
    backgroundColor: '#fff',
    borderRightWidth: 1,
    borderRightColor: '#e9ecef',
  },
  rightPanel: {
    flex: 1,
    backgroundColor: '#fff',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuList: {
    flex: 1,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f4',
  },
  selectedMenuItem: {
    backgroundColor: '#f0f4ff',
    borderRightWidth: 3,
    borderRightColor: '#667eea',
  },
  menuInfo: {
    flex: 1,
  },
  menuName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  menuDate: {
    fontSize: 12,
    color: '#666',
  },
  menuActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 4,
  },
  detailList: {
    flex: 1,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f4',
  },
  detailInfo: {
    flex: 1,
  },
  detailName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  detailPrice: {
    fontSize: 14,
    color: '#667eea',
    fontWeight: '500',
  },
  detailActions: {
    flexDirection: 'row',
    gap: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // 모달 스타일
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    ...Platform.select({
      ios: {
        paddingTop: 60,
      },
      android: {
        paddingTop: 20,
      },
    }),
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 'auto',
    paddingTop: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  saveButton: {
    backgroundColor: '#667eea',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
  },
});
