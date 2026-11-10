// SPEC-SECURITY-002 후속 — LoginForm 아이디 기억하기 저장소 실패 로그 검증.
// AsyncStorage 읽기·저장·삭제가 실패할 때 로그에 에러 메시지만 남고 에러 객체는 넘기지 않는지,
// 실패 뒤 동작(빈 입력란으로 그리기, 로그인 계속)은 그대로인지 본다.
// AsyncStorage는 jest.setup.js가 공식 jest 모의 객체로 바꿔 둔다.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import { Alert } from 'react-native';
import LoginForm from '@/components/forms/LoginForm';
import {
  PII_SENTINEL,
  allArgs,
  containsRef,
  includesText,
  restoreConsoleSpies,
  spyOnConsole,
  type ConsoleSpies,
} from './utils/consoleArgs';

const mockedStorage = AsyncStorage as unknown as {
  getItem: jest.Mock;
  setItem: jest.Mock;
  removeItem: jest.Mock;
};

const EMAIL_KEY = 'remembered-email';
const EMAIL = 'a@b.com';
const PASSWORD = 'password1';
const LOAD_FAILED = '저장된 이메일 로드 실패:';
const SAVE_FAILED = '이메일 저장 실패:';

// 메시지에는 표식을 넣지 않는다. 에러 객체를 통째로 넘길 때만 드러나는 속성에 개인정보 표식을 담는다.
function storageError(message: string) {
  return Object.assign(new Error(message), { key: EMAIL_KEY, userInfo: { value: PII_SENTINEL } });
}

let spies: ConsoleSpies;
let alertSpy: jest.SpyInstance;

beforeEach(() => {
  // 모의 함수의 구현은 그대로 두고 호출 기록만 지운다.
  mockedStorage.getItem.mockClear();
  mockedStorage.setItem.mockClear();
  mockedStorage.removeItem.mockClear();
  spies = spyOnConsole();
  alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
});

afterEach(() => {
  restoreConsoleSpies();
});

// label 로그가 에러 메시지만 받았고, 어떤 콘솔 인자에도 에러 객체와 표식이 없는지 본다.
function expectOnlyMessage(label: string, error: Error) {
  expect(spies.error).toHaveBeenCalledWith(label, error.message);
  const args = allArgs(spies);
  expect(containsRef(args, error)).toBe(false);
  expect(includesText(args, PII_SENTINEL)).toBe(false);
}

// 이메일과 비밀번호를 넣고 로그인을 누른다. remember가 참이면 '아이디 기억하기'를 먼저 켠다.
async function submitLogin(onLogin: jest.Mock, remember: boolean) {
  const screen = render(<LoginForm onLogin={onLogin} />);
  fireEvent.changeText(screen.getByPlaceholderText('이메일을 입력하세요'), EMAIL);
  fireEvent.changeText(screen.getByPlaceholderText('비밀번호를 입력하세요'), PASSWORD);
  if (remember) fireEvent.press(screen.getByText('아이디 기억하기'));
  fireEvent.press(screen.getByText('로그인'));
  // 저장 실패 로그가 남은 뒤에 onLogin이 불린다.
  await waitFor(() => expect(onLogin).toHaveBeenCalledWith({ email: EMAIL, password: PASSWORD }));
}

describe('SPEC-SECURITY-002 후속 LoginForm 아이디 기억하기 저장소 실패 로그', () => {
  it('getItem 실패: 로드 실패 로그에 메시지만 남기고 빈 입력란으로 그린다', async () => {
    const error = storageError('getItem failed');
    mockedStorage.getItem.mockRejectedValueOnce(error);

    const screen = render(<LoginForm onLogin={jest.fn()} />);
    // 마운트 때 읽기 실패 로그가 남을 때까지 기다린다.
    await waitFor(() => expect(spies.error.mock.calls.some((call) => call[0] === LOAD_FAILED)).toBe(true));

    expect(mockedStorage.getItem).toHaveBeenCalledWith(EMAIL_KEY);
    expectOnlyMessage(LOAD_FAILED, error);
    // 실패해도 이메일 입력란은 비어 있고 '아이디 기억하기'는 꺼져 있다.
    expect(screen.getByPlaceholderText('이메일을 입력하세요').props.value).toBe('');
    expect(screen.queryByText('✓')).toBeNull();
  });

  it('setItem 실패(아이디 기억하기 켬): 저장 실패 로그에 메시지만 남기고 로그인을 계속한다', async () => {
    const error = storageError('setItem failed');
    mockedStorage.setItem.mockRejectedValueOnce(error);
    const onLogin = jest.fn(async () => {});

    await submitLogin(onLogin, true);

    expect(mockedStorage.setItem).toHaveBeenCalledWith(EMAIL_KEY, EMAIL);
    expectOnlyMessage(SAVE_FAILED, error);
    // 저장 실패는 로그인 실패 알림으로 이어지지 않는다.
    expect(alertSpy).not.toHaveBeenCalled();
  });

  it('removeItem 실패(아이디 기억하기 끔): 저장 실패 로그에 메시지만 남기고 로그인을 계속한다', async () => {
    const error = storageError('removeItem failed');
    mockedStorage.removeItem.mockRejectedValueOnce(error);
    const onLogin = jest.fn(async () => {});

    await submitLogin(onLogin, false);

    expect(mockedStorage.removeItem).toHaveBeenCalledWith(EMAIL_KEY);
    expectOnlyMessage(SAVE_FAILED, error);
    expect(alertSpy).not.toHaveBeenCalled();
  });
});
