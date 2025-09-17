import { treatmentApiService } from '@/src/api/services/treatment';
import type { Treatment, TreatmentListParams } from '@/src/types';
import { formatKoreanDate } from '@/src/utils/dateUtils';
import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

interface BookingListScreenProps {
  onBookingPress?: (booking: Treatment) => void;
  onNewBooking?: () => void;
}

const statusLabels: Record<string, string> = {
  'RESERVED': '예약됨',
  'VISITED': '방문함',
  'COMPLETED': '완료',
  'CANCELLED': '취소됨',  
  'NO_SHOW': '노쇼'
};

const statusColors: Record<string, string> = {
  'RESERVED': '#667eea',
  'VISITED': '#f093fb',
  'COMPLETED': '#4facfe',
  'CANCELLED': '#ff6b6b',  
  'NO_SHOW': '#feca57'
};

export default function BookingListScreen({ 
  onBookingPress, 
  onNewBooking 
}: BookingListScreenProps) {
  
  // 상태 관리
  const [bookings, setBookings] = useState<Treatment[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // 예약 목록 로드
  const loadBookings = useCallback(async (isRefresh = false, pageNum = 1) => {
    try {
      // 이미 로딩 중이면 중복 요청 방지
      if (!isRefresh && loading) {
        console.log('⚠️ 이미 로딩 중이므로 요청 무시');
        return;
      }

      if (isRefresh) {
        setRefreshing(true);
      } else if (pageNum === 1) {
        setLoading(true);
      }

      const searchParams: TreatmentListParams = {
        page: pageNum,
        size: 20,
        sort_by: 'reserved_at',
        sort_order: 'desc',
        search: searchQuery || undefined,
        status: selectedStatus || undefined
      };

      console.log('🔍 예약 목록 조회 시작:', searchParams);
      const response = await treatmentApiService.list(searchParams);
      
      const newBookings = response.items || [];
      
      if (pageNum === 1) {
        setBookings(newBookings);
      } else {
        setBookings(prev => [...prev, ...newBookings]);
      }
      
      setTotalCount(response.total || 0);
      setHasMore(newBookings.length === (searchParams.size || 20));
      setCurrentPage(pageNum);
      
      console.log('✅ 예약 목록 조회 완료:', {
        count: newBookings.length,
        total: response.total,
        page: pageNum
      });
      
    } catch (error: any) {
      console.error('❌ 예약 목록 조회 실패:', error);
      Alert.alert('오류', '예약 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery, selectedStatus, loading]);

  // 더 많은 데이터 로드 (무한 스크롤)
  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      loadBookings(false, currentPage + 1);
    }
  }, [loading, hasMore, currentPage, loadBookings]);

  // 검색 실행
  const handleSearch = useCallback(() => {
    setCurrentPage(1);
    setHasMore(true);
    loadBookings(false, 1);
  }, [loadBookings]);

  // 새로고침
  const handleRefresh = useCallback(() => {
    setCurrentPage(1);
    setHasMore(true);
    loadBookings(true, 1);
  }, [loadBookings]);

  // 상태 필터 변경
  const handleStatusFilter = useCallback((status: string) => {
    setSelectedStatus(status === selectedStatus ? '' : status);
    setCurrentPage(1);
    setHasMore(true);
    // 디바운스 useEffect에서 API 호출이 처리되므로 여기서는 호출하지 않음
  }, [selectedStatus]);

  // 초기 로드
  useEffect(() => {
    loadBookings(false, 1);
  }, [loadBookings]);

  // 검색어/상태 변경 시 자동 검색 (디바운스)
  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch();
    }, 300); // 500ms에서 300ms로 단축

    return () => clearTimeout(timer);
  }, [searchQuery, selectedStatus, handleSearch]);

  // 예약 아이템 렌더링
  const renderBookingItem = ({ item }: { item: Treatment }) => {
    const formatDateTime = (dateTime: string) => {
      const date = new Date(dateTime);
      return {
        date: formatKoreanDate(dateTime),
        time: date.toLocaleTimeString('ko-KR', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        })
      };
    };

    const { date, time } = formatDateTime(item.reserved_at);
    const totalPrice = item.treatment_items?.reduce((sum, ti) => sum + ti.base_price, 0) || 0;

    return (
      <TouchableOpacity
        style={styles.bookingItem}
        onPress={() => onBookingPress?.(item)}
        activeOpacity={0.7}
      >
        <View style={styles.bookingHeader}>
          <View style={styles.customerInfo}>
            <Text style={styles.customerName}>
              {item.phonebook?.name || item.customer_name || '고객명 없음'}
            </Text>
            <Text style={styles.customerPhone}>
              {item.phonebook?.phone_number || item.customer_phone || ''}
            </Text>
          </View>
          <View style={[
            styles.statusBadge,
            { backgroundColor: statusColors[item.status] || '#6c757d' }
          ]}>
            <Text style={styles.statusText}>
              {statusLabels[item.status] || item.status}
            </Text>
          </View>
        </View>

        <View style={styles.bookingDetails}>
          <View style={styles.dateTimeInfo}>
            <Text style={styles.dateText}>📅 {date}</Text>
            <Text style={styles.timeText}>🕐 {time}</Text>
          </View>
          
          {item.treatment_items && item.treatment_items.length > 0 && (
            <View style={styles.treatmentInfo}>
              <Text style={styles.treatmentTitle}>
                {item.treatment_items[0].menu_detail?.name || '시술명 없음'}
                {item.treatment_items.length > 1 && ` 외 ${item.treatment_items.length - 1}개`}
              </Text>
              <Text style={styles.priceText}>
                💰 {totalPrice.toLocaleString()}원
              </Text>
            </View>
          )}

          {item.memo && (
            <Text style={styles.memoText} numberOfLines={2}>
              💬 {item.memo}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // 상태 필터 버튼들
  const statusFilters = [
    { key: '', label: '전체' },
    { key: 'RESERVED', label: '예약됨' },
    { key: 'VISITED', label: '방문함' },
    { key: 'COMPLETED', label: '완료' },
    { key: 'CANCELLED', label: '취소됨' },  
    { key: 'NO_SHOW', label: '노쇼' }
  ];

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.title}>예약 목록</Text>
        {onNewBooking && (
          <TouchableOpacity 
            style={styles.newBookingButton}
            onPress={onNewBooking}
          >
            <Text style={styles.newBookingButtonText}>+ 새 예약</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 검색 및 필터 */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <TextInput
            style={styles.searchInput}
            placeholder="고객명, 전화번호, 메모로 검색..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            onSubmitEditing={handleSearch}
          />
        </View>

        {/* 상태 필터 */}
        <View style={styles.statusFilters}>
          {statusFilters.map((filter) => (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.statusFilterButton,
                selectedStatus === filter.key && styles.statusFilterButtonActive
              ]}
              onPress={() => handleStatusFilter(filter.key)}
            >
              <Text style={[
                styles.statusFilterText,
                selectedStatus === filter.key && styles.statusFilterTextActive
              ]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 결과 정보 */}
      <View style={styles.resultInfo}>
        <Text style={styles.resultText}>
          총 {totalCount}개의 예약
          {searchQuery && ` (${searchQuery} 검색 결과)`}
        </Text>
      </View>

      {/* 예약 목록 */}
      <FlatList
        data={bookings}
        renderItem={renderBookingItem}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.1}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {searchQuery || selectedStatus ? '검색 결과가 없습니다.' : '등록된 예약이 없습니다.'}
              </Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          loading && currentPage > 1 ? (
            <View style={styles.loadingFooter}>
              <ActivityIndicator size="small" color="#007AFF" />
            </View>
          ) : null
        }
        contentContainerStyle={styles.listContainer}
      />

      {/* 로딩 인디케이터 */}
      {loading && currentPage === 1 && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>예약 목록을 불러오는 중...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  newBookingButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  newBookingButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  searchSection: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  searchBar: {
    marginBottom: 12,
  },
  searchInput: {
    height: 44,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    backgroundColor: '#f9fafb',
  },
  statusFilters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusFilterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  statusFilterButtonActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  statusFilterText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  statusFilterTextActive: {
    color: '#ffffff',
  },
  resultInfo: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#ffffff',
  },
  resultText: {
    fontSize: 14,
    color: '#6b7280',
  },
  listContainer: {
    flexGrow: 1,
  },
  bookingItem: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginVertical: 4,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  customerPhone: {
    fontSize: 14,
    color: '#6b7280',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '600',
  },
  bookingDetails: {
    gap: 8,
  },
  dateTimeInfo: {
    flexDirection: 'row',
    gap: 16,
  },
  dateText: {
    fontSize: 14,
    color: '#374151',
  },
  timeText: {
    fontSize: 14,
    color: '#374151',
  },
  treatmentInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  treatmentTitle: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
    flex: 1,
  },
  priceText: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '600',
  },
  memoText: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
  },
  loadingFooter: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
});
