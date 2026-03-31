import AppLayerException, {
  executeAsyncWithLayerException,
  executeWithLayerException,
} from '@/exceptions/AppLayerException';

class SampleLayerException extends AppLayerException {}

describe('AppLayerException helpers', () => {
  it('wraps sync errors with the provided exception type', () => {
    expect(() =>
      executeWithLayerException(() => {
        throw new Error('sync failed');
      }, SampleLayerException)
    ).toThrow(SampleLayerException);
  });

  it('returns sync operation result when no error occurs', () => {
    const result = executeWithLayerException(() => 10, SampleLayerException);

    expect(result).toBe(10);
  });

  it('wraps async errors with the provided exception type', async () => {
    await expect(
      executeAsyncWithLayerException(async () => {
        throw new Error('async failed');
      }, SampleLayerException)
    ).rejects.toThrow(SampleLayerException);
  });

  it('uses mapped exception when mapper returns one', async () => {
    await expect(
      executeAsyncWithLayerException(
        async () => {
          throw new Error('mapped');
        },
        SampleLayerException,
        (error) => new SampleLayerException(`wrapped: ${String(error)}`)
      )
    ).rejects.toThrow('wrapped: Error: mapped');
  });
});
