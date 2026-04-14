import {
  LETTERS_AND_NUMBERS_PATTERN,
  LETTERS_NUMBERS_AND_SPACES_PATTERN,
  ONLY_LETTERS_AND_SPACES_PATTERN,
  ONLY_LETTERS_PATTERN,
  ONLY_LOWERCASE_LETTERS_PATTERN,
  ONLY_NUMBERS_PATTERN,
} from '@/utils/validation/constants';
import {
  buildOnlyLettersAndSpacesMessage,
  buildOnlyLettersMessage,
  buildOnlyLettersNumbersAndSpacesMessage,
  buildOnlyNumbersMessage,
  VALIDATION_MESSAGES,
} from '@/utils/validation/messages';
import { assertCondition, validateByPattern, validateOptionalString, validateString } from '@/utils/validation/helpers';

export function validateOnlyNumbers(value: string): string {
  return validateByPattern(value, ONLY_NUMBERS_PATTERN, buildOnlyNumbersMessage('O valor'));
}

export function validateOnlyLetters(value: string): string {
  return validateByPattern(value, ONLY_LETTERS_PATTERN, buildOnlyLettersMessage('O valor'));
}

export function validateOnlyLettersAndSpaces(value: string): string {
  return validateByPattern(
    value,
    ONLY_LETTERS_AND_SPACES_PATTERN,
    buildOnlyLettersAndSpacesMessage('O valor')
  );
}

export function validateOnlyLowercaseLetters(value: string): string {
  return validateByPattern(
    value,
    ONLY_LOWERCASE_LETTERS_PATTERN,
    VALIDATION_MESSAGES.lowercaseLettersOnly
  );
}

export function validateOnlyLettersAndNumbers(value: string): string {
  return validateByPattern(
    value,
    LETTERS_AND_NUMBERS_PATTERN,
    VALIDATION_MESSAGES.lettersAndNumbersOnly
  );
}

export function validateOnlyLettersNumbersAndSpaces(value: string): string {
  return validateByPattern(
    value,
    LETTERS_NUMBERS_AND_SPACES_PATTERN,
    buildOnlyLettersNumbersAndSpacesMessage('O valor')
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
    VALIDATION_MESSAGES.invalidChassi
  );

  return chassi;
}

export function validateModel(value: unknown): string {
  return validateOnlyLettersAndNumbers(validateString(value, 'model').trim());
}

export function validateHorimetro(value: unknown): number {
  if (typeof value === 'number') {
    assertCondition(Number.isFinite(value) && value >= 0, VALIDATION_MESSAGES.invalidHorimetro);
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
