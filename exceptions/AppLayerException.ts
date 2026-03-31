export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

type AppLayerExceptionConstructor<T extends AppLayerException> = new (
  message: string,
  cause?: unknown
) => T;

type ExceptionMapper<T extends AppLayerException> = (error: unknown) => T | null;

export default class AppLayerException extends Error {
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

export function executeWithLayerException<T, E extends AppLayerException>(
  operation: () => T,
  ExceptionType: AppLayerExceptionConstructor<E>,
  mapError?: ExceptionMapper<E>
): T {
  try {
    return operation();
  } catch (error) {
    const mappedError = mapError?.(error);

    if (mappedError) {
      throw mappedError;
    }

    if (error instanceof ExceptionType) {
      throw error;
    }

    throw new ExceptionType(getErrorMessage(error), error);
  }
}

export async function executeAsyncWithLayerException<T, E extends AppLayerException>(
  operation: () => Promise<T>,
  ExceptionType: AppLayerExceptionConstructor<E>,
  mapError?: ExceptionMapper<E>
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    const mappedError = mapError?.(error);

    if (mappedError) {
      throw mappedError;
    }

    if (error instanceof ExceptionType) {
      throw error;
    }

    throw new ExceptionType(getErrorMessage(error), error);
  }
}
