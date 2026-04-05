import { exceptionHandling } from '@/exceptions/ExceptionHandler';
import ManagementServiceException from '@/exceptions/ManagementServiceException';
import { APP_API_BASE_URL, MANAGEMENT_REQUEST_TIMEOUT_MS } from '@/services/core/apiConfig';
import { httpRequest } from '@/services/core/networkService';
import { getManagementAuthorizationHeaders } from '@/services/management/managementApiHelpers';
import type { DashboardPayload } from '@/services/management';
import { validateDashboardResponse } from '@/utils/validation';

export async function fetchDashboard(): Promise<DashboardPayload> {
  return exceptionHandling(async () => {
    const headers = await getManagementAuthorizationHeaders();

    const response = await httpRequest<DashboardPayload>({
      method: 'GET',
      endpoint: '/mobile/dashboard_api/',
      BASE_URL: APP_API_BASE_URL,
      timeoutMs: MANAGEMENT_REQUEST_TIMEOUT_MS,
      headers,
    });

    return validateDashboardResponse(response);
  }, { ExceptionType: ManagementServiceException });
}
