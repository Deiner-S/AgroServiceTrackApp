import { rethrowAsValidationException } from '@/exceptions/ValidationException';
import type {
  EmployeeAddressPayload,
  EmployeePositionOption,
  EmployeeUpdatePayload,
} from '@/services/employee';
import {
  validateAddressCityField,
  validateAddressComplementField,
  validateAddressNumberField,
  validateAddressStateField,
  validateAddressStreetField,
  validateAddressZipCodeField,
  validateClientEmailField,
  validateClientPhoneField,
} from '@/utils/validation/clientValidation';
import { assertCondition, validateOptionalString, validateString } from '@/utils/validation/helpers';
import {
  sanitizeOnlyLowercaseLetters,
  validateOnlyLettersAndSpaces,
  validateOnlyLowercaseLetters,
} from '@/utils/validation/textValidation';

const CPF_FORMAT_PATTERN = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;

function validateRequiredText(value: unknown, fieldName: string): string {
  const normalized = validateString(value, fieldName).trim();
  assertCondition(normalized.length > 0, `${fieldName} e obrigatorio.`);
  return normalized;
}

export function formatCpfInput(value: string): string {
  const digits = value.replace(/[^\d]/g, '').slice(0, 11);

  return digits
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3}\.\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3}\.\d{3}\.\d{3})(\d)/, '$1-$2');
}

export function formatUsernameInput(value: string): string {
  return sanitizeOnlyLowercaseLetters(value);
}

export function validateEmployeeFirstNameField(value: string): string {
  return rethrowAsValidationException('user_input', () => {
    const firstName = validateRequiredText(value, 'first_name');
    return validateOnlyLettersAndSpaces(firstName);
  });
}

export function validateEmployeeLastNameField(value: string): string {
  return rethrowAsValidationException('user_input', () => {
    const lastName = validateRequiredText(value, 'last_name');
    return validateOnlyLettersAndSpaces(lastName);
  });
}

export function validateEmployeeCpfField(value: string): string {
  return rethrowAsValidationException('user_input', () => {
    const cpf = validateRequiredText(value, 'cpf');
    assertCondition(CPF_FORMAT_PATTERN.test(cpf), 'CPF invalido. Use o formato XXX.XXX.XXX-YY.');
    return cpf;
  });
}

export function validateEmployeeUsernameField(value: string): string {
  return rethrowAsValidationException('user_input', () => {
    const username = validateRequiredText(value, 'username');
    return validateOnlyLowercaseLetters(username);
  });
}

export function validateEmployeePositionField(
  value: string,
  positionOptions: EmployeePositionOption[]
): string {
  return rethrowAsValidationException('user_input', () => {
    const position = validateRequiredText(value, 'position');
    assertCondition(
      positionOptions.some((option) => option.value === position),
      'Selecione um cargo valido.'
    );
    return position;
  });
}

export function validateEmployeePasswordField(value: string): string {
  return rethrowAsValidationException('user_input', () => {
    const password = validateOptionalString(value, 'password')?.trim() ?? '';
    return password;
  });
}

export function validateEmployeeUpdatePayload(
  payload: EmployeeUpdatePayload,
  positionOptions: EmployeePositionOption[]
): EmployeeUpdatePayload {
  return rethrowAsValidationException('user_input', () => ({
    first_name: validateEmployeeFirstNameField(payload.first_name),
    last_name: validateEmployeeLastNameField(payload.last_name),
    cpf: validateEmployeeCpfField(payload.cpf),
    phone: validateClientPhoneField(payload.phone),
    email: validateClientEmailField(payload.email),
    position: validateEmployeePositionField(payload.position, positionOptions),
    username: validateEmployeeUsernameField(payload.username),
    password: validateEmployeePasswordField(payload.password ?? ''),
  }));
}

export function validateEmployeeAddressPayload(payload: EmployeeAddressPayload): EmployeeAddressPayload {
  return rethrowAsValidationException('user_input', () => ({
    street: validateAddressStreetField(payload.street),
    number: validateAddressNumberField(payload.number),
    complement: validateAddressComplementField(payload.complement ?? ''),
    city: validateAddressCityField(payload.city),
    state: validateAddressStateField(payload.state),
    zip_code: validateAddressZipCodeField(payload.zip_code),
  }));
}
