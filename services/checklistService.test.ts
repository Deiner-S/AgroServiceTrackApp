import WorkOrder from '@/models/WorkOrder';
import {
  buildChecklistPayload,
  hydrateChecklistState,
  resolveChecklistDateChange,
  saveChecklistItems,
  saveWorkOrderData,
} from './checklistService';
import * as imageService from './imageService';

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'generated-uuid'),
}));

jest.mock('./imageService', () => ({
  base64ToUint8Array: jest.fn(),
  readImageAsUint8Array: jest.fn(),
}));

const mockBase64ToUint8Array = imageService.base64ToUint8Array as jest.MockedFunction<typeof imageService.base64ToUint8Array>;
const mockReadImageAsUint8Array = imageService.readImageAsUint8Array as jest.MockedFunction<typeof imageService.readImageAsUint8Array>;

function createWorkOrder(): WorkOrder {
  return {
    operation_code: 'wo-1',
    client: 'Client',
    symptoms: 'Symptoms',
    chassi: '1HGCM82633A123456',
    horimetro: 10,
    model: 'oldmodel',
    date_in: '2026-03-31T12:00:00.000Z',
    date_out: '2026-03-31T13:00:00.000Z',
    status: '1',
    status_sync: 1,
    service: undefined,
    signature_in: null,
    signature_out: null,
    insertDate: undefined,
  };
}

describe('checklistService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('hydrates checklist state with persisted data', async () => {
    const repository = {
      getAll: jest.fn().mockResolvedValue([
        {
          id: 'row-1',
          checklist_item_fk: 'item-1',
          work_order_fk: 'wo-1',
          status: '1',
          img_in: new Uint8Array([1]),
          img_out: null,
        },
      ]),
    };

    const result = await hydrateChecklistState(
      repository as any,
      [
        { id: 'item-1' },
        { id: 'item-2' },
      ] as any,
      'wo-1'
    );

    expect(result).toEqual([
      {
        id: 'item-1',
        checklistId: 'row-1',
        selected: '1',
        photoInUri: null,
        photoOutUri: null,
        hasPhotoIn: true,
        hasPhotoOut: false,
      },
      {
        id: 'item-2',
        checklistId: undefined,
        selected: null,
        photoInUri: null,
        photoOutUri: null,
        hasPhotoIn: false,
        hasPhotoOut: false,
      },
    ]);
  });

  it('builds collection payload with current state', () => {
    const workOrder = createWorkOrder();
    const dateFilled = new Date('2026-03-31T12:00:00.000Z');

    const result = buildChecklistPayload({
      stage: 'collection',
      workOrder,
      checklistState: [
        {
          id: '550e8400-e29b-41d4-a716-446655440001',
          checklistId: '550e8400-e29b-41d4-a716-446655440010',
          selected: '1',
          photoInUri: 'file://photo-in.jpg',
          photoOutUri: 'file://photo-out.jpg',
          hasPhotoIn: true,
          hasPhotoOut: true,
        },
      ],
      chassi: '1HGCM82633A654321',
      horimetro: 20,
      modelo: 'newmodel',
      dateFilled,
      signature: 'signature-data',
    });

    expect(result).toEqual({
      stage: 'collection',
      workOrder,
      workOrderUpdate: {
        chassi: '1HGCM82633A654321',
        horimetro: 20,
        model: 'newmodel',
        date_in: dateFilled.toISOString(),
        status: '2',
        signature_in: 'signature-data',
      },
      items: [
        {
          checklist_id: '550e8400-e29b-41d4-a716-446655440010',
          checklist_item_fk: '550e8400-e29b-41d4-a716-446655440001',
          status: '1',
          photoInUri: 'file://photo-in.jpg',
          photoOutUri: null,
        },
      ],
    });
  });

  it('returns selected date when provided', () => {
    const date = new Date('2026-03-31T10:00:00.000Z');

    expect(resolveChecklistDateChange(date)).toBe(date);
    expect(resolveChecklistDateChange()).toBeNull();
  });

  it('saves work order data converting signatures to bytes', async () => {
    const repository = {
      update: jest.fn().mockResolvedValue(true),
    };

    mockBase64ToUint8Array.mockReturnValue(new Uint8Array([9, 9]));

    await saveWorkOrderData(repository as any, {
      stage: 'collection',
      workOrder: createWorkOrder(),
      workOrderUpdate: {
        chassi: '1HGCM82633A654321',
        horimetro: 10,
        model: 'oldmodel',
        date_in: '2026-03-31T12:00:00.000Z',
        status: '2',
        signature_in: 'base64-signature',
      },
      items: [],
    });

    expect(mockBase64ToUint8Array).toHaveBeenCalledWith('base64-signature');
    expect(repository.update).toHaveBeenCalledWith(
      expect.objectContaining({
        chassi: '1HGCM82633A654321',
        status_sync: 0,
        signature_in: new Uint8Array([9, 9]),
      })
    );
  });

  it('updates and creates checklist items with converted images', async () => {
    const repository = {
      getAll: jest.fn().mockResolvedValue([
        {
          id: 'existing-row',
          checklist_item_fk: '550e8400-e29b-41d4-a716-446655440001',
          work_order_fk: 'wo-1',
          status: '1',
          img_in: new Uint8Array([1]),
          img_out: null,
        },
      ]),
      update: jest.fn().mockResolvedValue(true),
      save: jest.fn().mockResolvedValue(true),
    };

    mockReadImageAsUint8Array
      .mockResolvedValueOnce(new Uint8Array([2]))
      .mockResolvedValueOnce(new Uint8Array([3]));

    await saveChecklistItems(repository as any, {
      stage: 'delivery',
      workOrder: createWorkOrder(),
      items: [
        {
          checklist_id: '550e8400-e29b-41d4-a716-446655440010',
          checklist_item_fk: '550e8400-e29b-41d4-a716-446655440001',
          status: '2',
          photoInUri: 'file://in.jpg',
          photoOutUri: null,
        },
        {
          checklist_item_fk: '550e8400-e29b-41d4-a716-446655440002',
          status: '1',
          photoInUri: null,
          photoOutUri: 'file://out.jpg',
        },
      ],
    });

    expect(repository.update).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'existing-row',
        checklist_item_fk: '550e8400-e29b-41d4-a716-446655440001',
        status: '2',
        img_in: new Uint8Array([2]),
      })
    );
    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'generated-uuid',
        checklist_item_fk: '550e8400-e29b-41d4-a716-446655440002',
        work_order_fk: 'wo-1',
        status: '1',
        img_out: new Uint8Array([3]),
      })
    );
  });

  it('rejects invalid collection payload before persisting', async () => {
    const repository = {
      update: jest.fn().mockResolvedValue(true),
    };

    await expect(
      saveWorkOrderData(repository as any, {
        stage: 'collection',
        workOrder: createWorkOrder(),
        workOrderUpdate: {
          chassi: 'invalid',
          horimetro: 10,
          model: 'oldmodel',
          date_in: '2026-03-31T12:00:00.000Z',
          status: '2',
          signature_in: 'signature-data',
        },
        items: [],
      })
    ).rejects.toThrow('chassi invalido');
  });
});
