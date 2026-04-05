import ManagementServiceException from '@/exceptions/ManagementServiceException';
import { BaseManagementResourceService } from '@/services/management';
import type {
  EmployeeAddressPayload,
  EmployeeDetail,
  EmployeeListItem,
  EmployeePositionOption,
  EmployeeUpdatePayload,
} from '@/services/employee/types';
import {
  validateEmployeeAddressPayload,
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
