import React from 'react';
import { Link } from 'react-router-dom';
import FormField from '../../../components/form/FormField';
import InputField from '../../../components/form/InputField';
import StatusMessage from '../../../components/form/StatusMessage';
import PrimaryButton from '../../../components/ui/PrimaryButton';
import { ROUTES } from '../../../constants/routes';
import { useLoginForm } from './useLoginForm';

const LoginForm: React.FC = () => {
  const {
    email,
    password,
    emailError,
    passwordError,
    submitError,
    isSuccess,
    loginState,
    isSubmitDisabled,
    handleEmailChange,
    handlePasswordChange,
    handleSubmit,
  } = useLoginForm();

  return (
    <form
      className="mx-auto flex w-full max-w-[560px] flex-col rounded-[28px] bg-white px-12 pb-11 pt-12 shadow-[0_18px_48px_rgba(15,23,42,0.08)]"
      onSubmit={handleSubmit}
      noValidate
    >
      <h1 className="text-left text-[32px] font-bold leading-tight text-slate-800">로그인</h1>

      <div className="mt-12 space-y-8">
        <FormField label="이메일" htmlFor="login-email" errorMessage={emailError}>
          <InputField
            id="login-email"
            name="email"
            type="email"
            placeholder="tabac202@abc.com"
            value={email}
            onChange={handleEmailChange}
            autoComplete="email"
            ariaDescribedBy={emailError ? 'login-email-error' : undefined}
            variant={emailError ? 'error' : email ? 'filled' : 'default'}
          />
        </FormField>

        <FormField label="비밀번호" htmlFor="login-password" errorMessage={passwordError}>
          <InputField
            id="login-password"
            name="password"
            type="password"
            placeholder="********"
            value={password}
            onChange={handlePasswordChange}
            autoComplete="current-password"
            ariaDescribedBy={passwordError ? 'login-password-error' : undefined}
            variant={passwordError ? 'error' : password ? 'filled' : 'default'}
          />
        </FormField>

        <div className="flex justify-end gap-2 text-[14px] leading-5 text-slate-400">
          <Link className="transition-colors hover:text-slate-600" to={ROUTES.signup}>
            회원가입
          </Link>
          <span>|</span>
          <button className="transition-colors hover:text-slate-600" type="button">
            비밀번호 찾기
          </button>
        </div>

        <StatusMessage variant={isSuccess ? 'success' : 'error'}>
          {isSuccess ? '로그인에 성공했습니다' : submitError}
        </StatusMessage>
      </div>

      <div className="mt-12">
        <PrimaryButton
          type="submit"
          disabled={isSubmitDisabled}
          variant={loginState === 'loading' ? 'loading' : isSubmitDisabled ? 'disabled' : 'active'}
        >
          로그인
        </PrimaryButton>
      </div>
    </form>
  );
};

export default LoginForm;
