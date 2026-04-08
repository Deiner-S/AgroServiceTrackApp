import ManagementServiceException from '@/exceptions/ManagementServiceException';
import { BaseManagementResourceService } from '@/services/management';
import type {
  EmployeeAddressPayload,
  EmployeeCreateOptions,
  EmployeeCreatePayload,
  EmployeeDetail,
  EmployeeListItem,
  EmployeePositionOption,
  EmployeeUpdatePayload,
} from '@/services/employee/types';
import {
  validateEmployeeAddressPayload,
  validateEmployeeCreateOptionsResponse,
  validateEmployeeCreatePayload,
  validateEmployeeDetailResponse,
  validateEmployeeUpdatePayload,
  validateEmployeesResponse,
  validateOkResponse,
} from '@/utils/validation';

class EmployeeService extends BaseManagementResourceService<ManagementServiceException> {
  protected readonly resourceEndpoint = '/mobile/employees_api/';
  protected readonly ExceptionType = ManagementServiceException;

  protected validateOkResponse(payload: unknown): { ok: boolean } {
    return validateOkResponse(payload);
  }

  fetchEmployees(searchQuery = ''): Promise<EmployeeListItem[]> {
    return this.fetchList(searchQuery, validateEmployeesResponse);
  }

  fetchEmployeeDetail(employeeId: string): Promise<EmployeeDetail> {
    return this.fetchDetail(employeeId, validateEmployeeDetailResponse);
  }

  fetchEmployeeCreateOptions(): Promise<EmployeeCreateOptions> {
    return this.request<unknown>('GET', `${this.resourceEndpoint}create/`).then(validateEmployeeCreateOptionsResponse);
  }

  createEmployee(
    payload: EmployeeCreatePayload,
    positionOptions: EmployeePositionOption[]
  ): Promise<EmployeeDetail> {
    const body = validateEmployeeCreatePayload(payload, positionOptions);
    return this.submit('POST', this.resourceEndpoint, body, validateEmployeeDetailResponse);
  }

  updateEmployee(
    employeeId: string,
    payload: EmployeeUpdatePayload,
    positionOptions: EmployeePositionOption[]
  ): Promise<EmployeeDetail> {
    const body = validateEmployeeUpdatePayload(payload, positionOptions);
    return this.submit('PATCH', `${this.resourceEndpoint}${employeeId}/detail/`, body, validateEmployeeDetailResponse);
  }

  createEmployeeAddress(employeeId: string, payload: EmployeeAddressPayload): Promise<EmployeeDetail> {
    const body = validateEmployeeAddressPayload(payload);
    return this.submit('POST', `${this.resourceEndpoint}${employeeId}/addresses/`, body, validateEmployeeDetailResponse);
  }

  deleteEmployeeAddress(employeeId: string, addressId: string): Promise<EmployeeDetail> {
    return this.submit(
      'DELETE',
      `${this.resourceEndpoint}${employeeId}/addresses/${addressId}/`,
      undefined,
      validateEmployeeDetailResponse
    );
  }

  toggleEmployeeStatus(employeeId: string): Promise<boolean> {
    return this.toggleStatus(employeeId);
  }
}

export const employeeService = new EmployeeService();
