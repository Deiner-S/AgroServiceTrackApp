import { executeAsyncWithLayerException } from '@/exceptions/AppLayerException';
import NetworkServiceException from '@/exceptions/NetworkServiceException';
import { clearTokenStorange } from '@/storange/authStorange';
import NetInfo from '@react-native-community/netinfo';
import { beginRequestLoading, endRequestLoading } from './requestLoadingService';
import { refreshToken } from './authService';


// definindo valores possíveis para 
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH';

//Empacotador da requisição
interface RequestOptions {
  method: HttpMethod;
  endpoint: string;
  body?: unknown;
  headers?: Record<string, string>;
  BASE_URL: String
}


export async function httpRequest<T>(
  options: RequestOptions,
  retried = false,
  controlLoading = true
): Promise<T> {
  return executeAsyncWithLayerException(async () => {
    try {
      if (controlLoading) {
        beginRequestLoading();
      }

      const response = await fetch(`${options.BASE_URL}${options.endpoint}`, {
        method: options.method,
        headers: {'Content-Type': 'application/json',...options.headers},
        body: options.body ? JSON.stringify(options.body) : undefined,
      });

      if (response.status === 401 && !retried) {
        try {
          await refreshToken()
          return httpRequest<T>(options, true, false)
        } catch {
          await clearTokenStorange()
          throw new NetworkServiceException('SESSION_EXPIRED')
        }
      }

      if (!response.ok) {
        const errorBody = await response.text();
        throw new NetworkServiceException(`HTTP ${response.status} - ${errorBody || response.statusText}`);
      }

      return response.json() as Promise<T>;
    } finally {
      if (controlLoading) {
        endRequestLoading();
      }
    }
  }, NetworkServiceException)
}



export async function hasWebAccess(): Promise<boolean> {
    return executeAsyncWithLayerException(async () => {
      const state = await NetInfo.fetch();
    
      return Boolean(
        state.isConnected && state.isInternetReachable
      );
    }, NetworkServiceException)
}
