import { MANAGEMENT_REQUEST_TIMEOUT_MS, APP_API_BASE_URL } from '@/services/apiConfig';
import { httpRequest } from '@/services/networkService';
import { getTokenStorange } from '@/storange/authStorange';
import type {
  ChecklistItemDetail,
  ChecklistItemListItem,
  ClientDetail,
  ClientListItem,
  DashboardPayload,
  EmployeeDetail,
  EmployeeListItem,
} from '@/types/management';
import {
  validateChecklistItemDetailResponse,
  validateChecklistItemsResponse,
  validateClientDetailResponse,
  validateClientsResponse,
  validateDashboardResponse,
  validateEmployeeDetailResponse,
  validateEmployeesResponse,
  validateOkResponse,
} from '@/utils/validation';

async function getAuthorizationHeaders() {
  const tokens = await getTokenStorange();

  if (!tokens?.access) {
    throw new Error('AUTH_TOKEN_MISSING');
  }

  return {
    Authorization: `Bearer ${tokens.access}`,
  };
}

function buildQuery(searchQuery?: string): string {
  const normalizedQuery = searchQuery?.trim();

  if (!normalizedQuery) {
    return '';
  }

  return `?search=${encodeURIComponent(normalizedQuery)}`;
}

export async function fetchDashboard(): Promise<DashboardPayload> {
  const headers = await getAuthorizationHeaders();

  const response = await httpRequest<DashboardPayload>({
    method: 'GET',
    endpoint: '/mobile/dashboard_api/',
    BASE_URL: APP_API_BASE_URL,
    timeoutMs: MANAGEMENT_REQUEST_TIMEOUT_MS,
    headers,
  });

  return validateDashboardResponse(response);
}

export async function fetchClients(searchQuery = ''): Promise<ClientListItem[]> {
  const headers = await getAuthorizationHeaders();

  const response = await httpRequest<ClientListItem[]>({
    method: 'GET',
    endpoint: `/mobile/clients_api/${buildQuery(searchQuery)}`,
    BASE_URL: APP_API_BASE_URL,
    timeoutMs: MANAGEMENT_REQUEST_TIMEOUT_MS,
    headers,
  });

  return validateClientsResponse(response);
}

export async function fetchClientDetail(clientId: string): Promise<ClientDetail> {
  const headers = await getAuthorizationHeaders();

  const response = await httpRequest<ClientDetail>({
    method: 'GET',
    endpoint: `/mobile/clients_api/${clientId}/detail/`,
    BASE_URL: APP_API_BASE_URL,
    timeoutMs: MANAGEMENT_REQUEST_TIMEOUT_MS,
    headers,
  });

  return validateClientDetailResponse(response);
}

export async function fetchEmployees(searchQuery = ''): Promise<EmployeeListItem[]> {
  const headers = await getAuthorizationHeaders();

  const response = await httpRequest<EmployeeListItem[]>({
    method: 'GET',
    endpoint: `/mobile/employees_api/${buildQuery(searchQuery)}`,
    BASE_URL: APP_API_BASE_URL,
    timeoutMs: MANAGEMENT_REQUEST_TIMEOUT_MS,
    headers,
  });

  return validateEmployeesResponse(response);
}

export async function fetchEmployeeDetail(employeeId: string): Promise<EmployeeDetail> {
  const headers = await getAuthorizationHeaders();

  const response = await httpRequest<EmployeeDetail>({
    method: 'GET',
    endpoint: `/mobile/employees_api/${employeeId}/detail/`,
    BASE_URL: APP_API_BASE_URL,
    timeoutMs: MANAGEMENT_REQUEST_TIMEOUT_MS,
    headers,
  });

  return validateEmployeeDetailResponse(response);
}

export async function toggleEmployeeStatus(employeeId: string): Promise<boolean> {
  const headers = await getAuthorizationHeaders();

  const response = await httpRequest<{ ok: boolean }>({
    method: 'POST',
    endpoint: `/mobile/employees_api/${employeeId}/toggle-status/`,
    BASE_URL: APP_API_BASE_URL,
    timeoutMs: MANAGEMENT_REQUEST_TIMEOUT_MS,
    headers,
  });

  return validateOkResponse(response).ok;
}

export async function fetchChecklistItems(searchQuery = ''): Promise<ChecklistItemListItem[]> {
  const headers = await getAuthorizationHeaders();

  const response = await httpRequest<ChecklistItemListItem[]>({
    method: 'GET',
    endpoint: `/mobile/checklist_items_api/${buildQuery(searchQuery)}`,
    BASE_URL: APP_API_BASE_URL,
    timeoutMs: MANAGEMENT_REQUEST_TIMEOUT_MS,
    headers,
  });

  return validateChecklistItemsResponse(response);
}

export async function fetchChecklistItemDetail(itemId: string): Promise<ChecklistItemDetail> {
  const headers = await getAuthorizationHeaders();

  const response = await httpRequest<ChecklistItemDetail>({
    method: 'GET',
    endpoint: `/mobile/checklist_items_api/${itemId}/detail/`,
    BASE_URL: APP_API_BASE_URL,
    timeoutMs: MANAGEMENT_REQUEST_TIMEOUT_MS,
    headers,
  });

  return validateChecklistItemDetailResponse(response);
}

export async function toggleChecklistItemStatus(itemId: string): Promise<boolean> {
  const headers = await getAuthorizationHeaders();

  const response = await httpRequest<{ ok: boolean }>({
    method: 'POST',
    endpoint: `/mobile/checklist_items_api/${itemId}/toggle-status/`,
    BASE_URL: APP_API_BASE_URL,
    timeoutMs: MANAGEMENT_REQUEST_TIMEOUT_MS,
    headers,
  });

  return validateOkResponse(response).ok;
}
