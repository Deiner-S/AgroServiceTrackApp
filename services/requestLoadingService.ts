type LoadingListener = (isLoading: boolean) => void;

let pendingRequests = 0;
const listeners = new Set<LoadingListener>();

function notifyListeners() {
  try {
    const isLoading = pendingRequests > 0;

    listeners.forEach((listener) => listener(isLoading));
  } catch (err) {
    throw err
  }
}

export function beginRequestLoading() {
  try {
    pendingRequests += 1;
    notifyListeners();
  } catch (err) {
    throw err
  }
}

export function endRequestLoading() {
  try {
    pendingRequests = Math.max(0, pendingRequests - 1);
    notifyListeners();
  } catch (err) {
    throw err
  }
}

export function subscribeRequestLoading(listener: LoadingListener): () => void {
  try {
    listeners.add(listener);
    listener(pendingRequests > 0);

    return () => {
      try {
        listeners.delete(listener);
      } catch (err) {
        throw err
      }
    };
  } catch (err) {
    throw err
  }
}
