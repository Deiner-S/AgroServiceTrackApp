import {
  VALID_CHECKLIST_STATUS,
  VALID_WORK_ORDER_STATUS,
} from '@/utils/validation/constants';
import { assertCondition, validateString } from '@/utils/validation/helpers';

export function validateWorkOrderStatus(value: unknown, fieldName = 'status'): string {
  const status = validateString(value, fieldName);
  assertCondition(
    VALID_WORK_ORDER_STATUS.includes(status as typeof VALID_WORK_ORDER_STATUS[number]),
    `${fieldName} invalido. Valores permitidos: ${VALID_WORK_ORDER_STATUS.join(', ')}.`
  );
  return status;
}

export function validateChecklistStatus(value: unknown, fieldName = 'status'): string {
  const status = validateString(value, fieldName);
  assertCondition(
    VALID_CHECKLIST_STATUS.includes(status as typeof VALID_CHECKLIST_STATUS[number]),
    `${fieldName} invalido. Valores permitidos: ${VALID_CHECKLIST_STATUS.join(', ')}.`
  );
  return status;
}
