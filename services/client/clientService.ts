import ClientServiceException from '@/exceptions/ClientServiceException';
import { BaseManagementResourceService } from '@/services/management';
import type {
  ClientAddressPayload,
  ClientCreatePayload,
  ClientDetail,
  ClientListItem,
  ClientServiceOrderPayload,
  ClientUpdatePayload,
} from '@/services/client/types';
import {
  validateClientAddressPayload,
  validateClientCreatePayload,
  validateClientDetailResponse,
  validateClientServiceOrderPayload,
  validateClientUpdatePayload,
  validateClientsResponse,
  validateOkResponse,
} from '@/utils/validation';

class ClientService extends BaseManagementResourceService<ClientServiceException> {
  protected readonly resourceEndpoint = '/mobile/clients_api/';
  protected readonly ExceptionType = ClientServiceException;

  protected validateOkResponse(payload: unknown): { ok: boolean } {
    return validateOkResponse(payload);
  }

  fetchClients(searchQuery = ''): Promise<ClientListItem[]> {
    return this.fetchList(searchQuery, validateClientsResponse);
  }

  fetchClientDetail(clientId: string): Promise<ClientDetail> {
    return this.fetchDetail(clientId, validateClientDetailResponse);
  }

  createClient(payload: ClientCreatePayload): Promise<ClientDetail> {
    const body = validateClientCreatePayload(payload);
    return this.submit('POST', this.resourceEndpoint, body, validateClientDetailResponse);
  }

  updateClient(clientId: string, payload: ClientUpdatePayload): Promise<ClientDetail> {
    const body = validateClientUpdatePayload(payload);
    return this.submit('PATCH', `${this.resourceEndpoint}${clientId}/detail/`, body, validateClientDetailResponse);
  }

  createClientAddress(clientId: string, payload: ClientAddressPayload): Promise<ClientDetail> {
    const body = validateClientAddressPayload(payload);
    return this.submit('POST', `${this.resourceEndpoint}${clientId}/addresses/`, body, validateClientDetailResponse);
  }

  createClientServiceOrder(clientId: string, payload: ClientServiceOrderPayload): Promise<ClientDetail> {
    const body = validateClientServiceOrderPayload(payload);
    return this.submit('POST', `${this.resourceEndpoint}${clientId}/services/`, body, validateClientDetailResponse);
  }
}

export const clientService = new ClientService();
