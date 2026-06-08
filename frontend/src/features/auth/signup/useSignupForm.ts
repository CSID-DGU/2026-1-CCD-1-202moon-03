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
type SurveyQuestionNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
type StoredSurveyQuestionNumber = 1 | 2 | 3 | 4 | 5;

export interface SurveyOption {
  label: string;
  value: SurveyAnswerValue;
}

export interface SurveyQuestion {
  questionNumber: SurveyQuestionNumber;
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
    question: '공부할 때 음악이나 주변 소리가 있으면 어떤가요?',
    options: [
      { label: '집중이 더 잘 된다', value: 'high' },
      { label: '별로 상관없다', value: 'medium' },
      { label: '집중이 더 안 된다', value: 'low' },
    ],
  },
  {
    questionNumber: 2,
    question: '공부할 때 손을 움직이거나 뭔가를 만지작거리는 편인가요?',
    options: [
      { label: '자주 그렇다', value: 'high' },
      { label: '가끔 그렇다', value: 'medium' },
      { label: '거의 없다', value: 'low' },
    ],
  },
  {
    questionNumber: 3,
    question: '조용하고 자극이 적은 환경에서 오히려 딴생각이 더 많이 나는 편인가요?',
    options: [
      { label: '자주 그렇다', value: 'high' },
      { label: '가끔 그렇다', value: 'medium' },
      { label: '거의 없다', value: 'low' },
    ],
  },
  {
    questionNumber: 4,
    question: '지루한 내용을 공부할 때 몸을 움직이고 싶어지나요?',
    options: [
      { label: '자주 그렇다', value: 'high' },
      { label: '가끔 그렇다', value: 'medium' },
      { label: '거의 없다', value: 'low' },
    ],
  },
  {
    questionNumber: 5,
    question: '영상 강의 중 다른 탭이나 핸드폰을 얼마나 자주 확인하나요?',
    options: [
      { label: '자주 확인한다', value: 'high' },
      { label: '가끔 확인한다', value: 'medium' },
      { label: '거의 확인하지 않는다', value: 'low' },
    ],
  },
  {
    questionNumber: 6,
    question: '강의 내용을 놓쳐서 되감기하는 경우가 얼마나 자주 있나요?',
    options: [
      { label: '자주 있다', value: 'high' },
      { label: '가끔 있다', value: 'medium' },
      { label: '거의 없다', value: 'low' },
    ],
  },
  {
    questionNumber: 7,
    question: '한 가지 영상을 끝까지 보지 못하고 중간에 포기한 경험이 있나요?',
    options: [
      { label: '자주 있다', value: 'high' },
      { label: '가끔 있다', value: 'medium' },
      { label: '거의 없다', value: 'low' },
    ],
  },
  {
    questionNumber: 8,
    question: '강의 중 관련 없는 생각이 얼마나 자주 떠오르나요?',
    options: [
      { label: '자주 떠오른다', value: 'high' },
      { label: '가끔 떠오른다', value: 'medium' },
      { label: '거의 없다', value: 'low' },
    ],
  },
  {
    questionNumber: 9,
    question: '게임이나 퀴즈처럼 빠른 반응이 필요한 활동을 할 때 어떤가요?',
    options: [
      { label: '재미있고 잘 할 수 있다', value: 'high' },
      { label: '보통이다', value: 'medium' },
      { label: '어렵고 부담스럽다', value: 'low' },
    ],
  },
  {
    questionNumber: 10,
    question: '타이핑 속도는 어느 정도인가요?',
    options: [
      { label: '빠른 편이다', value: 'high' },
      { label: '보통이다', value: 'medium' },
      { label: '느린 편이다', value: 'low' },
    ],
  },
  {
    questionNumber: 11,
    question: '시간 제한이 있는 활동을 할 때 어떤가요?',
    options: [
      { label: '긴장감이 있어서 더 집중이 잘 된다', value: 'high' },
      { label: '별로 상관없다', value: 'medium' },
      { label: '부담스럽고 실수가 많아진다', value: 'low' },
    ],
  },
  {
    questionNumber: 12,
    question: '빠르게 변하는 화면이나 정보를 따라가는 것이 어렵지 않나요?',
    options: [
      { label: '잘 따라갈 수 있다', value: 'high' },
      { label: '보통이다', value: 'medium' },
      { label: '따라가기 어렵다', value: 'low' },
    ],
  },
] as const;

const STORED_SURVEY_QUESTION_NUMBERS: StoredSurveyQuestionNumber[] = [1, 2, 3, 4, 5];
const TOTAL_SURVEY_QUESTION_COUNT = SURVEY_QUESTIONS.length;

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
  const [surveyAnswers, setSurveyAnswers] = useState<
    Record<SurveyQuestionNumber, SurveyAnswerValue | null>
  >({
    1: null,
    2: null,
    3: null,
    4: null,
    5: null,
    6: null,
    7: null,
    8: null,
    9: null,
    10: null,
    11: null,
    12: null,
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
    questionNumber: SurveyQuestionNumber,
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
      survey: hasAllAnswers ? '' : `설문 ${SURVEY_QUESTIONS.length}문항에 모두 응답해 주세요.`,
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
        answers: STORED_SURVEY_QUESTION_NUMBERS.map((questionNumber) => ({
          question_number: questionNumber,
          answer_value: surveyAnswers[questionNumber] as SurveyAnswerValue,
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
    totalSurveyQuestionCount: TOTAL_SURVEY_QUESTION_COUNT,
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
