import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../constants/routes';
import { useAuthStore } from '../../../store/useAuthStore';

type LoginState =
  | 'default'
  | 'completed'
  | 'validation_error'
  | 'fail'
  | 'success'
  | 'loading';

const usernamePattern = /^[a-zA-Z0-9_]{4,20}$/;

export function useLoginForm() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const loginState: LoginState = useMemo(
    () =>
      isLoading
        ? 'loading'
        : submitError
          ? 'fail'
          : usernameError || passwordError
            ? 'validation_error'
            : isSuccess
              ? 'success'
              : username && password
                ? 'completed'
                : 'default',
    [isLoading, isSuccess, password, passwordError, submitError, username, usernameError],
  );

  const isSubmitDisabled = loginState === 'default' || loginState === 'loading';

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
    setUsernameError('');
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
    const nextUsernameError = usernamePattern.test(username)
      ? ''
      : '아이디는 4~20자의 영문, 숫자, 밑줄만 사용할 수 있습니다.';
    const nextPasswordError = password.length >= 8
      ? ''
      : '비밀번호는 8자 이상이어야 합니다.';

    setUsernameError(nextUsernameError);
    setPasswordError(nextPasswordError);

    return !nextUsernameError && !nextPasswordError;
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
      await login({ username, password });
      setIsSuccess(true);
      navigate(ROUTES.home);
    } catch {
      setSubmitError('아이디 또는 비밀번호가 올바르지 않습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    username,
    password,
    usernameError,
    passwordError,
    submitError,
    isSuccess,
    isLoading,
    loginState,
    isSubmitDisabled,
    handleUsernameChange,
    handlePasswordChange,
    handleSubmit,
  };
}
