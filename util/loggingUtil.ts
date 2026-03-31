import { getErrorMessage } from '@/exceptions/AppLayerException';
import ErrorLogServiceException from '@/exceptions/ErrorLogServiceException';
import ErrorLog from '@/models/ErrorLog';
import ErrorLogRepository from '@/repository/ErrorLogRepository';
import { Alert, Platform } from 'react-native';
import { v4 as uuidv4 } from 'uuid';

type ErrorLogInput = {
  error: unknown;
  user?: string;
};

type HighLevelErrorInput = ErrorLogInput & {
  operation: string;
};

function resolveDeviceModel(): string {
  const constants = Platform.constants as {
    Model?: string;
    model?: string;
    Brand?: string;
    brand?: string;
  };

  return (
    constants.Model ??
    constants.model ??
    constants.Brand ??
    constants.brand ??
    Platform.OS
  );
}

function resolveStackTrace(error: unknown): string | null {
  if (error instanceof Error) {
    return error.stack ?? null;
  }

  return null;
}

export async function registerErrorLog({ error, user = 'unknown' }: ErrorLogInput): Promise<void> {
  try {
    const repository = await ErrorLogRepository.build();
    const errorLog: ErrorLog = {
      id: uuidv4(),
      osVersion: String(Platform.Version),
      deviceModel: resolveDeviceModel(),
      user,
      erro: getErrorMessage(error),
      stacktrace: resolveStackTrace(error),
      horario: new Date().toISOString(),
    };

    await repository.save(errorLog);
  } catch (registerError) {
    throw new ErrorLogServiceException(getErrorMessage(registerError), registerError);
  }
}

export async function handleHighLevelError({
  operation,
  error,
  user,
}: HighLevelErrorInput): Promise<void> {
  try {
    await registerErrorLog({ error, user });
  } catch (registerError) {
    if (registerError instanceof ErrorLogServiceException) {
      console.error(`[handleHighLevelError] ${registerError.name}: ${registerError.message}`);
    } else {
      console.error('[handleHighLevelError] Unexpected log failure', registerError);
    }
  } finally {
    Alert.alert('Erro', `Falha ao ${operation}. Tente novamente.`);
  }
}
