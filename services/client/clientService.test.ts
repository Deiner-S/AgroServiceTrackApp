import { getTokenStorange } from '@/storange/authStorange';
import { clientService } from './clientService';
import { httpRequest } from '@/services/networkService';

jest.mock('@/storange/authStorange', () => ({
  getTokenStorange: jest.fn(),
}));

jest.mock('@/services/networkService', () => ({
  httpRequest: jest.fn(),
}));

const mockGetTokenStorange = getTokenStorange as jest.MockedFunction<typeof getTokenStorange>;
const mockHttpRequest = httpRequest as jest.MockedFunction<typeof httpRequest>;

const AUTH_HEADERS = {
  Authorization: 'Bearer access-token',
};

const clientDetailPayload = {
  id: '11111111-1111-4111-8111-111111111111',
  name: 'Cliente 1',
  email: 'cliente@example.com',
  phone: '(11) 98765-4321',
  cpf: null,
  cnpj: '12.345.678/0001-90',
  addressCount: 1,
  insertDate: '2026-03-31T12:00:00.000Z',
  addresses: [
    {
      id: '22222222-2222-4222-8222-222222222222',
      label: 'Rua A, 10 - Cidade/UF',
    },
  ],
  recentOrders: [
    {
      id: '33333333-3333-4333-8333-333333333333',
      operationCode: '000001',
      status: '1',
      statusLabel: 'Pendente',
      insertDate: '2026-03-31T13:00:00.000Z',
    },
  ],
  permissions: {
    canEditClient: true,
    canManageAddresses: true,
    canCreateServiceOrder: true,
    nextOperationCode: '000002',
  },
};

describe('clientService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetTokenStorange.mockResolvedValue({
      access: 'access-token',
      refresh: 'refresh-token',
    });
  });

  it('fetches clients from the dedicated client service', async () => {
    mockHttpRequest.mockResolvedValue([
      {
        id: '11111111-1111-4111-8111-111111111111',
        name: 'Cliente 1',
        email: 'cliente@example.com',
        phone: '(11) 98765-4321',
        cpf: null,
        cnpj: '12.345.678/0001-90',
        addressCount: 1,
        insertDate: '2026-03-31T12:00:00.000Z',
      },
    ] as never);

    await expect(clientService.fetchClients('cliente 1')).resolves.toHaveLength(1);

    expect(mockHttpRequest).toHaveBeenCalledWith({
      method: 'GET',
      endpoint: '/mobile/clients_api/?search=cliente%201',
      BASE_URL: 'https://ringless-equivalently-alijah.ngrok-free.dev/gerenciador',
      timeoutMs: 20000,
      headers: AUTH_HEADERS,
    });
  });

  it('fetches client detail including mobile permissions', async () => {
    mockHttpRequest.mockResolvedValue(clientDetailPayload as never);

    await expect(clientService.fetchClientDetail(clientDetailPayload.id)).resolves.toEqual(
      expect.objectContaining({
        permissions: expect.objectContaining({
          canManageAddresses: true,
        }),
      })
    );
  });

  it('creates a client with validated payload', async () => {
    mockHttpRequest.mockResolvedValue(clientDetailPayload as never);

    await expect(clientService.createClient({
      cnpj: '12.345.678/0001-90',
      name: 'Cliente Teste',
      email: 'cliente@empresa.com',
      phone: '(11) 98765-4321',
    })).resolves.toEqual(expect.objectContaining({ id: clientDetailPayload.id }));

    expect(mockHttpRequest).toHaveBeenCalledWith({
      method: 'POST',
      endpoint: '/mobile/clients_api/',
      BASE_URL: 'https://ringless-equivalently-alijah.ngrok-free.dev/gerenciador',
      timeoutMs: 20000,
      headers: AUTH_HEADERS,
      body: {
        cnpj: '12.345.678/0001-90',
        name: 'Cliente Teste',
        email: 'cliente@empresa.com',
        phone: '(11) 98765-4321',
      },
    });
  });

  it('updates a client with validated payload', async () => {
    mockHttpRequest.mockResolvedValue(clientDetailPayload as never);

    await expect(clientService.updateClient(clientDetailPayload.id, {
      name: 'Cliente Atualizado',
      email: 'cliente@empresa.com',
      phone: '(11) 3333-4444',
    })).resolves.toEqual(expect.objectContaining({ id: clientDetailPayload.id }));

    expect(mockHttpRequest).toHaveBeenCalledWith({
      method: 'PATCH',
      endpoint: `/mobile/clients_api/${clientDetailPayload.id}/detail/`,
      BASE_URL: 'https://ringless-equivalently-alijah.ngrok-free.dev/gerenciador',
      timeoutMs: 20000,
      headers: AUTH_HEADERS,
      body: {
        name: 'Cliente Atualizado',
        email: 'cliente@empresa.com',
        phone: '(11) 3333-4444',
      },
    });
  });

  it('creates a client address using the dedicated endpoint', async () => {
    mockHttpRequest.mockResolvedValue(clientDetailPayload as never);

    await expect(clientService.createClientAddress(clientDetailPayload.id, {
      street: 'Rua Projetada 12',
      number: '10',
      complement: 'Galpao 2',
      city: 'Sao Paulo',
      state: 'Sao Paulo',
      zip_code: '12345-678',
    })).resolves.toEqual(expect.objectContaining({ id: clientDetailPayload.id }));

    expect(mockHttpRequest).toHaveBeenCalledWith({
      method: 'POST',
      endpoint: `/mobile/clients_api/${clientDetailPayload.id}/addresses/`,
      BASE_URL: 'https://ringless-equivalently-alijah.ngrok-free.dev/gerenciador',
      timeoutMs: 20000,
      headers: AUTH_HEADERS,
      body: {
        street: 'Rua Projetada 12',
        number: '10',
        complement: 'Galpao 2',
        city: 'Sao Paulo',
        state: 'Sao Paulo',
        zip_code: '12345-678',
      },
    });
  });

  it('creates a client service order using the dedicated endpoint', async () => {
    mockHttpRequest.mockResolvedValue(clientDetailPayload as never);

    await expect(clientService.createClientServiceOrder(clientDetailPayload.id, {
      operation_code: '000002',
      symptoms: 'Motor com falha',
    })).resolves.toEqual(expect.objectContaining({ id: clientDetailPayload.id }));

    expect(mockHttpRequest).toHaveBeenCalledWith({
      method: 'POST',
      endpoint: `/mobile/clients_api/${clientDetailPayload.id}/services/`,
      BASE_URL: 'https://ringless-equivalently-alijah.ngrok-free.dev/gerenciador',
      timeoutMs: 20000,
      headers: AUTH_HEADERS,
      body: {
        operation_code: '000002',
        symptoms: 'Motor com falha',
      },
    });
  });
});
