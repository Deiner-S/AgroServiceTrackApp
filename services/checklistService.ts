import CheckList from '@/models/CheckList';
import CheckListItem from '@/models/CheckListItem';
import WorkOrder from '@/models/WorkOrder';
import {
  exceptionHandling,
  syncExceptionHandling,
} from '@/exceptions/ExceptionHandler';
import ChecklistServiceException from '@/exceptions/ChecklistServiceException';
import CheckListRepository from '@/repository/CheckListRepository';
import WorkOrderRepository from '@/repository/WorkOrderRepository';
import { base64ToUint8Array, readImageAsUint8Array } from '@/services/imageService';
import { validateChecklistSavePayload } from '@/utils/validation';
import { v4 as uuidv4 } from 'uuid';

export interface ChecklistStateItem {
  id: string;
  checklistId?: string;
  selected: string | null;
  photoInUri: string | null;
  photoOutUri: string | null;
  hasPhotoIn: boolean;
  hasPhotoOut: boolean;
}

export type ChecklistStage = 'collection' | 'delivery';

export type ChecklistWorkOrderUpdatePayload =
  Partial<Pick<WorkOrder, 'chassi' | 'horimetro' | 'model' | 'date_in' | 'date_out' | 'status' | 'service'>> & {
    signature_in?: string;
    signature_out?: string;
  };

export interface ChecklistItemPayload {
  checklist_id?: string;
  checklist_item_fk: string;
  status: string | null;
  photoInUri: string | null;
  photoOutUri: string | null;
}

export interface ChecklistSavePayload {
  stage: ChecklistStage;
  workOrder: WorkOrder;
  workOrderUpdate?: ChecklistWorkOrderUpdatePayload;
  items: ChecklistItemPayload[];
}

interface BuildChecklistPayloadInput {
  stage: ChecklistStage;
  workOrder: WorkOrder;
  checklistState: ChecklistStateItem[];
  chassi: string;
  horimetro: number;
  modelo: string;
  dateFilled: Date;
  signature: string;
}

export async function hydrateChecklistState(
  checkListRepository: CheckListRepository,
  checklistItems: CheckListItem[],
  workOrderOperationCode: string
): Promise<ChecklistStateItem[]> {
  return exceptionHandling(async () => {
    const existingRows = await checkListRepository.getAll();
    const existingByItem = new Map(
      existingRows
        .filter((row) => row.work_order_fk === workOrderOperationCode)
        .map((row) => [row.checklist_item_fk, row])
    );

    return checklistItems.map((item) => {
      const existing = existingByItem.get(item.id);

      return {
        id: item.id,
        checklistId: existing?.id,
        selected: existing?.status ?? null,
        photoInUri: null,
        photoOutUri: null,
        hasPhotoIn: !!existing?.img_in,
        hasPhotoOut: !!existing?.img_out,
      };
    });
  }, { ExceptionType: ChecklistServiceException }) as Promise<ChecklistStateItem[]>;
}

export async function hydrateDeliveryChecklistState(
  checkListRepository: CheckListRepository,
  checklistItems: CheckListItem[],
  workOrderOperationCode: string
): Promise<Array<ChecklistStateItem & { name: string }>> {
  return exceptionHandling(async () => {
    const existingRows = await checkListRepository.getAll();
    const itemNames = new Map(checklistItems.map((item) => [item.id, item.name]));

    return existingRows
      .filter((row) => row.work_order_fk === workOrderOperationCode && row.status != null)
      .map((row) => ({
        id: row.checklist_item_fk,
        name: itemNames.get(row.checklist_item_fk) ?? 'Item de checklist',
        checklistId: row.id,
        selected: row.status,
        photoInUri: null,
        photoOutUri: null,
        hasPhotoIn: !!row.img_in,
        hasPhotoOut: !!row.img_out,
      }));
  }, { ExceptionType: ChecklistServiceException }) as Promise<Array<ChecklistStateItem & { name: string }>>;
}

