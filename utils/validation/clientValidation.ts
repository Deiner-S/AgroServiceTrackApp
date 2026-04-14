import { rethrowAsValidationException } from '@/exceptions/ValidationException';
import {
  buildOnlyLettersAndSpacesMessage,
  buildOnlyLettersNumbersAndSpacesMessage,
  buildOnlyNumbersMessage,
  buildRequiredFieldMessage,
  VALIDATION_MESSAGES,
} from '@/utils/validation/messages';
import type {
  ClientAddressPayload,
  ClientCreatePayload,
  ClientServiceOrderPayload,
  ClientUpdatePayload,
} from '@/services/client';
import { assertCondition, validateOptionalString, validateString } from '@/utils/validation/helpers';

export const BRAZILIAN_STATE_OPTIONS = [
  'Acre',
  'Alagoas',
  'Amapa',
  'Amazonas',
  'Bahia',
  'Ceara',
  'Distrito Federal',
  'Espirito Santo',
  'Goias',
  'Maranhao',
  'Mato Grosso',
  'Mato Grosso do Sul',
  'Minas Gerais',
  'Para',
  'Paraiba',
  'Parana',
  'Pernambuco',
  'Piaui',
  'Rio de Janeiro',
  'Rio Grande do Norte',
  'Rio Grande do Sul',
  'Rondonia',
  'Roraima',
  'Santa Catarina',
  'Sao Paulo',
  'Sergipe',
  'Tocantins',
] as const;

const ONLY_LETTERS_AND_SPACES_PATTERN = /^[A-Za-z\u00C0-\u00FF\s]+$/;
const LETTERS_NUMBERS_AND_SPACES_PATTERN = /^[A-Za-z\u00C0-\u00FF0-9\s]+$/;
const ONLY_NUMBERS_PATTERN = /^\d+$/;
const CNPJ_FORMAT_PATTERN = /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/;
const PHONE_FORMAT_PATTERN = /^\(\d{2}\) \d{4,5}-\d{4}$/;
const ZIP_CODE_FORMAT_PATTERN = /^\d{5}-\d{3}$/;
const EMAIL_FORMAT_PATTERN = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.(com|com\.br)$/;

function validateOnlyLettersAndSpaces(value: string, fieldName: string): string {
  assertCondition(
    ONLY_LETTERS_AND_SPACES_PATTERN.test(value),
    buildOnlyLettersAndSpacesMessage(fieldName)
  );
  return value;
}

function validateOnlyLettersNumbersAndSpaces(value: string, fieldName: string): string {
  assertCondition(
    LETTERS_NUMBERS_AND_SPACES_PATTERN.test(value),
    buildOnlyLettersNumbersAndSpacesMessage(fieldName)
  );
  return value;
}

function validateOnlyNumbers(value: string, fieldName: string): string {
  assertCondition(ONLY_NUMBERS_PATTERN.test(value), buildOnlyNumbersMessage(fieldName));
  return value;
}

function validateRequiredText(value: unknown, fieldName: string): string {
  const normalized = validateString(value, fieldName).trim();
  assertCondition(normalized.length > 0, buildRequiredFieldMessage(fieldName));
  return normalized;
}

export function validateClientCnpjField(value: string): string {
  return rethrowAsValidationException('user_input', () => {
    const cnpj = validateRequiredText(value, 'cnpj');
    assertCondition(CNPJ_FORMAT_PATTERN.test(cnpj), VALIDATION_MESSAGES.invalidCnpj);
    return cnpj;
  });
}

export function validateClientNameField(value: string): string {
  return rethrowAsValidationException('user_input', () => {
    const name = validateRequiredText(value, 'name');
    return validateOnlyLettersAndSpaces(name, 'name');
  });
}

export function validateClientEmailField(value: string): string {
  return rethrowAsValidationException('user_input', () => {
    const email = validateRequiredText(value, 'email');
    assertCondition(
      EMAIL_FORMAT_PATTERN.test(email),
      VALIDATION_MESSAGES.invalidEmail
    );
    return email;
  });
}

export function validateClientPhoneField(value: string): string {
  return rethrowAsValidationException('user_input', () => {
    const phone = validateRequiredText(value, 'phone');
    assertCondition(
      PHONE_FORMAT_PATTERN.test(phone),
      VALIDATION_MESSAGES.invalidPhone
    );
    return phone;
  });
}

