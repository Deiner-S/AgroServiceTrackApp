import type {
  AccessContext,
  ChecklistExecutionSummary,
  ChecklistItemDetail,
  ChecklistItemListItem,
  ClientDetail,
  ClientListItem,
  DashboardModule,
  DashboardPayload,
  DashboardSummary,
  EmployeeDetail,
  EmployeeListItem,
  OrderDetail,
  OrderListItem,
  RelatedOrderSummary,
} from '@/types/management';
import {
  JsonRecord,
  assertCondition,
  validateIsoDatetime,
  validateObject,
  validateOptionalString,
  validateString,
  validateUuid,
} from '@/utils/validation/helpers';

function validateBoolean(value: unknown, fieldName: string): boolean {
  assertCondition(typeof value === 'boolean', `${fieldName} deve ser booleano.`);
  return value;
}

function validateNumber(value: unknown, fieldName: string): number {
  assertCondition(typeof value === 'number' && Number.isFinite(value), `${fieldName} deve ser numerico.`);
  return value;
}

function validateOptionalIsoDatetime(value: unknown, fieldName: string): string | undefined {
  if (value == null || value === '') {
    return undefined;
  }

  return validateIsoDatetime(value, fieldName);
}

function validateAccessContext(payload: unknown): AccessContext {
  const entry = validateObject(payload, 'access');

  return {
    is_director: validateBoolean(entry.is_director, 'access.is_director'),
    is_manager: validateBoolean(entry.is_manager, 'access.is_manager'),
    is_administrative: validateBoolean(entry.is_administrative, 'access.is_administrative'),
    is_technician: validateBoolean(entry.is_technician, 'access.is_technician'),
    can_view_employee_module: validateBoolean(entry.can_view_employee_module, 'access.can_view_employee_module'),
    can_create_employee: validateBoolean(entry.can_create_employee, 'access.can_create_employee'),
    can_view_client_list: validateBoolean(entry.can_view_client_list, 'access.can_view_client_list'),
    can_view_client_detail: validateBoolean(entry.can_view_client_detail, 'access.can_view_client_detail'),
    can_manage_client: validateBoolean(entry.can_manage_client, 'access.can_manage_client'),
    can_create_service_order: validateBoolean(entry.can_create_service_order, 'access.can_create_service_order'),
    can_view_checklist_item_module: validateBoolean(entry.can_view_checklist_item_module, 'access.can_view_checklist_item_module'),
    can_manage_checklist_item: validateBoolean(entry.can_manage_checklist_item, 'access.can_manage_checklist_item'),
    can_view_service_panel: validateBoolean(entry.can_view_service_panel, 'access.can_view_service_panel'),
  };
}

function validateDashboardSummary(payload: unknown): DashboardSummary {
  const entry = validateObject(payload, 'summary');

  return {
    pendingOrders: validateNumber(entry.pendingOrders, 'summary.pendingOrders'),
    inProgressOrders: validateNumber(entry.inProgressOrders, 'summary.inProgressOrders'),
    deliveryOrders: validateNumber(entry.deliveryOrders, 'summary.deliveryOrders'),
    completedOrders: validateNumber(entry.completedOrders, 'summary.completedOrders'),
    clients: validateNumber(entry.clients, 'summary.clients'),
    employees: validateNumber(entry.employees, 'summary.employees'),
    checklistItems: validateNumber(entry.checklistItems, 'summary.checklistItems'),
  };
}

function validateDashboardModule(payload: unknown, index: number): DashboardModule {
  const entry = validateObject(payload, `modules[${index}]`);

  return {
    id: validateString(entry.id, `modules[${index}].id`).trim(),
    title: validateString(entry.title, `modules[${index}].title`).trim(),
    description: validateString(entry.description, `modules[${index}].description`).trim(),
    icon: validateString(entry.icon, `modules[${index}].icon`).trim(),
    route: validateString(entry.route, `modules[${index}].route`).trim(),
    count: validateNumber(entry.count, `modules[${index}].count`),
    enabled: validateBoolean(entry.enabled, `modules[${index}].enabled`),
  };
}

