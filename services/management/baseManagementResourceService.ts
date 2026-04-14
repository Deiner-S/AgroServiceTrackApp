import ExceptionHandler, { exceptionHandling } from '@/exceptions/ExceptionHandler';
import { APP_API_BASE_URL, MANAGEMENT_REQUEST_TIMEOUT_MS } from '@/services/apiConfig';
import { httpRequest } from '@/services/networkService';
import { buildManagementQuery, getManagementAuthorizationHeaders } from '@/services/management/managementApiHelpers';

type ExceptionConstructor<E extends ExceptionHandler> = new (message: string, cause?: unknown) => E;

export default abstract class BaseManagementResourceService<E extends ExceptionHandler> {
  protected abstract readonly resourceEndpoint: string;
  protected abstract readonly ExceptionType: ExceptionConstructor<E>;

  protected async request<T>(method: 'GET' | 'POST' | 'PATCH' | 'DELETE', endpoint: string, body?: unknown): Promise<T> {
    return exceptionHandling(async () => {
      const headers = await getManagementAuthorizationHeaders();

      return httpRequest<T>({
        method,
        endpoint,
        BASE_URL: APP_API_BASE_URL,
        timeoutMs: MANAGEMENT_REQUEST_TIMEOUT_MS,
        headers,
        body,
      });
    }, { ExceptionType: this.ExceptionType });
  }

  protected async fetchList<T>(searchQuery: string, validate: (payload: unknown) => T[]): Promise<T[]> {
    return exceptionHandling(async () => {
      const response = await this.request<unknown>(
        'GET',
        `${this.resourceEndpoint}${buildManagementQuery(searchQuery)}`
      );
      return validate(response);
    }, { ExceptionType: this.ExceptionType });
  }

  protected async fetchDetail<T>(identifier: string, validate: (payload: unknown) => T): Promise<T> {
    return exceptionHandling(async () => {
      const response = await this.request<unknown>('GET', `${this.resourceEndpoint}${identifier}/detail/`);
      return validate(response);
    }, { ExceptionType: this.ExceptionType });
  }

  protected async submit<T>(
    method: 'POST' | 'PATCH',
    endpoint: string,
    body: unknown,
    validate: (payload: unknown) => T
  ): Promise<T> {
    return exceptionHandling(async () => {
      const response = await this.request<unknown>(method, endpoint, body);
      return validate(response);
    }, { ExceptionType: this.ExceptionType });
  }

  protected async toggleStatus(identifier: string): Promise<boolean> {
    return exceptionHandling(async () => {
      const response = await this.request<unknown>(
        'POST',
        `${this.resourceEndpoint}${identifier}/toggle-status/`
      );

      return this.validateOkResponse(response).ok;
    }, { ExceptionType: this.ExceptionType });
  }

  protected async deleteResource(endpoint: string): Promise<boolean> {
    return exceptionHandling(async () => {
      const response = await this.request<unknown>('DELETE', endpoint);
      return this.validateOkResponse(response).ok;
    }, { ExceptionType: this.ExceptionType });
  }

  protected abstract validateOkResponse(payload: unknown): { ok: boolean };
}
