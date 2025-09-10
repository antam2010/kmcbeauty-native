import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { CalendarDate } from '@/types';
import React, { useState } from 'react';
import { FlatList, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface CalendarProps {
  selectedDate?: string;
  onDateSelect: (date: string) => void;
  bookingData?: { [date: string]: number };
  minDate?: string;
  maxDate?: string;
}

export default function Calendar({ 
  selectedDate, 
  onDateSelect, 
  bookingData = {},
  minDate,
  maxDate 
}: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // 달력 데이터 생성 함수
  const generateCalendarDates = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startWeekday = firstDay.getDay();
    
    const dates: CalendarDate[] = [];
    const today = new Date().toISOString().split('T')[0];
    
    // 이전 달 날짜들 (빈 칸 채우기)
    for (let i = startWeekday - 1; i >= 0; i--) {
      const date = new Date(year, month, -i);
      dates.push({
        date: date.toISOString().split('T')[0],
        isToday: false,
        isSelected: false,
        hasBookings: false,
        bookingCount: 0,
      });
    }
    
    // 현재 달 날짜들
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month, day);
      const dateString = date.toISOString().split('T')[0];
      
      dates.push({
        date: dateString,
        isToday: dateString === today,
        isSelected: dateString === selectedDate,
        hasBookings: (bookingData[dateString] || 0) > 0,
        bookingCount: bookingData[dateString] || 0,
      });
    }
    
    // 다음 달 날짜들 (6주 완성)
    const remainingCells = 42 - dates.length;
    for (let day = 1; day <= remainingCells; day++) {
      const date = new Date(year, month + 1, day);
      dates.push({
        date: date.toISOString().split('T')[0],
        isToday: false,
        isSelected: false,
        hasBookings: false,
        bookingCount: 0,
      });
    }
    
    return {
      year,
      month,
      dates,
    };
  };

  const calendarData = generateCalendarDates();

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const handleDatePress = (date: CalendarDate) => {
    if (isDateDisabled(date.date)) return;
    onDateSelect(date.date);
  };

  const isDateDisabled = (date: string) => {
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    return false;
  };

  const getDateItemStyle = (date: CalendarDate) => {
    const styles = [calendarStyles.dateItem];
    
    if (date.isToday) styles.push(calendarStyles.today as any);
    if (date.isSelected) styles.push(calendarStyles.selected as any);
    if (date.hasBookings) styles.push(calendarStyles.hasBookings as any);
    if (isDateDisabled(date.date)) styles.push(calendarStyles.disabled as any);
    
    return styles;
  };

  const renderDateItem = ({ item: date }: { item: CalendarDate }) => (
    <TouchableOpacity
      style={getDateItemStyle(date)}
      onPress={() => handleDatePress(date)}
      disabled={isDateDisabled(date.date)}
    >
      <ThemedText style={[
        calendarStyles.dateText,
        date.isSelected && calendarStyles.selectedText,
        isDateDisabled(date.date) && calendarStyles.disabledText
      ]}>
        {new Date(date.date).getDate()}
      </ThemedText>
      {date.hasBookings && (
        <View style={calendarStyles.bookingIndicator}>
          <Text style={calendarStyles.bookingCount}>
            {date.bookingCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const monthNames = [
    '1월', '2월', '3월', '4월', '5월', '6월',
    '7월', '8월', '9월', '10월', '11월', '12월'
  ];
  
  const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

  return (
    <ThemedView style={calendarStyles.container}>
      {/* 월 네비게이션 */}
      <ThemedView style={calendarStyles.header}>
        <TouchableOpacity onPress={goToPreviousMonth} style={calendarStyles.navButton}>
          <ThemedText style={calendarStyles.navText}>‹</ThemedText>
        </TouchableOpacity>
        
        <ThemedText style={calendarStyles.monthTitle}>
          {calendarData.year}년 {monthNames[calendarData.month]}
        </ThemedText>
        
        <TouchableOpacity onPress={goToNextMonth} style={calendarStyles.navButton}>
          <ThemedText style={calendarStyles.navText}>›</ThemedText>
        </TouchableOpacity>
      </ThemedView>

      {/* 요일 헤더 */}
      <ThemedView style={calendarStyles.weekHeader}>
        {weekDays.map((day, index) => (
          <ThemedView key={index} style={calendarStyles.weekDayItem}>
            <ThemedText style={calendarStyles.weekDayText}>{day}</ThemedText>
          </ThemedView>
        ))}
      </ThemedView>

      {/* 날짜 그리드 */}
      <FlatList
        data={calendarData.dates}
        renderItem={renderDateItem}
        numColumns={7}
        keyExtractor={(item) => item.date}
        scrollEnabled={false}
        style={calendarStyles.datesGrid}
      />
    </ThemedView>
  );
}

const calendarStyles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    ...(Platform.OS === 'web' ? {
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    } : {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    }),
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  navButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  navText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  weekHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekDayItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  weekDayText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  datesGrid: {
    flex: 1,
  },
  dateItem: {
    flex: 1,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 2,
    borderRadius: 8,
    position: 'relative',
  },
  dateText: {
    fontSize: 16,
    fontWeight: '500',
  },
  today: {
    backgroundColor: '#e3f2fd',
  },
  selected: {
    backgroundColor: '#007AFF',
  },
  selectedText: {
    color: 'white',
    fontWeight: 'bold',
  },
  hasBookings: {
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  disabled: {
    opacity: 0.3,
  },
  disabledText: {
    color: '#ccc',
  },
  bookingIndicator: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#FF5722',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookingCount: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
});