function validateRelatedOrderSummary(payload: unknown, label: string): RelatedOrderSummary {
  const entry = validateObject(payload, label);

  return {
    id: validateUuid(entry.id, `${label}.id`),
    operationCode: validateString(entry.operationCode, `${label}.operationCode`).trim(),
    status: validateString(entry.status, `${label}.status`).trim(),
    statusLabel: validateString(entry.statusLabel, `${label}.statusLabel`).trim(),
    insertDate: validateOptionalIsoDatetime(entry.insertDate, `${label}.insertDate`),
  };
}

function validateClientListItem(payload: unknown, label: string): ClientListItem {
  const entry = validateObject(payload, label);

  return {
    id: validateUuid(entry.id, `${label}.id`),
    name: validateString(entry.name, `${label}.name`).trim(),
    email: validateString(entry.email, `${label}.email`).trim(),
    phone: validateString(entry.phone, `${label}.phone`).trim(),
    cpf: validateOptionalString(entry.cpf, `${label}.cpf`)?.trim(),
    cnpj: validateOptionalString(entry.cnpj, `${label}.cnpj`)?.trim(),
    addressCount: validateNumber(entry.addressCount, `${label}.addressCount`),
    insertDate: validateOptionalIsoDatetime(entry.insertDate, `${label}.insertDate`),
  };
}

function validateEmployeeListItem(payload: unknown, label: string): EmployeeListItem {
  const entry = validateObject(payload, label);

  return {
    id: validateUuid(entry.id, `${label}.id`),
    username: validateString(entry.username, `${label}.username`).trim(),
    fullName: validateString(entry.fullName, `${label}.fullName`).trim(),
    email: validateString(entry.email, `${label}.email`).trim(),
    cpf: validateString(entry.cpf, `${label}.cpf`).trim(),
    phone: validateString(entry.phone, `${label}.phone`).trim(),
    position: validateString(entry.position, `${label}.position`).trim(),
    positionLabel: validateString(entry.positionLabel, `${label}.positionLabel`).trim(),
    isActive: validateBoolean(entry.isActive, `${label}.isActive`),
    addressCount: validateNumber(entry.addressCount, `${label}.addressCount`),
    insertDate: validateOptionalIsoDatetime(entry.insertDate, `${label}.insertDate`),
  };
}

function validateChecklistItemListItem(payload: unknown, label: string): ChecklistItemListItem {
  const entry = validateObject(payload, label);

  return {
    id: validateUuid(entry.id, `${label}.id`),
    name: validateString(entry.name, `${label}.name`).trim(),
    status: validateNumber(entry.status, `${label}.status`),
    statusLabel: validateString(entry.statusLabel, `${label}.statusLabel`).trim(),
    usageCount: validateNumber(entry.usageCount, `${label}.usageCount`),
    insertDate: validateOptionalIsoDatetime(entry.insertDate, `${label}.insertDate`),
  };
}

function validateOrderListItem(payload: unknown, label: string): OrderListItem {
  const entry = validateObject(payload, label);

  return {
    id: validateUuid(entry.id, `${label}.id`),
    operationCode: validateString(entry.operationCode, `${label}.operationCode`).trim(),
    clientName: validateString(entry.clientName, `${label}.clientName`).trim(),
    symptoms: validateString(entry.symptoms, `${label}.symptoms`).trim(),
    chassi: validateOptionalString(entry.chassi, `${label}.chassi`)?.trim(),
    horimetro: validateOptionalString(entry.horimetro, `${label}.horimetro`)?.trim(),
    model: validateOptionalString(entry.model, `${label}.model`)?.trim(),
    status: validateString(entry.status, `${label}.status`).trim(),
    statusLabel: validateString(entry.statusLabel, `${label}.statusLabel`).trim(),
    dateIn: validateOptionalIsoDatetime(entry.dateIn, `${label}.dateIn`),
    dateOut: validateOptionalIsoDatetime(entry.dateOut, `${label}.dateOut`),
    service: validateOptionalString(entry.service, `${label}.service`)?.trim(),
    insertDate: validateOptionalIsoDatetime(entry.insertDate, `${label}.insertDate`),
  };
}

