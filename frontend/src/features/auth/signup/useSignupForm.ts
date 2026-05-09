import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { register, saveOnboardingSurvey } from '../../../services/auth.api';
import { useAuthStore } from '../../../store/useAuthStore';

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
  agreements: string;
  survey: string;
}

type SurveyAnswerValue = 'low' | 'medium' | 'high';

export interface SurveyOption {
  label: string;
  value: SurveyAnswerValue;
}

export interface SurveyQuestion {
  questionNumber: 1 | 2 | 3 | 4 | 5;
  question: string;
  options: SurveyOption[];
}

const initialErrors: SignupFieldErrors = {
  username: '',
  nickname: '',
  birthdate: '',
  gender: '',
  email: '',
  password: '',
  agreements: '',
  survey: '',
};

const SURVEY_QUESTIONS: SurveyQuestion[] = [
  {
    questionNumber: 1,
    question: '평소 공부할 때 주변 자극(소리, 움직임 등)이 있으면 어떤가요?',
    options: [
      { label: '집중이 더 잘 된다', value: 'high' },
      { label: '별로 상관없다', value: 'medium' },
      { label: '집중이 더 안 된다', value: 'low' },
    ],
  },
  {
    questionNumber: 2,
    question: '타이핑 속도는 어느 정도인가요?',
    options: [
      { label: '빠른 편이다 (분당 300타 이상)', value: 'high' },
      { label: '보통이다 (분당 150~300타)', value: 'medium' },
      { label: '느린 편이다 (분당 150타 미만)', value: 'low' },
    ],
  },
  {
    questionNumber: 3,
    question: '강의를 들을 때 얼마나 자주 놓치는 내용이 생기나요?',
    options: [
      { label: '거의 놓치지 않는다', value: 'high' },
      { label: '가끔 놓친다', value: 'medium' },
      { label: '자주 놓친다', value: 'low' },
    ],
  },
  {
    questionNumber: 4,
    question: '게임이나 퀴즈처럼 빠른 반응이 필요한 활동을 할 때 어떤가요?',
    options: [
      { label: '재미있고 잘 할 수 있다', value: 'high' },
      { label: '보통이다', value: 'medium' },
      { label: '어렵고 부담스럽다', value: 'low' },
    ],
  },
  {
    questionNumber: 5,
    question: '학습 중 빈칸 채우기 같은 활동이 있다면 어느 정도 난이도를 선호하나요?',
    options: [
      { label: '도전적인 난이도가 좋다', value: 'high' },
      { label: '적당한 난이도가 좋다', value: 'medium' },
      { label: '쉬운 난이도가 좋다', value: 'low' },
    ],
  },
] as const;

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const usernamePattern = /^[a-zA-Z0-9_]{4,20}$/;
const birthdatePattern = /^\d{4}\s*\/\s*(0[1-9]|1[0-2])\s*\/\s*(0[1-9]|[12]\d|3[01])$/;

