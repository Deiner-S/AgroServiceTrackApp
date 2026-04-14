import { employeeService } from '@/services/employee';
import { exceptionHandling } from '@/exceptions/ExceptionHandler';
import type { EmployeeAddressPayload, EmployeeDetail } from '@/services/employee';
import {
  BRAZILIAN_STATE_OPTIONS,
  formatZipCodeInput,
  validateAddressCityField,
  validateAddressComplementField,
  validateAddressNumberField,
  validateAddressStateField,
  validateAddressStreetField,
  validateAddressZipCodeField,
} from '@/utils/validation';
import { EMPLOYEE_HOOK_MESSAGES } from '@/hooks/useEmployee/messages';
import { useCallback, useState } from 'react';

type AddressField = keyof EmployeeAddressPayload;
type AddressErrors = Partial<Record<AddressField, string>>;
type AddressValues = EmployeeAddressPayload;

const INITIAL_VALUES: AddressValues = {
  street: '',
  number: '',
  complement: '',
  city: '',
  state: '',
  zip_code: '',
};

function getFieldError(field: AddressField, value: string): string | undefined {
  try {
    switch (field) {
      case 'street':
        validateAddressStreetField(value);
        return undefined;
      case 'number':
        validateAddressNumberField(value);
        return undefined;
      case 'complement':
        validateAddressComplementField(value);
        return undefined;
      case 'city':
        validateAddressCityField(value);
        return undefined;
      case 'state':
        validateAddressStateField(value);
        return undefined;
      case 'zip_code':
        validateAddressZipCodeField(value);
        return undefined;
      default:
        return undefined;
    }
  } catch (error) {
    return error instanceof Error ? error.message : EMPLOYEE_HOOK_MESSAGES.invalidField;
  }
}

export default function useEmployeeAddressForm(employeeId?: string) {
  const [values, setValues] = useState<AddressValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState<AddressErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const setFieldValue = useCallback((field: AddressField, value: string) => {
    const nextValue = field === 'zip_code' ? formatZipCodeInput(value) : value;

    setValues((current) => ({ ...current, [field]: nextValue }));
    setErrors((current) => ({
      ...current,
      [field]: current[field] ? getFieldError(field, nextValue) : undefined,
    }));
  }, []);

  const validateForm = useCallback(() => {
    const nextErrors: AddressErrors = {
      street: getFieldError('street', values.street),
      number: getFieldError('number', values.number),
      complement: getFieldError('complement', values.complement ?? ''),
      city: getFieldError('city', values.city),
      state: getFieldError('state', values.state),
      zip_code: getFieldError('zip_code', values.zip_code),
    };

    setErrors(nextErrors);
    return !Object.values(nextErrors).some(Boolean);
  }, [values]);

  const submit = useCallback(async (): Promise<EmployeeDetail | undefined> => {
    if (!employeeId) {
      setFormError(EMPLOYEE_HOOK_MESSAGES.invalidIdentifier);
      return undefined;
    }

    if (!validateForm()) {
      setFormError(EMPLOYEE_HOOK_MESSAGES.highlightFieldsBeforeContinue);
      return undefined;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      const detail = await exceptionHandling(
        () => employeeService.createEmployeeAddress(employeeId, values),
        {
          operation: 'adicionar endereco de funcionario',
        }
      );

      if (!detail) {
        setFormError(EMPLOYEE_HOOK_MESSAGES.failedAddAddress);
      }

      return detail;
    } finally {
      setSubmitting(false);
    }
  }, [employeeId, validateForm, values]);

  return {
    values,
    errors,
    submitting,
    formError,
    setFieldValue,
    submit,
    stateOptions: ['' as const, ...BRAZILIAN_STATE_OPTIONS],
  };
}
