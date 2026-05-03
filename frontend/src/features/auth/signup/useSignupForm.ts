import { useMemo, useState } from 'react';
import { register } from '../../../services/auth.api';

export type SignupState =
  | 'default'
  | 'filled'
  | 'validation_error'
  | 'submit_loading'
  | 'submit_fail'
  | 'submit_success';

export interface SignupFieldErrors {
  username: string;
  nickname: string;
  birthdate: string;
  gender: string;
  email: string;
  password: string;
}

const initialErrors: SignupFieldErrors = {
  username: '',
  nickname: '',
  birthdate: '',
  gender: '',
  email: '',
  password: '',
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const usernamePattern = /^[a-zA-Z0-9_]{4,20}$/;
const birthdatePattern = /^\d{4}\s*\/\s*(0[1-9]|1[0-2])\s*\/\s*(0[1-9]|[12]\d|3[01])$/;

export function useSignupForm() {
  const [username, setUsername] = useState('');
  const [nickname, setNickname] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | ''>('');
  const [emailId, setEmailId] = useState('');
  const [emailDomain, setEmailDomain] = useState('Direct input');
  const [customEmailDomain, setCustomEmailDomain] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<SignupFieldErrors>(initialErrors);
  const [submitError, setSubmitError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const isCustomDomain = emailDomain === 'Direct input';
  const resolvedEmailDomain = isCustomDomain ? customEmailDomain.trim() : emailDomain;
  const fullEmail = emailId && resolvedEmailDomain ? `${emailId}@${resolvedEmailDomain}` : '';

  const isRequiredFieldsFilled = Boolean(
    username.trim() &&
      nickname.trim() &&
      birthdate.trim() &&
      gender &&
      emailId.trim() &&
      resolvedEmailDomain &&
      password,
  );

  const hasFieldErrors = useMemo(() => Object.values(fieldErrors).some(Boolean), [fieldErrors]);

  const signupState: SignupState = isLoading
    ? 'submit_loading'
    : submitError
      ? 'submit_fail'
      : isSuccess
        ? 'submit_success'
        : hasFieldErrors
          ? 'validation_error'
          : isRequiredFieldsFilled
            ? 'filled'
            : 'default';

  const clearSubmitState = () => {
    setSubmitError('');
    setIsSuccess(false);
  };

  const handleUsernameChange = (value: string) => {
    setUsername(value);
    setFieldErrors((prev) => ({ ...prev, username: '' }));
    clearSubmitState();
  };

  const handleNicknameChange = (value: string) => {
    setNickname(value);
    setFieldErrors((prev) => ({ ...prev, nickname: '' }));
    clearSubmitState();
  };

  const handleBirthdateChange = (value: string) => {
    setBirthdate(value);
    setFieldErrors((prev) => ({ ...prev, birthdate: '' }));
    clearSubmitState();
  };

  const handleGenderChange = (value: 'male' | 'female') => {
    setGender(value);
    setFieldErrors((prev) => ({ ...prev, gender: '' }));
    clearSubmitState();
  };

  const handleEmailIdChange = (value: string) => {
    setEmailId(value);
    setFieldErrors((prev) => ({ ...prev, email: '' }));
    clearSubmitState();
  };

  const handleEmailDomainChange = (value: string) => {
    setEmailDomain(value);
    setFieldErrors((prev) => ({ ...prev, email: '' }));
    if (value !== 'Direct input') {
      setCustomEmailDomain(value);
    } else {
      setCustomEmailDomain('');
    }
    clearSubmitState();
  };

  const handleCustomEmailDomainChange = (value: string) => {
    setCustomEmailDomain(value);
    setFieldErrors((prev) => ({ ...prev, email: '' }));
    clearSubmitState();
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    setFieldErrors((prev) => ({ ...prev, password: '' }));
    clearSubmitState();
  };

  const validate = () => {
    const nextErrors: SignupFieldErrors = { ...initialErrors };

    if (!username.trim()) {
      nextErrors.username = '아이디를 입력해 주세요.';
    } else if (!usernamePattern.test(username.trim())) {
      nextErrors.username = '아이디는 4~20자의 영문, 숫자, 밑줄만 사용할 수 있습니다.';
    }

    if (!nickname.trim()) {
      nextErrors.nickname = '닉네임을 입력해 주세요.';
    } else if (nickname.trim().length < 2 || nickname.trim().length > 15) {
      nextErrors.nickname = '닉네임은 2~15자로 입력해 주세요.';
    }

    if (!birthdate.trim()) {
      nextErrors.birthdate = '생년월일을 입력해 주세요.';
    } else if (!birthdatePattern.test(birthdate.trim())) {
      nextErrors.birthdate = '생년월일은 YYYY / MM / DD 형식으로 입력해 주세요.';
    }

    if (!gender) {
      nextErrors.gender = '성별을 선택해 주세요.';
    }

    if (!emailId.trim()) {
      nextErrors.email = '이메일을 입력해 주세요.';
    } else if (!resolvedEmailDomain) {
      nextErrors.email = '이메일을 입력해 주세요.';
    } else if (!emailPattern.test(`${emailId.trim()}@${resolvedEmailDomain}`)) {
      nextErrors.email = '올바른 이메일 형식으로 입력해 주세요.';
    }

    if (!password || password.length < 8) {
      nextErrors.password = '비밀번호는 8자 이상이어야 합니다.';
    }

    setFieldErrors(nextErrors);
    return !Object.values(nextErrors).some(Boolean);
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
      await register({
        username: username.trim(),
        nickname: nickname.trim(),
        email: fullEmail.trim(),
        password,
        birth_date: birthdate.replace(/\s*\/\s*/g, '-'),
        gender: gender || undefined,
      });
      setIsSuccess(true);
    } catch {
      setSubmitError('회원가입에 실패했습니다. 다시 시도해 주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    username,
    nickname,
    birthdate,
    gender,
    emailId,
    emailDomain,
    customEmailDomain,
    password,
    fieldErrors,
    submitError,
    isLoading,
    isSuccess,
    signupState,
    isRequiredFieldsFilled,
    isCustomDomain,
    fullEmail,
    handleUsernameChange,
    handleNicknameChange,
    handleBirthdateChange,
    handleGenderChange,
    handleEmailIdChange,
    handleEmailDomainChange,
    handleCustomEmailDomainChange,
    handlePasswordChange,
    handleSubmit,
    validate,
  };
}
