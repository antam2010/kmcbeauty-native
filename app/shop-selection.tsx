import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { shopService } from '@/services/api/shop';
import { Shop } from '@/types';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Platform,
    StyleSheet,
    TouchableOpacity
} from 'react-native';

export default function ShopSelectionScreen() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState(false);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    pages: 1,
    size: 50
  });

  useEffect(() => {
    loadShops();
  }, []);

  const loadShops = async (page: number = 1) => {
    try {
      setLoading(true);
      const response = await shopService.getShops(page, 50);
      setShops(response.items);
      setPagination({
        total: response.total,
        page: response.page,
        pages: response.pages,
        size: response.size
      });
    } catch (error: any) {
      console.error('상점 목록 로드 실패:', error);
      Alert.alert('오류', '상점 목록을 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectShop = async (shop: Shop) => {
    try {
      setSelecting(true);
      await shopService.selectShop(shop.id);
      Alert.alert(
        '상점 선택 완료',
        `${shop.name}이(가) 선택되었습니다.`,
        [
          {
            text: '확인',
            onPress: () => {
              // 이전 화면으로 돌아가기 또는 홈으로 이동
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/(tabs)');
              }
            }
          }
        ]
      );
    } catch (error: any) {
      console.error('상점 선택 실패:', error);
      Alert.alert('오류', '상점 선택에 실패했습니다.');
    } finally {
      setSelecting(false);
    }
  };

  const renderShopItem = ({ item }: { item: Shop }) => (
    <TouchableOpacity
      style={styles.shopItem}
      onPress={() => handleSelectShop(item)}
      disabled={selecting}
    >
      <ThemedView style={styles.shopInfo}>
        <ThemedText style={styles.shopName}>{item.name}</ThemedText>
        <ThemedText style={styles.shopAddress}>
          {item.address} {item.address_detail}
        </ThemedText>
        <ThemedText style={styles.shopPhone}>{item.phone}</ThemedText>
        <ThemedText style={styles.businessNumber}>
          사업자번호: {item.business_number}
        </ThemedText>
      </ThemedView>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <ThemedText style={styles.loadingText}>상점 목록을 불러오는 중...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title" style={styles.title}>상점 선택</ThemedText>
        <ThemedText style={styles.subtitle}>
          서비스를 이용할 상점을 선택해주세요
        </ThemedText>
        <ThemedText style={styles.pagination}>
          총 {pagination.total}개 상점 (페이지 {pagination.page}/{pagination.pages})
        </ThemedText>
      </ThemedView>

      <FlatList
        data={shops}
        renderItem={renderShopItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />

      {selecting && (
        <ThemedView style={styles.selectingOverlay}>
          <ActivityIndicator size="large" color="#007AFF" />
          <ThemedText style={styles.selectingText}>상점을 선택하는 중...</ThemedText>
        </ThemedView>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  header: {
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  pagination: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
  listContainer: {
    padding: 20,
    gap: 15,
  },
  shopItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    ...(Platform.OS === 'web' ? {
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    } : {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
    }),
    elevation: 3,
  },
  shopInfo: {
    backgroundColor: 'transparent',
  },
  shopName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  shopAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  shopPhone: {
    fontSize: 14,
    color: '#007AFF',
    marginBottom: 4,
  },
  businessNumber: {
    fontSize: 12,
    color: '#888',
  },
  selectingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectingText: {
    marginTop: 10,
    color: 'white',
    fontSize: 16,
  },
});
