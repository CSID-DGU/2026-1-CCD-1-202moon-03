import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../constants/routes';
import { useAuthStore } from '../../../store/useAuthStore';
import type { LoginResponse } from '../../../types/auth';

type LoginState =
  | 'default'
  | 'completed'
  | 'validation_error'
  | 'fail'
  | 'success'
  | 'loading';

const mockLogin = (email: string, password: string) =>  //API 호출로 대체할 곳 
  new Promise<LoginResponse>((resolve, reject) => {
    window.setTimeout(() => {
      if (email === 'test@test.com' && password === '12345678') {
        resolve({
          user: {
            id: 'mock-user-1',
            email,
            name: '테스트 사용자',
          },
        });
        return;
      }

      reject(new Error('Invalid credentials'));
    }, 1000);
  });

export function useLoginForm() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const isValidEmail = (value: string) => /\S+@\S+\.\S+/.test(value);
  const isValidPassword = (value: string) => value.length >= 8;

  const loginState: LoginState = useMemo(
    () =>
      isLoading
        ? 'loading'
        : submitError
          ? 'fail'
          : emailError || passwordError
            ? 'validation_error'
            : isSuccess
              ? 'success'
              : email && password
                ? 'completed'
                : 'default',
    [email, emailError, isLoading, isSuccess, password, passwordError, submitError],
  );

  const isSubmitDisabled = loginState === 'default' || loginState === 'loading';

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    setEmailError('');
    setSubmitError('');
    setIsSuccess(false);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    setPasswordError('');
    setSubmitError('');
    setIsSuccess(false);
  };

  const validate = () => {
    const nextEmailError = isValidEmail(email) ? '' : '이메일 형식이 올바르지 않습니다';
    const nextPasswordError = isValidPassword(password) ? '' : '비밀번호 형식이 올바르지 않습니다';

    setEmailError(nextEmailError);
    setPasswordError(nextPasswordError);

    return !nextEmailError && !nextPasswordError;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setSubmitError('');
    setIsSuccess(false);

    if (!validate()) {
      return;
    }

    setIsLoading(true);

    try {
      const session = await mockLogin(email, password);
      setAuth(session.user);
      setIsSuccess(true);
      console.log('로그인 성공');
      navigate(ROUTES.home);
    } catch {
      setSubmitError('이메일 또는 비밀번호가 올바르지 않습니다');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    email,
    password,
    emailError,
    passwordError,
    submitError,
    isSuccess,
    isLoading,
    loginState,
    isSubmitDisabled,
    handleEmailChange,
    handlePasswordChange,
    handleSubmit,
  };
}
