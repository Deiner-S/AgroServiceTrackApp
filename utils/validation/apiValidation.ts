import type CheckList from '@/models/CheckList';
import type CheckListItem from '@/models/CheckListItem';
import type ErrorLog from '@/models/ErrorLog';
import type WorkOrder from '@/models/WorkOrder';
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
  assertCondition(Array.isArray(payload), 'work_orders deve ser uma lista.');

  return payload.map((rawEntry, index) => {
    const label = `work_order[${index + 1}]`;
    const entry = validateObject(rawEntry, label);

    validateRequiredKeys(entry, WORK_ORDER_REQUIRED_KEYS, label);
    validateAllowedKeys(entry, WORK_ORDER_ALLOWED_KEYS, label);

    const operationCode = validateString(entry.operation_code, 'operation_code').trim();
    assertCondition(operationCode.length > 0, 'operation_code e obrigatorio.');

    return {
      ...entry,
      operation_code: operationCode,
      chassi: validateChassi(entry.chassi),
      horimetro: validateOnlyNumbers(String(entry.horimetro)),
      model: validateModel(entry.model),
      date_in: validateIsoDatetime(entry.date_in, 'date_in'),
      date_out: validateIsoDatetime(entry.date_out, 'date_out'),
      status: validateWorkOrderStatus(entry.status),
      service: validateServiceText(entry.service),
      signature_in: entry.signature_in,
      signature_out: entry.signature_out,
      signature: entry.signature,
    };
  });
}

export function validateChecklistApiEntries(payload: unknown): JsonRecord[] {
  assertCondition(Array.isArray(payload), 'checklists deve ser uma lista.');

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
}

export function buildWorkOrderApiPayload(workOrder: WorkOrder): JsonRecord {
  const validated = validateWorkOrderEntity(workOrder);

  return {
    operation_code: validateString(validated.operation_code, 'operation_code').trim(),
    chassi: validateChassi(requireValue(validated.chassi, 'chassi e obrigatorio.')),
    horimetro: validateOnlyNumbers(
      String(validateHorimetro(requireValue(validated.horimetro, 'horimetro e obrigatorio.')))
    ),
    model: validateModel(requireValue(validated.model, 'model e obrigatorio.')),
    date_in: validateIsoDatetime(requireValue(validated.date_in, 'date_in e obrigatorio.'), 'date_in'),
    date_out: validateIsoDatetime(requireValue(validated.date_out, 'date_out e obrigatorio.'), 'date_out'),
    status: validateWorkOrderStatus(validated.status),
    service: validated.service,
  };
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
  assertCondition(Array.isArray(payload), 'A resposta de ordens de servico deve ser uma lista.');
  return payload.map((entry) => validateWorkOrderEntity(entry as WorkOrder));
}

export function validateCheckListItemApiResponse(payload: unknown): CheckListItem[] {
  assertCondition(Array.isArray(payload), 'A resposta de itens de checklist deve ser uma lista.');
  return payload.map((entry) => validateCheckListItemEntity(entry as CheckListItem));
}

export function buildErrorLogApiPayload(errorLog: ErrorLog): JsonRecord {
  const validated = validateErrorLogEntity(errorLog);

  return {
    id: validateUuid(validated.id, 'id'),
    osVersion: validateString(validated.osVersion, 'osVersion').trim(),
    deviceModel: validateString(validated.deviceModel, 'deviceModel').trim(),
    user: validateString(validated.user, 'user').trim(),
    erro: validateString(validated.erro, 'erro').trim(),
    stacktrace: validated.stacktrace,
    horario: validateIsoDatetime(validated.horario, 'horario'),
    status_sync: validated.status_sync,
  };
}
