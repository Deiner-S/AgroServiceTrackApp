import CheckList from '@/models/CheckList';
import CheckListItem from '@/models/CheckListItem';
import WorkOrder from '@/models/WorkOrder';
import {
  executeAsyncWithLayerException,
  executeWithLayerException,
} from '@/exceptions/AppLayerException';
import ChecklistServiceException from '@/exceptions/ChecklistServiceException';
import CheckListRepository from '@/repository/CheckListRepository';
import WorkOrderRepository from '@/repository/WorkOrderRepository';
import { v4 as uuidv4 } from 'uuid';
import { base64ToUint8Array, readImageAsUint8Array } from './imageService';

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
  return executeAsyncWithLayerException(async () => {
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
  }, ChecklistServiceException);
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
  return executeWithLayerException(() => {
    return {
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
    };
  }, ChecklistServiceException);
}

export function resolveChecklistDateChange(selectedDate?: Date): Date | null {
  return executeWithLayerException(() => {
    return selectedDate ?? null;
  }, ChecklistServiceException);
}

export async function saveWorkOrderData(
  workOrderRepository: WorkOrderRepository,
  checklist: ChecklistSavePayload
): Promise<void> {
  return executeAsyncWithLayerException(async () => {
    if (!checklist.workOrderUpdate) {
      return;
    }

    const {
      signature_in,
      signature_out,
      ...workOrderUpdate
    } = checklist.workOrderUpdate;

    await workOrderRepository.update({
      ...checklist.workOrder,
      ...workOrderUpdate,
      status_sync: 0,
      signature_in: signature_in
        ? base64ToUint8Array(signature_in)
        : checklist.workOrder.signature_in,
      signature_out: signature_out
        ? base64ToUint8Array(signature_out)
        : checklist.workOrder.signature_out,
    });
  }, ChecklistServiceException);
}

export async function saveChecklistItems(
  checkListRepository: CheckListRepository,
  checklist: ChecklistSavePayload
): Promise<void> {
  return executeAsyncWithLayerException(async () => {
    const checklistRows = await checkListRepository.getAll();
    const rowsByItem = new Map(
      checklistRows
        .filter((row) => row.work_order_fk === checklist.workOrder.operation_code)
        .map((row) => [row.checklist_item_fk, row])
    );

    for (const item of checklist.items) {
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
        work_order_fk: checklist.workOrder.operation_code,
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
  }, ChecklistServiceException);
}

export async function saveChecklistData(
  workOrderRepository: WorkOrderRepository,
  checkListRepository: CheckListRepository,
  checklist: ChecklistSavePayload
): Promise<void> {
  return executeAsyncWithLayerException(async () => {
    await saveWorkOrderData(workOrderRepository, checklist);
    await saveChecklistItems(checkListRepository, checklist);
  }, ChecklistServiceException);
}
