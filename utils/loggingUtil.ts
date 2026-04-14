import ErrorLogServiceException from '@/exceptions/ErrorLogServiceException';
import { isUserInputValidationException } from '@/exceptions/ValidationException';
import ErrorLog from '@/models/ErrorLog';
import ErrorLogRepository from '@/repository/ErrorLogRepository';
import { buildHighLevelOperationMessage, LOGGING_TITLES } from '@/utils/loggingMessages';
import NetInfo from '@react-native-community/netinfo';
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

export function getErrorMessageForLog(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

function resolveStackTrace(error: unknown): string {
  if (error instanceof Error) {
    return error.stack ?? `${error.name}: ${error.message}`;
  }

  if (typeof error === 'string') {
    return error;
  }

  try {
    return JSON.stringify(error, null, 2);
  } catch {
    return String(error);
  }
}

async function persistErrorLog({ error, user = 'unknown' }: ErrorLogInput): Promise<void> {
  const repository = await ErrorLogRepository.build();
  const connectionStatus = await resolveConnectionStatus();
  const errorLog: ErrorLog = {
    id: uuidv4(),
    osVersion: String(Platform.Version),
    deviceModel: resolveDeviceModel(),
    connectionStatus,
    user,
    erro: getErrorMessageForLog(error),
    stacktrace: resolveStackTrace(error),
    horario: new Date().toISOString(),
    status_sync: 0,
  };

  await repository.save(errorLog);
}

async function resolveConnectionStatus(): Promise<'online' | 'offline' | 'unknown'> {
  try {
    const state = await NetInfo.fetch();

    if (state.isConnected === false || state.isInternetReachable === false) {
      return 'offline';
    }

    if (state.isConnected === true && state.isInternetReachable !== false) {
      return 'online';
    }

    return 'unknown';
  } catch {
    return 'unknown';
  }
}

export async function registerErrorLog(input: ErrorLogInput): Promise<void> {
  if (isUserInputValidationException(input.error)) {
    return;
  }

  try {
    await persistErrorLog(input);
  } catch (registerError) {
    const registerFailure = new ErrorLogServiceException(
      getErrorMessageForLog(registerError),
      registerError
    );

    if (!(input.error instanceof ErrorLogServiceException)) {
      try {
        await persistErrorLog({
          error: registerFailure,
          user: input.user,
        });
      } catch {
        throw registerFailure;
      }
    } else {
      throw registerFailure;
    }
  }
}

export async function captureErrorSilently(input: ErrorLogInput): Promise<void> {
  try {
    await registerErrorLog(input);
  } catch {
    // O fluxo da aplicação não deve quebrar por falha no armazenamento do log.
  }
}

export async function handleHighLevelError({
  operation,
  error,
  user,
}: HighLevelErrorInput): Promise<void> {
  if (!isUserInputValidationException(error)) {
    await captureErrorSilently({ error, user });
  }
  Alert.alert(LOGGING_TITLES.genericError, buildHighLevelOperationMessage(operation));
}
