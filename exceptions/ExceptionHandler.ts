declare const require: <T = any>(moduleName: string) => T;

import { isUserInputValidationException } from '@/exceptions/ValidationException';

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

type ExceptionConstructor<E extends ExceptionHandler> = new (
  message: string,
  cause?: unknown
) => E;

type ExceptionMapper<E extends ExceptionHandler> = (error: unknown) => E | null;

type ExceptionHandlingOptions<T, E extends ExceptionHandler> = {
  ExceptionType?: ExceptionConstructor<E>;
  fallbackValue?: T;
  mapError?: ExceptionMapper<E>;
  operation?: string;
  rethrow?: boolean;
  user?: string;
};

function captureLayerErrorSilently(error: unknown, user?: string): void {
  const cause = error instanceof Error ? (error as Error & { cause?: unknown }).cause : undefined;

  if (isUserInputValidationException(error) || isUserInputValidationException(cause)) {
    return;
  }

  try {
    const { captureErrorSilently } = require<{
      captureErrorSilently: (input: { error: unknown; user?: string }) => Promise<void>;
    }>('@/utils/loggingUtil');

    void captureErrorSilently({ error, user }).catch(() => undefined);
  } catch {
    // Logging failures must never interfere with exception mapping.
  }
}

async function handleHighLevelErrorAsync(error: unknown, operation: string, user?: string): Promise<void> {
  try {
    const { handleHighLevelError } = require<{
      handleHighLevelError: (input: { operation: string; error: unknown; user?: string }) => Promise<void>;
    }>('@/utils/loggingUtil');

    await handleHighLevelError({ operation, error, user });
  } catch {
    captureLayerErrorSilently(error, user);
  }
}

function handleHighLevelErrorSync(error: unknown, operation: string, user?: string): void {
  try {
    const { handleHighLevelError } = require<{
      handleHighLevelError: (input: { operation: string; error: unknown; user?: string }) => Promise<void>;
    }>('@/utils/loggingUtil');

    void handleHighLevelError({ operation, error, user }).catch(() => {
      captureLayerErrorSilently(error, user);
    });
  } catch {
    captureLayerErrorSilently(error, user);
  }
}

function resolveHandledError<E extends ExceptionHandler>(
  error: unknown,
  ExceptionType?: ExceptionConstructor<E>,
  mapError?: ExceptionMapper<E>
): unknown {
  const mappedError = mapError?.(error);

  if (mappedError) {
    return mappedError;
  }

  if (!ExceptionType) {
    return error;
  }

  if (error instanceof ExceptionType) {
    return error;
  }

  return new ExceptionType(getErrorMessage(error), error);
}

function shouldRethrow<E extends ExceptionHandler>(options: ExceptionHandlingOptions<unknown, E>): boolean {
  if (typeof options.rethrow === 'boolean') {
    return options.rethrow;
  }

  return !!options.ExceptionType && !options.operation;
}

export default class ExceptionHandler extends Error {
  public readonly originalMessage: string;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = new.target.name;
    this.originalMessage = message;

    if (cause !== undefined) {
      Object.defineProperty(this, 'cause', {
        value: cause,
        enumerable: false,
        configurable: true,
        writable: true,
      });
    }
  }
}

export function syncExceptionHandling<T, E extends ExceptionHandler = ExceptionHandler>(
  operation: () => T,
  options: ExceptionHandlingOptions<T, E> = {}
): T | undefined {
  try {
    return operation();
  } catch (error) {
    console.log('[ExceptionHandler][syncExceptionHandling][catch]', {
      operation: options.operation ?? 'unknown',
      error: getErrorMessage(error),
    });
    const handledError = resolveHandledError(error, options.ExceptionType, options.mapError);

    if (options.operation) {
      handleHighLevelErrorSync(handledError, options.operation, options.user);
    } else {
      captureLayerErrorSilently(handledError, options.user);
    }

    if (shouldRethrow(options)) {
      throw handledError;
    }

    return options.fallbackValue;
  }
}

export async function exceptionHandling<T, E extends ExceptionHandler = ExceptionHandler>(
  operation: () => Promise<T>,
  options: ExceptionHandlingOptions<T, E> = {}
): Promise<T | undefined> {
  try {
    return await operation();
  } catch (error) {
    console.log('[ExceptionHandler][exceptionHandling][catch]', {
      operation: options.operation ?? 'unknown',
      error: getErrorMessage(error),
    });
    const handledError = resolveHandledError(error, options.ExceptionType, options.mapError);

    if (options.operation) {
      await handleHighLevelErrorAsync(handledError, options.operation, options.user);
    } else {
      captureLayerErrorSilently(handledError, options.user);
    }

    if (shouldRethrow(options)) {
      throw handledError;
    }

    return options.fallbackValue;
  }
}
