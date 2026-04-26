import { useMemo, useState } from 'react';

export type SignupState =
  | 'default'
  | 'filled'
  | 'validation_error'
  | 'submit_loading'
  | 'submit_fail'
  | 'submit_success';

export interface SignupFieldErrors {
  name: string;
  birthdate: string;
  gender: string;
  email: string;
  password: string;
}

const initialErrors: SignupFieldErrors = {
  name: '',
  birthdate: '',
  gender: '',
  email: '',
  password: '',
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const birthdatePattern = /^\d{4}\s*\/\s*(0[1-9]|1[0-2])\s*\/\s*(0[1-9]|[12]\d|3[01])$/;

const mockSignup = () =>
  new Promise<boolean>((resolve, reject) => {
    window.setTimeout(() => {
      if (Math.random() > 0.5) {
        resolve(true);
        return;
      }

      reject(new Error('Signup failed'));
    }, 1000);
  });

export function useSignupForm() {
  const [name, setName] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | ''>('');
  const [emailId, setEmailId] = useState('');
  const [emailDomain, setEmailDomain] = useState('직접입력');
  const [customEmailDomain, setCustomEmailDomain] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<SignupFieldErrors>(initialErrors);
  const [submitError, setSubmitError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const isCustomDomain = emailDomain === '직접입력';
  const resolvedEmailDomain = isCustomDomain ? customEmailDomain.trim() : emailDomain;
  const fullEmail = emailId && resolvedEmailDomain ? `${emailId}@${resolvedEmailDomain}` : '';

  const isRequiredFieldsFilled = Boolean(
    name.trim() &&
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

  const handleNameChange = (value: string) => {
    setName(value);
    setFieldErrors((prev) => ({ ...prev, name: '' }));
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
    if (value !== '직접입력') {
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

    if (!name.trim()) {
      nextErrors.name = '이름을 입력해주세요';
    }

    if (!birthdate.trim()) {
      nextErrors.birthdate = '생년월일을 입력해주세요';
    } else if (!birthdatePattern.test(birthdate.trim())) {
      nextErrors.birthdate = '생년월일 형식이 올바르지 않습니다';
    }

    if (!gender) {
      nextErrors.gender = '성별을 선택해주세요';
    }

    if (!emailId.trim()) {
      nextErrors.email = '이메일을 입력해주세요';
    } else if (!resolvedEmailDomain) {
      nextErrors.email = '이메일을 입력해주세요';
    } else if (!emailPattern.test(`${emailId.trim()}@${resolvedEmailDomain}`)) {
      nextErrors.email = '이메일 형식이 올바르지 않습니다';
    }

    if (!password || password.length < 8) {
      nextErrors.password = '비밀번호 형식이 올바르지 않습니다';
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
      await mockSignup();
      setIsSuccess(true);
    } catch {
      setSubmitError('회원가입에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    name,
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
    handleNameChange,
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
