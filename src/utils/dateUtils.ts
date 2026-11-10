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

const LOCAL_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const LOCAL_TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

// @MX:NOTE: [AUTO] API 로 보내는 일시(reserved_at)의 UTC 규약. 백엔드는 오프셋 없는 일시를 UTC wall-clock 으로
//   저장하고 응답에 UTC 를 붙인다. 그래서 '2026-07-07T14:00:00' 을 그대로 보내면 14:00Z 로 저장되어 23:00 KST 로
//   보인다(9시간 밀림). 고른 로컬 시각을 그 순간의 UTC(Z)로 바꿔 보낸다 — 예약 수정의 toISOString() 과 같은 규약.
/**
 * 기기 로컬 날짜('YYYY-MM-DD')와 시각('HH:mm', 24시간)을 그 순간의 UTC ISO 8601 문자열로 변환
 *
 * 오프셋 없는 일시 문자열을 로컬로 읽을지 UTC 로 읽을지는 JS 엔진과 사양 판에 따라 달라 왔으므로
 * 문자열을 파싱하지 않고 숫자 구성요소로 로컬 Date 를 만든다.
 * @param localDate 'YYYY-MM-DD' 형식의 로컬 날짜
 * @param localTime 'HH:mm' 형식의 로컬 시각 (00:00~23:59)
 * @returns "2026-07-07T05:00:00.000Z" 형식의 문자열 (Asia/Seoul 에서 '2026-07-07', '14:00' 인 경우)
 * @throws RangeError 비었거나 형식이 다르거나 달력에 없는 날짜·시각(2월 30일, 24:00 등)
 */
export const localDateTimeToUtcIso = (localDate: string, localTime: string): string => {
  const dateMatch = LOCAL_DATE_PATTERN.exec(localDate);
  const timeMatch = LOCAL_TIME_PATTERN.exec(localTime);

  if (dateMatch && timeMatch) {
    const [year, month, day] = dateMatch.slice(1).map(Number);
    const date = new Date(year, month - 1, day, Number(timeMatch[1]), Number(timeMatch[2]));
    // Date 는 없는 날짜를 다음 달로 넘긴다(2월 30일 → 3월 2일). 고른 날짜와 다르면 보내지 않는다.
    if (date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day) {
      return date.toISOString();
    }
  }

  throw new RangeError(`Invalid local date/time: "${localDate}" "${localTime}"`);
};
