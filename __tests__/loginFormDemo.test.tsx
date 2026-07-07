// [Security hotfix] 하드코딩 데모 로그인 제거 검증.
// 데모 계정(자격증명 하드코딩) 버튼이 렌더 트리에 노출되지 않아야 한다.
import { render } from '@testing-library/react-native';
import React from 'react';
import LoginForm from '@/components/forms/LoginForm';

describe('LoginForm 데모 로그인 제거', () => {
  it('"데모 계정으로 로그인" 버튼을 렌더하지 않는다', () => {
    const { queryByText } = render(<LoginForm onLogin={async () => {}} />);
    expect(queryByText('데모 계정으로 로그인')).toBeNull();
  });

  it('정상 로그인 버튼은 유지된다', () => {
    const { getByText } = render(<LoginForm onLogin={async () => {}} />);
    expect(getByText('로그인')).toBeTruthy();
  });
});
