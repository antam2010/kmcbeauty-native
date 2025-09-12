import { shopEventEmitter, useShop } from '@/stores/shopStore';
import { router } from 'expo-router';
import { useCallback, useEffect } from 'react';
import {
    Alert,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface ShopHeaderProps {
  title?: string;
}

export default function ShopHeader({ title }: ShopHeaderProps) {
  const { selectedShop, loading, loadSelectedShop } = useShop();

  useEffect(() => {
    // 컴포넌트 마운트 시 한 번만 로드
    if (!selectedShop) {
      loadSelectedShop();
    }

    // 상점 변경 이벤트 리스닝
    const handleShopChanged = () => {
      console.log('상점이 변경되었습니다 - UI 업데이트');
      // 추가 UI 업데이트 로직이 필요한 경우 여기에 추가
    };

    shopEventEmitter.on('shopChanged', handleShopChanged);

    return () => {
      shopEventEmitter.off('shopChanged', handleShopChanged);
    };
  }, [selectedShop, loadSelectedShop]);

  const handleShopPress = useCallback(() => {
    if (loading) return;
    
    Alert.alert(
      '상점 변경',
      '다른 상점을 선택하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        { 
          text: '상점 선택', 
          onPress: () => router.push('/shop-selection')
        }
      ]
    );
  }, [loading]);

  return (
    <View style={styles.container}>
      <View style={styles.headerContent}>
        {title && (
          <Text style={styles.title}>{title}</Text>
        )}
        
        <TouchableOpacity 
          style={styles.shopButton}
          onPress={handleShopPress}
          disabled={loading}
        >
          <Text style={styles.shopButtonText}>
            {loading ? '로딩...' : selectedShop ? selectedShop.name : '상점 선택'}
          </Text>
          <Text style={styles.shopButtonArrow}>▼</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingTop: Platform.OS === 'ios' ? 44 : 20, // status bar height
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  shopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  shopButtonText: {
    fontSize: 14,
    color: '#333',
    marginRight: 4,
    maxWidth: 120,
  },
  shopButtonArrow: {
    fontSize: 12,
    color: '#666',
  },
});
