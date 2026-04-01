import {
  validateChecklistItemsResponse,
  validateClientsResponse,
  validateDashboardResponse,
  validateEmployeeDetailResponse,
} from '@/utils/validation';

describe('managementValidation', () => {
  it('validates dashboard payload', () => {
    const payload = validateDashboardResponse({
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
    });

    expect(payload.modules[0].route).toBe('ordersScreen');
    expect(payload.summary.clients).toBe(5);
  });

  it('validates client list payload', () => {
    const payload = validateClientsResponse([
      {
        id: '11111111-1111-4111-8111-111111111111',
        name: 'Cliente 1',
        email: 'cliente@example.com',
        phone: '999999999',
        cpf: '123',
        cnpj: null,
        addressCount: 2,
        insertDate: '2026-03-31T12:00:00',
      },
    ]);

    expect(payload[0].name).toBe('Cliente 1');
  });

  it('validates employee detail payload', () => {
    const payload = validateEmployeeDetailResponse({
      id: '11111111-1111-4111-8111-111111111111',
      username: 'deiner',
      fullName: 'Deiner Silva',
      email: 'deiner@example.com',
      cpf: '123',
      phone: '999',
      position: '1',
      positionLabel: 'Gerente',
      isActive: true,
      addressCount: 1,
      insertDate: '2026-03-31T12:00:00',
      addresses: [
        {
          id: '22222222-2222-4222-8222-222222222222',
          label: 'Rua A, 10 - Cidade/UF',
        },
      ],
    });

    expect(payload.addresses).toHaveLength(1);
  });

  it('rejects invalid checklist items payload', () => {
    expect(() => validateChecklistItemsResponse({})).toThrow('checklistItems deve ser uma lista.');
  });
});
