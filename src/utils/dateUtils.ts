/**
 * 날짜 포맷팅 유틸리티 함수들
 */

const WEEKDAYS = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];

/**
 * 날짜를 한국어 형식으로 포맷팅
 * @param date Date 객체 또는 날짜 문자열
 * @returns "2025년 9월 17일 화요일" 형식의 문자열
 */
export const formatKoreanDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const weekday = WEEKDAYS[d.getDay()];
  
  return `${year}년 ${month}월 ${day}일 ${weekday}`;
};

/**
 * 날짜와 시간을 한국어 형식으로 포맷팅
 * @param dateTime Date 객체 또는 날짜시간 문자열
 * @returns { date: "2025년 9월 17일 화요일", time: "14:30" } 형식의 객체
 */
export const formatKoreanDateTime = (dateTime: Date | string): { date: string; time: string } => {
  const d = typeof dateTime === 'string' ? new Date(dateTime) : dateTime;
  
  return {
    date: formatKoreanDate(d),
    time: d.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
  };
};

/**
 * 간단한 날짜 포맷팅 (요일 제외)
 * @param date Date 객체 또는 날짜 문자열
 * @returns "2025년 9월 17일" 형식의 문자열
 */
export const formatKoreanDateShort = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const day = d.getDate();
  
  return `${year}년 ${month}월 ${day}일`;
};

/**
 * 오늘 날짜 한국어 포맷팅
 * @returns "2025년 9월 17일 화요일" 형식의 문자열
 */
export const formatTodayKorean = (): string => {
  return formatKoreanDate(new Date());
};
