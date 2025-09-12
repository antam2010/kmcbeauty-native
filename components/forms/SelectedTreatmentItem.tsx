import { type TreatmentMenuDetail } from '@/src/api/services/treatmentMenu';
import React, { memo } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { bookingFormStyles } from './BookingForm.styles';

export interface SelectedTreatmentItem {
  menuDetail: TreatmentMenuDetail;
  customPrice: number;
  customDuration: number;
}

interface SelectedTreatmentItemProps {
  item: SelectedTreatmentItem;
  index: number;
  onRemove: (index: number) => void;
  onUpdatePrice: (index: number, price: string) => void;
  onUpdateDuration: (index: number, duration: string) => void;
  onQuickPrice: (index: number, price: number) => void;
}

const SelectedTreatmentItemComponent = memo(({
  item,
  index,
  onRemove,
  onUpdatePrice,
  onUpdateDuration,
  onQuickPrice,
}: SelectedTreatmentItemProps) => {
  return (
    <View style={bookingFormStyles.selectedTreatment}>
      <View style={bookingFormStyles.treatmentHeader}>
        <View style={bookingFormStyles.treatmentBasicInfo}>
          <Text style={bookingFormStyles.treatmentName}>{item.menuDetail.name}</Text>
          <Text style={bookingFormStyles.treatmentBaseInfo}>
            기본: {item.menuDetail.base_price.toLocaleString()}원 • {item.menuDetail.duration_min}분
          </Text>
        </View>
        <TouchableOpacity
          style={bookingFormStyles.removeButton}
          onPress={() => onRemove(index)}
        >
          <Text style={bookingFormStyles.removeButtonText}>✕</Text>
        </TouchableOpacity>
      </View>
      
      {/* 가격 및 시간 조정 */}
      <View style={bookingFormStyles.customControls}>
        <View style={bookingFormStyles.customControlRow}>
          <View style={bookingFormStyles.customControlItem}>
            <Text style={bookingFormStyles.customControlLabel}>실제 가격</Text>
            <View style={bookingFormStyles.customInputGroup}>
              <TextInput
                style={bookingFormStyles.customInput}
                value={item.customPrice.toString()}
                onChangeText={(text) => onUpdatePrice(index, text)}
                keyboardType="numeric"
                placeholder="0"
                selectTextOnFocus={true}
              />
              <Text style={bookingFormStyles.customUnit}>원</Text>
            </View>
          </View>
          
          <View style={bookingFormStyles.customControlItem}>
            <Text style={bookingFormStyles.customControlLabel}>실제 시간</Text>
            <View style={bookingFormStyles.customInputGroup}>
              <TextInput
                style={bookingFormStyles.customInput}
                value={item.customDuration.toString()}
                onChangeText={(text) => onUpdateDuration(index, text)}
                keyboardType="numeric"
                placeholder="1"
                selectTextOnFocus={true}
              />
              <Text style={bookingFormStyles.customUnit}>분</Text>
            </View>
          </View>
        </View>
        
        {/* 빠른 가격 설정 */}
        <View style={bookingFormStyles.quickActionsRow}>
          <TouchableOpacity
            style={bookingFormStyles.quickButton}
            onPress={() => onQuickPrice(index, 0)}
          >
            <Text style={bookingFormStyles.quickButtonText}>무료</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={bookingFormStyles.quickButton}
            onPress={() => onQuickPrice(index, item.menuDetail.base_price)}
          >
            <Text style={bookingFormStyles.quickButtonText}>기본가</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={bookingFormStyles.quickButton}
            onPress={() => onQuickPrice(index, Math.round(item.menuDetail.base_price * 0.5))}
          >
            <Text style={bookingFormStyles.quickButtonText}>50%</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {/* 현재 시술 요약 */}
      <View style={bookingFormStyles.itemSummary}>
        <Text style={bookingFormStyles.itemSummaryText}>
          {item.customPrice.toLocaleString()}원 • {item.customDuration}분
        </Text>
      </View>
    </View>
  );
});

SelectedTreatmentItemComponent.displayName = 'SelectedTreatmentItem';

export default SelectedTreatmentItemComponent;
