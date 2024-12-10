import { useState } from 'react';

export const useInputValidationProps = (
  validate: (value: string) => boolean,
) => {
  const [value, setValue] = useState<string>('');
  const [isValid, setIsValid] = useState<boolean>();
  const [isTouched, setIsTouchedState] = useState(false);

  const onBlur = () => {
    setIsTouchedState(true);
  };

  const onInputChange = (value: string) => {
    setIsValid(undefined);

    setValue(value);

    if (value === '') return;

    setIsValid(validate(value));
  };

  return {
    value,
    onBlur,
    isValid,
    isTouched,
    onInputChange,
  };
};
