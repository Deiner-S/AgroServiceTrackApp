import { rethrowAsValidationException } from '@/exceptions/ValidationException';
import type { ChecklistItemCreatePayload } from '@/services/checklistItem';
import { assertCondition, validateString } from '@/utils/validation/helpers';

function validateRequiredText(value: unknown, fieldName: string): string {
  const normalized = validateString(value, fieldName).trim();
  assertCondition(normalized.length > 0, `${fieldName} e obrigatorio.`);
  return normalized;
}

export function validateChecklistItemNameField(value: string): string {
  return rethrowAsValidationException('user_input', () => validateRequiredText(value, 'name'));
}

export function validateChecklistItemCreatePayload(payload: ChecklistItemCreatePayload): ChecklistItemCreatePayload {
  return rethrowAsValidationException('user_input', () => ({
    name: validateChecklistItemNameField(payload.name),
  }));
}
