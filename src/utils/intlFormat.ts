// SPEC-PERF-003 REQ-PERF-003-07: 모듈 수준 캐시된 Intl 포맷터.
// 매 렌더/호출마다 새 포맷터 인스턴스를 생성하던 toLocale* 호출을 대체한다.
// 출력은 기존 toLocale* 호출과 문자 단위로 동일해야 한다(행위 보존, AC-13).
//
// @MX:ANCHOR: [AUTO] 렌더 경로 로케일 포맷의 단일 진입점. BookingListScreen / 홈 위젯 /
//   시술 메뉴 / 캘린더가 모두 이 포맷터를 재사용한다(fan_in>=4).
// @MX:REASON: 출력 문자열이 기존 toLocale* 결과와 1문자라도 달라지면 시각 스냅샷이
//   회귀한다(SPEC-PERF-003 AC-13). 포맷 옵션은 기존 호출부와 동일하게 고정한다.

const toDate = (value: Date | string): Date =>
  typeof value === 'string' ? new Date(value) : value;

// 통화 숫자 (₩ 등 접두사는 호출부에서 부착). 기존: amount.toLocaleString()
const krwNumberFormatter = new Intl.NumberFormat('ko-KR');
export const formatKrwNumber = (amount: number): string => krwNumberFormatter.format(amount);

// 시간 HH:mm (24시간). 기존: toLocaleTimeString('ko-KR', { hour:'2-digit', minute:'2-digit', hour12:false })
const timeHmFormatter = new Intl.DateTimeFormat('ko-KR', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});
export const formatTimeHm = (value: Date | string): string => timeHmFormatter.format(toDate(value));

// 짧은 날짜. 기존: toLocaleDateString('ko-KR')
const shortDateFormatter = new Intl.DateTimeFormat('ko-KR');
export const formatKoreanShortDate = (value: Date | string): string =>
  shortDateFormatter.format(toDate(value));

// 연월. 기존: toLocaleDateString('ko-KR', { year:'numeric', month:'long' })
const yearMonthFormatter = new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'long' });
export const formatKoreanYearMonth = (value: Date | string): string =>
  yearMonthFormatter.format(toDate(value));

// 월일요일. 기존: toLocaleDateString('ko-KR', { month:'long', day:'numeric', weekday:'long' })
const monthDayWeekdayFormatter = new Intl.DateTimeFormat('ko-KR', {
  month: 'long',
  day: 'numeric',
  weekday: 'long',
});
export const formatKoreanMonthDayWeekday = (value: Date | string): string =>
  monthDayWeekdayFormatter.format(toDate(value));

// 전체 날짜. 기존: toLocaleDateString('ko-KR', { year:'numeric', month:'long', day:'numeric', weekday:'long' })
const fullDateFormatter = new Intl.DateTimeFormat('ko-KR', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  weekday: 'long',
});
export const formatKoreanFullDate = (value: Date | string): string =>
  fullDateFormatter.format(toDate(value));
