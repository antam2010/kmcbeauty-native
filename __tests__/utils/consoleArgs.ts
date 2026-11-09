// SPEC-SECURITY-002 테스트 전용 판정 도구 (acceptance.md §1.1~1.5, §1.7, contract.md D-C4).
// 콘솔 스파이가 받은 원시 인자를 깊게 탐색해 표식 문자열·참조·값 일치를 판정한다.
// 운영 코드에서는 쓰지 않는다(plan.md §A.3 I-3). jest testMatch(`__tests__/**/*.test.{ts,tsx}`)에
// 걸리지 않는 파일이라 스위트가 아니다.
import { AxiosError } from 'axios';

// §1.1 표식 문자열
export const PW_SENTINEL = 'PW-SENTINEL-7f3a';
export const TOKEN_SENTINEL = 'TOKEN-SENTINEL-9c1e';
export const PII_SENTINEL = 'PII-SENTINEL-4b2d';
export const XHR_SENTINEL = 'XHR-SENTINEL-1d8e';

// §1.2 콘솔 원시 인자
export const CONSOLE_METHODS = ['log', 'info', 'warn', 'error', 'debug'] as const;
export type ConsoleMethod = (typeof CONSOLE_METHODS)[number];
export type ConsoleSpies = Record<ConsoleMethod, jest.SpyInstance>;

// 다섯 콘솔 메서드에 스파이를 걸고 출력을 막는다. 테스트가 끝나면 restoreConsoleSpies()로 되돌린다.
export function spyOnConsole(): ConsoleSpies {
  const spies = {} as ConsoleSpies;
  for (const method of CONSOLE_METHODS) {
    spies[method] = jest.spyOn(console, method).mockImplementation(() => {});
  }
  return spies;
}

// 스파이를 되돌린다. 같은 테스트에서 jest.spyOn으로 건 다른 스파이도 함께 되돌아간다.
export function restoreConsoleSpies(): void {
  jest.restoreAllMocks();
}

// 스파이 하나가 받은 모든 호출의 모든 인자
export function argsOf(spy: jest.SpyInstance): unknown[] {
  return spy.mock.calls.flat();
}

// 다섯 스파이가 받은 모든 호출의 모든 인자(acceptance.md §1.2의 args)
export function allArgs(spies: ConsoleSpies): unknown[] {
  return CONSOLE_METHODS.flatMap((method) => argsOf(spies[method]));
}

// 다섯 스파이의 호출 수 합
export function totalCalls(spies: ConsoleSpies): number {
  return CONSOLE_METHODS.reduce((sum, method) => sum + spies[method].mock.calls.length, 0);
}

// §1.3 재귀 순회. 만난 값마다 visit을 부르고, visit이 참을 돌려주면 그 자리에서 참을 돌려준다.
// render가 참이면 객체의 String(value)와 JSON.stringify(value) 결과도 visit에 넘긴다.
type Visit = (value: unknown) => boolean;

function walk(value: unknown, visit: Visit, render: boolean, seen: Set<object>): boolean {
  // 3. 함수, null, undefined는 건너뛴다.
  if (value === null || value === undefined || typeof value === 'function') return false;
  // 1. 문자열·숫자·불리언 같은 원시값
  if (typeof value !== 'object') return visit(value);
  // 2. 객체(배열, Error, Map, Set, URLSearchParams 포함). 한 번 방문한 객체는 다시 보지 않는다.
  if (seen.has(value)) return false;
  seen.add(value);
  if (visit(value)) return true;
  if (render) {
    for (const rendered of [renderString(value), renderJson(value)]) {
      if (rendered !== undefined && visit(rendered)) return true;
    }
  }
  return childrenOf(value).some((child) => walk(child, visit, render, seen));
}

// String(value): URLSearchParams의 toString()과 Error의 이름·메시지가 여기서 잡힌다.
function renderString(value: object): string | undefined {
  try {
    return String(value);
  } catch {
    return undefined;
  }
}

