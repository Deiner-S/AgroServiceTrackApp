export type ChecklistItemDetailPermissions = {
  canToggleStatus: boolean;
  canDeleteChecklistItem: boolean;
};

export type ChecklistItemListItem = {
  id: string;
  name: string;
  status: number;
  statusLabel: string;
  usageCount: number;
  insertDate?: string;
};

export type ChecklistItemDetail = ChecklistItemListItem & {
  permissions: ChecklistItemDetailPermissions;
};

export type ChecklistItemCreatePayload = {
  name: string;
};
