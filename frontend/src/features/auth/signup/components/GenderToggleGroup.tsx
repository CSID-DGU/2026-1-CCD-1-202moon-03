import React from 'react';
import FormField from '../../../../components/form/FormField';
import ToggleButton from '../../../../components/ui/ToggleButton';

interface GenderToggleGroupProps {
  value: 'male' | 'female' | '';
  errorMessage?: string;
  onChange: (value: 'male' | 'female') => void;
}

const GenderToggleGroup: React.FC<GenderToggleGroupProps> = ({
  value,
  errorMessage,
  onChange,
}) => {
  return (
    <FormField label="성별" htmlFor="signup-gender-male" errorMessage={errorMessage} required>
      <div className="flex gap-2.5">
        <ToggleButton
          selected={value === 'male'}
          onClick={() => onChange('male')}
          hasError={Boolean(errorMessage)}
        >
          남자
        </ToggleButton>
        <ToggleButton
          selected={value === 'female'}
          onClick={() => onChange('female')}
          hasError={Boolean(errorMessage)}
        >
          여자
        </ToggleButton>
      </div>
    </FormField>
  );
};

export default GenderToggleGroup;
