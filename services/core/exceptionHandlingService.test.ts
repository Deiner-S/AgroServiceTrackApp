import { exceptionHandling } from '@/exceptions/ExceptionHandler';
import { handleHighLevelError } from '@/utils/loggingUtil';

jest.mock('@/utils/loggingUtil', () => ({
  handleHighLevelError: jest.fn(),
}));

const mockHandleHighLevelError = handleHighLevelError as jest.MockedFunction<typeof handleHighLevelError>;

describe('controllerErrorService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns task result when controller action succeeds', async () => {
    await expect(
      exceptionHandling(async () => 'ok', {
        operation: 'salvar dados',
      })
    ).resolves.toBe('ok');

    expect(mockHandleHighLevelError).not.toHaveBeenCalled();
  });

  it('logs and returns fallback when controller action fails', async () => {
    const error = new Error('boom');

    await expect(
      exceptionHandling(
        async () => {
          throw error;
        },
        {
          operation: 'carregar dados',
          fallbackValue: 'fallback',
        }
      )
    ).resolves.toBe('fallback');

    expect(mockHandleHighLevelError).toHaveBeenCalledWith({
      operation: 'carregar dados',
      error,
      user: undefined,
    });
  });

  it('rethrows when configured to rethrow', async () => {
    const error = new Error('boom');

    await expect(
      exceptionHandling(
        async () => {
          throw error;
        },
        {
          operation: 'executar sincronização',
          rethrow: true,
        }
      )
    ).rejects.toThrow(error);
  });
});