export function validateAddressStreetField(value: string): string {
  return rethrowAsValidationException('user_input', () => {
    const street = validateRequiredText(value, 'street');
    return validateOnlyLettersNumbersAndSpaces(street, 'street');
  });
}

export function validateAddressNumberField(value: string): string {
  return rethrowAsValidationException('user_input', () => {
    const number = validateRequiredText(value, 'number');
    return validateOnlyNumbers(number, 'number');
  });
}

export function validateAddressComplementField(value: string): string {
  return rethrowAsValidationException('user_input', () => {
    const complement = validateOptionalString(value, 'complement')?.trim() ?? '';

    if (!complement) {
      return '';
    }

    return validateOnlyLettersNumbersAndSpaces(complement, 'complement');
  });
}

export function validateAddressCityField(value: string): string {
  return rethrowAsValidationException('user_input', () => {
    const city = validateRequiredText(value, 'city');
    return validateOnlyLettersAndSpaces(city, 'city');
  });
}

export function validateAddressStateField(value: string): string {
  return rethrowAsValidationException('user_input', () => {
    const state = validateRequiredText(value, 'state');
    assertCondition(
      BRAZILIAN_STATE_OPTIONS.includes(state as (typeof BRAZILIAN_STATE_OPTIONS)[number]),
      VALIDATION_MESSAGES.invalidStateSelection
    );
    return state;
  });
}

export function validateAddressZipCodeField(value: string): string {
  return rethrowAsValidationException('user_input', () => {
    const zipCode = validateRequiredText(value, 'zip_code');
    assertCondition(ZIP_CODE_FORMAT_PATTERN.test(zipCode), VALIDATION_MESSAGES.invalidZipCode);
    return zipCode;
  });
}

export function validateServiceOperationCodeField(value: string): string {
  return rethrowAsValidationException('user_input', () => validateRequiredText(value, 'operation_code'));
}

export function validateServiceSymptomsField(value: string): string {
  return rethrowAsValidationException('user_input', () => validateRequiredText(value, 'symptoms'));
}

export function formatCnpjInput(value: string): string {
  const digits = value.replace(/[^\d]/g, '').slice(0, 14);

  return digits
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2}\.\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{2}\.\d{3}\.\d{3})(\d)/, '$1/$2')
    .replace(/^(\d{2}\.\d{3}\.\d{3}\/\d{4})(\d)/, '$1-$2');
}

export function formatPhoneInput(value: string): string {
  const digits = value.replace(/[^\d]/g, '').slice(0, 11);

  if (digits.length <= 2) {
    return digits ? `(${digits}` : '';
  }

  if (digits.length <= 6) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  }

  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }

  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function formatZipCodeInput(value: string): string {
  const digits = value.replace(/[^\d]/g, '').slice(0, 8);
  return digits.replace(/^(\d{5})(\d)/, '$1-$2');
}

export function validateClientCreatePayload(payload: ClientCreatePayload): ClientCreatePayload {
  return rethrowAsValidationException('user_input', () => {
    const cnpj = validateClientCnpjField(payload.cnpj);
    const name = validateClientNameField(payload.name);
    const email = validateClientEmailField(payload.email);
    const phone = validateClientPhoneField(payload.phone);

    return { cnpj, name, email, phone };
  });
}

export function validateClientUpdatePayload(payload: ClientUpdatePayload): ClientUpdatePayload {
  return rethrowAsValidationException('user_input', () => {
    const name = validateClientNameField(payload.name);
    const email = validateClientEmailField(payload.email);
    const phone = validateClientPhoneField(payload.phone);

    return { name, email, phone };
  });
}

export function validateClientAddressPayload(payload: ClientAddressPayload): ClientAddressPayload {
  return rethrowAsValidationException('user_input', () => {
    const street = validateAddressStreetField(payload.street);
    const number = validateAddressNumberField(payload.number);
    const city = validateAddressCityField(payload.city);
    const state = validateAddressStateField(payload.state);
    const zip_code = validateAddressZipCodeField(payload.zip_code);
    const complement = validateAddressComplementField(payload.complement ?? '');

    return {
      street,
      number,
      complement,
      city,
      state,
      zip_code,
    };
  });
}

export function validateClientServiceOrderPayload(
  payload: ClientServiceOrderPayload
): ClientServiceOrderPayload {
  return rethrowAsValidationException('user_input', () => {
    const operation_code = validateServiceOperationCodeField(payload.operation_code);
    const symptoms = validateServiceSymptomsField(payload.symptoms);

    return {
      operation_code,
      symptoms,
    };
  });
}
