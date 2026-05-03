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
    handleSubmit,
  } = useSignupForm();

  const isSubmitDisabled = signupState === 'default' || signupState === 'validation_error';
  const showSuccessModal = signupState === 'submit_success';

  return (
    <>
      <form
        className="mx-auto flex w-full max-w-[423px] flex-col rounded-[22px] bg-white px-8 pb-8 pt-9 shadow-[0_18px_48px_rgba(15,23,42,0.08)]"
        onSubmit={handleSubmit}
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

          <StatusMessage variant="error">{submitError}</StatusMessage>
        </div>

        <div className="mt-12">
          <Button
            type="submit"
            disabled={isSubmitDisabled || signupState === 'submit_loading'}
            variant={isSubmitDisabled ? 'inactive' : 'active'}
            className="h-[64px] w-full rounded-[12px] text-lg"
          >
            회원가입
          </Button>
        </div>
      </form>

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

export default SignupForm;
