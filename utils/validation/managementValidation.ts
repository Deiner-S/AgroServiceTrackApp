import { rethrowAsValidationException } from '@/exceptions/ValidationException';
import {
  buildBooleanFieldMessage,
  buildListFieldMessage,
  buildNumericFieldMessage,
} from '@/utils/validation/messages';
import type {
  AccessContext,
  ChecklistExecutionSummary,
  DashboardModule,
  DashboardPayload,
  DashboardSession,
  DashboardSummary,
  OrderDetail,
  OrderListItem,
} from '@/services/management';
import type {
  ChecklistItemDetail,
  ChecklistItemDetailPermissions,
  ChecklistItemListItem,
} from '@/services/checklistItem';
import type {
  ClientDetail,
  ClientDetailPermissions,
  ClientListItem,
  RelatedOrderSummary,
} from '@/services/client';
import type {
  EmployeeDetail,
  EmployeeCreateOptions,
  EmployeeDetailPermissions,
  EmployeeListItem,
  EmployeePositionOption,
} from '@/services/employee';

type DetailPermissions = {
  canToggleStatus: boolean;
};
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
  assertCondition(typeof value === 'boolean', buildBooleanFieldMessage(fieldName));
  return value;
}

function validateNumber(value: unknown, fieldName: string): number {
  assertCondition(typeof value === 'number' && Number.isFinite(value), buildNumericFieldMessage(fieldName));
  return value;
}

function validateOptionalIsoDatetime(value: unknown, fieldName: string): string | undefined {
  if (value == null || value === '') {
    return undefined;
  }

  return validateIsoDatetime(value, fieldName);
}

function validateDetailPermissions(payload: unknown, label: string): DetailPermissions {
  const entry = validateObject(payload, label);

  return {
    canToggleStatus: validateBoolean(entry.canToggleStatus, `${label}.canToggleStatus`),
  };
}

function validateChecklistItemDetailPermissions(payload: unknown, label: string): ChecklistItemDetailPermissions {
  const entry = validateObject(payload, label);

  return {
    canDeleteChecklistItem: validateBoolean(entry.canDeleteChecklistItem, `${label}.canDeleteChecklistItem`),
    canToggleStatus: validateBoolean(entry.canToggleStatus, `${label}.canToggleStatus`),
  };
}

function validateEmployeeDetailPermissions(payload: unknown, label: string): EmployeeDetailPermissions {
  const entry = validateObject(payload, label);

  return {
    canEditEmployee: validateBoolean(entry.canEditEmployee, `${label}.canEditEmployee`),
    canManageAddresses: validateBoolean(entry.canManageAddresses, `${label}.canManageAddresses`),
    canToggleStatus: validateBoolean(entry.canToggleStatus, `${label}.canToggleStatus`),
  };
}

