import CheckList from '@/models/CheckList';
import CheckListItem from '@/models/CheckListItem';
import WorkOrder from '@/models/WorkOrder';
import CheckListItemRepository from '@/repository/CheckListItemRepository';
import CheckListRepository from '@/repository/CheckListRepository';
import ErrorLogRepository from '@/repository/ErrorLogRepository';
import WorkOrderRepository from '@/repository/WorkOrderRepository';
import { hasWebAccess, httpRequest } from '@/services/networkService';
import { getTokenStorange } from '@/storange/authStorange';
import Synchronizer from './synchronizerService';

jest.mock('@/services/networkService', () => ({
  hasWebAccess: jest.fn(),
  httpRequest: jest.fn(),
}));

jest.mock('@/storange/authStorange', () => ({
  getTokenStorange: jest.fn(),
}));

jest.mock('@/repository/WorkOrderRepository', () => ({
  __esModule: true,
  default: {
    build: jest.fn(),
  },
}));

jest.mock('@/repository/CheckListRepository', () => ({
  __esModule: true,
  default: {
    build: jest.fn(),
  },
}));

jest.mock('@/repository/CheckListItemRepository', () => ({
  __esModule: true,
  default: {
    build: jest.fn(),
  },
}));

jest.mock('@/repository/ErrorLogRepository', () => ({
  __esModule: true,
  default: {
    build: jest.fn(),
  },
}));

const mockHasWebAccess = hasWebAccess as jest.MockedFunction<typeof hasWebAccess>;
const mockHttpRequest = httpRequest as jest.MockedFunction<typeof httpRequest>;
const mockGetTokenStorange = getTokenStorange as jest.MockedFunction<typeof getTokenStorange>;
const mockWorkOrderBuild = WorkOrderRepository.build as jest.Mock;
const mockCheckListBuild = CheckListRepository.build as jest.Mock;
const mockCheckListItemBuild = CheckListItemRepository.build as jest.Mock;
const mockErrorLogBuild = ErrorLogRepository.build as jest.Mock;