export function buildChecklistPayload({
  stage,
  workOrder,
  checklistState,
  chassi,
  horimetro,
  modelo,
  dateFilled,
  signature,
}: BuildChecklistPayloadInput): ChecklistSavePayload {
  return syncExceptionHandling(() => {
    return validateChecklistSavePayload({
      stage,
      workOrder,
      workOrderUpdate: stage === 'collection'
        ? {
            chassi,
            horimetro,
            model: modelo,
            date_in: dateFilled.toISOString(),
            status: '2',
            signature_in: signature,
          }
        : {
            date_out: new Date().toISOString(),
            status: '4',
            signature_out: signature,
          },
      items: checklistState.map((item) => ({
        checklist_id: item.checklistId,
        checklist_item_fk: item.id,
        status: item.selected,
        photoInUri: stage === 'collection' ? item.photoInUri : null,
        photoOutUri: stage === 'delivery' ? item.photoOutUri : null,
      })),
    });
  }, { ExceptionType: ChecklistServiceException }) as ChecklistSavePayload;
}

export function resolveChecklistDateChange(selectedDate?: Date): Date | null {
  return syncExceptionHandling(() => {
    return selectedDate ?? null;
  }, { ExceptionType: ChecklistServiceException }) as Date | null;
}

export async function saveWorkOrderData(
  workOrderRepository: WorkOrderRepository,
  checklist: ChecklistSavePayload
): Promise<void> {
  return exceptionHandling(async () => {
    const validatedChecklist = validateChecklistSavePayload(checklist);

    if (!validatedChecklist.workOrderUpdate) {
      return;
    }

    const {
      signature_in,
      signature_out,
      ...workOrderUpdate
    } = validatedChecklist.workOrderUpdate;

    await workOrderRepository.update({
      ...validatedChecklist.workOrder,
      ...workOrderUpdate,
      status_sync: 0,
      signature_in: signature_in
        ? base64ToUint8Array(signature_in)
        : validatedChecklist.workOrder.signature_in,
      signature_out: signature_out
        ? base64ToUint8Array(signature_out)
        : validatedChecklist.workOrder.signature_out,
    });
  }, { ExceptionType: ChecklistServiceException }) as Promise<void>;
}

export async function saveChecklistItems(
  checkListRepository: CheckListRepository,
  checklist: ChecklistSavePayload
): Promise<void> {
  return exceptionHandling(async () => {
    const validatedChecklist = validateChecklistSavePayload(checklist);
    const checklistRows = await checkListRepository.getAll();
    const rowsByItem = new Map(
      checklistRows
        .filter((row) => row.work_order_fk === validatedChecklist.workOrder.operation_code)
        .map((row) => [row.checklist_item_fk, row])
    );

    for (const item of validatedChecklist.items) {
      const existing = rowsByItem.get(item.checklist_item_fk);
      const resolvedStatus = item.status ?? existing?.status;

      if (!resolvedStatus) {
        continue;
      }

      const resolvedImgIn = item.photoInUri
        ? await readImageAsUint8Array(item.photoInUri)
        : existing?.img_in ?? null;
      const resolvedImgOut = item.photoOutUri
        ? await readImageAsUint8Array(item.photoOutUri)
        : existing?.img_out ?? null;

      const nextChecklist: CheckList = {
        id: existing?.id ?? item.checklist_id ?? uuidv4(),
        checklist_item_fk: item.checklist_item_fk,
        work_order_fk: validatedChecklist.workOrder.operation_code,
        status_sync: 0,
        status: resolvedStatus,
        img_in: resolvedImgIn,
        img_out: resolvedImgOut,
      };

      if (existing) {
        await checkListRepository.update(nextChecklist);
      } else {
        await checkListRepository.save(nextChecklist);
      }
    }
  }, { ExceptionType: ChecklistServiceException }) as Promise<void>;
}

export async function saveChecklistData(
  workOrderRepository: WorkOrderRepository,
  checkListRepository: CheckListRepository,
  checklist: ChecklistSavePayload
): Promise<void> {
  return exceptionHandling(async () => {
    await saveWorkOrderData(workOrderRepository, checklist);
    await saveChecklistItems(checkListRepository, checklist);
  }, { ExceptionType: ChecklistServiceException }) as Promise<void>;
}
