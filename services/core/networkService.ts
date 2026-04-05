import { exceptionHandling } from '@/exceptions/ExceptionHandler';
import NetworkServiceException from '@/exceptions/NetworkServiceException';
import { clearTokenStorange } from '@/storange/authStorange';
import NetInfo from '@react-native-community/netinfo';
import { refreshToken } from '@/services/auth/authService';
import { beginRequestLoading, endRequestLoading } from './requestLoadingService';


// definindo valores possíveis para 
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
const MAX_REQUEST_ATTEMPTS = 3;

//Empacotador da requisição
interface RequestOptions {
  method: HttpMethod;
  endpoint: string;
  body?: unknown;
  headers?: Record<string, string>;
  BASE_URL: String;
  timeoutMs?: number;
}


export async function httpRequest<T>(
  options: RequestOptions,
  retried = false,
  controlLoading = true,
  attempt = 1
): Promise<T> {
  return exceptionHandling(async () => {
    try {
      if (controlLoading) {
        beginRequestLoading();
      }

      const controller = new AbortController();
      const timeoutMs = options.timeoutMs ?? 15000;
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch(`${options.BASE_URL}${options.endpoint}`, {
        method: options.method,
        headers: {'Content-Type': 'application/json',...options.headers},
        body: options.body ? JSON.stringify(options.body) : undefined,
        signal: controller.signal,
      }).finally(() => {
        clearTimeout(timeoutId);
      });

      if (response.status === 401 && !retried) {
        try {
          const refreshedAccessToken = await refreshToken()
          return httpRequest<T>({
            ...options,
            headers: {
              ...options.headers,
              Authorization: `Bearer ${refreshedAccessToken}`,
            },
          }, true, false, attempt)
        } catch {
          await clearTokenStorange()
          throw new NetworkServiceException('SESSION_EXPIRED')
        }
      }

      if (!response.ok) {
        const errorBody = await response.text();
        const httpError = new NetworkServiceException(`HTTP ${response.status} - ${errorBody || response.statusText}`);

        if (shouldRetryRequest(response.status, attempt)) {
          return httpRequest<T>(options, retried, false, attempt + 1);
        }

        throw httpError;
      }

      return response.json() as Promise<T>;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        if (shouldRetryRequest('timeout', attempt)) {
          return httpRequest<T>(options, retried, false, attempt + 1);
        }

        throw new NetworkServiceException('REQUEST_TIMEOUT');
      }

      if (shouldRetryError(error, attempt)) {
        return httpRequest<T>(options, retried, false, attempt + 1);
      }

      throw error;
    } finally {
      if (controlLoading) {
        endRequestLoading();
      }
    }
  }, { ExceptionType: NetworkServiceException })
}

function shouldRetryRequest(status: number | 'timeout', attempt: number): boolean {
  if (attempt >= MAX_REQUEST_ATTEMPTS) {
    return false;
  }

  if (status === 'timeout') {
    return true;
  }

  return status === 408 || status === 429 || status >= 500;
}

function shouldRetryError(error: unknown, attempt: number): boolean {
  if (attempt >= MAX_REQUEST_ATTEMPTS) {
    return false;
  }

  if (error instanceof NetworkServiceException) {
    return false;
  }

  return error instanceof Error;
}



export async function hasWebAccess(): Promise<boolean> {
    return exceptionHandling(async () => {
      const state = await NetInfo.fetch();
    
      return Boolean(
        state.isConnected && state.isInternetReachable
      );
    }, { ExceptionType: NetworkServiceException })
}
