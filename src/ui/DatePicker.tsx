import { StyleSheet, View } from "react-native";
import DatePicker from 'react-native-ui-datepicker';
import { Colors, Spacing } from "./theme";

interface CustomDatePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  mode?: "date" | "time" | "datetime";
  locale?: string;
}

export default function CustomDatePicker({ 
  value, 
  onChange, 
  mode = "date",
  locale = "ko"
}: CustomDatePickerProps) {
  const handleDateChange = (params: any) => {
    if (params.date) {
      // react-native-ui-datepicker에서 반환되는 날짜를 직접 사용
      const originalDate = new Date(params.date);
      console.log('DatePicker - 원본 날짜:', originalDate);
      console.log('DatePicker - 원본 날짜 toString:', originalDate.toString());
      
      // toString()에서 보이는 실제 날짜를 사용하기 위해 로컬 메서드 사용
      // 사용자가 보는 날짜와 실제 저장되는 날짜가 일치하도록 함
      const year = originalDate.getFullYear();
      const month = originalDate.getMonth(); // 0-based
      const day = originalDate.getDate();
      
      console.log('DatePicker - 로컬 연/월/일:', year, month + 1, day);
      
      // 정확한 날짜로 새로운 Date 객체 생성 (12시로 설정)
      const selectedDate = new Date(year, month, day, 12, 0, 0);
      
      console.log('DatePicker - 최종 선택된 날짜:', selectedDate);
      console.log('DatePicker - 최종 연/월/일:', selectedDate.getFullYear(), selectedDate.getMonth() + 1, selectedDate.getDate());
      
      onChange(selectedDate);
    }
  };

  return (
    <View style={styles.container}>
      <DatePicker
        date={value}
        onChange={handleDateChange}
        mode="single"
        locale={locale}
        timePicker={mode === "time" || mode === "datetime"}
        styles={{
          header: {
            paddingVertical: Spacing.md,
          },
          month_selector_label: {
            fontSize: 18,
            fontWeight: 'bold',
            color: Colors.gray[900],
          },
          year_selector_label: {
            fontSize: 18,
            fontWeight: 'bold',
            color: Colors.gray[900],
          },
          button_next: {
            padding: 8,
            borderRadius: 8,
            backgroundColor: Colors.gray[50],
          },
          button_prev: {
            padding: 8,
            borderRadius: 8,
            backgroundColor: Colors.gray[50],
          },
          weekday_label: {
            fontSize: 14,
            fontWeight: '600',
            color: Colors.gray[600],
          },
          day: {
            borderRadius: 12,
            margin: 2,
          },
          day_label: {
            fontSize: 16,
            fontWeight: '500',
            color: Colors.gray[800],
          },
          selected: {
            backgroundColor: Colors.primary,
            borderRadius: 12,
          },
          selected_label: {
            color: Colors.white,
            fontWeight: '600',
          },
          today: {
            borderColor: Colors.primary,
            borderWidth: 2,
            borderRadius: 12,
          },
          today_label: {
            color: Colors.primary,
            fontWeight: '600',
          },
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.gray[100],
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    marginHorizontal: 4,
    marginVertical: 8,
  },
});
