import { treatmentApiService } from '@/src/api/services/treatment';
import type { Treatment, TreatmentListParams } from '@/src/types';
import { formatKoreanDate } from '@/src/utils/dateUtils';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
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

// SPEC-UX-001 REQ-UX-002: 흰색 텍스트 대비 4.5:1 이상을 확보하기 위해 배지 배경을 진한 색으로 조정.
// (기존 밝은 색 #feca57/#f093fb 등은 흰 텍스트 대비 ≈1.4:1로 판독 불가였음)
// 각 배경 vs #ffffff 대비: RESERVED 6.3, VISITED 6.4, COMPLETED 6.0, CANCELLED 4.8, NO_SHOW 5.1
export const statusColors: Record<string, string> = {
  'RESERVED': '#4f46e5',
  'VISITED': '#a21caf',
  'COMPLETED': '#0369a1',
  'CANCELLED': '#dc2626',
  'NO_SHOW': '#b45309'
};

interface BookingListItemProps {
  item: Treatment;
  onPress?: (booking: Treatment) => void;
}

// @MX:NOTE: [AUTO] FlatList 항목을 React.memo 로 메모화(REQ-PERF-005). 상위(BookingListScreen) 리렌더 시 props(item, onPress)가 불변인 행은 재렌더되지 않는다. 렌더 결과는 기존 인라인 renderBookingItem 과 동일.
const BookingListItem = memo(function BookingListItem({ item, onPress }: BookingListItemProps) {
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
      onPress={() => onPress?.(item)}
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
});

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
  
  // ref로 loading 상태 추적
  const loadingRef = useRef(false);

  // 예약 목록 로드
  const loadBookings = useCallback(async (isRefresh = false, pageNum = 1) => {
    try {
      // 이미 로딩 중이면 중복 요청 방지
      if (!isRefresh && loadingRef.current) {
        if (__DEV__) console.log('⚠️ 이미 로딩 중이므로 요청 무시');
        return;
      }

      loadingRef.current = true;

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

      if (__DEV__) console.log('🔍 예약 목록 조회 시작:', searchParams);
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
      
      if (__DEV__) console.log('✅ 예약 목록 조회 완료:', {
        count: newBookings.length,
        total: response.total,
        page: pageNum
      });
      
    } catch (error: any) {
      console.error('❌ 예약 목록 조회 실패:', error);
      Alert.alert('오류', '예약 목록을 불러오는데 실패했습니다.');
    } finally {
      loadingRef.current = false;
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery, selectedStatus]);

  // 더 많은 데이터 로드 (무한 스크롤)
  const loadMore = useCallback(() => {
    if (!loadingRef.current && hasMore) {
      loadBookings(false, currentPage + 1);
    }
  }, [hasMore, currentPage, loadBookings]);

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

  // 초기 로드 (한 번만 실행)
  useEffect(() => {
    const initialLoad = async () => {
      try {
        loadingRef.current = true;
        setLoading(true);

        const searchParams: TreatmentListParams = {
          page: 1,
          size: 20,
          sort_by: 'reserved_at',
          sort_order: 'desc'
        };

        if (__DEV__) console.log('🔍 초기 예약 목록 조회 시작');
        const response = await treatmentApiService.list(searchParams);
        
        const newBookings = response.items || [];
        setBookings(newBookings);
        setTotalCount(response.total || 0);
        setHasMore(newBookings.length === 20);
        setCurrentPage(1);
        
        if (__DEV__) console.log('✅ 초기 예약 목록 조회 완료:', {
          count: newBookings.length,
          total: response.total
        });
        
      } catch (error: any) {
        console.error('❌ 초기 예약 목록 조회 실패:', error);
        Alert.alert('오류', '예약 목록을 불러오는데 실패했습니다.');
      } finally {
        loadingRef.current = false;
        setLoading(false);
      }
    };

    initialLoad();
  }, []); // 빈 의존성 배열로 초기 로드만 실행

  // 검색어/상태 변경 시 자동 검색 (디바운스)
  useEffect(() => {
    // 초기 로드가 아닌 경우에만 실행
    if (searchQuery !== '' || selectedStatus !== '') {
      const timer = setTimeout(() => {
        setCurrentPage(1);
        setHasMore(true);
        loadBookings(false, 1);
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [searchQuery, selectedStatus, loadBookings]);

  // 예약 아이템 렌더링
  // @MX:NOTE: [AUTO] useCallback 으로 안정적 참조 유지(REQ-PERF-005). 항목 UI 는 React.memo 로 감싼 BookingListItem 으로 위임한다. 의존성은 onBookingPress 뿐이므로 상위 상태 변경 시에도 renderItem 참조가 안정적이다.
  const renderBookingItem = useCallback(
    ({ item }: { item: Treatment }) => (
      <BookingListItem item={item} onPress={onBookingPress} />
    ),
    [onBookingPress]
  );

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
    minHeight: 44, // SPEC-UX-001 REQ-UX-004: 유효 터치 영역 44pt 확보
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusFilterButtonActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  statusFilterText: {
    fontSize: 14,
    color: '#374151',
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
    color: '#374151',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 14,
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
    fontSize: 14,
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
    color: '#6b7280',
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
