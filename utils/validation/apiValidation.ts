import { rethrowAsValidationException } from '@/exceptions/ValidationException';
import type CheckList from '@/models/CheckList';
import type CheckListItem from '@/models/CheckListItem';
import type ErrorLog from '@/models/ErrorLog';
import type WorkOrder from '@/models/WorkOrder';
import {
  buildListFieldMessage,
  buildRequiredFieldMessage,
  VALIDATION_MESSAGES,
} from '@/utils/validation/messages';
import {
  CHECKLIST_ALLOWED_KEYS,
  CHECKLIST_REQUIRED_KEYS,
  WORK_ORDER_ALLOWED_KEYS,
  WORK_ORDER_REQUIRED_KEYS,
} from '@/utils/validation/constants';
import {
  JsonRecord,
  assertCondition,
  validateAllowedKeys,
  validateIsoDatetime,
  validateObject,
  validateRequiredKeys,
  validateString,
  validateUuid,
} from '@/utils/validation/helpers';
import {
  validateCheckListEntity,
  validateCheckListItemEntity,
  validateErrorLogEntity,
  validateWorkOrderEntity,
} from '@/utils/validation/entityValidation';
import { validateChecklistStatus, validateWorkOrderStatus } from '@/utils/validation/statusValidation';
import {
  validateChassi,
  validateHorimetro,
  validateModel,
  validateOnlyNumbers,
  validateServiceText,
} from '@/utils/validation/textValidation';

function requireValue<T>(value: T | undefined, message: string): T {
  if (value === undefined) {
    throw new Error(message);
  }

  return value;
}

export function validateWorkOrderApiEntries(payload: unknown): JsonRecord[] {
  return rethrowAsValidationException('api_contract', () => {
    assertCondition(Array.isArray(payload), buildListFieldMessage('work_orders'));

    return payload.map((rawEntry, index) => {
      const label = `work_order[${index + 1}]`;
      const entry = validateObject(rawEntry, label);

      validateAllowedKeys(entry, WORK_ORDER_ALLOWED_KEYS, label);
      const operationCode = validateString(entry.operation_code, 'operation_code').trim();
      assertCondition(operationCode.length > 0, buildRequiredFieldMessage('operation_code'));
      const status = validateWorkOrderStatus(entry.status);

      const requiredKeys = [...WORK_ORDER_REQUIRED_KEYS];
      if (status !== '1') {
        requiredKeys.push('chassi', 'horimetro', 'model', 'date_in');
      }
      if (status === '3' || status === '4') {
        requiredKeys.push('service');
      }
      if (status === '4') {
        requiredKeys.push('date_out');
      }

      validateRequiredKeys(entry, requiredKeys, label);

      const payloadEntry: JsonRecord = {
        ...entry,
        operation_code: operationCode,
        status,
        signature_in: entry.signature_in,
        signature_out: entry.signature_out,
        signature: entry.signature,
      };

      if (status !== '1') {
        payloadEntry.chassi = validateChassi(entry.chassi);
        payloadEntry.horimetro = validateOnlyNumbers(String(entry.horimetro));
        payloadEntry.model = validateModel(entry.model);
        payloadEntry.date_in = validateIsoDatetime(entry.date_in, 'date_in');
      }

      if (status === '3' || status === '4') {
        payloadEntry.service = validateServiceText(entry.service);
      } else if (entry.service != null) {
        payloadEntry.service = validateServiceText(entry.service);
      }

      if (status === '4') {
        payloadEntry.date_out = validateIsoDatetime(entry.date_out, 'date_out');
      } else if (entry.date_out != null) {
        payloadEntry.date_out = validateIsoDatetime(entry.date_out, 'date_out');
      }

      return payloadEntry;
    });
  });
}

