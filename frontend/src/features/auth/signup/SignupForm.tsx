import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../../../components/ui/Button';
import FormField from '../../../components/form/FormField';
import InputField from '../../../components/form/InputField';
import StatusMessage from '../../../components/form/StatusMessage';
import { ROUTES } from '../../../constants/routes';
import EmailField from './components/EmailField';
import GenderToggleGroup from './components/GenderToggleGroup';
import { useSignupForm } from './useSignupForm';

const SignupForm: React.FC = () => {
  const {
    surveyQuestions,
    totalSurveyQuestionCount,
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
    signupState,
    isCustomDomain,
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
    handleSubmit,
    validate,
    completeSignupWithSurvey,
  } = useSignupForm();

  const [currentStep, setCurrentStep] = React.useState<1 | 2>(1);
  const [currentSurveyIndex, setCurrentSurveyIndex] = React.useState(0);

  const isSubmitDisabled = signupState === 'default' || signupState === 'validation_error';
  const showSuccessModal = signupState === 'submit_success';
  const currentQuestion = surveyQuestions[currentSurveyIndex];
  const selectedSurveyAnswer = surveyAnswers[currentQuestion.questionNumber];
  const isLastQuestion = currentSurveyIndex === totalSurveyQuestionCount - 1;

  const handleNextStep = async () => {
    if (!validate()) {
      return;
    }

    const isRegistered = await handleSubmit();
    if (isRegistered) {
      setCurrentStep(2);
      setCurrentSurveyIndex(0);
    }
  };

  const handleNextQuestion = async () => {
    if (!selectedSurveyAnswer) {
      return;
    }

    if (isLastQuestion) {
      await completeSignupWithSurvey();
      return;
    }

    setCurrentSurveyIndex((prev) => prev + 1);
  };

  return (
    <>
      {currentStep === 1 ? (
        <form
          className="mx-auto flex w-full max-w-[423px] flex-col rounded-[22px] bg-white px-8 pb-8 pt-9 shadow-[0_18px_48px_rgba(15,23,42,0.08)]"
          onSubmit={(event) => event.preventDefault()}
          noValidate
        >
          <h1 className="text-left text-[24px] font-bold leading-tight text-[#394150]">회원가입</h1>

          <div className="mt-12 space-y-6">
            <FormField label="아이디" htmlFor="signup-username" errorMessage={fieldErrors.username} required>
              <InputField
                id="signup-username"
                name="username"
                type="text"
                placeholder="4~20자의 영문, 숫자, 밑줄"
                value={username}
                onChange={(e) => handleUsernameChange(e.target.value)}
                autoComplete="username"
                variant={fieldErrors.username ? 'error' : username ? 'filled' : 'default'}
              />
            </FormField>

            <FormField
              label="비밀번호"
              htmlFor="signup-password"
              errorMessage={fieldErrors.password}
              required
            >
              <InputField
                id="signup-password"
                name="password"
                type="password"
                placeholder="비밀번호를 입력해 주세요"
                value={password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                autoComplete="new-password"
                variant={fieldErrors.password ? 'error' : password ? 'filled' : 'default'}
              />
            </FormField>

            <FormField label="닉네임" htmlFor="signup-nickname" errorMessage={fieldErrors.nickname} required>
              <InputField
                id="signup-nickname"
                name="nickname"
                type="text"
                placeholder="2~15자로 입력해 주세요"
                value={nickname}
                onChange={(e) => handleNicknameChange(e.target.value)}
                variant={fieldErrors.nickname ? 'error' : nickname ? 'filled' : 'default'}
              />
            </FormField>

            <FormField
              label="생년월일"
              htmlFor="signup-birthdate"
              errorMessage={fieldErrors.birthdate}
              required
            >
              <InputField
                id="signup-birthdate"
                name="birthdate"
                type="text"
                placeholder="YYYY / MM / DD"
                value={birthdate}
                onChange={(e) => handleBirthdateChange(e.target.value)}
                variant={fieldErrors.birthdate ? 'error' : birthdate ? 'filled' : 'default'}
              />
            </FormField>

            <GenderToggleGroup
              value={gender}
              errorMessage={fieldErrors.gender}
              onChange={handleGenderChange}
            />

            <EmailField
              emailId={emailId}
              emailDomain={emailDomain}
              customEmailDomain={customEmailDomain}
              errorMessage={fieldErrors.email}
              isCustomDomain={isCustomDomain}
              onEmailIdChange={handleEmailIdChange}
              onEmailDomainChange={handleEmailDomainChange}
              onCustomEmailDomainChange={handleCustomEmailDomainChange}
            />

            <div className="space-y-3 pt-1">
              <button
                type="button"
                onClick={handleToggleAllAgreements}
                className="flex w-full items-center gap-3 rounded-[12px] bg-[#F4F6F9] px-4 py-3 text-left transition-colors hover:bg-[#EEF2F7]"
              >
                <AgreementCheckBox checked={isAllAgreed} />
                <span className="text-[16px] font-medium text-[#394150]">전체 동의</span>
              </button>

              <div className="h-px bg-[#E4E7EC]" />

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleToggleServiceAgreement}
                  className="flex items-center gap-3 text-left"
                >
                  <AgreementCheckBox checked={agreeToService} />
                  <span className="text-[16px] text-[#394150]">[필수] 서비스 이용약관 동의</span>
                </button>

                <button
                  type="button"
                  onClick={handleTogglePrivacyAgreement}
                  className="flex items-center gap-3 text-left"
                >
                  <AgreementCheckBox checked={agreeToPrivacy} />
                  <span className="text-[16px] text-[#394150]">[필수] 개인정보 수집 및 이용 동의</span>
                </button>

                <button
                  type="button"
                  onClick={handleToggleAgeAgreement}
                  className="flex items-center gap-3 text-left"
                >
                  <AgreementCheckBox checked={confirmAge} />
                  <span className="text-[16px] text-[#394150]">[필수] 만 14세 이상입니다</span>
                </button>
              </div>

              <StatusMessage variant="error">{fieldErrors.agreements}</StatusMessage>
            </div>

            <StatusMessage variant="error">{submitError}</StatusMessage>
          </div>

          <div className="mt-12">
            <Button
              type="button"
              disabled={signupState === 'submit_loading'}
              variant={isSubmitDisabled ? 'inactive' : 'active'}
              onClick={() => void handleNextStep()}
              className="h-[64px] w-full rounded-[12px] text-lg"
            >
              다음
            </Button>
          </div>
        </form>
      ) : (
        <section className="mx-auto w-full max-w-[760px] rounded-[32px] bg-white px-10 pb-10 pt-11 shadow-[0_20px_60px_rgba(15,23,42,0.1)]">
          <div>
            <h1 className="text-[24px] font-bold leading-tight text-[#202632]">설문조사</h1>
            <p className="mt-2 text-[14px] font-medium text-[#6E7786]">
              회원가입 후 나에게 맞는 학습 환경을 설정해드릴게요!
            </p>
          </div>

          <div className="mt-10">
            <p className="text-[18px] font-semibold leading-none text-[#1E97F4]">
              {currentSurveyIndex + 1}/{totalSurveyQuestionCount}
            </p>
            <h2 className="mt-4 text-[20px] font-semibold leading-[1.45] text-[#202632]">
              {currentQuestion.question}
            </h2>
          </div>

          <div className="mt-8 space-y-12">
            <div className="space-y-10">
              {currentQuestion.options.map((option) => (
                <button
                  key={option.label}
                  type="button"
                  onClick={() =>
                    handleSurveyAnswerChange(currentQuestion.questionNumber, option.value)
                  }
                  className={`flex min-h-[64px] w-full items-center rounded-[20px] border px-5 text-left text-[16px] font-medium transition-colors ${
                    selectedSurveyAnswer === option.value
                      ? 'border-[#259BFA] bg-[#D9EBFA] text-[#202632] shadow-[inset_0_-2px_0_rgba(37,155,250,0.18)]'
                      : 'border-[#D9E1EC] bg-white text-[#202632] hover:bg-[#F8FBFF]'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <div className="flex justify-end">
              <Button
                type="button"
                disabled={!selectedSurveyAnswer || signupState === 'submit_loading'}
                variant={selectedSurveyAnswer ? 'active' : 'inactive'}
                onClick={() => void handleNextQuestion()}
                className="h-[64px] w-[140px] rounded-[20px] text-[24px]"
              >
                {isLastQuestion ? '완료' : '다음'}
              </Button>
            </div>
          </div>

          <div className="mt-4">
            <StatusMessage variant="error">{fieldErrors.survey || submitError}</StatusMessage>
          </div>
        </section>
      )}

      {showSuccessModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-6">
          <div className="w-full max-w-[344px] rounded-[16px] bg-white px-8 pb-7 pt-5 shadow-[0_18px_48px_rgba(15,23,42,0.14)]">
            <div className="mx-auto flex h-[44px] w-[44px] items-center justify-center rounded-full bg-[#eef7ff] text-[28px] font-bold text-[#1A9AF5]">
              확인
            </div>
            <p className="mt-3 text-center text-[15px] font-medium leading-7 text-[#394150]">
              회원가입이 완료되었습니다.
              <br />
              로그인 후 서비스를 이용할 수 있습니다.
            </p>
            <Link
              className="mt-7 inline-flex h-[40px] w-full items-center justify-center rounded-[8px] bg-[#1A9AF5] text-[16px] font-semibold text-white transition-colors hover:bg-[#168fe6]"
              to={ROUTES.login}
            >
              로그인으로 이동
            </Link>
          </div>
        </div>
      ) : null}
    </>
  );
};

function AgreementCheckBox({ checked }: { checked: boolean }) {
  return (
    <span
      className={`flex h-5 w-5 flex-none items-center justify-center rounded-[4px] border transition-colors ${
        checked ? 'border-[#1A9AF5] bg-[#1A9AF5]' : 'border-[#D5DBE5] bg-[#EFF2F6]'
      }`}
      aria-hidden="true"
    >
      <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M4.5 10.2L8 13.7L15.5 6.5"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

export default SignupForm;
