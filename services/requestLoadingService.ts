import {
  syncExceptionHandling,
} from '@/exceptions/ExceptionHandler';
import RequestLoadingServiceException from '@/exceptions/RequestLoadingServiceException';

type LoadingListener = (isLoading: boolean) => void;

let pendingRequests = 0;
const listeners = new Set<LoadingListener>();

function notifyListeners() {
  return syncExceptionHandling(() => {
    const isLoading = pendingRequests > 0;

    listeners.forEach((listener) => listener(isLoading));
  }, { ExceptionType: RequestLoadingServiceException });
}

export function beginRequestLoading() {
  return syncExceptionHandling(() => {
    pendingRequests += 1;
    notifyListeners();
  }, { ExceptionType: RequestLoadingServiceException });
}

export function endRequestLoading() {
  return syncExceptionHandling(() => {
    pendingRequests = Math.max(0, pendingRequests - 1);
    notifyListeners();
  }, { ExceptionType: RequestLoadingServiceException });
}

export function subscribeRequestLoading(listener: LoadingListener): () => void {
  return syncExceptionHandling(() => {
    listeners.add(listener);
    listener(pendingRequests > 0);

    return () => {
      return syncExceptionHandling(() => {
        listeners.delete(listener);
      }, { ExceptionType: RequestLoadingServiceException });
    };
  }, { ExceptionType: RequestLoadingServiceException });
}
