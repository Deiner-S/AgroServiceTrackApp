import { getTokenStorange } from '@/storange/authStorange';
import {
  fetchChecklistItemDetail,
  fetchChecklistItems,
  fetchClientDetail,
  fetchClients,
  fetchDashboard,
  fetchEmployeeDetail,
  fetchEmployees,
  toggleChecklistItemStatus,
  toggleEmployeeStatus,
} from './managementService';
import { httpRequest } from './networkService';

jest.mock('@/storange/authStorange', () => ({
  getTokenStorange: jest.fn(),
}));

jest.mock('./networkService', () => ({
  httpRequest: jest.fn(),
}));

const mockGetTokenStorange = getTokenStorange as jest.MockedFunction<typeof getTokenStorange>;
const mockHttpRequest = httpRequest as jest.MockedFunction<typeof httpRequest>;

const AUTH_HEADERS = {
  Authorization: 'Bearer access-token',
};

describe('managementService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetTokenStorange.mockResolvedValue({
      access: 'access-token',
      refresh: 'refresh-token',
    });
  });

  it('fetches dashboard with authorization header and validates payload', async () => {
    mockHttpRequest.mockResolvedValue({
      user: {
        username: 'deiner',
        fullName: 'Deiner Silva',
        position: 'Gerente',
      },
      summary: {
        pendingOrders: 1,
        inProgressOrders: 2,
        deliveryOrders: 3,
        completedOrders: 4,
        clients: 5,
        employees: 6,
        checklistItems: 7,
      },
      modules: [
        {
          id: 'orders',
          title: 'Ordens',
          description: 'Fluxo operacional',
          icon: 'assignment',
          route: 'ordersScreen',
          count: 3,
          enabled: true,
        },
      ],
      access: {
        is_director: false,
        is_manager: true,
        is_administrative: false,
        is_technician: false,
        can_view_employee_module: true,
        can_create_employee: true,
        can_view_client_list: true,
        can_view_client_detail: true,
        can_manage_client: true,
        can_create_service_order: true,
        can_view_checklist_item_module: true,
        can_manage_checklist_item: true,
        can_view_service_panel: true,
      },
    } as never);

    await expect(fetchDashboard()).resolves.toEqual(
      expect.objectContaining({
        user: expect.objectContaining({ username: 'deiner' }),
        summary: expect.objectContaining({ clients: 5 }),
      })
    );

    expect(mockHttpRequest).toHaveBeenCalledWith({
      method: 'GET',
      endpoint: '/mobile/dashboard_api/',
      BASE_URL: 'https://ringless-equivalently-alijah.ngrok-free.dev/gerenciador',
      timeoutMs: 20000,
      headers: AUTH_HEADERS,
    });
  });

  it('fetches clients with encoded search query', async () => {
    mockHttpRequest.mockResolvedValue([
      {
        id: '11111111-1111-4111-8111-111111111111',
        name: 'Cliente 1',
        email: 'cliente@example.com',
        phone: '9999',
        cpf: '123',
        cnpj: null,
        addressCount: 2,
        insertDate: '2026-03-31T12:00:00.000Z',
      },
    ] as never);

    await expect(fetchClients(' cliente sao ')).resolves.toHaveLength(1);

    expect(mockHttpRequest).toHaveBeenCalledWith({
      method: 'GET',
      endpoint: '/mobile/clients_api/?search=cliente%20sao',
      BASE_URL: 'https://ringless-equivalently-alijah.ngrok-free.dev/gerenciador',
      timeoutMs: 20000,
      headers: AUTH_HEADERS,
    });
  });

  it('fetches client detail', async () => {
    mockHttpRequest.mockResolvedValue({
      id: '11111111-1111-4111-8111-111111111111',
      name: 'Cliente 1',
      email: 'cliente@example.com',
      phone: '9999',
      cpf: '123',
      cnpj: null,
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
    } as never);

    await expect(fetchClientDetail('11111111-1111-4111-8111-111111111111')).resolves.toEqual(
      expect.objectContaining({
        addresses: expect.any(Array),
        recentOrders: expect.any(Array),
      })
    );
  });

  it('fetches employees and validates boolean status', async () => {
    mockHttpRequest.mockResolvedValue([
      {
        id: '11111111-1111-4111-8111-111111111111',
        username: 'deiner',
        fullName: 'Deiner Silva',
        email: 'deiner@example.com',
        cpf: '123',
        phone: '9999',
        position: '1',
        positionLabel: 'Gerente',
        isActive: true,
        addressCount: 1,
        insertDate: '2026-03-31T12:00:00.000Z',
      },
    ] as never);

    await expect(fetchEmployees()).resolves.toHaveLength(1);

    expect(mockHttpRequest).toHaveBeenCalledWith({
      method: 'GET',
      endpoint: '/mobile/employees_api/',
      BASE_URL: 'https://ringless-equivalently-alijah.ngrok-free.dev/gerenciador',
      timeoutMs: 20000,
      headers: AUTH_HEADERS,
    });
  });

  it('fetches employee detail', async () => {
    mockHttpRequest.mockResolvedValue({
      id: '11111111-1111-4111-8111-111111111111',
      username: 'deiner',
      fullName: 'Deiner Silva',
      email: 'deiner@example.com',
      cpf: '123',
      phone: '9999',
      position: '1',
      positionLabel: 'Gerente',
      isActive: true,
      addressCount: 1,
      insertDate: '2026-03-31T12:00:00.000Z',
      addresses: [
        {
          id: '22222222-2222-4222-8222-222222222222',
          label: 'Rua A, 10 - Cidade/UF',
        },
      ],
    } as never);

    await expect(fetchEmployeeDetail('11111111-1111-4111-8111-111111111111')).resolves.toEqual(
      expect.objectContaining({
        fullName: 'Deiner Silva',
      })
    );
  });

  it('toggles employee status and returns backend ok flag', async () => {
    mockHttpRequest.mockResolvedValue({ ok: true } as never);

    await expect(toggleEmployeeStatus('11111111-1111-4111-8111-111111111111')).resolves.toBe(true);

    expect(mockHttpRequest).toHaveBeenCalledWith({
      method: 'POST',
      endpoint: '/mobile/employees_api/11111111-1111-4111-8111-111111111111/toggle-status/',
      BASE_URL: 'https://ringless-equivalently-alijah.ngrok-free.dev/gerenciador',
      timeoutMs: 20000,
      headers: AUTH_HEADERS,
    });
  });

  it('fetches checklist items with encoded search query', async () => {
    mockHttpRequest.mockResolvedValue([
      {
        id: '11111111-1111-4111-8111-111111111111',
        name: 'Freio',
        status: 1,
        statusLabel: 'Ativo',
        usageCount: 8,
        insertDate: '2026-03-31T12:00:00.000Z',
      },
    ] as never);

    await expect(fetchChecklistItems('freio dianteiro')).resolves.toHaveLength(1);

    expect(mockHttpRequest).toHaveBeenCalledWith({
      method: 'GET',
      endpoint: '/mobile/checklist_items_api/?search=freio%20dianteiro',
      BASE_URL: 'https://ringless-equivalently-alijah.ngrok-free.dev/gerenciador',
      timeoutMs: 20000,
      headers: AUTH_HEADERS,
    });
  });

  it('fetches checklist item detail', async () => {
    mockHttpRequest.mockResolvedValue({
      id: '11111111-1111-4111-8111-111111111111',
      name: 'Freio',
      status: 1,
      statusLabel: 'Ativo',
      usageCount: 8,
      insertDate: '2026-03-31T12:00:00.000Z',
    } as never);

    await expect(fetchChecklistItemDetail('11111111-1111-4111-8111-111111111111')).resolves.toEqual(
      expect.objectContaining({
        name: 'Freio',
      })
    );
  });

  it('toggles checklist item status and returns backend ok flag', async () => {
    mockHttpRequest.mockResolvedValue({ ok: true } as never);

    await expect(toggleChecklistItemStatus('11111111-1111-4111-8111-111111111111')).resolves.toBe(true);

    expect(mockHttpRequest).toHaveBeenCalledWith({
      method: 'POST',
      endpoint: '/mobile/checklist_items_api/11111111-1111-4111-8111-111111111111/toggle-status/',
      BASE_URL: 'https://ringless-equivalently-alijah.ngrok-free.dev/gerenciador',
      timeoutMs: 20000,
      headers: AUTH_HEADERS,
    });
  });

  it('fails before request when access token is missing', async () => {
    mockGetTokenStorange.mockResolvedValue(null);

    await expect(fetchClients()).rejects.toThrow('AUTH_TOKEN_MISSING');
    expect(mockHttpRequest).not.toHaveBeenCalled();
  });

  it('fails when backend payload does not match expected structure', async () => {
    mockHttpRequest.mockResolvedValue({ invalid: true } as never);

    await expect(fetchEmployees()).rejects.toThrow('employees deve ser uma lista.');
  });
});
