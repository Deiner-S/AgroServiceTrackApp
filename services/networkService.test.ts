import { clearTokenStorange } from '@/storange/authStorange';
import NetInfo from '@react-native-community/netinfo';
import { refreshToken } from './authService';
import { beginRequestLoading, endRequestLoading } from './requestLoadingService';
import { hasWebAccess, httpRequest } from './networkService';

jest.mock('@/storange/authStorange', () => ({
  clearTokenStorange: jest.fn(),
}));

jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: {
    fetch: jest.fn(),
  },
}));

jest.mock('./authService', () => ({
  refreshToken: jest.fn(),
}));

jest.mock('./requestLoadingService', () => ({
  beginRequestLoading: jest.fn(),
  endRequestLoading: jest.fn(),
}));

const mockClearTokenStorange = clearTokenStorange as jest.MockedFunction<typeof clearTokenStorange>;
const mockNetInfoFetch = NetInfo.fetch as jest.MockedFunction<typeof NetInfo.fetch>;
const mockRefreshToken = refreshToken as jest.MockedFunction<typeof refreshToken>;
const mockBeginRequestLoading = beginRequestLoading as jest.MockedFunction<typeof beginRequestLoading>;
const mockEndRequestLoading = endRequestLoading as jest.MockedFunction<typeof endRequestLoading>;

describe('networkService', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('httpRequest', () => {
    it('starts and ends request loading by default', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        status: 200,
        ok: true,
        json: jest.fn().mockResolvedValue({ ok: true }),
      });

      await expect(
        httpRequest<{ ok: boolean }>({
          method: 'GET',
          endpoint: '/orders',
          BASE_URL: 'https://example.com',
        })
      ).resolves.toEqual({ ok: true });

      expect(mockBeginRequestLoading).toHaveBeenCalledTimes(1);
      expect(mockEndRequestLoading).toHaveBeenCalledTimes(1);
    });

    it('does not control loading when disabled', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        status: 200,
        ok: true,
        json: jest.fn().mockResolvedValue({ ok: true }),
      });

      await httpRequest(
        {
          method: 'GET',
          endpoint: '/orders',
          BASE_URL: 'https://example.com',
        },
        false,
        false
      );

      expect(mockBeginRequestLoading).not.toHaveBeenCalled();
      expect(mockEndRequestLoading).not.toHaveBeenCalled();
    });

    it('retries once after a 401 response', async () => {
      mockRefreshToken.mockResolvedValue('new-access-token');
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          status: 401,
          ok: false,
          text: jest.fn().mockResolvedValue('unauthorized'),
          statusText: 'Unauthorized',
        })
        .mockResolvedValueOnce({
          status: 200,
          ok: true,
          json: jest.fn().mockResolvedValue({ ok: true }),
        });

      await expect(
        httpRequest<{ ok: boolean }>({
          method: 'GET',
          endpoint: '/orders',
          BASE_URL: 'https://example.com',
        })
      ).resolves.toEqual({ ok: true });

      expect(mockRefreshToken).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(global.fetch).toHaveBeenNthCalledWith(2, 'https://example.com/orders', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer new-access-token',
        },
        body: undefined,
        signal: expect.any(Object),
      });
    });

    it('clears token and throws SESSION_EXPIRED when refresh fails', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        status: 401,
        ok: false,
        text: jest.fn().mockResolvedValue('unauthorized'),
        statusText: 'Unauthorized',
      });
      mockRefreshToken.mockRejectedValue(new Error('refresh-failed'));

      await expect(
        httpRequest({
          method: 'GET',
          endpoint: '/orders',
          BASE_URL: 'https://example.com',
        })
      ).rejects.toThrow('SESSION_EXPIRED');

      expect(mockClearTokenStorange).toHaveBeenCalledTimes(1);
    });

    it('throws http error body when response is not ok', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        status: 500,
        ok: false,
        text: jest.fn().mockResolvedValue('server exploded'),
        statusText: 'Internal Server Error',
      });

      await expect(
        httpRequest({
          method: 'POST',
          endpoint: '/orders',
          BASE_URL: 'https://example.com',
          body: { id: 1 },
        })
      ).rejects.toThrow('HTTP 500 - server exploded');
    });

    it('rethrows fetch errors', async () => {
      const error = new Error('network-down');
      (global.fetch as jest.Mock).mockRejectedValue(error);

      await expect(
        httpRequest({
          method: 'GET',
          endpoint: '/orders',
          BASE_URL: 'https://example.com',
        })
      ).rejects.toThrow('network-down');
    });

    it('throws REQUEST_TIMEOUT when fetch aborts by timeout', async () => {
      (global.fetch as jest.Mock).mockImplementation((_url, options) => {
        options.signal.dispatchEvent(new Event('abort'));
        const abortError = new Error('aborted');
        abortError.name = 'AbortError';
        return Promise.reject(abortError);
      });

      await expect(
        httpRequest({
          method: 'GET',
          endpoint: '/orders',
          BASE_URL: 'https://example.com',
          timeoutMs: 1,
        })
      ).rejects.toThrow('REQUEST_TIMEOUT');
    });
  });

  describe('hasWebAccess', () => {
    it('returns true when internet is reachable', async () => {
      mockNetInfoFetch.mockResolvedValue({
        isConnected: true,
        isInternetReachable: true,
      } as never);

      await expect(hasWebAccess()).resolves.toBe(true);
    });

    it('returns false when internet is unreachable', async () => {
      mockNetInfoFetch.mockResolvedValue({
        isConnected: true,
        isInternetReachable: false,
      } as never);

      await expect(hasWebAccess()).resolves.toBe(false);
    });

    it('rethrows NetInfo errors', async () => {
      const error = new Error('netinfo-failed');
      mockNetInfoFetch.mockRejectedValue(error);

      await expect(hasWebAccess()).rejects.toThrow('netinfo-failed');
    });
  });
});