export function validateChecklistApiEntries(payload: unknown): JsonRecord[] {
  return rethrowAsValidationException('api_contract', () => {
    assertCondition(Array.isArray(payload), buildListFieldMessage('checklists'));

    return payload.map((rawEntry, index) => {
      const label = `checklist[${index + 1}]`;
      const entry = validateObject(rawEntry, label);

      validateRequiredKeys(entry, CHECKLIST_REQUIRED_KEYS, label);
      validateAllowedKeys(entry, CHECKLIST_ALLOWED_KEYS, label);

      return {
        ...entry,
        id: entry.id == null ? undefined : validateUuid(entry.id, 'id'),
        checklist_item_fk: validateUuid(entry.checklist_item_fk, 'checklist_item_fk'),
        work_order_fk: validateString(entry.work_order_fk, 'work_order_fk').trim(),
        status: validateChecklistStatus(entry.status),
        img_in: entry.img_in,
        img_out: entry.img_out,
      };
    });
  });
}

export function buildWorkOrderApiPayload(workOrder: WorkOrder): JsonRecord {
  const validated = validateWorkOrderEntity(workOrder);
  const status = validateWorkOrderStatus(validated.status);

  const payload: JsonRecord = {
    operation_code: validateString(validated.operation_code, 'operation_code').trim(),
    status,
  };

  if (status !== '1') {
    payload.chassi = validateChassi(requireValue(validated.chassi, buildRequiredFieldMessage('chassi')));
    payload.horimetro = validateOnlyNumbers(
      String(validateHorimetro(requireValue(validated.horimetro, buildRequiredFieldMessage('horimetro'))))
    );
    payload.model = validateModel(requireValue(validated.model, buildRequiredFieldMessage('model')));
    payload.date_in = validateIsoDatetime(requireValue(validated.date_in, buildRequiredFieldMessage('date_in')), 'date_in');
  }

  if (status === '3' || status === '4') {
    payload.service = requireValue(validated.service, buildRequiredFieldMessage('service'));
  } else if (validated.service) {
    payload.service = validated.service;
  }

  if (status === '4') {
    payload.date_out = validateIsoDatetime(requireValue(validated.date_out, buildRequiredFieldMessage('date_out')), 'date_out');
  } else if (validated.date_out) {
    payload.date_out = validateIsoDatetime(validated.date_out, 'date_out');
  }

  if (validated.signature_in !== undefined) {
    payload.signature_in = validated.signature_in;
  }
  if (validated.signature_out !== undefined) {
    payload.signature_out = validated.signature_out;
  }

  return payload;
}

export function buildChecklistApiPayload(checkList: CheckList): JsonRecord {
  const validated = validateCheckListEntity(checkList);

  return {
    id: validateUuid(validated.id, 'id'),
    checklist_item_fk: validateUuid(validated.checklist_item_fk, 'checklist_item_fk'),
    work_order_fk: validateString(validated.work_order_fk, 'work_order_fk').trim(),
    status: validateChecklistStatus(validated.status),
    img_in: validated.img_in ?? null,
    img_out: validated.img_out ?? null,
  };
}

export function validateWorkOrderApiResponse(payload: unknown): WorkOrder[] {
  return rethrowAsValidationException('api_contract', () => {
    assertCondition(Array.isArray(payload), VALIDATION_MESSAGES.workOrdersResponseMustBeList);
    return payload.map((entry) => validateWorkOrderEntity(entry as WorkOrder));
  });
}

export function validateCheckListItemApiResponse(payload: unknown): CheckListItem[] {
  return rethrowAsValidationException('api_contract', () => {
    assertCondition(Array.isArray(payload), VALIDATION_MESSAGES.checklistItemsResponseMustBeList);
    return payload.map((entry) => validateCheckListItemEntity(entry as CheckListItem));
  });
}

export function buildErrorLogApiPayload(errorLog: ErrorLog): JsonRecord {
  const validated = validateErrorLogEntity(errorLog);

  return {
    id: validateUuid(validated.id, 'id'),
    osVersion: validateString(validated.osVersion, 'osVersion').trim(),
    deviceModel: validateString(validated.deviceModel, 'deviceModel').trim(),
    connectionStatus: validateString(validated.connectionStatus, 'connectionStatus').trim(),
    user: validateString(validated.user, 'user').trim(),
    erro: validateString(validated.erro, 'erro').trim(),
    stacktrace: validated.stacktrace,
    horario: validateIsoDatetime(validated.horario, 'horario'),
    status_sync: validated.status_sync,
  };
}
