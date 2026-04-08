import { employeeService } from '@/services/employee';
import { exceptionHandling } from '@/exceptions/ExceptionHandler';
import type {
  EmployeeCreatePayload,
  EmployeeDetail,
  EmployeePositionOption,
  EmployeeUpdatePayload,
} from '@/services/employee';
import {
  formatCpfInput,
  formatPhoneInput,
  formatUsernameInput,
  validateEmployeeCpfField,
  validateEmployeeFirstNameField,
  validateEmployeeLastNameField,
  validateEmployeePasswordField,
  validateEmployeePositionField,
  validateEmployeeUsernameField,
  validateClientEmailField,
  validateClientPhoneField,
} from '@/utils/validation';
import { useCallback, useEffect, useState } from 'react';

type EmployeeFormMode = 'create' | 'edit';
type EmployeeFormValues = EmployeeCreatePayload;
type EmployeeField = keyof EmployeeFormValues;
type EmployeeFormErrors = Partial<Record<EmployeeField, string>>;

const INITIAL_VALUES: EmployeeFormValues = {
  first_name: '',
  last_name: '',
  cpf: '',
  phone: '',
  email: '',
  position: '',
  username: '',
  password: '',
};

function getFieldError(
  field: EmployeeField,
  value: string,
  positionOptions: EmployeePositionOption[],
  mode: EmployeeFormMode
): string | undefined {
  try {
    switch (field) {
      case 'first_name':
        validateEmployeeFirstNameField(value);
        return undefined;
      case 'last_name':
        validateEmployeeLastNameField(value);
        return undefined;
      case 'cpf':
        validateEmployeeCpfField(value);
        return undefined;
      case 'phone':
        validateClientPhoneField(value);
        return undefined;
      case 'email':
        validateClientEmailField(value);
        return undefined;
      case 'position':
        validateEmployeePositionField(value, positionOptions);
        return undefined;
      case 'username':
        validateEmployeeUsernameField(value);
        return undefined;
      case 'password':
        validateEmployeePasswordField(value, mode === 'create');
        return undefined;
      default:
        return undefined;
    }
  } catch (error) {
    return error instanceof Error ? error.message : 'Campo invalido.';
  }
}

export default function useEmployeeForm(mode: EmployeeFormMode, employeeId?: string) {
  const [values, setValues] = useState<EmployeeFormValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState<EmployeeFormErrors>({});
  const [loading, setLoading] = useState(mode === 'edit');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [positionOptions, setPositionOptions] = useState<EmployeePositionOption[]>([]);

  useEffect(() => {
    let active = true;

    async function loadForm() {
      try {
        setLoading(true);
        setFormError(null);

        if (mode === 'create') {
          const options = await exceptionHandling(() => employeeService.fetchEmployeeCreateOptions(), {
            operation: 'carregar cadastro de funcionario',
          });

          if (!active || !options) {
            if (active && !options) {
              setFormError('Falha ao carregar opcoes do cadastro.');
            }
            return;
          }

          setPositionOptions(options.positionOptions);
          setValues(INITIAL_VALUES);
          return;
        }

        if (!employeeId) {
          setFormError('Identificador invalido.');
          return;
        }

        const detail = await exceptionHandling(() => employeeService.fetchEmployeeDetail(employeeId), {
          operation: 'carregar funcionario',
        });

        if (!active || !detail) {
          if (active && !detail) {
            setFormError('Falha ao carregar funcionario.');
          }
          return;
        }

        setPositionOptions(detail.positionOptions);
        setValues({
          first_name: detail.firstName,
          last_name: detail.lastName,
          cpf: detail.cpf,
          phone: detail.phone,
          email: detail.email,
          position: detail.position,
          username: detail.username,
          password: '',
        });
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    if (mode === 'edit' && !employeeId) {
      setLoading(false);
      setFormError('Identificador invalido.');
      return;
    }

    void loadForm();

    return () => {
      active = false;
    };
  }, [employeeId, mode]);

  const setFieldValue = useCallback((field: EmployeeField, value: string) => {
    const nextValue = field === 'cpf'
      ? formatCpfInput(value)
      : field === 'phone'
        ? formatPhoneInput(value)
        : field === 'username'
          ? formatUsernameInput(value)
          : value;

    setValues((current) => ({ ...current, [field]: nextValue }));
    setErrors((current) => ({
      ...current,
      [field]: current[field] ? getFieldError(field, nextValue, positionOptions, mode) : undefined,
    }));
  }, [mode, positionOptions]);

  const validateForm = useCallback(() => {
    const nextErrors: EmployeeFormErrors = {
      first_name: getFieldError('first_name', values.first_name, positionOptions, mode),
      last_name: getFieldError('last_name', values.last_name, positionOptions, mode),
      cpf: getFieldError('cpf', values.cpf, positionOptions, mode),
      phone: getFieldError('phone', values.phone, positionOptions, mode),
      email: getFieldError('email', values.email, positionOptions, mode),
      position: getFieldError('position', values.position, positionOptions, mode),
      username: getFieldError('username', values.username, positionOptions, mode),
      password: getFieldError('password', values.password ?? '', positionOptions, mode),
    };

    setErrors(nextErrors);
    return !Object.values(nextErrors).some(Boolean);
  }, [mode, positionOptions, values]);

  const submit = useCallback(async (): Promise<EmployeeDetail | undefined> => {
    if (!validateForm()) {
      setFormError('Corrija os campos destacados antes de continuar.');
      return undefined;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      const detail = mode === 'create'
        ? await exceptionHandling(
          () => employeeService.createEmployee(values, positionOptions),
          { operation: 'cadastrar funcionario' }
        )
        : await exceptionHandling(
          () => {
            if (!employeeId) {
              throw new Error('Identificador invalido.');
            }

            const payload: EmployeeUpdatePayload = values;
            return employeeService.updateEmployee(employeeId, payload, positionOptions);
          },
          { operation: 'editar funcionario' }
        );

      if (!detail) {
        setFormError('Falha ao salvar funcionario.');
      }

      return detail;
    } finally {
      setSubmitting(false);
    }
  }, [employeeId, mode, positionOptions, validateForm, values]);

  return {
    values,
    errors,
    loading,
    submitting,
    formError,
    positionOptions,
    setFieldValue,
    submit,
  };
}