function validateClientDetailPermissions(payload: unknown, label: string): ClientDetailPermissions {
  const entry = validateObject(payload, label);

  return {
    canEditClient: validateBoolean(entry.canEditClient, `${label}.canEditClient`),
    canManageAddresses: validateBoolean(entry.canManageAddresses, `${label}.canManageAddresses`),
    canCreateServiceOrder: validateBoolean(entry.canCreateServiceOrder, `${label}.canCreateServiceOrder`),
    nextOperationCode: validateOptionalString(entry.nextOperationCode, `${label}.nextOperationCode`)?.trim(),
  };
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

function validateDashboardSession(payload: unknown): DashboardSession {
  const entry = validateObject(payload, 'session');
  assertCondition(Array.isArray(entry.scope), buildListFieldMessage('session.scope'));

  return {
    validatedAt: validateIsoDatetime(entry.validatedAt, 'session.validatedAt'),
    offlineSessionExpiresAt: validateIsoDatetime(entry.offlineSessionExpiresAt, 'session.offlineSessionExpiresAt'),
    permissionVersion: validateString(entry.permissionVersion, 'session.permissionVersion').trim(),
    scope: entry.scope.map((item, index) => validateString(item, `session.scope[${index}]`).trim()),
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
  assertCondition(Array.isArray(value), buildListFieldMessage(label));

  return value.map((entry, index) => {
    const address = validateObject(entry, `${label}[${index}]`);

    return {
      id: validateUuid(address.id, `${label}[${index}].id`),
      label: validateString(address.label, `${label}[${index}].label`).trim(),
    };
  });
}

function validateChecklistExecutions(value: unknown): ChecklistExecutionSummary[] {
  assertCondition(Array.isArray(value), buildListFieldMessage('checklists'));

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
  assertCondition(Array.isArray(payload), buildListFieldMessage(label));
  return payload.map((entry, index) => validator(entry, `${label}[${index}]`));
}

export function validateDashboardResponse(payload: unknown): DashboardPayload {
  return rethrowAsValidationException('api_contract', () => {
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
      session: validateDashboardSession(entry.session),
    };
  });
}

function validateEmployeePositionOptions(value: unknown): EmployeePositionOption[] {
  assertCondition(Array.isArray(value), buildListFieldMessage('employeeDetail.positionOptions'));

  return value.map((entry, index) => {
    const option = validateObject(entry, `employeeDetail.positionOptions[${index}]`);

    return {
      value: validateString(option.value, `employeeDetail.positionOptions[${index}].value`).trim(),
      label: validateString(option.label, `employeeDetail.positionOptions[${index}].label`).trim(),
    };
  });
}

export function validateEmployeeCreateOptionsResponse(payload: unknown): EmployeeCreateOptions {
  return rethrowAsValidationException('api_contract', () => {
    const entry = validateObject(payload, 'employeeCreateOptions');

    return {
      positionOptions: validateEmployeePositionOptions(entry.positionOptions),
    };
  });
}

export function validateClientsResponse(payload: unknown): ClientListItem[] {
  return rethrowAsValidationException('api_contract', () =>
    validateCollection(payload, 'clients', validateClientListItem)
  );
}

export function validateClientDetailResponse(payload: unknown): ClientDetail {
  return rethrowAsValidationException('api_contract', () => {
    const entry = validateClientListItem(payload, 'clientDetail') as ClientDetail & JsonRecord;
    const detail = validateObject(payload, 'clientDetail');

    return {
      ...entry,
      addresses: validateAddressList(detail.addresses, 'clientDetail.addresses'),
      recentOrders: validateCollection(detail.recentOrders, 'clientDetail.recentOrders', validateRelatedOrderSummary),
      permissions: validateClientDetailPermissions(detail.permissions, 'clientDetail.permissions'),
    };
  });
}

export function validateEmployeesResponse(payload: unknown): EmployeeListItem[] {
  return rethrowAsValidationException('api_contract', () =>
    validateCollection(payload, 'employees', validateEmployeeListItem)
  );
}

export function validateEmployeeDetailResponse(payload: unknown): EmployeeDetail {
  return rethrowAsValidationException('api_contract', () => {
    const entry = validateEmployeeListItem(payload, 'employeeDetail') as EmployeeDetail & JsonRecord;
    const detail = validateObject(payload, 'employeeDetail');

    return {
      ...entry,
      firstName: validateString(detail.firstName, 'employeeDetail.firstName').trim(),
      lastName: validateString(detail.lastName, 'employeeDetail.lastName').trim(),
      addresses: validateAddressList(detail.addresses, 'employeeDetail.addresses'),
      permissions: validateEmployeeDetailPermissions(detail.permissions, 'employeeDetail.permissions'),
      positionOptions: validateEmployeePositionOptions(detail.positionOptions),
    };
  });
}

export function validateChecklistItemsResponse(payload: unknown): ChecklistItemListItem[] {
  return rethrowAsValidationException('api_contract', () =>
    validateCollection(payload, 'checklistItems', validateChecklistItemListItem)
  );
}

export function validateChecklistItemDetailResponse(payload: unknown): ChecklistItemDetail {
  return rethrowAsValidationException('api_contract', () => {
    const entry = validateChecklistItemListItem(payload, 'checklistItemDetail') as ChecklistItemDetail & JsonRecord;
    const detail = validateObject(payload, 'checklistItemDetail');

    return {
      ...entry,
      permissions: validateChecklistItemDetailPermissions(detail.permissions, 'checklistItemDetail.permissions'),
    };
  });
}

export function validateOrdersResponse(payload: unknown): OrderListItem[] {
  return rethrowAsValidationException('api_contract', () =>
    validateCollection(payload, 'orders', validateOrderListItem)
  );
}

export function validateOrderDetailResponse(payload: unknown): OrderDetail {
  return rethrowAsValidationException('api_contract', () => {
    const entry = validateOrderListItem(payload, 'orderDetail') as OrderDetail & JsonRecord;
    const detail = validateObject(payload, 'orderDetail');

    return {
      ...entry,
      checklists: validateChecklistExecutions(detail.checklists),
    };
  });
}
