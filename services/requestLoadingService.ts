import {
  executeWithLayerException,
} from '@/exceptions/AppLayerException';
import RequestLoadingServiceException from '@/exceptions/RequestLoadingServiceException';

type LoadingListener = (isLoading: boolean) => void;

let pendingRequests = 0;
const listeners = new Set<LoadingListener>();

function notifyListeners() {
  return executeWithLayerException(() => {
    const isLoading = pendingRequests > 0;

    listeners.forEach((listener) => listener(isLoading));
  }, RequestLoadingServiceException);
}

export function beginRequestLoading() {
  return executeWithLayerException(() => {
    pendingRequests += 1;
    notifyListeners();
  }, RequestLoadingServiceException);
}

export function endRequestLoading() {
  return executeWithLayerException(() => {
    pendingRequests = Math.max(0, pendingRequests - 1);
    notifyListeners();
  }, RequestLoadingServiceException);
}

export function subscribeRequestLoading(listener: LoadingListener): () => void {
  return executeWithLayerException(() => {
    listeners.add(listener);
    listener(pendingRequests > 0);

    return () => {
      return executeWithLayerException(() => {
        listeners.delete(listener);
      }, RequestLoadingServiceException);
    };
  }, RequestLoadingServiceException);
}
