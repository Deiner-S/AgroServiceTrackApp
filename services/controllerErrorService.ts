import { handleHighLevelError } from '@/util/loggingUtil';

type ControllerTaskOptions<T> = {
  fallbackValue?: T;
  operation: string;
  rethrow?: boolean;
  user?: string;
};

export async function executeControllerTask<T>(
  task: () => Promise<T>,
  options: ControllerTaskOptions<T>
): Promise<T | undefined> {
  try {
    return await task();
  } catch (error) {
    await handleHighLevelError({
      operation: options.operation,
      error,
      user: options.user,
    });

    if (options.rethrow) {
      throw error;
    }

    return options.fallbackValue;
  }
}
