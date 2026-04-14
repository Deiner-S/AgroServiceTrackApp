import {
  ISO_DATETIME_PATTERN,
  UUID_PATTERN,
} from '@/utils/validation/constants';
import {
  buildBinaryFieldMessage,
  buildIsoDateFieldMessage,
  buildJsonObjectMessage,
  buildMissingRequiredKeysMessage,
  buildTextFieldMessage,
  buildUnexpectedKeysMessage,
  buildUuidFieldMessage,
} from '@/utils/validation/messages';

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
    buildJsonObjectMessage(label)
  );
  return value as JsonRecord;
}

export function validateString(value: unknown, fieldName: string): string {
  assertCondition(typeof value === 'string', buildTextFieldMessage(fieldName));
  return value;
}

export function validateOptionalString(value: unknown, fieldName: string): string | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  assertCondition(typeof value === 'string', buildTextFieldMessage(fieldName));
  return value;
}

export function validateBlob(value: unknown, fieldName: string): Uint8Array | null | undefined {
  if (value === undefined || value === null) {
    return value as undefined | null;
  }

  assertCondition(value instanceof Uint8Array, buildBinaryFieldMessage(fieldName));
  return value;
}

export function validateIsoDatetime(value: unknown, fieldName: string): string {
  const stringValue = validateString(value, fieldName);

  assertCondition(
    ISO_DATETIME_PATTERN.test(stringValue) && !Number.isNaN(Date.parse(stringValue)),
    buildIsoDateFieldMessage(fieldName)
  );

  return stringValue;
}

export function validateUuid(value: unknown, fieldName: string): string {
  const stringValue = validateString(value, fieldName);
  assertCondition(UUID_PATTERN.test(stringValue), buildUuidFieldMessage(fieldName));
  return stringValue;
}

export function validateRequiredKeys(entry: JsonRecord, requiredKeys: string[], label: string): void {
  const missingKeys = requiredKeys.filter((key) => !(key in entry));
  assertCondition(
    missingKeys.length === 0,
    buildMissingRequiredKeysMessage(label, missingKeys)
  );
}

export function validateAllowedKeys(entry: JsonRecord, allowedKeys: string[], label: string): void {
  const unexpectedKeys = Object.keys(entry).filter((key) => !allowedKeys.includes(key));
  assertCondition(
    unexpectedKeys.length === 0,
    buildUnexpectedKeysMessage(label, unexpectedKeys)
  );
}