describe('synchronizerService', () => {
  const makeWorkOrder = (statusSync = 0) =>
    new WorkOrder(
      'OP-1',
      'Client',
      'Symptoms',
      '1HGCM82633A123456',
      123,
      'TRATOR2026',
      '2026-03-31T12:00:00.000Z',
      '2026-03-31T13:00:00.000Z',
      '4',
      statusSync,
      'Troca filtro'
    );

  const makeCheckListItem = () => new CheckListItem('550e8400-e29b-41d4-a716-446655440100', 'Item', 0);
  const makeCheckList = (statusSync = 0) =>
    new CheckList(
      '550e8400-e29b-41d4-a716-446655440000',
      '550e8400-e29b-41d4-a716-446655440100',
      'OP-1',
      '1',
      statusSync
    );
  const makeErrorLog = (statusSync = 0) => ({
    id: '550e8400-e29b-41d4-a716-446655449999',
    osVersion: '35',
    deviceModel: 'Pixel 9',
    user: 'deiner',
    erro: 'request failed',
    stacktrace: 'stack',
    horario: '2026-03-31T12:00:00.000Z',
    status_sync: statusSync,
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('build returns a synchronizer instance', async () => {
    const instance = await Synchronizer.build();

    expect(instance).toBeInstanceOf(Synchronizer);
  });

  it('run throws when web access is unavailable', async () => {
    mockHasWebAccess.mockResolvedValue(false);
    const instance = await Synchronizer.build();

    await expect(instance.run()).rejects.toThrow('MISSING_WEB_ACCESS');
  });

  it('run throws when access token is missing', async () => {
    mockHasWebAccess.mockResolvedValue(true);
    mockGetTokenStorange.mockResolvedValue(null);
    const instance = await Synchronizer.build();

    await expect(instance.run()).rejects.toThrow('AUTH_TOKEN_MISSING');
  });

  it('run executes the synchronization pipeline', async () => {
    const workOrderRepo = {
      getById: jest.fn().mockResolvedValue(null),
      save: jest.fn(),
      getAll: jest.fn().mockResolvedValue([makeWorkOrder(0)]),
      update: jest.fn(),
    };
    const checkListItemRepo = {
      deleteAll: jest.fn(),
      save: jest.fn(),
    };
    const checkListRepo = {
      getAll: jest.fn().mockResolvedValue([makeCheckList(0)]),
      update: jest.fn(),
    };
    const errorLogRepo = {
      getAll: jest.fn().mockResolvedValue([makeErrorLog(0)]),
      update: jest.fn(),
    };

    mockHasWebAccess.mockResolvedValue(true);
    mockGetTokenStorange.mockResolvedValue({ access: 'access-token', refresh: 'refresh-token' });
    mockWorkOrderBuild.mockResolvedValue(workOrderRepo);
    mockCheckListItemBuild.mockResolvedValue(checkListItemRepo);
    mockCheckListBuild.mockResolvedValue(checkListRepo);
    mockErrorLogBuild.mockResolvedValue(errorLogRepo);
    mockHttpRequest
      .mockResolvedValueOnce([makeWorkOrder(0)] as never)
      .mockResolvedValueOnce([makeCheckListItem()] as never)
      .mockResolvedValueOnce({ ok: true } as never)
      .mockResolvedValueOnce({ ok: true } as never)
      .mockResolvedValueOnce({ ok: true } as never);

    const instance = await Synchronizer.build();

    await expect(instance.run()).resolves.toBeUndefined();

    expect(mockHttpRequest).toHaveBeenCalledTimes(5);
    expect(workOrderRepo.save).toHaveBeenCalledTimes(1);
    expect(checkListItemRepo.deleteAll).toHaveBeenCalledTimes(1);
    expect(checkListItemRepo.save).toHaveBeenCalledTimes(1);
    expect(workOrderRepo.update).toHaveBeenCalledTimes(1);
    expect(checkListRepo.update).toHaveBeenCalledTimes(1);
    expect(errorLogRepo.update).toHaveBeenCalledTimes(1);
  });

  it('run rethrows SESSION_EXPIRED to allow redirect to login', async () => {
    mockHasWebAccess.mockResolvedValue(true);
    mockGetTokenStorange.mockResolvedValue({ access: 'access-token', refresh: 'refresh-token' });
    mockHttpRequest.mockRejectedValue(new Error('SESSION_EXPIRED'));

    const instance = await Synchronizer.build();

    await expect(instance.run()).rejects.toThrow('SESSION_EXPIRED');
  });

  it('receivePendingOrders saves only missing orders', async () => {
    const existingOrder = makeWorkOrder(0);
    const newOrder = new WorkOrder(
      'OP-2',
      'Client 2',
      'Symptoms 2',
      '1HGCM82633A123457',
      456,
      'TRATOR2027',
      '2026-03-31T12:00:00.000Z',
      '2026-03-31T13:00:00.000Z',
      '4',
      0,
      'Troca oleo'
    );
    const workOrderRepo = {
      getById: jest.fn().mockResolvedValueOnce(existingOrder).mockResolvedValueOnce(null),
      save: jest.fn(),
    };
    mockWorkOrderBuild.mockResolvedValue(workOrderRepo);
    mockHttpRequest.mockResolvedValue([existingOrder, newOrder] as never);

    const instance = await Synchronizer.build();
    (instance as any).authToken = 'access-token';

    await expect((instance as any).receivePendingOrders('/send_work_orders_api/')).resolves.toBeUndefined();

    expect(workOrderRepo.save).toHaveBeenCalledTimes(1);
    expect(workOrderRepo.save).toHaveBeenCalledWith(expect.objectContaining({ operation_code: 'OP-2', status_sync: 1 }));
  });

  it('receivePendingOrders rethrows request errors', async () => {
    const error = new Error('request-failed');
    mockHttpRequest.mockRejectedValue(error);

    const instance = await Synchronizer.build();
    (instance as any).authToken = 'access-token';

    await expect((instance as any).receivePendingOrders('/send_work_orders_api/')).rejects.toThrow('request-failed');
  });

  it('receiveCheckListItems clears and repopulates repository', async () => {
    const checkListItemRepo = {
      deleteAll: jest.fn(),
      save: jest.fn(),
    };
    mockCheckListItemBuild.mockResolvedValue(checkListItemRepo);
    mockHttpRequest.mockResolvedValue([makeCheckListItem()] as never);

    const instance = await Synchronizer.build();
    (instance as any).authToken = 'access-token';

    await expect((instance as any).receiveCheckListItems('/send_checklist_items_api/')).resolves.toBeUndefined();

    expect(checkListItemRepo.deleteAll).toHaveBeenCalledTimes(1);
    expect(checkListItemRepo.save).toHaveBeenCalledTimes(1);
  });

  it('sendWorkOrders sends only unsynchronized items and updates them on success', async () => {
    const pendingOrder = makeWorkOrder(0);
    const syncedOrder = makeWorkOrder(1);
    const workOrderRepo = {
      getAll: jest.fn().mockResolvedValue([pendingOrder, syncedOrder]),
      update: jest.fn(),
    };
    mockWorkOrderBuild.mockResolvedValue(workOrderRepo);
    mockHttpRequest.mockResolvedValue({ ok: true } as never);

    const instance = await Synchronizer.build();
    (instance as any).authToken = 'access-token';

    await expect((instance as any).sendWorkOrders('/receive_work_orders_api/')).resolves.toBeUndefined();

    expect(mockHttpRequest).toHaveBeenCalledWith({
      method: 'POST',
      endpoint: '/receive_work_orders_api/',
      BASE_URL: 'https://ringless-equivalently-alijah.ngrok-free.dev/gerenciador',
      timeoutMs: 20000,
      body: [
        {
          operation_code: 'OP-1',
          chassi: '1HGCM82633A123456',
          horimetro: '123',
          model: 'TRATOR2026',
          date_in: '2026-03-31T12:00:00.000Z',
          date_out: '2026-03-31T13:00:00.000Z',
          status: '4',
          service: 'Troca filtro',
          signature_in: undefined,
          signature_out: undefined,
          signature: undefined,
        },
      ],
      headers: { Authorization: 'Bearer access-token' },
    });
    expect(workOrderRepo.update).toHaveBeenCalledTimes(1);
    expect(pendingOrder.status_sync).toBe(1);
  });

  it('sendWorkOrders skips requests when there is nothing pending', async () => {
    const workOrderRepo = {
      getAll: jest.fn().mockResolvedValue([makeWorkOrder(1)]),
      update: jest.fn(),
    };
    mockWorkOrderBuild.mockResolvedValue(workOrderRepo);

    const instance = await Synchronizer.build();
    (instance as any).authToken = 'access-token';

    await expect((instance as any).sendWorkOrders('/receive_work_orders_api/')).resolves.toBeUndefined();

    expect(mockHttpRequest).not.toHaveBeenCalled();
    expect(workOrderRepo.update).not.toHaveBeenCalled();
  });

  it('sendCheckListsFilleds sends pending checklists and updates them on success', async () => {
    const pendingCheckList = makeCheckList(0);
    const syncedCheckList = makeCheckList(1);
    const checkListRepo = {
      getAll: jest.fn().mockResolvedValue([pendingCheckList, syncedCheckList]),
      update: jest.fn(),
    };
    mockCheckListBuild.mockResolvedValue(checkListRepo);
    mockHttpRequest.mockResolvedValue({ ok: true } as never);

    const instance = await Synchronizer.build();
    (instance as any).authToken = 'access-token';

    await expect((instance as any).sendCheckListsFilleds('/receive_checklist_api/')).resolves.toBeUndefined();

    expect(mockHttpRequest).toHaveBeenCalledWith({
      method: 'POST',
      endpoint: '/receive_checklist_api/',
      BASE_URL: 'https://ringless-equivalently-alijah.ngrok-free.dev/gerenciador',
      timeoutMs: 20000,
      body: [
        {
          id: '550e8400-e29b-41d4-a716-446655440000',
          checklist_item_fk: '550e8400-e29b-41d4-a716-446655440100',
          work_order_fk: 'OP-1',
          status: '1',
          img_in: null,
          img_out: null,
        },
      ],
      headers: { Authorization: 'Bearer access-token' },
    });
    expect(checkListRepo.update).toHaveBeenCalledTimes(1);
    expect(pendingCheckList.status_sync).toBe(1);
  });

  it('sendErrorLogs sends pending mobile logs and updates them on success', async () => {
    const pendingLog = makeErrorLog(0);
    const syncedLog = makeErrorLog(1);
    const errorLogRepo = {
      getAll: jest.fn().mockResolvedValue([pendingLog, syncedLog]),
      update: jest.fn(),
    };
    mockErrorLogBuild.mockResolvedValue(errorLogRepo);
    mockHttpRequest.mockResolvedValue({ ok: true } as never);

    const instance = await Synchronizer.build();
    (instance as any).authToken = 'access-token';

    await expect((instance as any).sendErrorLogs('/receive_mobile_logs_api/')).resolves.toBeUndefined();

    expect(mockHttpRequest).toHaveBeenCalledWith({
      method: 'POST',
      endpoint: '/receive_mobile_logs_api/',
      BASE_URL: 'https://ringless-equivalently-alijah.ngrok-free.dev/gerenciador',
      timeoutMs: 20000,
      body: [
        {
          id: '550e8400-e29b-41d4-a716-446655449999',
          osVersion: '35',
          deviceModel: 'Pixel 9',
          user: 'deiner',
          erro: 'request failed',
          stacktrace: 'stack',
          horario: '2026-03-31T12:00:00.000Z',
          status_sync: 0,
        },
      ],
      headers: { Authorization: 'Bearer access-token' },
    });
    expect(errorLogRepo.update).toHaveBeenCalledTimes(1);
    expect(pendingLog.status_sync).toBe(1);
  });
});
