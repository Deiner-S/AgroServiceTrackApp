import { clientService } from '@/services/client';
import { executeControllerTask } from '@/services/core/controllerErrorService';
import type { ClientAddressPayload, ClientDetail } from '@/services/client';
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
import { useCallback, useState } from 'react';

type AddressField = 'street' | 'number' | 'complement' | 'city' | 'state' | 'zip_code';
type AddressErrors = Partial<Record<AddressField, string>>;
type AddressValues = ClientAddressPayload;

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
    return error instanceof Error ? error.message : 'Campo invalido.';
  }
}

export default function useClientAddressForm(clientId?: string) {
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
  }, [values.city, values.complement, values.number, values.state, values.street, values.zip_code]);

  const submit = useCallback(async (): Promise<ClientDetail | undefined> => {
    if (!clientId) {
      setFormError('Identificador invalido.');
      return undefined;
    }

    if (!validateForm()) {
      setFormError('Corrija os campos destacados antes de continuar.');
      return undefined;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      const detail = await executeControllerTask(() => clientService.createClientAddress(clientId, values), {
        operation: 'adicionar endereco de cliente',
      });

      if (!detail) {
        setFormError('Falha ao adicionar endereco.');
      }

      return detail;
    } finally {
      setSubmitting(false);
    }
  }, [clientId, validateForm, values]);

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
