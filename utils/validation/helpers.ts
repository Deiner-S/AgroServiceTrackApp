import {
  ISO_DATETIME_PATTERN,
  UUID_PATTERN,
} from '@/utils/validation/constants';

export type JsonRecord = Record<string, unknown>;

export function assertCondition(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

export function validateByPattern(value: string, pattern: RegExp, errorMessage: string): string {
  assertCondition(Boolean(value) && pattern.test(value), errorMessage);
  return value;
}

export function validateObject(value: unknown, label: string): JsonRecord {
  assertCondition(
    typeof value === 'object' && value !== null && !Array.isArray(value),
    `${label} deve ser um objeto JSON.`
  );
  return value as JsonRecord;
}

export function validateString(value: unknown, fieldName: string): string {
  assertCondition(typeof value === 'string', `${fieldName} deve ser um texto.`);
  return value;
}

export function validateOptionalString(value: unknown, fieldName: string): string | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  assertCondition(typeof value === 'string', `${fieldName} deve ser um texto.`);
  return value;
}

export function validateBlob(value: unknown, fieldName: string): Uint8Array | null | undefined {
  if (value === undefined || value === null) {
    return value as undefined | null;
  }

  assertCondition(value instanceof Uint8Array, `${fieldName} deve ser um binario valido.`);
  return value;
}

export function validateIsoDatetime(value: unknown, fieldName: string): string {
  const stringValue = validateString(value, fieldName);

  assertCondition(
    ISO_DATETIME_PATTERN.test(stringValue) && !Number.isNaN(Date.parse(stringValue)),
    `${fieldName} deve ser uma data valida em formato ISO.`
  );

  return stringValue;
}

export function validateUuid(value: unknown, fieldName: string): string {
  const stringValue = validateString(value, fieldName);
  assertCondition(UUID_PATTERN.test(stringValue), `${fieldName} deve ser um UUID valido.`);
  return stringValue;
}

export function validateRequiredKeys(entry: JsonRecord, requiredKeys: string[], label: string): void {
  const missingKeys = requiredKeys.filter((key) => !(key in entry));
  assertCondition(
    missingKeys.length === 0,
    `${label} sem chaves obrigatorias: ${missingKeys.join(', ')}.`
  );
}

export function validateAllowedKeys(entry: JsonRecord, allowedKeys: string[], label: string): void {
  const unexpectedKeys = Object.keys(entry).filter((key) => !allowedKeys.includes(key));
  assertCondition(
    unexpectedKeys.length === 0,
    `${label} contem chaves nao esperadas: ${unexpectedKeys.join(', ')}.`
  );
}
