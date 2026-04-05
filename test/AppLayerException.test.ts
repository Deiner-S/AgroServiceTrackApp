import ExceptionHandler, {
  exceptionHandling,
  syncExceptionHandling,
} from '@/exceptions/ExceptionHandler';
import ValidationException from '@/exceptions/ValidationException';
import { captureErrorSilently, handleHighLevelError } from '@/utils/loggingUtil';

jest.mock('@/utils/loggingUtil', () => ({
  captureErrorSilently: jest.fn().mockResolvedValue(undefined),
  handleHighLevelError: jest.fn().mockResolvedValue(undefined),
}));

class SampleLayerException extends ExceptionHandler {}

describe('ExceptionHandler helpers', () => {
  const mockCaptureErrorSilently = captureErrorSilently as jest.MockedFunction<typeof captureErrorSilently>;
  const mockHandleHighLevelError = handleHighLevelError as jest.MockedFunction<typeof handleHighLevelError>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('wraps sync errors with the provided exception type', () => {
    expect(() =>
      syncExceptionHandling(() => {
        throw new Error('sync failed');
      }, { ExceptionType: SampleLayerException })
    ).toThrow(SampleLayerException);
  });

  it('returns sync operation result when no error occurs', () => {
    const result = syncExceptionHandling(() => 10, { ExceptionType: SampleLayerException });

    expect(result).toBe(10);
  });

  it('wraps async errors with the provided exception type', async () => {
    await expect(
      exceptionHandling(async () => {
        throw new Error('async failed');
      }, { ExceptionType: SampleLayerException })
    ).rejects.toThrow(SampleLayerException);
  });

  it('uses mapped exception when mapper returns one', async () => {
    await expect(
      exceptionHandling(
        async () => {
          throw new Error('mapped');
        },
        {
          ExceptionType: SampleLayerException,
          mapError: (error) => new SampleLayerException(`wrapped: ${String(error)}`),
        }
      )
    ).rejects.toThrow('wrapped: Error: mapped');
  });

  it('does not log user input validation errors', () => {
    const error = new ValidationException('campo invalido', 'user_input');

    expect(() =>
      syncExceptionHandling(() => {
        throw error;
      }, { ExceptionType: SampleLayerException })
    ).toThrow(SampleLayerException);

    expect(mockCaptureErrorSilently).not.toHaveBeenCalled();
  });

  it('still logs api contract validation errors', () => {
    const error = new ValidationException('response invalida', 'api_contract');

    expect(() =>
      syncExceptionHandling(() => {
        throw error;
      }, { ExceptionType: SampleLayerException })
    ).toThrow(SampleLayerException);

    expect(mockCaptureErrorSilently).toHaveBeenCalledWith({ error: expect.any(SampleLayerException), user: undefined });
  });

  it('uses high level handler when operation is provided', async () => {
    const error = new Error('falhou');

    await expect(
      exceptionHandling(async () => {
        throw error;
      }, {
        operation: 'salvar dados',
        fallbackValue: 'fallback',
      })
    ).resolves.toBe('fallback');

    expect(mockHandleHighLevelError).toHaveBeenCalledWith({
      operation: 'salvar dados',
      error,
      user: undefined,
    });
  });
});
