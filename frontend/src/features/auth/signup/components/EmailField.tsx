import React from 'react';
import FormField from '../../../../components/form/FormField';
import InputField from '../../../../components/form/InputField';
import SelectField from '../../../../components/form/SelectField';

const emailDomainOptions = [
  { label: '직접입력', value: 'Direct input' },
  { label: 'gmail.com', value: 'gmail.com' },
  { label: 'naver.com', value: 'naver.com' },
  { label: 'daum.net', value: 'daum.net' },
  { label: 'kakao.com', value: 'kakao.com' },
];

interface EmailFieldProps {
  emailId: string;
  emailDomain: string;
  customEmailDomain: string;
  errorMessage?: string;
  isCustomDomain: boolean;
  onEmailIdChange: (value: string) => void;
  onEmailDomainChange: (value: string) => void;
  onCustomEmailDomainChange: (value: string) => void;
}

const EmailField: React.FC<EmailFieldProps> = ({
  emailId,
  emailDomain,
  customEmailDomain,
  errorMessage,
  isCustomDomain,
  onEmailIdChange,
  onEmailDomainChange,
  onCustomEmailDomainChange,
}) => {
  const leftInputVariant = errorMessage ? 'error' : emailId ? 'filled' : 'default';
  const rightInputValue = isCustomDomain ? customEmailDomain : emailDomain;
  const rightInputVariant = errorMessage ? 'error' : rightInputValue ? 'filled' : 'default';
  const selectVariant = emailDomain !== 'Direct input' ? 'filled' : 'default';

  return (
    <FormField label="이메일" htmlFor="signup-email-id" errorMessage={errorMessage} required>
      <div className="space-y-3">
        <div className="flex items-center gap-2.5">
          <div className="min-w-0 flex-1">
            <InputField
              id="signup-email-id"
              name="emailId"
              type="text"
              placeholder="이메일을 입력해 주세요"
              value={emailId}
              onChange={(e) => onEmailIdChange(e.target.value)}
              variant={leftInputVariant}
              autoComplete="email"
            />
          </div>
          <span className="text-[24px] font-medium text-[#394150]">@</span>
          <div className="w-[122px]">
            <InputField
              id="signup-email-domain-custom"
              name="customEmailDomain"
              type="text"
              placeholder="직접입력"
              value={rightInputValue}
              onChange={(e) => onCustomEmailDomainChange(e.target.value)}
              variant={rightInputVariant}
              disabled={!isCustomDomain}
            />
          </div>
        </div>
        <SelectField
          id="signup-email-domain-select"
          name="emailDomain"
          value={emailDomain}
          onChange={(e) => onEmailDomainChange(e.target.value)}
          options={emailDomainOptions}
          variant={selectVariant}
        />
      </div>
    </FormField>
  );
};

export default EmailField;
