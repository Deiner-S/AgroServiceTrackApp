import CheckList from '@/models/CheckList';
import CheckListItem from '@/models/CheckListItem';
import WorkOrder from '@/models/WorkOrder';
import CheckListItemRepository from '@/repository/CheckListItemRepository';
import CheckListRepository from '@/repository/CheckListRepository';
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

const mockHasWebAccess = hasWebAccess as jest.MockedFunction<typeof hasWebAccess>;
const mockHttpRequest = httpRequest as jest.MockedFunction<typeof httpRequest>;
const mockGetTokenStorange = getTokenStorange as jest.MockedFunction<typeof getTokenStorange>;
const mockWorkOrderBuild = WorkOrderRepository.build as jest.Mock;
const mockCheckListBuild = CheckListRepository.build as jest.Mock;
const mockCheckListItemBuild = CheckListItemRepository.build as jest.Mock;

describe('synchronizerService', () => {
  const makeWorkOrder = (statusSync = 0) =>
    new WorkOrder('OP-1', 'Client', 'Symptoms', undefined, undefined, undefined, undefined, undefined, 'OPEN', statusSync);

  const makeCheckListItem = () => new CheckListItem('ITEM-1', 'Item', 0);
  const makeCheckList = (statusSync = 0) => new CheckList('CHK-1', 'ITEM-1', 'OP-1', 'OK', statusSync);

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

    mockHasWebAccess.mockResolvedValue(true);
    mockGetTokenStorange.mockResolvedValue({ access: 'access-token', refresh: 'refresh-token' });
    mockWorkOrderBuild.mockResolvedValue(workOrderRepo);
    mockCheckListItemBuild.mockResolvedValue(checkListItemRepo);
    mockCheckListBuild.mockResolvedValue(checkListRepo);
    mockHttpRequest
      .mockResolvedValueOnce([makeWorkOrder(0)] as never)
      .mockResolvedValueOnce([makeCheckListItem()] as never)
      .mockResolvedValueOnce({ ok: true } as never)
      .mockResolvedValueOnce({ ok: true } as never);

    const instance = await Synchronizer.build();

    await expect(instance.run()).resolves.toBeUndefined();

    expect(mockHttpRequest).toHaveBeenCalledTimes(4);
    expect(workOrderRepo.save).toHaveBeenCalledTimes(1);
    expect(checkListItemRepo.deleteAll).toHaveBeenCalledTimes(1);
    expect(checkListItemRepo.save).toHaveBeenCalledTimes(1);
    expect(workOrderRepo.update).toHaveBeenCalledTimes(1);
    expect(checkListRepo.update).toHaveBeenCalledTimes(1);
  });

  it('receivePendingOrders saves only missing orders', async () => {
    const existingOrder = makeWorkOrder(0);
    const newOrder = new WorkOrder('OP-2', 'Client 2', 'Symptoms 2', undefined, undefined, undefined, undefined, undefined, 'OPEN', 0);
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
    expect(newOrder.status_sync).toBe(1);
  });

  it('receivePendingOrders rethrows request errors', async () => {
    const error = new Error('request-failed');
    mockHttpRequest.mockRejectedValue(error);

    const instance = await Synchronizer.build();
    (instance as any).authToken = 'access-token';

    await expect((instance as any).receivePendingOrders('/send_work_orders_api/')).rejects.toThrow(error);
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
      body: [pendingOrder],
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
      body: [pendingCheckList],
      headers: { Authorization: 'Bearer access-token' },
    });
    expect(checkListRepo.update).toHaveBeenCalledTimes(1);
    expect(pendingCheckList.status_sync).toBe(1);
  });
});