// JSON.stringify(value)가 예외 없이 끝나면 그 결과. AxiosError.toJSON() 경로가 여기서 잡힌다.
function renderJson(value: object): string | undefined {
  try {
    return JSON.stringify(value);
  } catch {
    return undefined;
  }
}

// Map·Set 항목의 키와 값, Reflect.ownKeys가 돌려주는 모든 키(열거 불가 키와 심볼 키 포함)의 값
function childrenOf(value: object): unknown[] {
  const children: unknown[] = [];
  if (value instanceof Map) value.forEach((entryValue, entryKey) => children.push(entryKey, entryValue));
  if (value instanceof Set) value.forEach((entryValue) => children.push(entryValue));
  let keys: (string | symbol)[] = [];
  try {
    keys = Reflect.ownKeys(value);
  } catch {
    keys = [];
  }
  for (const key of keys) {
    try {
      children.push((value as Record<string | symbol, unknown>)[key]);
    } catch {
      // getter가 예외를 던지면 그 키는 건너뛴다.
    }
  }
  return children;
}

// §1.3 includesText(args, text): 인자나 그 하위 값, 객체의 렌더링 결과 가운데 하나라도 text를 포함하면 참
export function includesText(args: readonly unknown[], text: string): boolean {
  const seen = new Set<object>();
  const visit: Visit = (value) => {
    if (typeof value === 'string') return value.includes(text);
    if (typeof value === 'number' || typeof value === 'boolean') return String(value).includes(text);
    return false;
  };
  return args.some((arg) => walk(arg, visit, true, seen));
}

// §1.4 containsRef(args, target): 같은 순회에서 target과 같은 참조(===)가 있으면 참
export function containsRef(args: readonly unknown[], target: unknown): boolean {
  const seen = new Set<object>();
  return args.some((arg) => walk(arg, (value) => value === target, false, seen));
}

// §1.5 hasExactValue(args, text): 렌더링 없이 순회하며 만난 문자열·숫자 가운데
// String(value) === text인 것이 있으면 참
export function hasExactValue(args: readonly unknown[], text: string): boolean {
  const seen = new Set<object>();
  const visit: Visit = (value) =>
    (typeof value === 'string' || typeof value === 'number') && String(value) === text;
  return args.some((arg) => walk(arg, visit, false, seen));
}

// §1.7 에러와 응답 만들기. 실제 AxiosError이며 응답은 config와 request를 품는다.
// 메시지에는 표식을 넣지 않는다.
export type AxiosErrorOptions = {
  method: string;
  url: string;
  // 없으면 응답이 없는 에러다(request만 품는다).
  status?: number;
  // 직렬화된 요청 본문(JSON 문자열 또는 폼 문자열)
  data?: string;
  params?: Record<string, unknown>;
  responseData?: unknown;
  code?: string;
  message?: string;
};

const STATUS_TEXT: Record<number, string> = {
  401: 'Unauthorized',
  422: 'Unprocessable Entity',
  500: 'Internal Server Error',
};

export function makeAxiosError(options: AxiosErrorOptions): AxiosError {
  const { method, url, status, data, params, responseData } = options;
  const config: Record<string, unknown> = {
    url,
    method,
    headers: { Authorization: 'Bearer ' + TOKEN_SENTINEL },
  };
  if (data !== undefined) config.data = data;
  if (params !== undefined) config.params = params;
  const request = { _response: XHR_SENTINEL, readyState: 4 };
  const response =
    status === undefined
      ? undefined
      : { status, statusText: STATUS_TEXT[status] ?? '', data: responseData, headers: {}, config, request };
  const message =
    options.message ?? (status === undefined ? 'Network Error' : `Request failed with status code ${status}`);
  const code =
    options.code ??
    (status === undefined
      ? AxiosError.ERR_NETWORK
      : status >= 500
        ? AxiosError.ERR_BAD_RESPONSE
        : AxiosError.ERR_BAD_REQUEST);
  return new AxiosError(message, code, config as any, request, response as any);
}