function validateAddressList(value: unknown, label: string) {
  assertCondition(Array.isArray(value), `${label} deve ser uma lista.`);

  return value.map((entry, index) => {
    const address = validateObject(entry, `${label}[${index}]`);

    return {
      id: validateUuid(address.id, `${label}[${index}].id`),
      label: validateString(address.label, `${label}[${index}].label`).trim(),
    };
  });
}

function validateChecklistExecutions(value: unknown): ChecklistExecutionSummary[] {
  assertCondition(Array.isArray(value), 'checklists deve ser uma lista.');

  return value.map((entry, index) => {
    const checklist = validateObject(entry, `checklists[${index}]`);

    return {
      id: validateUuid(checklist.id, `checklists[${index}].id`),
      itemName: validateString(checklist.itemName, `checklists[${index}].itemName`).trim(),
      status: validateString(checklist.status, `checklists[${index}].status`).trim(),
      statusLabel: validateString(checklist.statusLabel, `checklists[${index}].statusLabel`).trim(),
      employeeName: validateString(checklist.employeeName, `checklists[${index}].employeeName`).trim(),
      insertDate: validateOptionalIsoDatetime(checklist.insertDate, `checklists[${index}].insertDate`),
    };
  });
}

function validateCollection<T>(
  payload: unknown,
  label: string,
  validator: (entry: unknown, label: string) => T
): T[] {
  assertCondition(Array.isArray(payload), `${label} deve ser uma lista.`);
  return payload.map((entry, index) => validator(entry, `${label}[${index}]`));
}

export function validateDashboardResponse(payload: unknown): DashboardPayload {
  const entry = validateObject(payload, 'dashboard');
  const user = validateObject(entry.user, 'dashboard.user');

  return {
    user: {
      username: validateString(user.username, 'dashboard.user.username').trim(),
      fullName: validateString(user.fullName, 'dashboard.user.fullName').trim(),
      position: validateString(user.position, 'dashboard.user.position').trim(),
    },
    summary: validateDashboardSummary(entry.summary),
    modules: validateCollection(entry.modules, 'modules', (item, label) => {
      const match = label.match(/\[(\d+)\]/);
      return validateDashboardModule(item, Number(match?.[1] ?? 0));
    }),
    access: validateAccessContext(entry.access),
  };
}

export function validateClientsResponse(payload: unknown): ClientListItem[] {
  return validateCollection(payload, 'clients', validateClientListItem);
}

export function validateClientDetailResponse(payload: unknown): ClientDetail {
  const entry = validateClientListItem(payload, 'clientDetail') as ClientDetail & JsonRecord;
  const detail = validateObject(payload, 'clientDetail');

  return {
    ...entry,
    addresses: validateAddressList(detail.addresses, 'clientDetail.addresses'),
    recentOrders: validateCollection(detail.recentOrders, 'clientDetail.recentOrders', validateRelatedOrderSummary),
  };
}

export function validateEmployeesResponse(payload: unknown): EmployeeListItem[] {
  return validateCollection(payload, 'employees', validateEmployeeListItem);
}

export function validateEmployeeDetailResponse(payload: unknown): EmployeeDetail {
  const entry = validateEmployeeListItem(payload, 'employeeDetail') as EmployeeDetail & JsonRecord;
  const detail = validateObject(payload, 'employeeDetail');

  return {
    ...entry,
    addresses: validateAddressList(detail.addresses, 'employeeDetail.addresses'),
  };
}

export function validateChecklistItemsResponse(payload: unknown): ChecklistItemListItem[] {
  return validateCollection(payload, 'checklistItems', validateChecklistItemListItem);
}

export function validateChecklistItemDetailResponse(payload: unknown): ChecklistItemDetail {
  return validateChecklistItemListItem(payload, 'checklistItemDetail');
}

export function validateOrdersResponse(payload: unknown): OrderListItem[] {
  return validateCollection(payload, 'orders', validateOrderListItem);
}

export function validateOrderDetailResponse(payload: unknown): OrderDetail {
  const entry = validateOrderListItem(payload, 'orderDetail') as OrderDetail & JsonRecord;
  const detail = validateObject(payload, 'orderDetail');

  return {
    ...entry,
    checklists: validateChecklistExecutions(detail.checklists),
  };
}
