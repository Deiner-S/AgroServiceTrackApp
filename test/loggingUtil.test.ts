import ErrorLogRepository from '@/repository/ErrorLogRepository';
import { handleHighLevelError, registerErrorLog } from '@/utils/loggingUtil';

jest.mock('@/repository/ErrorLogRepository', () => ({
  __esModule: true,
  default: {
    build: jest.fn(),
  },
}));

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'log-id'),
}));

jest.mock('react-native', () => ({
  Alert: {
    alert: jest.fn(),
  },
  Platform: {
    OS: 'android',
    Version: 35,
    constants: {
      Model: 'Pixel 9',
    },
  },
}));

describe('loggingUtil', () => {
  const mockBuild = ErrorLogRepository.build as jest.Mock;
  const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    consoleErrorSpy.mockRestore();
  });

  it('registers error logs with device metadata', async () => {
    const repository = {
      save: jest.fn().mockResolvedValue(true),
    };
    const error = new Error('request failed');
    mockBuild.mockResolvedValue(repository);

    await expect(
      registerErrorLog({
        error,
        user: 'deiner',
      })
    ).resolves.toBeUndefined();

    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'log-id',
        osVersion: '35',
        deviceModel: 'Pixel 9',
        user: 'deiner',
        erro: 'request failed',
        stacktrace: error.stack,
        status_sync: 0,
      })
    );
  });

  it('shows generic alert even when log persistence fails', async () => {
    const repositoryError = new Error('db failed');
    const { Alert } = require('react-native');
    mockBuild.mockRejectedValue(repositoryError);

    await expect(
      handleHighLevelError({
        operation: 'salvar checklist',
        error: new Error('save failed'),
        user: 'deiner',
      })
    ).resolves.toBeUndefined();

    expect(Alert.alert).toHaveBeenCalledWith(
      'Erro',
      'Falha ao salvar checklist. Tente novamente.'
    );
  });
});
