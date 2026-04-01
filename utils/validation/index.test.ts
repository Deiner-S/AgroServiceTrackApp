import CheckList from '@/models/CheckList';
import WorkOrder from '@/models/WorkOrder';
import {
  buildChecklistApiPayload,
  buildWorkOrderApiPayload,
  sanitizeOnlyLettersAndNumbers,
  sanitizeOnlyLowercaseLetters,
  sanitizeOnlyNumbers,
  validateChecklistApiEntries,
  validateWorkOrderApiEntries,
} from '@/utils/validation';

describe('validation index', () => {
  it('sanitizes text inputs according to the expected patterns', () => {
    expect(sanitizeOnlyLowercaseLetters('Joao 123')).toBe('joao');
    expect(sanitizeOnlyNumbers('12a-3')).toBe('123');
    expect(sanitizeOnlyLettersAndNumbers('TR-123 45')).toBe('TR12345');
  });

  it('validates outbound work order payload keys and values', () => {
    const payload = validateWorkOrderApiEntries([
      {
        operation_code: 'OP-1',
        chassi: '1HGCM82633A123456',
        horimetro: '123',
        model: 'TRATOR2026',
        date_in: '2026-03-31T12:00:00.000Z',
        date_out: '2026-03-31T13:00:00.000Z',
        status: '4',
        service: 'Troca filtro',
      },
    ]);

    expect(payload).toHaveLength(1);
    expect(payload[0].model).toBe('TRATOR2026');
  });

  it('rejects unexpected keys in external work order payload', () => {
    expect(() =>
      validateWorkOrderApiEntries([
        {
          operation_code: 'OP-1',
          chassi: '1HGCM82633A123456',
          horimetro: '123',
          model: 'TRATOR2026',
          date_in: '2026-03-31T12:00:00.000Z',
          date_out: '2026-03-31T13:00:00.000Z',
          status: '4',
          service: 'Troca filtro',
          extra: true,
        },
      ])
    ).toThrow('chaves nao esperadas');
  });

  it('builds api payloads with only the expected keys', () => {
    const workOrder = new WorkOrder(
      'OP-1',
      'Client',
      'Symptoms',
      '1HGCM82633A123456',
      123,
      'TRATOR2026',
      '2026-03-31T12:00:00.000Z',
      '2026-03-31T13:00:00.000Z',
      '4',
      0,
      'Troca filtro'
    );

    const checklist = new CheckList(
      '550e8400-e29b-41d4-a716-446655440000',
      '550e8400-e29b-41d4-a716-446655440001',
      'OP-1',
      '1',
      0
    );

    expect(Object.keys(buildWorkOrderApiPayload(workOrder))).toEqual([
      'operation_code',
      'chassi',
      'horimetro',
      'model',
      'date_in',
      'date_out',
      'status',
      'service',
    ]);

    expect(Object.keys(buildChecklistApiPayload(checklist))).toEqual([
      'id',
      'checklist_item_fk',
      'work_order_fk',
      'status',
      'img_in',
      'img_out',
    ]);
  });

  it('validates checklist payload structure', () => {
    const payload = validateChecklistApiEntries([
      {
        id: '550e8400-e29b-41d4-a716-446655440000',
        checklist_item_fk: '550e8400-e29b-41d4-a716-446655440001',
        work_order_fk: 'OP-1',
        status: '1',
        img_in: null,
        img_out: null,
      },
    ]);

    expect(payload[0].status).toBe('1');
  });
});
