import {
  VALID_CHECKLIST_STATUS,
  VALID_WORK_ORDER_STATUS,
} from '@/utils/validation/constants';
import { buildAllowedValuesMessage } from '@/utils/validation/messages';
import { assertCondition, validateString } from '@/utils/validation/helpers';

export function validateWorkOrderStatus(value: unknown, fieldName = 'status'): string {
  const status = validateString(value, fieldName);
  assertCondition(
    VALID_WORK_ORDER_STATUS.includes(status as typeof VALID_WORK_ORDER_STATUS[number]),
    buildAllowedValuesMessage(fieldName, VALID_WORK_ORDER_STATUS)
  );
  return status;
}

export function validateChecklistStatus(value: unknown, fieldName = 'status'): string {
  const status = validateString(value, fieldName);
  assertCondition(
    VALID_CHECKLIST_STATUS.includes(status as typeof VALID_CHECKLIST_STATUS[number]),
    buildAllowedValuesMessage(fieldName, VALID_CHECKLIST_STATUS)
  );
  return status;
}
