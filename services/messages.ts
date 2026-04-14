export const SERVICE_ERROR_CODES = {
  authTokenMissing: 'AUTH_TOKEN_MISSING',
  inactiveUser: 'INACTIVE_USER',
  invalidCredentials: 'INVALID_CREDENTIALS',
  missingWebAccess: 'MISSING_WEB_ACCESS',
  noRefreshToken: 'NO_REFRESH_TOKEN',
  refreshFailed: 'REFRESH_FAILED',
  requestFailure: 'REQUEST_FAILURE',
  sessionExpired: 'SESSION_EXPIRED',
  sessionValidationFailed: 'SESSION_VALIDATION_FAILED',
} as const;
