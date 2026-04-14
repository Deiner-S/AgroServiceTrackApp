import { rethrowAsValidationException } from '@/exceptions/ValidationException';
import { buildListFieldMessage, VALIDATION_MESSAGES } from '@/utils/validation/messages';
import type {
  ChecklistItemPayload,
  ChecklistSavePayload,
  ChecklistWorkOrderUpdatePayload,
} from '@/services/checklistService';
import { assertCondition, validateString, validateIsoDatetime, validateUuid } from '@/utils/validation/helpers';
import { validateChecklistStatus, validateWorkOrderStatus } from '@/utils/validation/statusValidation';
import {
  validateChassi,
  validateHorimetro,
  validateModel,
  validateServiceText,
} from '@/utils/validation/textValidation';
import { validateWorkOrderEntity } from '@/utils/validation/entityValidation';

export function validateChecklistWorkOrderUpdatePayload(
  payload: ChecklistWorkOrderUpdatePayload,
  stage: ChecklistSavePayload['stage']
): ChecklistWorkOrderUpdatePayload {
  return rethrowAsValidationException('user_input', () => {
    const nextPayload: ChecklistWorkOrderUpdatePayload = {};

    if (stage === 'collection') {
      nextPayload.chassi = validateChassi(payload.chassi);
      nextPayload.horimetro = validateHorimetro(payload.horimetro);
      nextPayload.model = validateModel(payload.model);
      nextPayload.date_in = validateIsoDatetime(payload.date_in, 'date_in');
      nextPayload.status = validateWorkOrderStatus(payload.status);
      nextPayload.signature_in = validateString(payload.signature_in, 'signature_in');
      nextPayload.service = validateServiceText(payload.service);
      return nextPayload;
    }

    nextPayload.date_out = validateIsoDatetime(payload.date_out, 'date_out');
    nextPayload.status = validateWorkOrderStatus(payload.status);
    nextPayload.signature_out = validateString(payload.signature_out, 'signature_out');
    return nextPayload;
  });
}

export function validateChecklistItemPayload(
  item: ChecklistItemPayload,
  index: number
): ChecklistItemPayload {
  return rethrowAsValidationException('user_input', () => {
    const label = `items[${index}]`;

    return {
      checklist_id: item.checklist_id
        ? validateUuid(item.checklist_id, `${label}.checklist_id`)
        : undefined,
      checklist_item_fk: validateUuid(item.checklist_item_fk, `${label}.checklist_item_fk`),
      status: item.status == null ? null : validateChecklistStatus(item.status, `${label}.status`),
      photoInUri: item.photoInUri == null ? null : validateString(item.photoInUri, `${label}.photoInUri`),
      photoOutUri: item.photoOutUri == null ? null : validateString(item.photoOutUri, `${label}.photoOutUri`),
    };
  });
}

export function validateChecklistSavePayload(payload: ChecklistSavePayload): ChecklistSavePayload {
  return rethrowAsValidationException('user_input', () => {
    validateWorkOrderEntity(payload.workOrder);
    assertCondition(payload.stage === 'collection' || payload.stage === 'delivery', VALIDATION_MESSAGES.invalidStage);
    assertCondition(Array.isArray(payload.items), buildListFieldMessage('items'));

    return {
      ...payload,
      workOrderUpdate: payload.workOrderUpdate
        ? validateChecklistWorkOrderUpdatePayload(payload.workOrderUpdate, payload.stage)
        : undefined,
      items: payload.items.map((item, index) => validateChecklistItemPayload(item, index)),
    };
  });
}
