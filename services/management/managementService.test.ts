import {
  fetchDashboard,
} from './managementService';
import { getTokenStorange } from '@/storange/authStorange';
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
      session: {
        validatedAt: '2026-04-07T12:00:00Z',
        offlineSessionExpiresAt: '2026-04-14T12:00:00Z',
        permissionVersion: 'mobile-management-v1',
        scope: ['mobile:management'],
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

  it('fails before request when access token is missing', async () => {
    mockGetTokenStorange.mockResolvedValue(null);

    await expect(fetchDashboard()).rejects.toThrow('AUTH_TOKEN_MISSING');
    expect(mockHttpRequest).not.toHaveBeenCalled();
  });
});
