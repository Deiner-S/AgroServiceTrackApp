export type AccessContext = {
  is_director: boolean;
  is_manager: boolean;
  is_administrative: boolean;
  is_technician: boolean;
  can_view_employee_module: boolean;
  can_create_employee: boolean;
  can_view_client_list: boolean;
  can_view_client_detail: boolean;
  can_manage_client: boolean;
  can_create_service_order: boolean;
  can_view_checklist_item_module: boolean;
  can_manage_checklist_item: boolean;
  can_view_service_panel: boolean;
};

export type DashboardSummary = {
  pendingOrders: number;
  inProgressOrders: number;
  deliveryOrders: number;
  completedOrders: number;
  clients: number;
  employees: number;
  checklistItems: number;
};

export type DashboardModule = {
  id: string;
  title: string;
  description: string;
  icon: string;
  route: string;
  count: number;
  enabled: boolean;
};

export type DashboardPayload = {
  user: {
    username: string;
    fullName: string;
    position: string;
  };
  summary: DashboardSummary;
  modules: DashboardModule[];
  access: AccessContext;
};

export type ChecklistExecutionSummary = {
  id: string;
  itemName: string;
  status: string;
  statusLabel: string;
  employeeName: string;
  insertDate?: string;
};

export type OrderListItem = {
  id: string;
  operationCode: string;
  clientName: string;
  symptoms: string;
  chassi?: string;
  horimetro?: string;
  model?: string;
  status: string;
  statusLabel: string;
  dateIn?: string;
  dateOut?: string;
  service?: string;
  insertDate?: string;
};

export type OrderDetail = OrderListItem & {
  checklists: ChecklistExecutionSummary[];
};
