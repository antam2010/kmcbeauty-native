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

// @MX:ANCHOR: [AUTO] 'YYYY-MM-DD' 날짜 문자열의 단일 진입점. 예약 탭·홈·달력·예약 폼/수정 모달·대시보드 훅과
//   시술/대시보드 API 서비스가 날짜 키와 API 날짜 파라미터를 모두 이 함수로 만든다(호출 파일 10개).
// @MX:REASON: API 는 start_date/end_date/target_date 를 KST 달력 날짜로 해석한다. toISOString() 기반(UTC) 날짜로
//   되돌리면 00:00~08:59 KST 에 하루 전 날짜가 전송·표시되고, 월말 예약이 월간 조회에서 빠진다.
/**
 * Date 를 기기 로컬 시간 기준 'YYYY-MM-DD' 문자열로 변환
 *
 * toISOString().split('T')[0] 은 UTC 날짜다. 한국(UTC+9)에서는 00:00~08:59 사이에, 그리고
 * new Date(y, m, d) 같은 로컬 자정 Date 는 항상 하루 전 날짜가 나온다.
 * API 는 날짜 파라미터를 KST 달력 날짜로 해석하고, 앱의 나머지 날짜 로직(getDate/getDay 등)도
 * 기기 로컬 시간을 쓰므로 로컬 연·월·일로 조립한다.
 * @param date Date 객체 (기본값: 현재 시각)
 * @returns "2025-09-17" 형식의 문자열
 */
export const toLocalDateString = (date: Date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};