export function useSignupForm() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const logout = useAuthStore((state) => state.logout);

  const [username, setUsername] = useState('');
  const [nickname, setNickname] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | ''>('');
  const [emailId, setEmailId] = useState('');
  const [emailDomain, setEmailDomain] = useState('Direct input');
  const [customEmailDomain, setCustomEmailDomain] = useState('');
  const [password, setPassword] = useState('');
  const [agreeToService, setAgreeToService] = useState(false);
  const [agreeToPrivacy, setAgreeToPrivacy] = useState(false);
  const [confirmAge, setConfirmAge] = useState(false);
  const [surveyAnswers, setSurveyAnswers] = useState<Record<1 | 2 | 3 | 4 | 5, SurveyAnswerValue | null>>({
    1: null,
    2: null,
    3: null,
    4: null,
    5: null,
  });
  const [fieldErrors, setFieldErrors] = useState<SignupFieldErrors>(initialErrors);
  const [submitError, setSubmitError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const isCustomDomain = emailDomain === 'Direct input';
  const resolvedEmailDomain = isCustomDomain ? customEmailDomain.trim() : emailDomain;
  const fullEmail = emailId && resolvedEmailDomain ? `${emailId}@${resolvedEmailDomain}` : '';
  const isAllAgreed = agreeToService && agreeToPrivacy && confirmAge;

  const isRequiredFieldsFilled = Boolean(
    username.trim() &&
      nickname.trim() &&
      birthdate.trim() &&
      gender &&
      emailId.trim() &&
      resolvedEmailDomain &&
      password &&
      isAllAgreed,
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

  const clearAgreementError = () => {
    setFieldErrors((prev) => ({ ...prev, agreements: '' }));
  };

  const clearSurveyError = () => {
    setFieldErrors((prev) => ({ ...prev, survey: '' }));
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

  const handleToggleAllAgreements = () => {
    const nextValue = !isAllAgreed;
    setAgreeToService(nextValue);
    setAgreeToPrivacy(nextValue);
    setConfirmAge(nextValue);
    clearAgreementError();
    clearSubmitState();
  };

  const handleToggleServiceAgreement = () => {
    setAgreeToService((prev) => !prev);
    clearAgreementError();
    clearSubmitState();
  };

  const handleTogglePrivacyAgreement = () => {
    setAgreeToPrivacy((prev) => !prev);
    clearAgreementError();
    clearSubmitState();
  };

  const handleToggleAgeAgreement = () => {
    setConfirmAge((prev) => !prev);
    clearAgreementError();
    clearSubmitState();
  };

  const handleSurveyAnswerChange = (
    questionNumber: 1 | 2 | 3 | 4 | 5,
    answerValue: SurveyAnswerValue,
  ) => {
    setSurveyAnswers((prev) => ({
      ...prev,
      [questionNumber]: answerValue,
    }));
    clearSurveyError();
    clearSubmitState();
  };

  const validateProfileStep = () => {
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

    if (!agreeToService || !agreeToPrivacy || !confirmAge) {
      nextErrors.agreements = '필수 약관에 모두 동의해 주세요.';
    }

    setFieldErrors(nextErrors);
    return !Object.values(nextErrors).some(Boolean);
  };

  const validateSurveyStep = () => {
    const hasAllAnswers = SURVEY_QUESTIONS.every(
      (question) => surveyAnswers[question.questionNumber] !== null,
    );

    setFieldErrors((prev) => ({
      ...prev,
      survey: hasAllAnswers ? '' : '설문 5문항에 모두 응답해 주세요.',
    }));

    return hasAllAnswers;
  };

  const completeSignupWithSurvey = async () => {
    setSubmitError('');
    setIsSuccess(false);

    if (!validateSurveyStep()) {
      return;
    }

    setIsLoading(true);

    try {
      await login({
        username: username.trim(),
        password,
      });

      await saveOnboardingSurvey({
        answers: SURVEY_QUESTIONS.map((question) => ({
          question_number: question.questionNumber,
          answer_value: surveyAnswers[question.questionNumber] as SurveyAnswerValue,
        })),
      });

      setIsSuccess(true);
      await logout({ redirectToLogin: false });
      navigate('/login');
    } catch {
      setSubmitError('설문 저장 또는 회원가입 완료 처리에 실패했습니다. 다시 시도해 주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  const submitRegistration = async () => {
    setSubmitError('');
    setIsSuccess(false);

    if (!validateProfileStep()) {
      return false;
    }

    setIsLoading(true);

    try {
      await useAuthStore.getState().logout({ revokeToken: false, redirectToLogin: false });
      await register({
        username: username.trim(),
        nickname: nickname.trim(),
        email: fullEmail.trim(),
        password,
        birth_date: birthdate.replace(/\s*\/\s*/g, '-'),
        gender: gender || undefined,
      });
      return true;
    } catch {
      setSubmitError('회원가입에 실패했습니다. 다시 시도해 주세요.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    surveyQuestions: SURVEY_QUESTIONS,
    username,
    nickname,
    birthdate,
    gender,
    emailId,
    emailDomain,
    customEmailDomain,
    password,
    agreeToService,
    agreeToPrivacy,
    confirmAge,
    isAllAgreed,
    surveyAnswers,
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
    handleToggleAllAgreements,
    handleToggleServiceAgreement,
    handleTogglePrivacyAgreement,
    handleToggleAgeAgreement,
    handleSurveyAnswerChange,
    handleSubmit: submitRegistration,
    validate: validateProfileStep,
    completeSignupWithSurvey,
  };
}
