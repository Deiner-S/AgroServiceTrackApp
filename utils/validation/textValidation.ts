import {
  LETTERS_AND_NUMBERS_PATTERN,
  LETTERS_NUMBERS_AND_SPACES_PATTERN,
  ONLY_LETTERS_AND_SPACES_PATTERN,
  ONLY_LETTERS_PATTERN,
  ONLY_LOWERCASE_LETTERS_PATTERN,
  ONLY_NUMBERS_PATTERN,
} from '@/utils/validation/constants';
import { assertCondition, validateByPattern, validateOptionalString, validateString } from '@/utils/validation/helpers';

export function validateOnlyNumbers(value: string): string {
  return validateByPattern(value, ONLY_NUMBERS_PATTERN, 'O valor deve conter somente numeros.');
}

export function validateOnlyLetters(value: string): string {
  return validateByPattern(value, ONLY_LETTERS_PATTERN, 'O valor deve conter somente letras.');
}

export function validateOnlyLettersAndSpaces(value: string): string {
  return validateByPattern(
    value,
    ONLY_LETTERS_AND_SPACES_PATTERN,
    'O valor deve conter somente letras e espacos.'
  );
}

export function validateOnlyLowercaseLetters(value: string): string {
  return validateByPattern(
    value,
    ONLY_LOWERCASE_LETTERS_PATTERN,
    'O valor deve conter somente letras minusculas, sem espacos.'
  );
}

export function validateOnlyLettersAndNumbers(value: string): string {
  return validateByPattern(
    value,
    LETTERS_AND_NUMBERS_PATTERN,
    'O valor deve conter somente letras e numeros.'
  );
}

export function validateOnlyLettersNumbersAndSpaces(value: string): string {
  return validateByPattern(
    value,
    LETTERS_NUMBERS_AND_SPACES_PATTERN,
    'O valor deve conter somente letras, numeros e espacos.'
  );
}

export function sanitizeOnlyNumbers(value: string): string {
  return value.replace(/[^\d]/g, '');
}

export function sanitizeOnlyLettersAndNumbers(value: string): string {
  return value.replace(/[^A-Za-zÀ-ÿ0-9]/g, '');
}

export function sanitizeOnlyLettersNumbersAndSpaces(value: string): string {
  return value.replace(/[^A-Za-zÀ-ÿ0-9\s]/g, '').replace(/\s+/g, ' ').trimStart();
}

export function sanitizeOnlyLowercaseLetters(value: string): string {
  return value.toLowerCase().replace(/[^a-z]/g, '');
}

export function validateChassi(value: unknown): string {
  const chassi = validateString(value, 'chassi').trim().toUpperCase();

  assertCondition(
    chassi.length === 17 && /^[A-Z0-9]+$/.test(chassi),
    'chassi invalido. Ele deve conter 17 caracteres, sem espacos e sem tracos.'
  );

  return chassi;
}

export function validateModel(value: unknown): string {
  return validateOnlyLettersAndNumbers(validateString(value, 'model').trim());
}

export function validateHorimetro(value: unknown): number {
  if (typeof value === 'number') {
    assertCondition(Number.isFinite(value) && value >= 0, 'horimetro deve ser um numero valido.');
    validateOnlyNumbers(String(value));
    return value;
  }

  const stringValue = validateOnlyNumbers(validateString(value, 'horimetro').trim());
  return Number(stringValue);
}

export function validateServiceText(value: unknown): string | undefined {
  const service = validateOptionalString(value, 'service');
  return service?.trim();
}
