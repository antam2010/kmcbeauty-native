/**
 * 한국 전화번호 포맷팅 유틸리티
 */

/**
 * 전화번호를 한국식 포맷(010-1234-5678)으로 변환
 * @param phone 숫자만 포함된 전화번호 문자열
 * @returns 포맷된 전화번호 문자열
 */
export function formatPhoneNumber(phone: string): string {
  // 숫자만 추출
  const numbers = phone.replace(/[^0-9]/g, '');
  
  if (numbers.length === 0) return '';
  
  // 한국 휴대폰 번호 (010, 011, 016, 017, 018, 019)
  if (numbers.startsWith('01') && numbers.length <= 11) {
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
  }
  
  // 지역번호가 있는 일반 전화번호 (02, 031, 032 등)
  if (numbers.startsWith('02')) {
    // 서울 (02)
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 6) return `${numbers.slice(0, 2)}-${numbers.slice(2)}`;
    return `${numbers.slice(0, 2)}-${numbers.slice(2, 6)}-${numbers.slice(6, 10)}`;
  } else if (numbers.startsWith('0')) {
    // 기타 지역번호 (3자리)
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
  }
  
  // 일반적인 경우 (앞 3자리-중간 4자리-뒤 4자리)
  if (numbers.length <= 3) return numbers;
  if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
  return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
}

/**
 * 포맷된 전화번호에서 숫자만 추출
 * @param formattedPhone 포맷된 전화번호 문자열
 * @returns 숫자만 포함된 전화번호 문자열
 */
export function unformatPhoneNumber(formattedPhone: string): string {
  return formattedPhone.replace(/[^0-9]/g, '');
}

/**
 * 한국 전화번호 유효성 검사
 * @param phone 전화번호 문자열 (포맷된 것 또는 숫자만)
 * @returns 유효한 전화번호인지 여부
 */
export function isValidKoreanPhoneNumber(phone: string): boolean {
  const numbers = unformatPhoneNumber(phone);
  
  // 최소 7자리, 최대 11자리
  if (numbers.length < 7 || numbers.length > 11) return false;
  
  // 한국 휴대폰 번호 패턴
  const mobilePattern = /^01[0-9]{8,9}$/;
  
  // 한국 지역번호 패턴
  const landlinePattern = /^(02\d{7,8}|0[3-9]\d{8,9})$/;
  
  return mobilePattern.test(numbers) || landlinePattern.test(numbers);
}

/**
 * 전화번호 입력 중 실시간 포맷팅을 위한 함수
 * @param currentValue 현재 입력값
 * @param newValue 새로운 입력값
 * @returns 포맷팅된 새로운 값과 커서 위치
 */
export function handlePhoneInputChange(currentValue: string, newValue: string): {
  formattedValue: string;
  cursorPosition: number;
} {
  const oldNumbers = unformatPhoneNumber(currentValue);
  const newNumbers = unformatPhoneNumber(newValue);
  
  // 최대 11자리까지만 허용
  const limitedNumbers = newNumbers.slice(0, 11);
  const formattedValue = formatPhoneNumber(limitedNumbers);
  
  // 커서 위치 계산 (대시 문자 고려)
  let cursorPosition = formattedValue.length;
  
  // 숫자가 추가된 경우 커서를 마지막으로
  if (newNumbers.length > oldNumbers.length) {
    cursorPosition = formattedValue.length;
  }
  
  return {
    formattedValue,
    cursorPosition
  };
}

/**
 * 입력된 문자열이 전화번호인지 이름인지 판단
 * @param input 입력된 문자열
 * @returns 'phone' | 'name' | 'mixed'
 */
export function detectInputType(input: string): 'phone' | 'name' | 'mixed' {
  const trimmed = input.trim();
  if (!trimmed) return 'mixed';
  
  // 숫자만 있거나 숫자+대시로만 이루어진 경우 전화번호로 판단
  if (/^[\d\-\s]+$/.test(trimmed)) {
    return 'phone';
  }
  
  // 한글, 영문, 공백만 있는 경우 이름으로 판단
  if (/^[가-힣a-zA-Z\s]+$/.test(trimmed)) {
    return 'name';
  }
  
  // 혼합된 경우
  return 'mixed';
}

/**
 * 입력값에서 추정 이름과 전화번호를 추출
 * @param input 입력된 문자열
 * @returns { name: string, phone: string }
 */
export function extractNameAndPhone(input: string): { name: string; phone: string } {
  const type = detectInputType(input);
  
  if (type === 'phone') {
    return {
      name: '',
      phone: input.trim()
    };
  }
  
  if (type === 'name') {
    return {
      name: input.trim(),
      phone: ''
    };
  }
  
  // 혼합된 경우 간단한 패턴 매칭으로 분리 시도
  const phoneMatch = input.match(/[\d\-\s]+/);
  const nameMatch = input.replace(/[\d\-\s]+/g, '').trim();
  
  return {
    name: nameMatch || '',
    phone: phoneMatch ? phoneMatch[0].trim() : ''
  };
}
