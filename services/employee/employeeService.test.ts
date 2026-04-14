import { getTokenStorange } from '@/storange/authStorange';
import { employeeService } from './employeeService';
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

describe('employeeService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetTokenStorange.mockResolvedValue({
      access: 'access-token',
      refresh: 'refresh-token',
    });
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

    await expect(employeeService.fetchEmployees()).resolves.toHaveLength(1);

    expect(mockHttpRequest).toHaveBeenCalledWith({
      method: 'GET',
      endpoint: '/mobile/employees_api/',
      BASE_URL: 'https://ringless-equivalently-alijah.ngrok-free.dev/gerenciador',
      timeoutMs: 20000,
      headers: AUTH_HEADERS,
      body: undefined,
    });
  });

  it('fetches employee detail', async () => {
    mockHttpRequest.mockResolvedValue({
      id: '11111111-1111-4111-8111-111111111111',
      username: 'deiner',
      fullName: 'Deiner Silva',
      firstName: 'Deiner',
      lastName: 'Silva',
      email: 'deiner@example.com',
      cpf: '123.456.789-00',
      phone: '(11) 98765-4321',
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
      permissions: {
        canEditEmployee: true,
        canManageAddresses: true,
        canToggleStatus: true,
      },
      positionOptions: [
        {
          value: '1',
          label: 'Gerente',
        },
      ],
    } as never);

    await expect(employeeService.fetchEmployeeDetail('11111111-1111-4111-8111-111111111111')).resolves.toEqual(
      expect.objectContaining({
        fullName: 'Deiner Silva',
      })
    );
  });

  it('updates employee and validates payload before request', async () => {
    mockHttpRequest.mockResolvedValue({
      id: '11111111-1111-4111-8111-111111111111',
      username: 'deiner',
      fullName: 'Deiner Silva',
      firstName: 'Deiner',
      lastName: 'Silva',
      email: 'deiner@example.com',
      cpf: '123.456.789-00',
      phone: '(11) 98765-4321',
      position: '1',
      positionLabel: 'Gerente',
      isActive: true,
      addressCount: 1,
      insertDate: '2026-03-31T12:00:00.000Z',
      addresses: [],
      permissions: {
        canEditEmployee: true,
        canManageAddresses: true,
        canToggleStatus: true,
      },
      positionOptions: [
        {
          value: '1',
          label: 'Gerente',
        },
      ],
    } as never);

    await expect(employeeService.updateEmployee(
      '11111111-1111-4111-8111-111111111111',
      {
        first_name: 'Deiner',
        last_name: 'Silva',
        cpf: '123.456.789-00',
        phone: '(11) 98765-4321',
        email: 'deiner@example.com',
        position: '1',
        username: 'deiner',
        password: '',
      },
      [{ value: '1', label: 'Gerente' }]
    )).resolves.toEqual(expect.objectContaining({ username: 'deiner' }));

    expect(mockHttpRequest).toHaveBeenCalledWith({
      method: 'PATCH',
      endpoint: '/mobile/employees_api/11111111-1111-4111-8111-111111111111/detail/',
      BASE_URL: 'https://ringless-equivalently-alijah.ngrok-free.dev/gerenciador',
      timeoutMs: 20000,
      headers: AUTH_HEADERS,
      body: {
        first_name: 'Deiner',
        last_name: 'Silva',
        cpf: '123.456.789-00',
        phone: '(11) 98765-4321',
        email: 'deiner@example.com',
        position: '1',
        username: 'deiner',
        password: '',
      },
    });
  });

  it('creates employee address', async () => {
    mockHttpRequest.mockResolvedValue({
      id: '11111111-1111-4111-8111-111111111111',
      username: 'deiner',
      fullName: 'Deiner Silva',
      firstName: 'Deiner',
      lastName: 'Silva',
      email: 'deiner@example.com',
      cpf: '123.456.789-00',
      phone: '(11) 98765-4321',
      position: '1',
      positionLabel: 'Gerente',
      isActive: true,
      addressCount: 2,
      insertDate: '2026-03-31T12:00:00.000Z',
      addresses: [],
      permissions: {
        canEditEmployee: true,
        canManageAddresses: true,
        canToggleStatus: true,
      },
      positionOptions: [
        {
          value: '1',
          label: 'Gerente',
        },
      ],
    } as never);

    await expect(employeeService.createEmployeeAddress('11111111-1111-4111-8111-111111111111', {
      street: 'Rua A',
      number: '10',
      complement: '',
      city: 'Sao Paulo',
      state: 'Sao Paulo',
      zip_code: '12345-678',
    })).resolves.toEqual(expect.objectContaining({ addressCount: 2 }));
  });

  it('deletes employee address and returns updated detail', async () => {
    mockHttpRequest.mockResolvedValue({
      id: '11111111-1111-4111-8111-111111111111',
      username: 'deiner',
      fullName: 'Deiner Silva',
      firstName: 'Deiner',
      lastName: 'Silva',
      email: 'deiner@example.com',
      cpf: '123.456.789-00',
      phone: '(11) 98765-4321',
      position: '1',
      positionLabel: 'Gerente',
      isActive: true,
      addressCount: 0,
      insertDate: '2026-03-31T12:00:00.000Z',
      addresses: [],
      permissions: {
        canEditEmployee: true,
        canManageAddresses: true,
        canToggleStatus: true,
      },
      positionOptions: [
        {
          value: '1',
          label: 'Gerente',
        },
      ],
    } as never);

    await expect(
      employeeService.deleteEmployeeAddress(
        '11111111-1111-4111-8111-111111111111',
        '22222222-2222-4222-8222-222222222222'
      )
    ).resolves.toEqual(expect.objectContaining({ addressCount: 0 }));

    expect(mockHttpRequest).toHaveBeenCalledWith({
      method: 'DELETE',
      endpoint: '/mobile/employees_api/11111111-1111-4111-8111-111111111111/addresses/22222222-2222-4222-8222-222222222222/',
      BASE_URL: 'https://ringless-equivalently-alijah.ngrok-free.dev/gerenciador',
      timeoutMs: 20000,
      headers: AUTH_HEADERS,
      body: undefined,
    });
  });

  it('toggles employee status and returns backend ok flag', async () => {
    mockHttpRequest.mockResolvedValue({ ok: true, isActive: false } as never);

    await expect(employeeService.toggleEmployeeStatus('11111111-1111-4111-8111-111111111111')).resolves.toBe(true);

    expect(mockHttpRequest).toHaveBeenCalledWith({
      method: 'POST',
      endpoint: '/mobile/employees_api/11111111-1111-4111-8111-111111111111/toggle-status/',
      BASE_URL: 'https://ringless-equivalently-alijah.ngrok-free.dev/gerenciador',
      timeoutMs: 20000,
      headers: AUTH_HEADERS,
      body: undefined,
    });
  });

  it('fails when backend payload does not match expected structure', async () => {
    mockHttpRequest.mockResolvedValue({ invalid: true } as never);

    await expect(employeeService.fetchEmployees()).rejects.toThrow('employees deve ser uma lista.');
  });
});
