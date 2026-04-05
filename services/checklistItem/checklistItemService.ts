import ManagementServiceException from '@/exceptions/ManagementServiceException';
import { BaseManagementResourceService } from '@/services/management';
import type {
  ChecklistItemCreatePayload,
  ChecklistItemDetail,
  ChecklistItemListItem,
} from '@/services/checklistItem/types';
import {
  validateChecklistItemCreatePayload,
  validateChecklistItemDetailResponse,
  validateChecklistItemsResponse,
  validateOkResponse,
} from '@/utils/validation';

class ChecklistItemService extends BaseManagementResourceService<ManagementServiceException> {
  protected readonly resourceEndpoint = '/mobile/checklist_items_api/';
  protected readonly ExceptionType = ManagementServiceException;

  protected validateOkResponse(payload: unknown): { ok: boolean } {
    return validateOkResponse(payload);
  }

  fetchChecklistItems(searchQuery = ''): Promise<ChecklistItemListItem[]> {
    return this.fetchList(searchQuery, validateChecklistItemsResponse);
  }

  fetchChecklistItemDetail(itemId: string): Promise<ChecklistItemDetail> {
    return this.fetchDetail(itemId, validateChecklistItemDetailResponse);
  }

  createChecklistItem(payload: ChecklistItemCreatePayload): Promise<ChecklistItemDetail> {
    const body = validateChecklistItemCreatePayload(payload);
    return this.submit('POST', this.resourceEndpoint, body, validateChecklistItemDetailResponse);
  }

  toggleChecklistItemStatus(itemId: string): Promise<boolean> {
    return this.toggleStatus(itemId);
  }

  deleteChecklistItem(itemId: string): Promise<boolean> {
    return this.deleteResource(`${this.resourceEndpoint}${itemId}/detail/`);
  }
}

export const checklistItemService = new ChecklistItemService();
