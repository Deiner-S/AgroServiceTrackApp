import type CheckList from '@/models/CheckList';
import type CheckListItem from '@/models/CheckListItem';
import type ErrorLog from '@/models/ErrorLog';
import type WorkOrder from '@/models/WorkOrder';
import { assertCondition, validateBlob, validateIsoDatetime, validateString, validateUuid } from '@/utils/validation/helpers';
import { validateChecklistStatus } from '@/utils/validation/statusValidation';
import { validateChassi, validateHorimetro, validateModel, validateServiceText } from '@/utils/validation/textValidation';

export function validateWorkOrderEntity(entity: WorkOrder): WorkOrder {
  assertCondition(typeof entity === 'object' && entity !== null, 'WorkOrder invalida.');

  const validated = {
    ...entity,
    operation_code: validateString(entity.operation_code, 'operation_code').trim(),
    client: validateString(entity.client, 'client').trim(),
    symptoms: validateString(entity.symptoms, 'symptoms').trim(),
    status: validateString(entity.status, 'status').trim(),
    status_sync: typeof entity.status_sync === 'number' ? entity.status_sync : Number.NaN,
    chassi: entity.chassi ? validateChassi(entity.chassi) : undefined,
    horimetro: entity.horimetro == null ? undefined : validateHorimetro(entity.horimetro),
    model: entity.model ? validateModel(entity.model) : undefined,
    date_in: entity.date_in ? validateIsoDatetime(entity.date_in, 'date_in') : undefined,
    date_out: entity.date_out ? validateIsoDatetime(entity.date_out, 'date_out') : undefined,
    service: validateServiceText(entity.service),
    signature_in: validateBlob(entity.signature_in, 'signature_in'),
    signature_out: validateBlob(entity.signature_out, 'signature_out'),
    insertDate: entity.insertDate ? validateIsoDatetime(entity.insertDate, 'insertDate') : undefined,
  };

  assertCondition(Number.isInteger(validated.status_sync), 'status_sync deve ser um numero inteiro.');
  return validated as WorkOrder;
}

export function validateCheckListEntity(entity: CheckList): CheckList {
  const validated = {
    ...entity,
    id: validateUuid(entity.id, 'id'),
    checklist_item_fk: validateUuid(entity.checklist_item_fk, 'checklist_item_fk'),
    work_order_fk: validateString(entity.work_order_fk, 'work_order_fk').trim(),
    status: validateChecklistStatus(entity.status),
    status_sync: entity.status_sync == null ? undefined : Number(entity.status_sync),
    img_in: validateBlob(entity.img_in, 'img_in'),
    img_out: validateBlob(entity.img_out, 'img_out'),
  };

  if (validated.status_sync != null) {
    assertCondition(Number.isInteger(validated.status_sync), 'status_sync deve ser um numero inteiro.');
  }

  return validated as CheckList;
}

export function validateCheckListItemEntity(entity: CheckListItem): CheckListItem {
  const validated = {
    ...entity,
    id: validateUuid(entity.id, 'id'),
    name: validateString(entity.name, 'name').trim(),
    status: Number(entity.status),
  };

  assertCondition(Number.isInteger(validated.status), 'status deve ser um numero inteiro.');
  return validated as CheckListItem;
}

export function validateErrorLogEntity(entity: ErrorLog): ErrorLog {
  const validated = {
    ...entity,
    id: validateUuid(entity.id, 'id'),
    osVersion: validateString(entity.osVersion, 'osVersion').trim(),
    deviceModel: validateString(entity.deviceModel, 'deviceModel').trim(),
    user: validateString(entity.user, 'user').trim(),
    erro: validateString(entity.erro, 'erro').trim(),
    stacktrace: entity.stacktrace == null ? null : validateString(entity.stacktrace, 'stacktrace'),
    horario: validateIsoDatetime(entity.horario, 'horario'),
    status_sync: Number(entity.status_sync),
  };

  assertCondition(
    Number.isInteger(validated.status_sync) && (validated.status_sync === 0 || validated.status_sync === 1),
    'status_sync deve ser 0 ou 1.'
  );

  return validated as ErrorLog;
}
