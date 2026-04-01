import { getTokenStorange, saveTokenStorange } from '@/storange/authStorange';
import { httpRequest } from './networkService';
import { haveToken, refreshToken, requestToken } from './authService';

jest.mock('@/storange/authStorange', () => ({
  getTokenStorange: jest.fn(),
  saveTokenStorange: jest.fn(),
}));

jest.mock('./networkService', () => ({
  httpRequest: jest.fn(),
}));

const mockGetTokenStorange = getTokenStorange as jest.MockedFunction<typeof getTokenStorange>;
const mockSaveTokenStorange = saveTokenStorange as jest.MockedFunction<typeof saveTokenStorange>;
const mockHttpRequest = httpRequest as jest.MockedFunction<typeof httpRequest>;

describe('authService', () => {
  describe('haveToken', () => {
    it('returns true when access token exists', async () => {
      mockGetTokenStorange.mockResolvedValue({ access: 'access-token', refresh: 'refresh-token' });

      await expect(haveToken()).resolves.toBe(true);
    });

    it('returns false when token does not exist', async () => {
      mockGetTokenStorange.mockResolvedValue(null);

      await expect(haveToken()).resolves.toBe(false);
    });

    it('rethrows storage errors', async () => {
      const error = new Error('storage-failure');
      mockGetTokenStorange.mockRejectedValue(error);

      await expect(haveToken()).rejects.toThrow('storage-failure');
    });
  });

  describe('requestToken', () => {
    it('requests and saves tokens successfully', async () => {
      mockHttpRequest.mockResolvedValue({ access: 'new-access', refresh: 'new-refresh' });

      await expect(requestToken({ username: 'user', password: 'pass' })).resolves.toBeUndefined();

      expect(mockHttpRequest).toHaveBeenCalledWith({
        method: 'POST',
        endpoint: '/api/token/',
        BASE_URL: 'https://ringless-equivalently-alijah.ngrok-free.dev/gerenciador',
        body: { username: 'user', password: 'pass' },
      });
      expect(mockSaveTokenStorange).toHaveBeenCalledWith({
        access: 'new-access',
        refresh: 'new-refresh',
      });
    });

    it('throws INACTIVE_USER when backend indicates inactive account', async () => {
      mockHttpRequest.mockRejectedValue(new Error('no_active_account'));

      await expect(requestToken({ username: 'user', password: 'pass' })).rejects.toThrow('INACTIVE_USER');
    });

    it('throws INVALID_CREDENTIALS on 401', async () => {
      mockHttpRequest.mockRejectedValue(new Error('HTTP 401 - unauthorized'));

      await expect(requestToken({ username: 'user', password: 'pass' })).rejects.toThrow('INVALID_CREDENTIALS');
    });

    it('rethrows unexpected errors', async () => {
      const error = new Error('network-down');
      mockHttpRequest.mockRejectedValue(error);

      await expect(requestToken({ username: 'user', password: 'pass' })).rejects.toThrow('network-down');
    });

    it('throws REQUEST_FAILURE when tokens are missing from response', async () => {
      mockHttpRequest.mockResolvedValue({ access: '', refresh: '' });

      await expect(requestToken({ username: 'user', password: 'pass' })).rejects.toThrow('REQUEST_FAILURE');
    });

    it('rejects username outside the web validation pattern', async () => {
      await expect(requestToken({ username: 'User 1', password: 'pass' })).rejects.toThrow(
        'O valor deve conter somente letras minusculas, sem espacos.'
      );
      expect(mockHttpRequest).not.toHaveBeenCalled();
    });
  });

  describe('refreshToken', () => {
    it('refreshes access token and keeps refresh token', async () => {
      mockGetTokenStorange.mockResolvedValue({ access: 'old-access', refresh: 'refresh-token' });
      mockHttpRequest.mockResolvedValue({ access: 'new-access' });

      await expect(refreshToken()).resolves.toBe('new-access');

      expect(mockHttpRequest).toHaveBeenCalledWith({
        method: 'POST',
        endpoint: '/api/token/refresh/',
        BASE_URL: 'https://ringless-equivalently-alijah.ngrok-free.dev/gerenciador',
        body: { refresh: 'refresh-token' },
      });
      expect(mockSaveTokenStorange).toHaveBeenCalledWith({
        access: 'new-access',
        refresh: 'refresh-token',
      });
    });

    it('throws when refresh token is missing', async () => {
      mockGetTokenStorange.mockResolvedValue(null);

      await expect(refreshToken()).rejects.toThrow('NO_REFRESH_TOKEN');
    });

    it('throws when backend returns no new access token', async () => {
      mockGetTokenStorange.mockResolvedValue({ access: 'old-access', refresh: 'refresh-token' });
      mockHttpRequest.mockResolvedValue({ access: '' });

      await expect(refreshToken()).rejects.toThrow('REFRESH_FAILED');
    });

    it('rethrows request errors', async () => {
      const error = new Error('request-failed');
      mockGetTokenStorange.mockResolvedValue({ access: 'old-access', refresh: 'refresh-token' });
      mockHttpRequest.mockRejectedValue(error);

      await expect(refreshToken()).rejects.toThrow('request-failed');
    });
  });
});
