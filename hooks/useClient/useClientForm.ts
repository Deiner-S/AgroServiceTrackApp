import { clientService } from '@/services/client';
import { exceptionHandling } from '@/exceptions/ExceptionHandler';
import type { ClientCreatePayload, ClientDetail, ClientUpdatePayload } from '@/services/client';
import {
  formatCnpjInput,
  formatPhoneInput,
  validateClientCnpjField,
  validateClientEmailField,
  validateClientNameField,
  validateClientPhoneField,
} from '@/utils/validation';
import { useCallback, useEffect, useState } from 'react';

type ClientFormMode = 'create' | 'edit';

type ClientFormValues = {
  cnpj: string;
  cpf: string;
  name: string;
  email: string;
  phone: string;
};

type ClientField = keyof ClientFormValues;
type ClientFormErrors = Partial<Record<ClientField, string>>;

const INITIAL_VALUES: ClientFormValues = {
  cnpj: '',
  cpf: '',
  name: '',
  email: '',
  phone: '',
};

function getFieldError(field: ClientField, value: string, mode: ClientFormMode): string | undefined {
  try {
    switch (field) {
      case 'cnpj':
        if (mode === 'edit') {
          return undefined;
        }
        validateClientCnpjField(value);
        return undefined;
      case 'name':
        validateClientNameField(value);
        return undefined;
      case 'email':
        validateClientEmailField(value);
        return undefined;
      case 'phone':
        validateClientPhoneField(value);
        return undefined;
      default:
        return undefined;
    }
  } catch (error) {
    return error instanceof Error ? error.message : 'Campo invalido.';
  }
}

export default function useClientForm(mode: ClientFormMode, clientId?: string) {
  const [values, setValues] = useState<ClientFormValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState<ClientFormErrors>({});
  const [loading, setLoading] = useState(mode === 'edit');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (mode !== 'edit' || !clientId) {
      setLoading(false);
      return;
    }

    let active = true;

    async function loadClient() {
      try {
        setLoading(true);
        setFormError(null);
        const detail = await exceptionHandling(() => clientService.fetchClientDetail(clientId), {
          operation: 'carregar cliente',
        });

        if (!active || !detail) {
          if (active && !detail) {
            setFormError('Falha ao carregar cliente.');
          }
          return;
        }

        setValues({
          cnpj: detail.cnpj ?? '',
          cpf: detail.cpf ?? '',
          name: detail.name,
          email: detail.email,
          phone: detail.phone,
        });
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadClient();

    return () => {
      active = false;
    };
  }, [clientId, mode]);

  const setFieldValue = useCallback((field: ClientField, value: string) => {
    const nextValue = field === 'cnpj'
      ? formatCnpjInput(value)
      : field === 'phone'
        ? formatPhoneInput(value)
        : value;

    setValues((current) => ({ ...current, [field]: nextValue }));
    setErrors((current) => ({
      ...current,
      [field]: current[field] ? getFieldError(field, nextValue, mode) : undefined,
    }));
  }, [mode]);

  const validateForm = useCallback(() => {
    const nextErrors: ClientFormErrors = {
      cnpj: getFieldError('cnpj', values.cnpj, mode),
      name: getFieldError('name', values.name, mode),
      email: getFieldError('email', values.email, mode),
      phone: getFieldError('phone', values.phone, mode),
    };

    if (mode === 'edit') {
      delete nextErrors.cnpj;
    }

    setErrors(nextErrors);
    return !Object.values(nextErrors).some(Boolean);
  }, [mode, values.cnpj, values.email, values.name, values.phone]);

  const submit = useCallback(async (): Promise<ClientDetail | undefined> => {
    if (!validateForm()) {
      setFormError('Corrija os campos destacados antes de continuar.');
      return undefined;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      if (mode === 'create') {
        const payload: ClientCreatePayload = {
          cnpj: values.cnpj,
          name: values.name,
          email: values.email,
          phone: values.phone,
        };

      const detail = await exceptionHandling(() => clientService.createClient(payload), {
          operation: 'cadastrar cliente',
        });

        if (!detail) {
          setFormError('Falha ao salvar cliente.');
        }

        return detail;
      }

      if (!clientId) {
        setFormError('Identificador invalido.');
        return undefined;
      }

      const payload: ClientUpdatePayload = {
        name: values.name,
        email: values.email,
        phone: values.phone,
      };

      const detail = await exceptionHandling(() => clientService.updateClient(clientId, payload), {
        operation: 'editar cliente',
      });

      if (!detail) {
        setFormError('Falha ao salvar cliente.');
      }

      return detail;
    } finally {
      setSubmitting(false);
    }
  }, [clientId, mode, validateForm, values.cnpj, values.email, values.name, values.phone]);

  return {
    values,
    errors,
    loading,
    submitting,
    formError,
    setFieldValue,
    submit,
  };
}
